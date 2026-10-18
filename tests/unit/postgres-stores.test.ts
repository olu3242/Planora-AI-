import { describe, expect, it, vi } from "vitest";
import { PostgresRuntimeExecutionStore, PostgresWorkflowRunStore } from "../../src/lib/orchestration/postgres-stores";
import { createWorkflowRun } from "../../src/lib/orchestration/engine";
import { executeReadySteps, MemoryRuntimeExecutionStore, RuntimeRegistry } from "../../src/lib/orchestration/runtime";

const definition = { id: "close", version: 1, steps: [{ id: "step", kind: "DETERMINISTIC" as const }] };
const context = { organizationId: "tenant-a", actorId: "actor-a", correlationId: "trace-a" };

describe("persisted workflow snapshot CAS", () => {
  const old = createWorkflowRun("run-1", definition, context);
  const next = { ...old, status: "RUNNING" as const };

  it("uses a scoped conditional update with exact expected state", async () => {
    const updateMany = vi.fn(async () => ({ count: 1 }));
    const store = new PostgresWorkflowRunStore(
      { workflowRunRecord: { updateMany } } as never, "tenant-a",
    );
    await store.saveIfUnchanged(next, old);
    expect(updateMany).toHaveBeenCalledWith({
      where: {
        id: "run-1", organizationId: "tenant-a", actorId: "actor-a",
        definitionId: "close", definitionVersion: 1, status: "READY",
        state: { equals: old },
      },
      data: { status: "RUNNING", state: next },
    });
  });

  it("rejects a stale snapshot without overwriting it", async () => {
    const updateMany = vi.fn(async () => ({ count: 0 }));
    const store = new PostgresWorkflowRunStore(
      { workflowRunRecord: { updateMany } } as never, "tenant-a",
    );
    await expect(store.saveIfUnchanged(next, old)).rejects.toThrow("WORKFLOW_SCOPE_STALE_WRITE");
  });

  it("rejects cross-tenant expected state before touching the database", async () => {
    const updateMany = vi.fn(async () => ({ count: 1 }));
    const store = new PostgresWorkflowRunStore(
      { workflowRunRecord: { updateMany } } as never, "tenant-a",
    );
    await expect(store.saveIfUnchanged(next, {
      ...old, context: { ...context, organizationId: "tenant-b" },
    })).rejects.toThrow("WORKFLOW_SCOPE_CAS_MISMATCH");
    expect(updateMany).not.toHaveBeenCalled();
  });
  it("uses CAS for every runtime transition when supported", async () => {
    const snapshots = new Map<string, ReturnType<typeof createWorkflowRun>>();
    snapshots.set("run-1", structuredClone(old));
    const saveIfUnchanged = vi.fn(async (next: typeof old, expected: typeof old) => {
      const current = snapshots.get(next.id);
      if (JSON.stringify(current) !== JSON.stringify(expected)) {
        throw new Error("WORKFLOW_SCOPE_STALE_WRITE");
      }
      snapshots.set(next.id, structuredClone(next));
    });
    const runs = {
      load: async (id: string) => snapshots.get(id) ?? null,
      save: vi.fn(async () => { throw new Error("UNSAFE_SAVE_CALLED"); }),
      saveIfUnchanged,
    };
    const registry = new RuntimeRegistry();
    registry.register("step", async () => ({ evidenceId: "proof" }));
    const result = await executeReadySteps(
      definition, "run-1", runs, new MemoryRuntimeExecutionStore(), registry,
    );
    expect(result.status).toBe("SUCCEEDED");
    expect(saveIfUnchanged).toHaveBeenCalled();
    expect(runs.save).not.toHaveBeenCalled();
  });

  it("atomically advances a persisted execution without upsert", async () => {
    const updateMany = vi.fn(async () => ({ count: 1 }));
    const db = {
      workflowRunRecord: { findFirst: vi.fn(async () => ({ id: "run-1" })) },
      workflowExecutionRecord: {
        findUnique: vi.fn(async () => ({
          runId: "run-1", stepId: "step", status: "RUNNING", attempts: 1,
        })),
        updateMany,
      },
    };
    const store = new PostgresRuntimeExecutionStore(db as never, "tenant-a");
    await store.save({
      idempotencyKey: "key-1", runId: "run-1", stepId: "step",
      status: "SUCCEEDED", attempts: 1, evidenceId: "proof",
    });
    expect(updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        idempotencyKey: "key-1", runId: "run-1",
        stepId: "step", status: "RUNNING", attempts: 1,
      }),
      data: expect.objectContaining({ status: "SUCCEEDED", evidenceId: "proof" }),
    }));
  });

  it("refuses stale execution writes", async () => {
    const db = {
      workflowRunRecord: { findFirst: vi.fn(async () => ({ id: "run-1" })) },
      workflowExecutionRecord: {
        findUnique: vi.fn(async () => ({
          runId: "run-1", stepId: "step", status: "RUNNING", attempts: 1,
        })),
        updateMany: vi.fn(async () => ({ count: 0 })),
      },
    };
    const store = new PostgresRuntimeExecutionStore(db as never, "tenant-a");
    await expect(store.save({
      idempotencyKey: "key-1", runId: "run-1", stepId: "step",
      status: "SUCCEEDED", attempts: 1, evidenceId: "proof",
    })).rejects.toThrow("WORKFLOW_SCOPE_EXECUTION_STALE_WRITE");
  });

  it("refuses terminal execution overwrite", async () => {
    const updateMany = vi.fn();
    const db = {
      workflowRunRecord: { findFirst: vi.fn(async () => ({ id: "run-1" })) },
      workflowExecutionRecord: {
        findUnique: vi.fn(async () => ({
          runId: "run-1", stepId: "step", status: "SUCCEEDED", attempts: 1,
        })),
        updateMany,
      },
    };
    const store = new PostgresRuntimeExecutionStore(db as never, "tenant-a");
    await expect(store.save({
      idempotencyKey: "key-1", runId: "run-1", stepId: "step",
      status: "RUNNING", attempts: 2,
    })).rejects.toThrow("WORKFLOW_SCOPE_EXECUTION_TERMINAL_IMMUTABLE");
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("rejects attempt-count regression before the database update", async () => {
    const updateMany = vi.fn();
    const db = {
      workflowRunRecord: { findFirst: vi.fn(async () => ({ id: "run-1" })) },
      workflowExecutionRecord: {
        findUnique: vi.fn(async () => ({
          runId: "run-1", stepId: "step", status: "RETRYING", attempts: 3,
        })),
        updateMany,
      },
    };
    const store = new PostgresRuntimeExecutionStore(db as never, "tenant-a");
    await expect(store.save({
      idempotencyKey: "key-1", runId: "run-1", stepId: "step",
      status: "RETRYING", attempts: 2,
    })).rejects.toThrow("WORKFLOW_SCOPE_EXECUTION_ATTEMPT_REGRESSION");
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("fails closed when another worker inserts the same execution key", async () => {
    const db = {
      workflowRunRecord: { findFirst: vi.fn(async () => ({ id: "run-1" })) },
      workflowExecutionRecord: {
        findUnique: vi.fn(async () => null),
        create: vi.fn(async () => { throw Object.assign(new Error("Unique constraint"), { code: "P2002" }); }),
      },
    };
    const store = new PostgresRuntimeExecutionStore(db as never, "tenant-a");
    await expect(store.save({
      idempotencyKey: "key-1", runId: "run-1", stepId: "step",
      status: "RUNNING", attempts: 1,
    })).rejects.toThrow("WORKFLOW_SCOPE_EXECUTION_CONCURRENT_INSERT");
  });

  it("rejects an existing key owned by a different run", async () => {
    const updateMany = vi.fn();
    const db = {
      workflowRunRecord: { findFirst: vi.fn(async () => ({ id: "run-1" })) },
      workflowExecutionRecord: {
        findUnique: vi.fn(async () => ({
          runId: "run-2", stepId: "step", status: "RUNNING", attempts: 1,
        })),
        updateMany,
      },
    };
    const store = new PostgresRuntimeExecutionStore(db as never, "tenant-a");
    await expect(store.save({
      idempotencyKey: "key-1", runId: "run-1", stepId: "step",
      status: "SUCCEEDED", attempts: 1, evidenceId: "proof",
    })).rejects.toThrow("WORKFLOW_SCOPE_IDEMPOTENCY_COLLISION");
    expect(updateMany).not.toHaveBeenCalled();
  });

});

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

  it("round-trips retry attempts and terminal error classification", async () => {
    const upsert = vi.fn(async () => ({}));
    const db = {
      workflowRunRecord: { findFirst: vi.fn(async () => ({ id: "run-1" })) },
      workflowExecutionRecord: {
        findUnique: vi.fn(async () => null),
        upsert,
        findFirst: vi.fn(async () => ({
          idempotencyKey: "key-1", runId: "run-1", stepId: "step",
          status: "FAILED", attempts: 3, errorClass: "TERMINAL",
          error: "FORBIDDEN_POLICY", evidenceId: null,
        })),
      },
    };
    const store = new PostgresRuntimeExecutionStore(db as never, "tenant-a");
    await store.save({
      idempotencyKey: "key-1", runId: "run-1", stepId: "step",
      status: "FAILED", attempts: 3, errorClass: "TERMINAL",
      error: "FORBIDDEN_POLICY",
    });
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({ attempts: 3, errorClass: "TERMINAL" }),
      update: expect.objectContaining({ attempts: 3, errorClass: "TERMINAL" }),
    }));
    await expect(store.load("key-1")).resolves.toEqual({
      idempotencyKey: "key-1", runId: "run-1", stepId: "step",
      status: "FAILED", attempts: 3, errorClass: "TERMINAL",
      error: "FORBIDDEN_POLICY", evidenceId: undefined,
    });
  });

});

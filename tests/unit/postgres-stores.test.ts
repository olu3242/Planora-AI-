import { describe, expect, it, vi } from "vitest";
import { PostgresWorkflowRunStore } from "../../src/lib/orchestration/postgres-stores";
import { createWorkflowRun } from "../../src/lib/orchestration/engine";

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
});

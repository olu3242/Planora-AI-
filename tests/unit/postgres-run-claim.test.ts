import { describe, expect, it, vi } from "vitest";
import { claimReadyWorkflowRun } from "../../src/lib/orchestration/postgres-run-claim";

const request = {
  organizationId: "tenant-a",
  runId: "run-1",
  definitionId: "monthly-close",
  definitionVersion: 1,
};

describe("atomic PostgreSQL run claim contract", () => {
  it("claims a READY run with a single scoped conditional update", async () => {
    const updateMany = vi.fn(async () => ({ count: 1 }));
    await expect(claimReadyWorkflowRun({ workflowRunRecord: { updateMany } }, request))
      .resolves.toBeUndefined();
    expect(updateMany).toHaveBeenCalledExactlyOnceWith({
      where: {
        id: "run-1",
        organizationId: "tenant-a",
        definitionId: "monthly-close",
        definitionVersion: 1,
        status: "READY",
      },
      data: { status: "RUNNING" },
    });
  });

  it("fails closed when another worker has already claimed the run", async () => {
    const updateMany = vi.fn(async () => ({ count: 0 }));
    await expect(claimReadyWorkflowRun({ workflowRunRecord: { updateMany } }, request))
      .rejects.toThrow("WORKFLOW_SCOPE_CLAIM_UNAVAILABLE");
  });

  it.each([
    { organizationId: "" },
    { runId: "" },
    { definitionId: "" },
    { definitionVersion: 0 },
  ])("rejects invalid claim scope %o", async (invalid) => {
    const updateMany = vi.fn(async () => ({ count: 1 }));
    await expect(claimReadyWorkflowRun(
      { workflowRunRecord: { updateMany } }, { ...request, ...invalid },
    )).rejects.toThrow();
    expect(updateMany).not.toHaveBeenCalled();
  });
});

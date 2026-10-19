import { createWorkflowRun } from "../../src/lib/orchestration/engine";
import { describe, expect, it, vi } from "vitest";
import { claimReadyWorkflowRun } from "../../src/lib/orchestration/postgres-run-claim";

const expectedRun = createWorkflowRun("run-1", {
  id: "monthly-close", version: 1, steps: [],
}, { organizationId: "tenant-a", actorId: "actor-1", correlationId: "trace-1" });

const request = {
  expectedRun,
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
        state: { equals: expectedRun },
      },
      data: { status: "RUNNING", state: { ...expectedRun, status: "RUNNING" } },
    });
  });

  it("atomically updates both status and JSON state for a verified snapshot", async () => {
    const updateMany = vi.fn(async () => ({ count: 1 }));
    await claimReadyWorkflowRun(
      { workflowRunRecord: { updateMany } },
      { ...request, expectedRun },
    );
    expect(updateMany).toHaveBeenCalledWith({
      where: {
        id: "run-1", organizationId: "tenant-a",
        definitionId: "monthly-close", definitionVersion: 1,
        status: "READY", state: { equals: expectedRun },
      },
      data: { status: "RUNNING", state: { ...expectedRun, status: "RUNNING" } },
    });
  });

  it("allows only one winner among competing claims in a serialized store simulation", async () => {
    let available = true;
    const updateMany = vi.fn(async () => {
      if (!available) return { count: 0 };
      available = false;
      return { count: 1 };
    });
    const outcomes = await Promise.allSettled(
      Array.from({ length: 10 }, () =>
        claimReadyWorkflowRun({ workflowRunRecord: { updateMany } }, request)),
    );
    expect(outcomes.filter((outcome) => outcome.status === "fulfilled")).toHaveLength(1);
    expect(outcomes.filter((outcome) => outcome.status === "rejected")).toHaveLength(9);
    expect(updateMany).toHaveBeenCalledTimes(10);
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

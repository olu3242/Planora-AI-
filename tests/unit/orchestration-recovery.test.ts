import { describe, expect, it } from "vitest";
import { createWorkflowRun } from "../../src/lib/orchestration/engine";
import { deadLetterSteps, replayFailedStep, retryableFailedSteps } from "../../src/lib/orchestration/recovery";

const definition = { id: "close", version: 1, steps: [{ id: "check", kind: "DETERMINISTIC" as const }] };
const context = { organizationId: "org", actorId: "user", correlationId: "corr" };

describe("orchestration recovery", () => {
  it("replays failed work below the retry limit", () => {
    const run = createWorkflowRun("run", definition, context);
    const failed = { ...run, status: "FAILED" as const, steps: { check: { ...run.steps.check, status: "FAILED" as const, attempts: 1, error: "temporary" } } };
    expect(retryableFailedSteps(failed)).toEqual(["check"]);
    expect(replayFailedStep(failed, "check").steps.check.status).toBe("PENDING");
  });

  it("dead letters exhausted work", () => {
    const run = createWorkflowRun("run", definition, context);
    const failed = { ...run, status: "FAILED" as const, steps: { check: { ...run.steps.check, status: "FAILED" as const, attempts: 3, error: "terminal" } } };
    expect(deadLetterSteps(failed)).toEqual([{ stepId: "check", error: "terminal" }]);
    expect(() => replayFailedStep(failed, "check")).toThrow("RETRY_LIMIT_EXCEEDED");
  });
});

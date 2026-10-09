import type { WorkflowRun } from "./types";

export function retryableFailedSteps(run: WorkflowRun): string[] {
  return Object.values(run.steps)
    .filter((step) => step.status === "FAILED" && step.attempts < 3)
    .map((step) => step.stepId);
}

export function replayFailedStep(run: WorkflowRun, stepId: string): WorkflowRun {
  const step = run.steps[stepId];
  if (!step || step.status !== "FAILED") throw new Error("STEP_NOT_FAILED");
  if (step.attempts >= 3) throw new Error("RETRY_LIMIT_EXCEEDED");
  return {
    ...run,
    status: "READY",
    steps: { ...run.steps, [stepId]: { ...step, status: "PENDING", error: undefined } },
  };
}

export function deadLetterSteps(run: WorkflowRun) {
  return Object.values(run.steps)
    .filter((step) => step.status === "FAILED" && step.attempts >= 3)
    .map((step) => ({ stepId: step.stepId, error: step.error ?? "UNKNOWN" }));
}

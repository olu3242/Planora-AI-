import { describe, expect, it } from "vitest";
import { CLOSE_TO_FORECAST_WORKFLOW } from "../../src/lib/orchestration/close-to-forecast";
import {
  approveStep,
  beginStep,
  completeStep,
  createWorkflowRun,
  finalizeRun,
  readySteps,
  validateWorkflowDefinition,
} from "../../src/lib/orchestration/engine";

const context = {
  organizationId: "org-1",
  legalEntityId: "entity-1",
  fiscalPeriodId: "period-1",
  actorId: "controller-1",
  correlationId: "corr-1",
};

describe("workflow orchestration", () => {
  it("validates and starts only dependency-ready work", () => {
    validateWorkflowDefinition(CLOSE_TO_FORECAST_WORKFLOW);
    let run = createWorkflowRun("run-1", CLOSE_TO_FORECAST_WORKFLOW, context);
    expect(readySteps(CLOSE_TO_FORECAST_WORKFLOW, run).map((step) => step.id)).toEqual(["preflight"]);

    run = beginStep(run, CLOSE_TO_FORECAST_WORKFLOW.steps[0]);
    run = completeStep(run, "preflight", "evidence-preflight");
    expect(readySteps(CLOSE_TO_FORECAST_WORKFLOW, run).map((step) => step.id)).toEqual([
      "bank-reconciliation",
      "ap-validation",
      "ar-validation",
    ]);
  });

  it("requires explicit human approval before period close becomes eligible", () => {
    let run = createWorkflowRun("run-2", CLOSE_TO_FORECAST_WORKFLOW, context);
    for (const id of ["preflight", "bank-reconciliation", "ap-validation", "ar-validation", "trial-balance", "close-analysis"]) {
      const step = CLOSE_TO_FORECAST_WORKFLOW.steps.find((candidate) => candidate.id === id)!;
      run = beginStep(run, step);
      run = completeStep(run, id, `evidence-${id}`);
    }

    const approval = CLOSE_TO_FORECAST_WORKFLOW.steps.find((step) => step.id === "controller-approval")!;
    run = beginStep(run, approval);
    expect(run.status).toBe("WAITING_APPROVAL");
    expect(readySteps(CLOSE_TO_FORECAST_WORKFLOW, run)).toEqual([]);

    run = approveStep(run, "controller-approval", "approval-controller-1");
    expect(readySteps(CLOSE_TO_FORECAST_WORKFLOW, run).map((step) => step.id)).toEqual(["period-close"]);
  });

  it("cannot be finalized successfully with unfinished steps", () => {
    const run = createWorkflowRun("run-3", CLOSE_TO_FORECAST_WORKFLOW, context);
    expect(finalizeRun(run).status).toBe("READY");
  });
});

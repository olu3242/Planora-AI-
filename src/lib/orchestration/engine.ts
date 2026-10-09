import type {
  StepRun,
  WorkflowContext,
  WorkflowDefinition,
  WorkflowRun,
  WorkflowStepDefinition,
} from "./types";

export class WorkflowDefinitionError extends Error {}

export function validateWorkflowDefinition(definition: WorkflowDefinition): void {
  if (!definition.id.trim()) throw new WorkflowDefinitionError("Workflow id is required");
  if (!Number.isInteger(definition.version) || definition.version < 1) {
    throw new WorkflowDefinitionError("Workflow version must be a positive integer");
  }

  const ids = new Set<string>();
  for (const step of definition.steps) {
    if (!step.id.trim()) throw new WorkflowDefinitionError("Step id is required");
    if (ids.has(step.id)) throw new WorkflowDefinitionError(`Duplicate step id: ${step.id}`);
    ids.add(step.id);
  }

  for (const step of definition.steps) {
    for (const dependency of step.dependsOn ?? []) {
      if (!ids.has(dependency)) {
        throw new WorkflowDefinitionError(`Unknown dependency ${dependency} for ${step.id}`);
      }
      if (dependency === step.id) {
        throw new WorkflowDefinitionError(`Step ${step.id} cannot depend on itself`);
      }
    }
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const byId = new Map(definition.steps.map((step) => [step.id, step]));
  const visit = (id: string): void => {
    if (visiting.has(id)) throw new WorkflowDefinitionError("Workflow contains a dependency cycle");
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dependency of byId.get(id)?.dependsOn ?? []) visit(dependency);
    visiting.delete(id);
    visited.add(id);
  };
  for (const step of definition.steps) visit(step.id);
}

export function createWorkflowRun(
  id: string,
  definition: WorkflowDefinition,
  context: WorkflowContext,
): WorkflowRun {
  validateWorkflowDefinition(definition);
  if (!id.trim()) throw new WorkflowDefinitionError("Workflow run id is required");
  const steps = Object.fromEntries(
    definition.steps.map((step) => [
      step.id,
      { stepId: step.id, status: "PENDING", attempts: 0, evidenceIds: [] } satisfies StepRun,
    ]),
  );
  return {
    id,
    definitionId: definition.id,
    definitionVersion: definition.version,
    context,
    status: "READY",
    steps,
  };
}

function dependenciesSucceeded(step: WorkflowStepDefinition, run: WorkflowRun): boolean {
  return (step.dependsOn ?? []).every((id) => run.steps[id]?.status === "SUCCEEDED");
}

export function readySteps(definition: WorkflowDefinition, run: WorkflowRun): WorkflowStepDefinition[] {
  if (run.status === "WAITING_APPROVAL" || run.status === "FAILED" || run.status === "CANCELLED" || run.status === "SUCCEEDED") return [];
  return definition.steps.filter(
    (step) => run.steps[step.id]?.status === "PENDING" && dependenciesSucceeded(step, run),
  );
}

export function beginStep(run: WorkflowRun, step: WorkflowStepDefinition): WorkflowRun {
  const current = run.steps[step.id];
  if (!current || current.status !== "PENDING") {
    throw new WorkflowDefinitionError(`Step ${step.id} is not pending`);
  }
  const nextStatus = step.requiresApproval || step.kind === "HUMAN_APPROVAL"
    ? "WAITING_APPROVAL"
    : "RUNNING";
  return {
    ...run,
    status: nextStatus === "WAITING_APPROVAL" ? "WAITING_APPROVAL" : "RUNNING",
    steps: {
      ...run.steps,
      [step.id]: { ...current, status: nextStatus, attempts: current.attempts + 1 },
    },
  };
}

export function approveStep(run: WorkflowRun, stepId: string, evidenceId: string): WorkflowRun {
  const current = run.steps[stepId];
  if (!current || current.status !== "WAITING_APPROVAL") {
    throw new WorkflowDefinitionError(`Step ${stepId} is not awaiting approval`);
  }
  return {
    ...run,
    status: "RUNNING",
    steps: {
      ...run.steps,
      [stepId]: {
        ...current,
        status: "SUCCEEDED",
        evidenceIds: [...current.evidenceIds, evidenceId],
      },
    },
  };
}

export function completeStep(run: WorkflowRun, stepId: string, evidenceId: string): WorkflowRun {
  const current = run.steps[stepId];
  if (!current || current.status !== "RUNNING") {
    throw new WorkflowDefinitionError(`Step ${stepId} is not running`);
  }
  return {
    ...run,
    steps: {
      ...run.steps,
      [stepId]: {
        ...current,
        status: "SUCCEEDED",
        evidenceIds: [...current.evidenceIds, evidenceId],
      },
    },
  };
}

export function finalizeRun(run: WorkflowRun): WorkflowRun {
  const states = Object.values(run.steps).map((step) => step.status);
  if (states.every((status) => status === "SUCCEEDED")) return { ...run, status: "SUCCEEDED" };
  if (states.some((status) => status === "FAILED")) return { ...run, status: "FAILED" };
  if (states.some((status) => status === "WAITING_APPROVAL")) return { ...run, status: "WAITING_APPROVAL" };
  return run;
}

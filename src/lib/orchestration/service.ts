import { approveStep, createWorkflowRun } from "./engine";
import { executeReadySteps, type RuntimeExecutionStore, type RuntimeRegistry, type WorkflowRunStore } from "./runtime";
import type { WorkflowContext, WorkflowDefinition, WorkflowRun } from "./types";

export interface OrchestrationAuthorization {
  actorId: string;
  organizationId: string;
  canStart: boolean;
  canApprove: boolean;
}
export class OrchestrationAuthorizationError extends Error {}
function assertOrganization(auth: OrchestrationAuthorization, run: WorkflowRun): void {
  if (auth.organizationId !== run.context.organizationId) throw new OrchestrationAuthorizationError("Cross-organization workflow access denied");
}
export async function startWorkflow(definition: WorkflowDefinition, runId: string, context: WorkflowContext, auth: OrchestrationAuthorization, runs: WorkflowRunStore): Promise<WorkflowRun> {
  if (!auth.canStart) throw new OrchestrationAuthorizationError("Workflow start permission required");
  if (auth.actorId !== context.actorId || auth.organizationId !== context.organizationId) throw new OrchestrationAuthorizationError("Workflow context does not match authorization context");
  if (await runs.load(runId)) throw new Error(`Workflow run already exists: ${runId}`);
  const run=createWorkflowRun(runId,definition,context); await runs.save(run); return run;
}
export async function resumeWorkflow(definition: WorkflowDefinition, runId: string, auth: OrchestrationAuthorization, runs: WorkflowRunStore, executions: RuntimeExecutionStore, registry: RuntimeRegistry): Promise<WorkflowRun> {
  const run=await runs.load(runId); if(!run) throw new Error(`Workflow run not found: ${runId}`); assertOrganization(auth,run);
  return executeReadySteps(definition,runId,runs,executions,registry);
}
export async function approveWorkflowStep(runId: string, stepId: string, evidenceId: string, auth: OrchestrationAuthorization, runs: WorkflowRunStore): Promise<WorkflowRun> {
  if(!auth.canApprove) throw new OrchestrationAuthorizationError("Workflow approval permission required");
  const run=await runs.load(runId); if(!run) throw new Error(`Workflow run not found: ${runId}`); assertOrganization(auth,run);
  if (run.context.actorId === auth.actorId) throw new OrchestrationAuthorizationError("Requester cannot approve own workflow");
  const approved=approveStep(run,stepId,evidenceId); await runs.save(approved); return approved;
}

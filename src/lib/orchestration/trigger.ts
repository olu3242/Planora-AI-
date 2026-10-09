import type { WorkflowContext, WorkflowDefinition } from "./types";
import type { WorkflowRunStore } from "./runtime";
import { startWorkflow, type OrchestrationAuthorization } from "./service";

export type WorkflowTrigger = Readonly<{
  id: string;
  definitionId: string;
  organizationId: string;
  actorId: string;
  correlationId: string;
  legalEntityId?: string;
  fiscalPeriodId?: string;
}>;

export async function dispatchWorkflowTrigger(
  trigger: WorkflowTrigger,
  definition: WorkflowDefinition,
  auth: OrchestrationAuthorization,
  runs: WorkflowRunStore,
) {
  if (trigger.definitionId !== definition.id) throw new Error("TRIGGER_DEFINITION_MISMATCH");
  if (trigger.organizationId !== auth.organizationId || trigger.actorId !== auth.actorId) {
    throw new Error("TRIGGER_SCOPE_MISMATCH");
  }
  const context: WorkflowContext = {
    organizationId: trigger.organizationId,
    actorId: trigger.actorId,
    correlationId: trigger.correlationId,
    legalEntityId: trigger.legalEntityId,
    fiscalPeriodId: trigger.fiscalPeriodId,
  };
  return startWorkflow(definition, trigger.id, context, auth, runs);
}

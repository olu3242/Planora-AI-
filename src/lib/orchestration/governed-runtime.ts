import { assertExecutionBoundary, validateGovernedRunEnvelope } from "./catalog-contract";
import type { CatalogScenarioContract, GovernedRunEnvelope } from "./catalog-contract";
import { executeReadySteps } from "./runtime";
import type { RuntimeExecutionStore, RuntimeRegistry, WorkflowRunStore } from "./runtime";
import type { WorkflowDefinition, WorkflowRun } from "./types";

/**
 * Opt-in governed entry point. Existing workflows are not silently migrated.
 * Policy and approval evidence must be verified by the calling core service;
 * an evidence ID alone is not proof of authorization.
 */
export async function executeGovernedWorkflow(input: {
  envelope: GovernedRunEnvelope;
  definition: WorkflowDefinition;
  scenario: CatalogScenarioContract;
  executor: "CORE" | "N8N";
  approvalEvidenceId?: string;
  runs: WorkflowRunStore;
  executions: RuntimeExecutionStore;
  registry: RuntimeRegistry;
  authorize: (input: {
    envelope: GovernedRunEnvelope;
    scenario: CatalogScenarioContract;
    approvalEvidenceId?: string;
  }) => Promise<void>;
}): Promise<WorkflowRun> {
  const { envelope, definition, scenario, executor } = input;
  validateGovernedRunEnvelope(envelope);
  if (definition.id !== envelope.workflowDefinitionId ||
      definition.version !== envelope.workflowDefinitionVersion) {
    throw new Error("WORKFLOW_SCOPE_DEFINITION_MISMATCH");
  }
  if (executor !== "CORE") {
    throw new Error("FORBIDDEN_EXTERNAL_RUNTIME_EXECUTION");
  }
  assertExecutionBoundary(scenario, executor, input.approvalEvidenceId);
  if (!envelope.idempotencyKey.trim() || !envelope.policyVersion.trim()) {
    throw new Error("WORKFLOW_SCOPE_GOVERNANCE_REQUIRED");
  }
  const existing = await input.runs.load(envelope.runId);
  if (!existing) throw new Error("WORKFLOW_SCOPE_RUN_NOT_FOUND");
  if (existing.id !== envelope.runId ||
      existing.definitionId !== envelope.workflowDefinitionId ||
      existing.definitionVersion !== envelope.workflowDefinitionVersion ||
      existing.context.organizationId !== envelope.organizationId ||
      existing.context.actorId !== envelope.actorId ||
      existing.context.correlationId !== envelope.correlationId ||
      existing.context.legalEntityId !== envelope.legalEntityId ||
      existing.context.fiscalPeriodId !== envelope.fiscalPeriodId) {
    throw new Error("WORKFLOW_SCOPE_RUN_MISMATCH");
  }
  // A run already executing must be resumed by a leased, persistent worker, not
  // re-entered through this request path. This guard is not an atomic lease.
  if (existing.status === "RUNNING" || existing.status === "RETRYING" || existing.status === "COMPENSATING") {
    throw new Error("WORKFLOW_SCOPE_ACTIVE_RUN_REQUIRES_LEASE");
  }
  // The core policy service must check the current period, role, segregation
  // of duties, policy version, and approval evidence before any step executes.
  await input.authorize({
    envelope,
    scenario,
    approvalEvidenceId: input.approvalEvidenceId,
  });
  return executeReadySteps(definition, envelope.runId, input.runs, input.executions, input.registry);
}

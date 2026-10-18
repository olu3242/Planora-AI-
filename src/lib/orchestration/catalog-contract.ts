/**
 * Shared catalog contract for Workflow OS, Flow Orchestration OS and Runtime OS.
 * This module declares boundaries and scenario ownership; it does not authorize
 * financial mutations or register executable handlers.
 */
export const PLANORA_OS_LAYERS = [
  "WORKFLOW_OS",
  "FLOW_ORCHESTRATION_OS",
  "RUNTIME_OS",
] as const;

export type PlanoraOsLayer = (typeof PLANORA_OS_LAYERS)[number];
export type CatalogEngine = "CORE" | "MIXED" | "N8N";
export type CatalogScenarioId =
  | `A${1 | 2 | 3 | 4 | 5 | 6 | 7}`
  | `B${1 | 2 | 3 | 4 | 5 | 6}`
  | `C${1 | 2 | 3 | 4 | 5}`
  | `D${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`
  | `E${1 | 2 | 3 | 4 | 5 | 6 | 7}`
  | `F${1 | 2 | 3 | 4 | 5}`
  | `G${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`
  | `H${1 | 2 | 3 | 4 | 5 | 6 | 7}`
  | `I${1 | 2 | 3 | 4}`
  | `J${1 | 2 | 3 | 4 | 5 | 6}`
  | `K${1 | 2 | 3 | 4}`;

export interface CatalogScenarioContract {
  id: CatalogScenarioId;
  engine: CatalogEngine;
  financialMutation: boolean;
  requiresHumanGate: boolean;
  executionAuthority: "CORE_ONLY" | "DELIVERY_ONLY";
}

export interface GovernedRunEnvelope {
  organizationId: string;
  runId: string;
  correlationId: string;
  workflowDefinitionId: string;
  workflowDefinitionVersion: number;
  policyVersion: string;
  idempotencyKey: string;
  actorId: string;
  legalEntityId?: string;
  fiscalPeriodId?: string;
}

export function validateGovernedRunEnvelope(envelope: GovernedRunEnvelope): void {
  for (const [field, value] of Object.entries(envelope)) {
    if (typeof value === "string" && !value.trim()) {
      throw new Error(`WORKFLOW_SCOPE_MISSING_${field.toUpperCase()}`);
    }
  }
  if (!Number.isInteger(envelope.workflowDefinitionVersion) || envelope.workflowDefinitionVersion < 1) {
    throw new Error("INVALID_WORKFLOW_DEFINITION_VERSION");
  }
}

export function assertExecutionBoundary(
  scenario: CatalogScenarioContract,
  executor: "CORE" | "N8N",
  approvalEvidenceId?: string,
): void {
  if (executor === "N8N" && (scenario.financialMutation || scenario.executionAuthority === "CORE_ONLY")) {
    throw new Error("FORBIDDEN_EXTERNAL_FINANCIAL_EXECUTION");
  }
  if (scenario.financialMutation && scenario.requiresHumanGate && !approvalEvidenceId?.trim()) {
    throw new Error("FORBIDDEN_MISSING_APPROVAL_EVIDENCE");
  }
}

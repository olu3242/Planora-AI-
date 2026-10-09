export type WorkflowRunStatus =
  | "PENDING"
  | "READY"
  | "RUNNING"
  | "WAITING_APPROVAL"
  | "RETRYING"
  | "BLOCKED"
  | "FAILED"
  | "COMPENSATING"
  | "CANCELLED"
  | "SUCCEEDED";

export type StepKind = "DETERMINISTIC" | "DATABASE" | "INTEGRATION" | "AGENT" | "HUMAN_APPROVAL";

export interface WorkflowContext {
  organizationId: string;
  legalEntityId?: string;
  fiscalPeriodId?: string;
  actorId: string;
  correlationId: string;
}

export interface WorkflowStepDefinition {
  id: string;
  kind: StepKind;
  dependsOn?: string[];
  requiresApproval?: boolean;
  maxAttempts?: number;
}

export interface WorkflowDefinition {
  id: string;
  version: number;
  steps: WorkflowStepDefinition[];
}

export interface StepRun {
  stepId: string;
  status: WorkflowRunStatus;
  attempts: number;
  evidenceIds: string[];
  error?: string;
}

export interface WorkflowRun {
  id: string;
  definitionId: string;
  definitionVersion: number;
  context: WorkflowContext;
  status: WorkflowRunStatus;
  steps: Record<string, StepRun>;
}

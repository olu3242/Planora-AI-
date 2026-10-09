export const agentDefinitions = [
  {
    agentId: "PLANORA.WORKFLOW.ASSISTANT.NEXT_ACTION.v1",
    displayName: "Workflow Assistant",
    version: 1,
    purpose: "Explain governed forecast status, blockers, and the next permitted action.",
    persona: "ANALYST|FPA_DIRECTOR|CFO",
    tenantScope: "AUTHENTICATED_ORGANIZATION",
    authorityClass: "A1_RECOMMEND" as const,
    allowedTools: ["getForecastCycle", "getValidationSummary", "getOutstandingActions"],
  },
  {
    agentId: "PLANORA.FORECAST.ANALYST.VARIANCE.v1",
    displayName: "Variance Analyst",
    version: 1,
    purpose: "Rank supported Actual-vs-Forecast and Current-vs-Prior movements.",
    persona: "ANALYST|FPA_DIRECTOR|CFO",
    tenantScope: "AUTHENTICATED_ORGANIZATION",
    authorityClass: "A1_RECOMMEND" as const,
    allowedTools: ["getMaterialVariances", "getForecastCycle"],
  },
  {
    agentId: "PLANORA.FORECAST.ANALYST.COMMENTARY.v1",
    displayName: "Commentary Assistant",
    version: 1,
    purpose: "Draft evidence-grounded commentary for explicit human acceptance, editing, or rejection.",
    persona: "ANALYST|FPA_DIRECTOR|CFO",
    tenantScope: "AUTHENTICATED_ORGANIZATION",
    authorityClass: "A2_ASSIST" as const,
    allowedTools: ["getMaterialVariances", "getForecastCommentary", "prepareVarianceCommentary"],
  },
  {
    agentId: "PLANORA.REVIEW.DIRECTOR.EXCEPTION.v1",
    displayName: "Review Assistant",
    version: 1,
    purpose: "Summarize material movements, commentary gaps, warnings, and approval state for review.",
    persona: "FPA_DIRECTOR|CFO",
    tenantScope: "AUTHENTICATED_ORGANIZATION",
    authorityClass: "A1_RECOMMEND" as const,
    allowedTools: ["getMaterialVariances", "getForecastCommentary", "getApprovalHistory", "getOutstandingActions"],
  },
] as const;

export type AgentCapability = (typeof agentDefinitions)[number]["agentId"];

export const sharedAgentPolicy = {
  forbiddenActions: ["writeFinancialData", "changeMapping", "bypassValidation", "approveForecast", "lockForecast", "changeAuthorization", "readOtherTenant"],
  requiredContext: ["authenticatedActor", "organizationMembership", "forecastVersion", "workflowState", "validationState"],
  workflowStates: ["DRAFT", "SUBMITTED", "IN_REVIEW", "REVISION_REQUIRED", "APPROVED", "LOCKED"] as const,
  humanApprovalRequired: true,
  financialWritePermission: false,
  retryPolicy: { maxAttempts: 1, backoff: "none", safeReadsOnly: true },
  memoryPolicy: { session: "ephemeral", workflow: "organization+forecastVersion", learning: "governedFeedbackOnly" },
  learningPolicy: { onlineLearning: false, changeRequiresApprovedVersion: true },
  failurePolicy: { failClosed: true, preserveWorkflow: true, noPrivilegeEscalation: true },
  auditPolicy: { logEveryRun: true, persistEvidence: true, noChainOfThought: true },
} as const;

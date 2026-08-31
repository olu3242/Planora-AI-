import "server-only";
import type { AgentFeedbackDecision, Prisma, RoleCode } from "@prisma/client";
import { writeAudit } from "@/audit/audit";
import { forecastWorkspace } from "@/application/forecast/forecast-service";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { nextBestActions } from "./next-best-action";
import type { AgentCapability } from "./definitions";

type AgentContext = { organizationId: string; actorId: string; role: RoleCode; correlationId: string };
type RunInput = AgentContext & { agentId: AgentCapability; forecastVersionId: string; task: string; prompt?: string };

function compactMoney(value: string) {
  const amount = Number(value);
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}

function promptGuardrail(prompt = "") {
  const normalized = prompt.toLowerCase();
  if (/(approve|final approve|lock).*(for me|forecast)|ignore.*(error|validation)|bypass.*validation/.test(normalized)) {
    return "Planora assistants cannot approve, lock, or bypass validation. An authorized human must use the governed workflow command, and all normal controls still apply.";
  }
  return null;
}

export async function runAgent(input: RunInput) {
  const definition = await prisma.agentDefinition.findUnique({ where: { agentId: input.agentId } });
  if (!definition) throw new AppError("RESOURCE_NOT_FOUND", "Agent capability was not found.", 404);
  const run = await prisma.agentRun.create({ data: { agentDefinitionId: definition.id, organizationId: input.organizationId, actorId: input.actorId, trigger: "USER_REQUEST", task: input.task, inputReferences: { forecastVersion: "authorization_pending" }, toolTrace: [], evidence: {} } });
  const fail = async (status: "ERROR" | "AUTHORIZATION_UNDETERMINED" | "INSUFFICIENT_DATA", errorCode: string, error: AppError) => {
    await prisma.agentRun.update({ where: { id: run.id }, data: { status, errorCode, completedAt: new Date(), output: { message: error.message } } });
    throw error;
  };
  if (definition.killSwitch === "DISABLED") return fail("ERROR", "AGENT_DISABLED", new AppError("CONFLICT", `${definition.displayName} is disabled. The deterministic forecast workflow remains available.`, 409));
  if (!definition.persona.split("|").includes(input.role)) return fail("AUTHORIZATION_UNDETERMINED", "ROLE_NOT_ALLOWED", new AppError("FORBIDDEN", "This assistant is not available for the current role.", 403));

  let workspace;
  try {
    workspace = await forecastWorkspace(input.organizationId, input.forecastVersionId, { all: true });
  } catch (error) {
    if (error instanceof AppError) return fail("AUTHORIZATION_UNDETERMINED", error.code, error);
    return fail("ERROR", "UNKNOWN", new AppError("CONFLICT", "The assistant could not load authorized forecast context.", 500));
  }
  const batchIds = [...new Set(workspace.version.lines.map((line) => line.sourceImportBatchId).filter(Boolean))] as string[];
  const [blockingErrors, warningCount, approvalEvents] = await Promise.all([
    prisma.importError.count({ where: { importBatchId: { in: batchIds }, blocking: true, resolvedAt: null } }),
    prisma.importError.count({ where: { importBatchId: { in: batchIds }, severity: "WARNING", resolvedAt: null } }),
    prisma.auditEvent.findMany({ where: { organizationId: input.organizationId, entityType: "ForecastVersion", entityId: workspace.version.id, action: { in: ["FORECAST.SUBMIT", "FORECAST.REVIEW", "FORECAST.REVISE", "FORECAST.APPROVE", "FORECAST.LOCK"] } }, orderBy: { occurredAt: "asc" }, select: { id: true, action: true, occurredAt: true } }),
  ]);
  const baseEvidence = {
    forecastVersionId: workspace.version.id,
    forecastCode: workspace.version.forecast.code,
    version: workspace.version.version,
    workflowState: workspace.version.status,
    lineCount: workspace.totalLines,
    blockingErrors,
    warningCount,
    commentaryCount: workspace.version.comments.length,
    source: "canonical_forecast_model",
  };
  const guarded = promptGuardrail(input.prompt);
  let type = "NEXT_BEST_ACTION";
  let summary = guarded ?? "";
  let proposedContent: string | null = null;
  let observedFacts: Prisma.InputJsonValue = baseEvidence;
  let tools: string[] = [];

  if (!guarded && input.agentId === "PLANORA.WORKFLOW.ASSISTANT.NEXT_ACTION.v1") {
    const actions = nextBestActions({ role: input.role, status: workspace.version.status, blockingErrors, warningCount, lineCount: workspace.totalLines, commentaryCount: workspace.version.comments.length });
    summary = actions[0].label;
    proposedContent = actions.map((action) => `${action.label}: ${action.reason}`).join("\n");
    observedFacts = { ...baseEvidence, actions };
    tools = ["getForecastCycle", "getValidationSummary", "getOutstandingActions"];
  } else if (!guarded && input.agentId === "PLANORA.FORECAST.ANALYST.VARIANCE.v1") {
    type = "VARIANCE_REVIEW";
    const movements = workspace.largestMovements.map((line) => ({ lineId: line.id, account: line.account.name, costCenter: line.costCenter.code, period: line.fiscalPeriod.code, actualVsForecast: line.variance, currentVsPrior: line.movement }));
    if (!movements.length) return fail("INSUFFICIENT_DATA", "NO_FORECAST_LINES", new AppError("VALIDATION_ERROR", "No forecast movements are available to analyze.", 400));
    summary = `Largest movement: ${movements[0].account} / ${movements[0].costCenter} at ${compactMoney(movements[0].currentVsPrior)} versus prior forecast.`;
    proposedContent = movements.map((movement, index) => `${index + 1}. ${movement.account} · ${movement.costCenter} · ${movement.period}: ${compactMoney(movement.currentVsPrior)} current vs prior`).join("\n");
    observedFacts = { ...baseEvidence, movements, causalExplanation: "unknown_without_supporting_operational_evidence" };
    tools = ["getMaterialVariances", "getForecastCycle"];
  } else if (!guarded && input.agentId === "PLANORA.FORECAST.ANALYST.COMMENTARY.v1") {
    type = "COMMENTARY_DRAFT";
    const movement = workspace.largestMovements[0];
    if (!movement) return fail("INSUFFICIENT_DATA", "NO_FORECAST_LINES", new AppError("VALIDATION_ERROR", "No supported forecast movement is available for commentary.", 400));
    summary = `Draft commentary for ${movement.account.name} / ${movement.costCenter.code}.`;
    proposedContent = `${movement.account.name} for ${movement.costCenter.name} is ${compactMoney(movement.movement)} versus the prior forecast and ${compactMoney(movement.variance)} versus actual. The financial movement is observed; the underlying business cause is not established by the available evidence.`;
    observedFacts = { ...baseEvidence, lineId: movement.id, account: movement.account.name, costCenter: movement.costCenter.code, period: movement.fiscalPeriod.code, actualVsForecast: movement.variance, currentVsPrior: movement.movement, causalExplanation: "not_established" };
    tools = ["getMaterialVariances", "getForecastCommentary", "prepareVarianceCommentary"];
  } else if (!guarded && input.agentId === "PLANORA.REVIEW.DIRECTOR.EXCEPTION.v1") {
    type = "REVIEW_SUMMARY";
    const movements = workspace.largestMovements.map((line) => ({ account: line.account.name, costCenter: line.costCenter.code, movement: line.movement }));
    summary = `${workspace.version.status.replaceAll("_", " ")} forecast with ${movements.length} ranked movements, ${workspace.version.comments.length} commentary item${workspace.version.comments.length === 1 ? "" : "s"}, and ${warningCount} warning${warningCount === 1 ? "" : "s"}.`;
    proposedContent = `Review the ranked movements and ${workspace.version.comments.length ? "supporting commentary" : "missing commentary"} before making any human approval or revision decision.`;
    observedFacts = { ...baseEvidence, movements, approvalEvents };
    tools = ["getMaterialVariances", "getForecastCommentary", "getApprovalHistory", "getOutstandingActions"];
  } else if (guarded) {
    type = "GUARDRAIL_RESPONSE";
    proposedContent = guarded;
    observedFacts = { ...baseEvidence, deniedAutonomousAction: true };
    tools = ["getForecastCycle", "getValidationSummary"];
  }

  const result = await prisma.$transaction(async (tx) => {
    const recommendation = await tx.agentRecommendation.create({ data: { runId: run.id, organizationId: input.organizationId, actorId: input.actorId, forecastVersionId: workspace.version.id, type, summary, proposedContent, observedFacts, evidence: { references: [{ type: "ForecastVersion", id: workspace.version.id }, ...workspace.largestMovements.slice(0, 3).map((line) => ({ type: "ForecastLine", id: line.id }))], calculations: "src/domain/forecast/variance.ts", assumptions: ["No causal driver is asserted without operational evidence"] }, unsupportedClaim: false } });
    await tx.agentRun.update({ where: { id: run.id }, data: { forecastVersionId: workspace.version.id, inputReferences: { forecastVersionId: workspace.version.id, organizationId: input.organizationId }, toolTrace: tools.map((tool) => ({ tool, authorizedBy: "authenticated_session", organizationId: input.organizationId })), evidence: baseEvidence, output: { recommendationId: recommendation.id, type, summary }, status: "SUCCEEDED", confidence: "1.0000", completedAt: new Date() } });
    await writeAudit(tx, { organizationId: input.organizationId, actorId: input.actorId, action: "AGENT.RUN_COMPLETED", entityType: "AgentRun", entityId: run.id, newState: { status: "SUCCEEDED", recommendationId: recommendation.id }, metadata: { agentId: definition.agentId, agentVersion: definition.version, forecastVersionId: workspace.version.id, evidenceReferences: (recommendation.evidence as { references?: unknown[] }).references?.length ?? 0 }, correlationId: input.correlationId });
    return recommendation;
  });
  return { runId: run.id, recommendation: result, definition };
}

export async function respondToRecommendation(input: AgentContext & { recommendationId: string; decision: AgentFeedbackDecision; finalContent?: string; reason: string }) {
  return prisma.$transaction(async (tx) => {
    const recommendation = await tx.agentRecommendation.findFirst({ where: { id: input.recommendationId, organizationId: input.organizationId }, include: { run: { include: { agentDefinition: true } }, forecastVersion: true } });
    if (!recommendation) throw new AppError("RESOURCE_NOT_FOUND", "Agent recommendation was not found.", 404);
    if (recommendation.status !== "PENDING") throw new AppError("CONFLICT", "This recommendation already has a recorded human decision.", 409);
    const content = input.finalContent?.trim() || recommendation.proposedContent;
    if (input.decision === "EDITED" && (!content || content === recommendation.proposedContent)) throw new AppError("VALIDATION_ERROR", "Edited commentary must differ from the suggestion.", 400);
    if (["ACCEPTED", "EDITED"].includes(input.decision) && recommendation.type === "COMMENTARY_DRAFT") {
      if (recommendation.run.agentDefinition.killSwitch !== "ENABLED") throw new AppError("CONFLICT", "Commentary application is read-only or disabled. The suggestion remains available for review.", 409);
      if (!content || !recommendation.forecastVersion || !["DRAFT", "REVISION_REQUIRED", "IN_REVIEW"].includes(recommendation.forecastVersion.status)) throw new AppError("VERSION_LOCKED", "Commentary cannot be applied in the current workflow state.", 409);
      const comment = await tx.forecastComment.create({ data: { forecastVersionId: recommendation.forecastVersion.id, authorId: input.actorId, body: content, context: { source: "agent_recommendation", recommendationId: recommendation.id, decision: input.decision, agentId: recommendation.run.agentDefinition.agentId, agentVersion: recommendation.run.agentDefinition.version } } });
      await writeAudit(tx, { organizationId: input.organizationId, actorId: input.actorId, action: "FORECAST.COMMENT_ADDED", entityType: "ForecastComment", entityId: comment.id, newState: { body: content, forecastVersionId: recommendation.forecastVersion.id }, metadata: { source: "agent_recommendation", recommendationId: recommendation.id, agentId: recommendation.run.agentDefinition.agentId, agentVersion: recommendation.run.agentDefinition.version }, correlationId: input.correlationId });
    }
    const status = input.decision;
    const updated = await tx.agentRecommendation.update({ where: { id: recommendation.id }, data: { status, decidedById: input.actorId, decidedAt: new Date(), decisionReason: input.reason } });
    await tx.agentFeedback.create({ data: { recommendationId: recommendation.id, organizationId: input.organizationId, actorId: input.actorId, decision: input.decision, originalContent: recommendation.proposedContent, finalContent: content, candidateImprovement: { type: "FORMAT_OR_RANKING_ONLY", sourceAgentVersion: recommendation.run.agentDefinition.version, deploymentStatus: "NOT_DEPLOYED" }, requiresVersionChange: true } });
    await writeAudit(tx, { organizationId: input.organizationId, actorId: input.actorId, action: `AGENT.RECOMMENDATION_${input.decision}`, entityType: "AgentRecommendation", entityId: recommendation.id, previousState: { status: recommendation.status }, newState: { status }, metadata: { reason: input.reason, forecastVersionId: recommendation.forecastVersionId, liveBehaviorChanged: false, versionChangeRequired: true }, correlationId: input.correlationId });
    return updated;
  });
}

export function listForecastRecommendations(organizationId: string, forecastVersionId: string) {
  return prisma.agentRecommendation.findMany({ where: { organizationId, forecastVersionId }, include: { run: { include: { agentDefinition: true } }, feedback: true }, orderBy: { createdAt: "desc" }, take: 12 });
}

export async function getTenantRecommendation(organizationId: string, recommendationId: string) {
  const recommendation = await prisma.agentRecommendation.findFirst({ where: { id: recommendationId, organizationId }, include: { run: { include: { agentDefinition: true } }, feedback: true } });
  if (!recommendation) throw new AppError("RESOURCE_NOT_FOUND", "Agent recommendation was not found.", 404);
  return recommendation;
}

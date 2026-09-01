import "server-only";
import type { ForecastVersionStatus, Prisma, RoleCode } from "@prisma/client";
import { writeAudit } from "@/audit/audit";
import { calculateFavorability, calculateMovement, calculateVariance } from "@/domain/forecast/variance";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { getTenantForecastVersion } from "@/repositories/forecast-repository";

type Context = { organizationId: string; actorId: string; role: RoleCode; correlationId: string };
const editable = new Set<ForecastVersionStatus>(["DRAFT", "REVISION_REQUIRED"]);

export async function forecastWorkspace(organizationId: string, id: string, filters: { search?: string; period?: string; page?: string; all?: boolean } = {}) {
  const version = await getTenantForecastVersion(organizationId, id); const search = filters.search?.trim().toLowerCase();
  const matchedLines = version.lines.filter((line) => (!filters.period || line.fiscalPeriod.id === filters.period) && (!search || `${line.account.code} ${line.account.name} ${line.costCenter.code} ${line.costCenter.name}`.toLowerCase().includes(search))).map((line) => {
    const variance = calculateVariance(line.actualAmount.toFixed(), line.currentForecast.toFixed()); const movement = calculateMovement(line.currentForecast.toFixed(), line.priorForecast.toFixed());
    return { ...line, actual: line.actualAmount.toFixed(), prior: line.priorForecast.toFixed(), current: line.currentForecast.toFixed(), variance: variance.amount.toFixed(), variancePct: variance.percentage.toFixed(), movement: movement.amount.toFixed(), movementPct: movement.percentage.toFixed() };
  });
  const pageSize = 100; const pageCount = Math.max(1, Math.ceil(matchedLines.length / pageSize)); const page = Math.min(pageCount, Math.max(1, Number.parseInt(filters.page ?? "1", 10) || 1)); const lines = filters.all ? matchedLines : matchedLines.slice((page - 1) * pageSize, page * pageSize);
  const rank = (line: typeof matchedLines[number]) => calculateFavorability(line.variance, line.account.type).toNumber(); const movementRank = (line: typeof matchedLines[number]) => Math.abs(Number(line.movement));
  return { version, lines, topFavorable: [...matchedLines].sort((a, b) => rank(b) - rank(a)).slice(0, 3), topUnfavorable: [...matchedLines].sort((a, b) => rank(a) - rank(b)).slice(0, 3), largestMovements: [...matchedLines].sort((a, b) => movementRank(b) - movementRank(a)).slice(0, 3), editable: editable.has(version.status), page, pageCount, totalLines: matchedLines.length };
}

export async function updateForecastLine(input: Context & { versionId: string; lineId: string; currentForecast: string; reason: string }) {
  return prisma.$transaction(async (tx) => {
    const line = await tx.forecastLine.findFirst({ where: { id: input.lineId, forecastVersionId: input.versionId, forecastVersion: { forecast: { organizationId: input.organizationId } } }, include: { forecastVersion: true } });
    if (!line) throw new AppError("RESOURCE_NOT_FOUND", "Forecast line was not found.", 404); if (!editable.has(line.forecastVersion.status)) throw new AppError("VERSION_LOCKED", "This forecast version is not editable.", 409);
    const updated = await tx.forecastLine.update({ where: { id: line.id }, data: { currentForecast: input.currentForecast } });
    await writeAudit(tx, { organizationId: input.organizationId, actorId: input.actorId, action: "FORECAST.LINE_UPDATED", entityType: "ForecastLine", entityId: line.id, previousState: { currentForecast: line.currentForecast.toFixed() }, newState: { currentForecast: updated.currentForecast.toFixed() }, metadata: { forecastVersionId: input.versionId, reason: input.reason }, correlationId: input.correlationId }); return updated;
  });
}

export async function addForecastComment(input: Context & { versionId: string; lineId?: string; body: string }) {
  const version = await getTenantForecastVersion(input.organizationId, input.versionId); if (!editable.has(version.status) && input.role === "ANALYST") throw new AppError("VERSION_LOCKED", "Analyst commentary is closed for this state.", 409);
  if (input.lineId && !version.lines.some((line) => line.id === input.lineId)) throw new AppError("RESOURCE_NOT_FOUND", "Forecast line was not found in this version.", 404);
  return prisma.$transaction(async (tx) => { const comment = await tx.forecastComment.create({ data: { forecastVersionId: version.id, forecastLineId: input.lineId, authorId: input.actorId, body: input.body, context: { status: version.status, forecastCode: version.forecast.code, version: version.version } } }); await writeAudit(tx, { organizationId: input.organizationId, actorId: input.actorId, action: "FORECAST.COMMENT_ADDED", entityType: "ForecastComment", entityId: comment.id, newState: { body: input.body, forecastVersionId: version.id, lineId: input.lineId ?? null }, correlationId: input.correlationId }); return comment; });
}

const transitions: Record<string, { from: ForecastVersionStatus[]; to: ForecastVersionStatus; roles: RoleCode[] }> = {
  submit: { from: ["DRAFT", "REVISION_REQUIRED"], to: "SUBMITTED", roles: ["ANALYST", "FPA_DIRECTOR", "CFO"] },
  review: { from: ["SUBMITTED"], to: "IN_REVIEW", roles: ["FPA_DIRECTOR", "CFO"] },
  revise: { from: ["IN_REVIEW"], to: "REVISION_REQUIRED", roles: ["FPA_DIRECTOR", "CFO"] },
  approve: { from: ["IN_REVIEW"], to: "APPROVED", roles: ["FPA_DIRECTOR", "CFO"] },
  lock: { from: ["APPROVED"], to: "LOCKED", roles: ["CFO"] },
};

export async function transitionForecast(input: Context & { versionId: string; action: keyof typeof transitions; reason: string }) {
  const denied = (code: string) => console.warn(JSON.stringify({ level: "warn", event: "forecast.transition_denied", correlationId: input.correlationId, organizationId: input.organizationId, actorId: input.actorId, versionId: input.versionId, action: input.action, code }));
  const rule = transitions[input.action]; if (!rule || !rule.roles.includes(input.role)) { denied("FORBIDDEN"); throw new AppError("FORBIDDEN", "You are not authorized for this workflow transition.", 403); }
  return prisma.$transaction(async (tx) => {
    const version = await tx.forecastVersion.findFirst({ where: { id: input.versionId, forecast: { organizationId: input.organizationId } }, include: { lines: { select: { sourceImportBatchId: true } } } });
    if (!version) { denied("RESOURCE_NOT_FOUND"); throw new AppError("RESOURCE_NOT_FOUND", "Forecast version was not found.", 404); } if (!rule.from.includes(version.status)) { denied("INVALID_STATE"); throw new AppError("CONFLICT", `Cannot ${input.action} from ${version.status}.`, 409); } if (!version.lines.length) throw new AppError("VALIDATION_ERROR", "Forecast contains no data.", 400);
    if (input.action === "submit") { const batchIds = [...new Set(version.lines.map((line) => line.sourceImportBatchId).filter(Boolean))] as string[]; const blockers = await tx.importError.count({ where: { importBatchId: { in: batchIds }, blocking: true, resolvedAt: null } }); if (blockers) throw new AppError("VALIDATION_ERROR", "Blocking import validation issues must be resolved before submission.", 400); }
    if (input.action === "approve") { const submission = await tx.auditEvent.findFirst({ where: { organizationId: input.organizationId, entityType: "ForecastVersion", entityId: version.id, action: "FORECAST.SUBMIT" }, orderBy: { occurredAt: "desc" } }); if (submission?.actorId === input.actorId) { denied("SELF_APPROVAL"); throw new AppError("FORBIDDEN", "A forecast submitter cannot approve the same submission.", 403); } }
    const timestamps: Prisma.ForecastVersionUpdateInput = input.action === "submit" ? { submittedAt: new Date() } : input.action === "approve" ? { approvedAt: new Date() } : input.action === "lock" ? { lockedAt: new Date() } : {};
    const updated = await tx.forecastVersion.update({ where: { id: version.id }, data: { status: rule.to, ...timestamps, reason: input.reason } }); await writeAudit(tx, { organizationId: input.organizationId, actorId: input.actorId, action: `FORECAST.${input.action.toUpperCase()}`, entityType: "ForecastVersion", entityId: version.id, previousState: { status: version.status }, newState: { status: updated.status }, metadata: { reason: input.reason }, correlationId: input.correlationId }); return updated;
  });
}

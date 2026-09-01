import "server-only";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

function elapsedMs(start?: Date | null, end?: Date | null) { return start && end ? Math.max(0, end.getTime() - start.getTime()) : null; }

export async function forecastCycleMetrics(organizationId: string, versionId: string) {
  const version = await prisma.forecastVersion.findFirst({ where: { id: versionId, forecast: { organizationId } }, include: { lines: { select: { sourceImportBatchId: true } } } });
  if (!version) throw new AppError("RESOURCE_NOT_FOUND", "Forecast version was not found.", 404);
  const batchIds = [...new Set(version.lines.map((line) => line.sourceImportBatchId).filter(Boolean))] as string[];
  const [batches, events, mappingReuseCount] = await Promise.all([
    prisma.importBatch.findMany({ where: { organizationId, id: { in: batchIds } }, orderBy: { startedAt: "asc" } }),
    prisma.auditEvent.findMany({ where: { organizationId, OR: [{ entityId: versionId }, { metadata: { path: ["forecastVersionId"], equals: versionId } }] }, orderBy: { occurredAt: "asc" } }),
    prisma.auditEvent.count({ where: { organizationId, action: "MAPPING.REUSED" } }),
  ]);
  const event = (action: string, last = false) => (last ? [...events].reverse() : events).find((item) => item.action === action);
  const firstBatch = batches[0]; const lastBatch = batches.at(-1); const firstEdit = event("FORECAST.LINE_UPDATED"); const firstSubmit = event("FORECAST.SUBMIT"); const approval = event("FORECAST.APPROVE", true); const lock = event("FORECAST.LOCK", true);
  return {
    importDurationMs: batches.reduce((sum, batch) => sum + (elapsedMs(batch.startedAt, batch.completedAt) ?? 0), 0),
    mappingReuseCount,
    validationExceptionCount: await prisma.importError.count({ where: { batch: { organizationId } } }),
    draftToSubmitMs: elapsedMs(firstEdit?.occurredAt ?? lastBatch?.completedAt, firstSubmit?.occurredAt),
    submitToApprovalMs: elapsedMs(firstSubmit?.occurredAt, approval?.occurredAt),
    revisionCount: events.filter((item) => item.action === "FORECAST.REVISE").length,
    cycleDurationMs: elapsedMs(firstBatch?.startedAt, lock?.occurredAt ?? approval?.occurredAt),
    eventCount: events.length,
  };
}

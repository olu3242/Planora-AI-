import "server-only";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { buildManagementDashboard, type DashboardFilters } from "@/domain/dashboard/management-dashboard";

export async function managementDashboard(organizationId: string, selection: DashboardFilters & { cycle?: string; version?: number }) {
  const version = await prisma.forecastVersion.findFirst({
    where: { forecast: { organizationId, ...(selection.cycle ? { code: selection.cycle } : {}) }, ...(selection.version ? { version: selection.version } : {}) },
    orderBy: [{ createdAt: "desc" }, { version: "desc" }],
    include: { forecast: true, lines: { include: { account: true, costCenter: true, fiscalPeriod: true } } },
  });
  if (!version) throw new AppError("RESOURCE_NOT_FOUND", "No forecast data is available for this selection.", 404);
  const [workflowRows, errors, unresolvedMappings, failedImports, failedExports, failedAgentRuns, failedRuntime, recoveries, recommendations] = await Promise.all([
    prisma.forecastVersion.groupBy({ by: ["status"], where: { forecast: { organizationId } }, _count: { status: true } }),
    prisma.importError.groupBy({ by: ["severity"], where: { batch: { organizationId }, resolvedAt: null }, _count: { severity: true } }),
    prisma.mappingSuggestion.count({ where: { mappingVersion: { template: { organizationId } }, status: { in: ["SUGGESTED", "REVIEW_REQUIRED"] } } }),
    prisma.importBatch.count({ where: { organizationId, status: { in: ["FAILED", "VALIDATION_FAILED"] } } }),
    prisma.auditEvent.count({ where: { organizationId, action: "FORECAST.EXPORT_FAILED" } }),
    prisma.agentRun.count({ where: { organizationId, status: "ERROR" } }),
    prisma.runtimeExecution.count({ where: { organizationId, status: "FAILED" } }),
    prisma.runtimeExecution.count({ where: { organizationId, status: "RECOVERED" } }),
    prisma.agentRecommendation.findMany({ where: { organizationId }, select: { status: true, run: { select: { agentDefinition: { select: { displayName: true, version: true } } } } } }),
  ]);
  const result = buildManagementDashboard(version.lines.map((line) => ({ id: line.id, accountCode: line.account.code, accountName: line.account.name, accountType: line.account.type, costCenterCode: line.costCenter.code, costCenterName: line.costCenter.name, periodCode: line.fiscalPeriod.code, periodName: line.fiscalPeriod.name, periodOrdinal: line.fiscalPeriod.ordinal, actual: line.actualAmount.toFixed(), prior: line.priorForecast.toFixed(), current: line.currentForecast.toFixed() })), selection, {
    workflow: Object.fromEntries(workflowRows.map((row) => [row.status, row._count.status])),
    blockingErrors: errors.find((row) => row.severity === "ERROR")?._count.severity ?? 0,
    warnings: errors.find((row) => row.severity === "WARNING")?._count.severity ?? 0,
    unresolvedMappings, failedImports, failedExports, failedAgentRuns, failedRuntimeExecutions: failedRuntime, runtimeRecoveries: recoveries,
    recommendations: recommendations.map((item) => ({ assistant: item.run.agentDefinition.displayName, version: item.run.agentDefinition.version, status: item.status })),
  });
  return { ...result, cycle: version.forecast.code, cycleName: version.forecast.name, version: version.version, versionId: version.id, status: version.status, approvedAt: version.approvedAt, lockedAt: version.lockedAt,
    options: { periods: [...new Map(version.lines.map((line) => [line.fiscalPeriod.code, line.fiscalPeriod.name])).entries()], accounts: [...new Map(version.lines.map((line) => [line.account.code, line.account.name])).entries()], costCenters: [...new Map(version.lines.map((line) => [line.costCenter.code, line.costCenter.name])).entries()] } };
}

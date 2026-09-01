import "server-only";
import { FinancialScenario } from "@prisma/client";
import { money } from "@/domain/financial/money";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

type SourceTotals = { revenue?: string; cogs?: string; operatingExpense?: string };

export async function reconcileForecastVersion(organizationId: string, versionId: string) {
  const version = await prisma.forecastVersion.findFirst({ where: { id: versionId, forecast: { organizationId } }, include: { lines: { select: { currentForecast: true, sourceImportBatchId: true } } } });
  if (!version) throw new AppError("RESOURCE_NOT_FOUND", "Forecast version was not found.", 404);
  const batchIds = [...new Set(version.lines.map((line) => line.sourceImportBatchId).filter(Boolean))] as string[];
  const [batches, facts] = await Promise.all([
    prisma.importBatch.findMany({ where: { id: { in: batchIds }, organizationId }, select: { sourceTotals: true } }),
    prisma.financialFact.findMany({ where: { organizationId, versionContext: { in: batchIds }, scenario: FinancialScenario.FORECAST }, select: { amount: true } }),
  ]);
  const acceptedSourceTotal = batches.reduce((total, batch) => { const source = batch.sourceTotals as SourceTotals | null; return total.plus(source?.revenue ?? 0).plus(source?.cogs ?? 0).plus(source?.operatingExpense ?? 0); }, money(0));
  const persistedImportTotal = facts.reduce((total, fact) => total.plus(fact.amount.toFixed()), money(0));
  const workspaceTotal = version.lines.reduce((total, line) => total.plus(line.currentForecast.toFixed()), money(0));
  return {
    acceptedSourceTotal: acceptedSourceTotal.toFixed(), persistedImportTotal: persistedImportTotal.toFixed(),
    workspaceTotal: workspaceTotal.toFixed(), approvedForecastTotal: ["APPROVED", "LOCKED"].includes(version.status) ? workspaceTotal.toFixed() : null,
    importReconciled: acceptedSourceTotal.eq(persistedImportTotal), status: version.status,
  };
}

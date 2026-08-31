import "server-only";
import { FinancialScenario } from "@prisma/client";
import { calculateMetrics, type MetricCode } from "@/domain/financial/calculation-engine";
import { formatMoney, formatPercent } from "@/domain/financial/money";
import { prisma } from "@/lib/prisma";
import { aggregateActuals, listStatementFilters, type StatementFilter } from "@/repositories/financial-repository";

export async function getActualStatement(organizationId: string, requested: Partial<StatementFilter> = {}) {
  const filters = await listStatementFilters(organizationId);
  const period = requested.periodId ? filters.periods.find((item) => item.id === requested.periodId) : filters.periods[0];
  if (!period) return { state: "empty" as const, filters };
  const geographyId = filters.geographies.some((item) => item.id === requested.geographyId) ? requested.geographyId : undefined;
  const productId = filters.products.some((item) => item.id === requested.productId) ? requested.productId : undefined;
  const aggregate = await aggregateActuals(organizationId, { periodId: period.id, geographyId, productId });
  const results = calculateMetrics({ REVENUE: aggregate.REVENUE.amount, COGS: aggregate.COGS.amount, OPERATING_EXPENSE: aggregate.OPERATING_EXPENSE.amount });
  const definitions = await prisma.metricDefinition.findMany({ where: { organizationId, code: { in: [...results.keys()] } }, include: { values: { where: { fiscalPeriodId: period.id, scenario: FinancialScenario.ACTUAL, contextKey: "ALL" } } } });
  const valueIds = Object.fromEntries(definitions.map((definition) => [definition.code, definition.values[0]?.id]));
  const lines = (["REVENUE", "COGS", "GROSS_PROFIT", "OPERATING_EXPENSE", "EBITDA", "GROSS_MARGIN_PCT", "EBITDA_MARGIN_PCT"] as MetricCode[]).map((code) => {
    const result = results.get(code)!; const percent = code.endsWith("_PCT");
    return { code, label: code.replaceAll("_", " "), value: result.value.toFixed(), formatted: percent ? formatPercent(result.value) : formatMoney(result.value), compact: percent ? formatPercent(result.value) : formatMoney(result.value, "USD", true), formula: result.formula, metricValueId: valueIds[code] as string | undefined };
  });
  return { state: "ready" as const, period, filters, selected: { geographyId, productId }, lines, source: { type: "SEED", identifier: "PHASE2-FIXTURE", factCount: Object.values(aggregate).reduce((sum, row) => sum + row.count, 0) } };
}

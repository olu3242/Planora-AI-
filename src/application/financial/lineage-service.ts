import "server-only";
import { AccountType } from "@prisma/client";
import { calculateMetrics, type MetricCode } from "@/domain/financial/calculation-engine";
import { aggregateActuals, getTenantMetricValue, listSourceFacts, type StatementFilter } from "@/repositories/financial-repository";

const sourceTypes: Record<string, AccountType[]> = {
  REVENUE: [AccountType.REVENUE], COGS: [AccountType.COGS], OPERATING_EXPENSE: [AccountType.OPERATING_EXPENSE],
  GROSS_PROFIT: [AccountType.REVENUE, AccountType.COGS], EBITDA: [AccountType.REVENUE, AccountType.COGS, AccountType.OPERATING_EXPENSE],
  GROSS_MARGIN_PCT: [AccountType.REVENUE, AccountType.COGS], EBITDA_MARGIN_PCT: [AccountType.REVENUE, AccountType.COGS, AccountType.OPERATING_EXPENSE],
};

export async function explainMetricValue(organizationId: string, id: string, filter: Omit<StatementFilter, "periodId"> = {}) {
  const metricValue = await getTenantMetricValue(organizationId, id);
  const facts = await listSourceFacts(organizationId, metricValue.fiscalPeriodId, sourceTypes[metricValue.metric.code] ?? [], filter);
  let value = metricValue.value.toFixed();
  if (filter.geographyId || filter.productId) {
    const aggregate = await aggregateActuals(organizationId, { periodId: metricValue.fiscalPeriodId, ...filter });
    value = calculateMetrics({ REVENUE: aggregate.REVENUE.amount, COGS: aggregate.COGS.amount, OPERATING_EXPENSE: aggregate.OPERATING_EXPENSE.amount }).get(metricValue.metric.code as MetricCode)?.value.toFixed() ?? value;
  }
  return {
    id: metricValue.id, metric: metricValue.metric.code, name: metricValue.metric.name, value,
    formula: metricValue.metric.calculation?.expression ?? "", period: metricValue.fiscalPeriod.name, provenance: metricValue.provenance,
    dependencies: metricValue.metric.dependencies.map((item) => item.dependsOn.code),
    facts: facts.map((fact) => ({ id: fact.id, account: { code: fact.account.code, name: fact.account.name }, amount: fact.amount.toFixed(), geography: fact.geography?.name ?? null, product: fact.product?.name ?? null, source: fact.lineage.map((lineage) => ({ type: lineage.sourceType, identifier: lineage.sourceIdentifier, location: lineage.sourceLocation, transformation: lineage.transformation })) })),
  };
}

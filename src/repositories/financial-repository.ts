import "server-only";
import { AccountType, FinancialScenario, Prisma, type PrismaClient } from "@prisma/client";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

type DbClient = PrismaClient | Prisma.TransactionClient;
export type StatementFilter = { periodId: string; geographyId?: string; productId?: string };

async function activeActualVersionContext(organizationId: string, periodId: string, client: DbClient) {
  const latest = await client.financialFact.findFirst({
    where: { organizationId, fiscalPeriodId: periodId, scenario: FinancialScenario.ACTUAL },
    select: { versionContext: true },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
  return latest?.versionContext;
}

export async function aggregateActuals(organizationId: string, filter: StatementFilter, client: DbClient = prisma) {
  const versionContext = await activeActualVersionContext(organizationId, filter.periodId, client);
  const where: Prisma.FinancialFactWhereInput = { organizationId, fiscalPeriodId: filter.periodId, scenario: FinancialScenario.ACTUAL, versionContext, geographyId: filter.geographyId, productId: filter.productId };
  const types = [AccountType.REVENUE, AccountType.COGS, AccountType.OPERATING_EXPENSE] as const;
  const rows = await Promise.all(types.map(async (type) => ({ type, aggregate: await client.financialFact.aggregate({ where: { ...where, account: { type } }, _sum: { amount: true }, _count: { id: true } }) })));
  return Object.fromEntries(rows.map(({ type, aggregate }) => [type, { amount: aggregate._sum.amount?.toFixed() ?? "0", count: aggregate._count.id }])) as Record<(typeof types)[number], { amount: string; count: number }>;
}

export async function listStatementFilters(organizationId: string, client: DbClient = prisma) {
  const [periods, geographies, products] = await Promise.all([
    client.fiscalPeriod.findMany({ where: { year: { calendar: { organizationId } } }, select: { id: true, code: true, name: true, year: { select: { code: true } } }, orderBy: [{ year: { code: "desc" } }, { ordinal: "asc" }] }),
    client.geography.findMany({ where: { organizationId, active: true }, select: { id: true, code: true, name: true }, orderBy: { code: "asc" } }),
    client.product.findMany({ where: { organizationId, active: true }, select: { id: true, code: true, name: true }, orderBy: { code: "asc" } }),
  ]);
  return { periods, geographies, products };
}

export async function getTenantAccount(organizationId: string, id: string, client: DbClient = prisma) {
  const account = await client.account.findFirst({ where: { id, organizationId } });
  if (!account) throw new AppError("RESOURCE_NOT_FOUND", "Account was not found.", 404);
  return account;
}

export async function getTenantFact(organizationId: string, id: string, client: DbClient = prisma) {
  const fact = await client.financialFact.findFirst({ where: { id, organizationId }, include: { lineage: true, account: true, fiscalPeriod: true } });
  if (!fact) throw new AppError("RESOURCE_NOT_FOUND", "Financial fact was not found.", 404);
  return fact;
}

export async function getTenantMetricValue(organizationId: string, id: string, client: DbClient = prisma) {
  const value = await client.metricValue.findFirst({ where: { id, organizationId }, include: { metric: { include: { calculation: true, dependencies: { include: { dependsOn: true } } } }, fiscalPeriod: true } });
  if (!value) throw new AppError("RESOURCE_NOT_FOUND", "Metric value was not found.", 404);
  return value;
}

export async function listSourceFacts(organizationId: string, periodId: string, accountTypes: AccountType[], filter: Omit<StatementFilter, "periodId"> = {}, client: DbClient = prisma) {
  const versionContext = await activeActualVersionContext(organizationId, periodId, client);
  return client.financialFact.findMany({ where: { organizationId, fiscalPeriodId: periodId, scenario: FinancialScenario.ACTUAL, versionContext, geographyId: filter.geographyId, productId: filter.productId, account: { type: { in: accountTypes } } }, include: { account: true, lineage: true, geography: true, product: true }, orderBy: [{ account: { code: "asc" } }, { geography: { code: "asc" } }, { product: { code: "asc" } }] });
}

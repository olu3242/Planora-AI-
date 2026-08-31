import "dotenv/config";
import { AccountType, FinancialScenario, FinancialSourceType, MetricUnit, NormalBalance, PrismaClient, RoleCode } from "@prisma/client";
import { hashPassword } from "../../src/auth/password";
import { calculateMetrics, metricGraph, type MetricCode } from "../../src/domain/financial/calculation-engine";
import { dimensionKey, financialFactGrain } from "../../src/domain/financial/lineage";
import { agentDefinitions, sharedAgentPolicy } from "../../src/agents/definitions";

const prisma = new PrismaClient();

async function seedOrganization(code: string, name: string) {
  return prisma.organization.upsert({
    where: { code },
    update: { name },
    create: { code, name },
  });
}

async function seedUser(email: string, name: string, role: RoleCode, organizationId: string) {
  const user = await prisma.user.upsert({
    where: { email },
    update: { name, active: true },
    create: { email, name, passwordHash: await hashPassword("Planora!2026") },
  });
  await prisma.organizationMembership.upsert({
    where: { userId_organizationId: { userId: user.id, organizationId } },
    update: { role, active: true },
    create: { userId: user.id, organizationId, role },
  });
}

const effectiveFrom = new Date("2026-01-01T00:00:00.000Z");

async function seedFinancialFixture(organizationId: string) {
  await prisma.currency.upsert({ where: { code: "USD" }, update: { name: "US Dollar", minorUnits: 2 }, create: { code: "USD", name: "US Dollar", minorUnits: 2 } });
  const calendar = await prisma.fiscalCalendar.upsert({ where: { organizationId_code: { organizationId, code: "STANDARD" } }, update: { name: "Standard calendar" }, create: { organizationId, code: "STANDARD", name: "Standard calendar" } });
  const year = await prisma.fiscalYear.upsert({ where: { fiscalCalendarId_code: { fiscalCalendarId: calendar.id, code: "FY26" } }, update: {}, create: { fiscalCalendarId: calendar.id, code: "FY26", name: "Fiscal 2026", startDate: effectiveFrom, endDate: new Date("2026-12-31T00:00:00.000Z") } });
  const period = await prisma.fiscalPeriod.upsert({ where: { fiscalYearId_code: { fiscalYearId: year.id, code: "P01" } }, update: {}, create: { fiscalYearId: year.id, code: "P01", name: "January 2026", ordinal: 1, startDate: effectiveFrom, endDate: new Date("2026-01-31T00:00:00.000Z") } });
  const entity = await prisma.legalEntity.upsert({ where: { organizationId_code: { organizationId, code: "US01" } }, update: {}, create: { organizationId, code: "US01", name: "Northstar Holdings", effectiveFrom } });
  const unit = await prisma.businessUnit.upsert({ where: { organizationId_code: { organizationId, code: "CORE" } }, update: {}, create: { organizationId, code: "CORE", name: "Core Operations", effectiveFrom } });
  const costCenter = await prisma.costCenter.upsert({ where: { organizationId_code: { organizationId, code: "CORP" } }, update: {}, create: { organizationId, code: "CORP", name: "Corporate", effectiveFrom } });
  for (const [code, name] of [["NA-IND", "North America Industrial"], ["NA-SVC", "North America Services"], ["EU-IND", "Europe Industrial"], ["EU-SVC", "Europe Services"]]) await prisma.costCenter.upsert({ where: { organizationId_code: { organizationId, code } }, update: { name }, create: { organizationId, code, name, effectiveFrom, parentId: costCenter.id } });
  const geographies = Object.fromEntries(await Promise.all([["NA", "North America"], ["EU", "Europe"]].map(async ([code, name]) => {
    const row = await prisma.geography.upsert({ where: { organizationId_code: { organizationId, code } }, update: {}, create: { organizationId, code, name, effectiveFrom } }); return [code, row];
  })));
  const products = Object.fromEntries(await Promise.all([["IND", "Industrial"], ["SVC", "Services"]].map(async ([code, name]) => {
    const row = await prisma.product.upsert({ where: { organizationId_code: { organizationId, code } }, update: {}, create: { organizationId, code, name, effectiveFrom } }); return [code, row];
  })));
  const customer = await prisma.customer.upsert({ where: { organizationId_code: { organizationId, code: "PORTFOLIO" } }, update: {}, create: { organizationId, code: "PORTFOLIO", name: "Customer portfolio", effectiveFrom } });
  const accountSpecs = [
    ["4000", "Revenue", AccountType.REVENUE, NormalBalance.CREDIT],
    ["5000", "Cost of goods sold", AccountType.COGS, NormalBalance.DEBIT],
    ["6000", "Operating expense", AccountType.OPERATING_EXPENSE, NormalBalance.DEBIT],
  ] as const;
  const accounts = Object.fromEntries(await Promise.all(accountSpecs.map(async ([code, name, type, normalBalance]) => {
    const row = await prisma.account.upsert({ where: { organizationId_code: { organizationId, code } }, update: { name, type, normalBalance }, create: { organizationId, code, name, type, normalBalance, effectiveFrom } }); return [code, row];
  })));
  const splits = [
    ["NA", "IND", "4000", "70000000"], ["NA", "SVC", "4000", "30000000"], ["EU", "IND", "4000", "25000000"], ["EU", "SVC", "4000", "25000000"],
    ["NA", "IND", "5000", "20000000"], ["NA", "SVC", "5000", "10000000"], ["EU", "IND", "5000", "5000000"], ["EU", "SVC", "5000", "5000000"],
    ["NA", "IND", "6000", "10000000"], ["NA", "SVC", "6000", "5000000"], ["EU", "IND", "6000", "4000000"], ["EU", "SVC", "6000", "4000000"],
  ] as const;
  for (const [geo, product, account, amount] of splits) {
    const dimensions = { legalEntityId: entity.id, businessUnitId: unit.id, geographyId: geographies[geo].id, productId: products[product].id, customerId: customer.id, costCenterId: costCenter.id };
    const common = { ...dimensions, accountId: accounts[account].id, fiscalPeriodId: period.id, scenario: FinancialScenario.ACTUAL, currencyCode: "USD", sourceIdentifier: "PHASE2-FIXTURE", versionContext: "FY26-P01-ACTUAL" };
    const grainKey = financialFactGrain(common);
    const fact = await prisma.financialFact.upsert({ where: { organizationId_grainKey: { organizationId, grainKey } }, update: { amount }, create: { organizationId, ...common, amount, unit: "currency", sourceType: FinancialSourceType.SEED, sourceMetadata: { fixture: "phase-2", certified: true }, dimensionKey: dimensionKey(dimensions), grainKey } });
    await prisma.lineageReference.deleteMany({ where: { financialFactId: fact.id } });
    await prisma.lineageReference.create({ data: { financialFactId: fact.id, sourceType: FinancialSourceType.SEED, sourceIdentifier: "PHASE2-FIXTURE", sourceLocation: { fixture: "database/seeds/index.ts", row: `${geo}-${product}-${account}` }, transformation: { operation: "canonical fixture load", amount } } });
  }
  const descriptions: Record<MetricCode, string> = { REVENUE: "Recognized revenue", COGS: "Direct cost of revenue", GROSS_PROFIT: "Revenue less COGS", OPERATING_EXPENSE: "Operating expenses", EBITDA: "Gross profit less operating expenses", GROSS_MARGIN_PCT: "Gross profit as a percentage of revenue", EBITDA_MARGIN_PCT: "EBITDA as a percentage of revenue" };
  const definitions = {} as Record<MetricCode, { id: string }>;
  for (const code of Object.keys(metricGraph) as MetricCode[]) {
    const unitType = code.endsWith("_PCT") ? MetricUnit.PERCENT : MetricUnit.CURRENCY;
    const definition = await prisma.metricDefinition.upsert({ where: { organizationId_code: { organizationId, code } }, update: { name: code.replaceAll("_", " "), description: descriptions[code], unit: unitType }, create: { organizationId, code, name: code.replaceAll("_", " "), description: descriptions[code], unit: unitType } });
    definitions[code] = definition;
    await prisma.calculationDefinition.upsert({ where: { metricDefinitionId: definition.id }, update: { expression: metricGraph[code].formula }, create: { metricDefinitionId: definition.id, expression: metricGraph[code].formula } });
  }
  for (const [code, node] of Object.entries(metricGraph) as [MetricCode, (typeof metricGraph)[MetricCode]][]) for (const input of node.inputs) await prisma.metricDependency.upsert({ where: { metricDefinitionId_dependsOnMetricId: { metricDefinitionId: definitions[code].id, dependsOnMetricId: definitions[input].id } }, update: {}, create: { metricDefinitionId: definitions[code].id, dependsOnMetricId: definitions[input].id } });
  const calculated = calculateMetrics({ REVENUE: "150000000", COGS: "40000000", OPERATING_EXPENSE: "23000000" });
  for (const result of calculated.values()) await prisma.metricValue.upsert({ where: { organizationId_metricDefinitionId_fiscalPeriodId_scenario_contextKey: { organizationId, metricDefinitionId: definitions[result.code].id, fiscalPeriodId: period.id, scenario: FinancialScenario.ACTUAL, contextKey: "ALL" } }, update: { value: result.value.toFixed(), provenance: { type: "SYSTEM_CALCULATION", formula: result.formula, inputs: result.inputs, sourceIdentifier: "PHASE2-FIXTURE" } }, create: { organizationId, metricDefinitionId: definitions[result.code].id, fiscalPeriodId: period.id, scenario: FinancialScenario.ACTUAL, currencyCode: result.code.endsWith("_PCT") ? null : "USD", value: result.value.toFixed(), contextKey: "ALL", provenance: { type: "SYSTEM_CALCULATION", formula: result.formula, inputs: result.inputs, sourceIdentifier: "PHASE2-FIXTURE" } } });
  const plan = await prisma.plan.upsert({ where: { organizationId_code: { organizationId, code: "FY26-BUDGET" } }, update: {}, create: { organizationId, code: "FY26-BUDGET", name: "FY26 Budget" } });
  await prisma.planVersion.upsert({ where: { planId_version: { planId: plan.id, version: 1 } }, update: {}, create: { planId: plan.id, version: 1, status: "APPROVED" } });
  const forecast = await prisma.forecast.upsert({ where: { organizationId_code: { organizationId, code: "FY26-LE" } }, update: {}, create: { organizationId, code: "FY26-LE", name: "FY26 Latest Estimate" } });
  await prisma.forecastVersion.upsert({ where: { forecastId_version: { forecastId: forecast.id, version: 1 } }, update: {}, create: { forecastId: forecast.id, version: 1, status: "PUBLISHED" } });
}

async function main() {
  const northstar = await seedOrganization("NORTHSTAR", "Northstar Manufacturing");
  const horizon = await seedOrganization("HORIZON", "Horizon Services");
  const demo = await seedOrganization("PLANORA-DEMO", "Planora Demo Company");
  await seedUser("cfo@planora.local", "Morgan Lee", RoleCode.CFO, northstar.id);
  await seedUser("director@planora.local", "Jordan Patel", RoleCode.FPA_DIRECTOR, northstar.id);
  await seedUser("analyst@planora.local", "Casey Rivera", RoleCode.ANALYST, northstar.id);
  await seedUser("cfo@horizon.local", "Avery Chen", RoleCode.CFO, horizon.id);
  await seedUser("analyst@demo.planora.local", "Demo Analyst", RoleCode.ANALYST, demo.id);
  await seedUser("director@demo.planora.local", "Demo FP&A Director", RoleCode.FPA_DIRECTOR, demo.id);
  await seedUser("cfo@demo.planora.local", "Demo CFO", RoleCode.CFO, demo.id);
  await seedFinancialFixture(northstar.id);
  await seedFinancialFixture(horizon.id);
  await seedFinancialFixture(demo.id);
  for (const definition of agentDefinitions) {
    const data = {
      displayName: definition.displayName,
      version: definition.version,
      purpose: definition.purpose,
      persona: definition.persona,
      tenantScope: definition.tenantScope,
      authorityClass: definition.authorityClass,
      allowedTools: [...definition.allowedTools],
      forbiddenActions: [...sharedAgentPolicy.forbiddenActions],
      requiredContext: [...sharedAgentPolicy.requiredContext],
      workflowStates: [...sharedAgentPolicy.workflowStates],
      humanApprovalRequired: sharedAgentPolicy.humanApprovalRequired,
      financialWritePermission: sharedAgentPolicy.financialWritePermission,
      retryPolicy: sharedAgentPolicy.retryPolicy,
      memoryPolicy: sharedAgentPolicy.memoryPolicy,
      learningPolicy: sharedAgentPolicy.learningPolicy,
      failurePolicy: sharedAgentPolicy.failurePolicy,
      auditPolicy: sharedAgentPolicy.auditPolicy,
      killSwitch: "ENABLED" as const,
    };
    await prisma.agentDefinition.upsert({ where: { agentId: definition.agentId }, update: data, create: { agentId: definition.agentId, ...data } });
  }
}

main().finally(() => prisma.$disconnect());

import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { explainMetricValue } from "@/application/financial/lineage-service";
import { getActualStatement } from "@/application/financial/statement-service";
import { createPlanCorrection } from "@/application/financial/version-service";

const prisma = new PrismaClient();
afterAll(() => prisma.$disconnect());

describe("financial core persistence", () => {
  it("aggregates canonical facts and materializes the exact fixture", async () => {
    const org = await prisma.organization.findUniqueOrThrow({ where: { code: "NORTHSTAR" } });
    const statement = await getActualStatement(org.id);
    expect(statement.state).toBe("ready");
    if (statement.state === "ready") expect(Object.fromEntries(statement.lines.map((line) => [line.code, line.value]))).toMatchObject({ REVENUE: "150000000", COGS: "40000000", GROSS_PROFIT: "110000000", OPERATING_EXPENSE: "23000000", EBITDA: "87000000", EBITDA_MARGIN_PCT: "58" });
  });
  it("returns source-complete EBITDA lineage", async () => {
    const value = await prisma.metricValue.findFirstOrThrow({ where: { organization: { code: "NORTHSTAR" }, metric: { code: "EBITDA" } } });
    const lineage = await explainMetricValue(value.organizationId, value.id);
    expect(lineage.dependencies).toEqual(["GROSS_PROFIT", "OPERATING_EXPENSE"]);
    expect(lineage.facts).toHaveLength(12);
    expect(lineage.facts.every((fact) => fact.source[0]?.identifier === "PHASE2-FIXTURE")).toBe(true);
  });
  it("rejects a duplicate semantic fact grain", async () => {
    const fact = await prisma.financialFact.findFirstOrThrow({ where: { organization: { code: "NORTHSTAR" } } });
    await expect(prisma.financialFact.create({ data: {
      organizationId: fact.organizationId, accountId: fact.accountId, fiscalPeriodId: fact.fiscalPeriodId,
      legalEntityId: fact.legalEntityId, businessUnitId: fact.businessUnitId, geographyId: fact.geographyId,
      productId: fact.productId, customerId: fact.customerId, costCenterId: fact.costCenterId,
      scenario: fact.scenario, currencyCode: fact.currencyCode, amount: fact.amount, unit: fact.unit,
      sourceType: fact.sourceType, sourceIdentifier: fact.sourceIdentifier, versionContext: fact.versionContext,
      dimensionKey: fact.dimensionKey, grainKey: fact.grainKey,
    } })).rejects.toThrow();
  });
  it("protects approved plan and published forecast versions in the database", async () => {
    const plan = await prisma.planVersion.findFirstOrThrow({ where: { plan: { organization: { code: "NORTHSTAR" } }, status: "APPROVED" } });
    const forecast = await prisma.forecastVersion.findFirstOrThrow({ where: { forecast: { organization: { code: "NORTHSTAR" } }, status: "PUBLISHED" } });
    await expect(prisma.planVersion.update({ where: { id: plan.id }, data: { reason: "tamper" } })).rejects.toThrow(/immutable/i);
    await expect(prisma.forecastVersion.update({ where: { id: forecast.id }, data: { reason: "tamper" } })).rejects.toThrow(/immutable/i);
  });
  it("creates an audited correction draft instead of changing approval history", async () => {
    const plan = await prisma.planVersion.findFirstOrThrow({ where: { plan: { organization: { code: "NORTHSTAR" } }, status: "APPROVED" }, include: { plan: true } });
    const actor = await prisma.user.findUniqueOrThrow({ where: { email: "cfo@planora.local" } });
    const existing = await prisma.planVersion.findUnique({ where: { planId_version: { planId: plan.planId, version: plan.version + 1 } } });
    if (existing) return expect(existing.correctionOfId).toBe(plan.id);
    const correction = await createPlanCorrection({ organizationId: plan.plan.organizationId, planVersionId: plan.id, actorId: actor.id, reason: "Correct classification", correlationId: "phase2-test" });
    expect(correction).toMatchObject({ status: "DRAFT", correctionOfId: plan.id, reason: "Correct classification" });
    expect(await prisma.auditEvent.count({ where: { entityId: correction.id, action: "PLAN_VERSION.CORRECTION_CREATED" } })).toBe(1);
  });
});

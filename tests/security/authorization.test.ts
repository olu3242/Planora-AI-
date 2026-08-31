import { describe, expect, it } from "vitest";
import { hasPermission } from "@/permissions/permissions";
import { getOrganizationResource } from "@/repositories/organization-repository";
import { getTenantAccount, getTenantFact, getTenantMetricValue } from "@/repositories/financial-repository";
import { getTenantWorkbook } from "@/repositories/excel-repository";
import { getTenantForecastVersion } from "@/repositories/forecast-repository";
import { addForecastComment } from "@/application/forecast/forecast-service";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

describe("authorization boundaries", () => {
  it("does not grant privileged approval or administration to an analyst", () => {
    expect(hasPermission("ANALYST", "mapping.approve")).toBe(false);
    expect(hasPermission("ANALYST", "reconciliation.certify")).toBe(false);
    expect(hasPermission("ANALYST", "forecast.publish")).toBe(false);
    expect(hasPermission("ANALYST", "forecast.export")).toBe(false);
    expect(hasPermission("ANALYST", "admin.manage")).toBe(false);
  });

  it("fails a direct cross-tenant organization ID as not found", async () => {
    const organizations = await prisma.organization.findMany({ orderBy: { code: "asc" }, take: 2 });
    expect(organizations).toHaveLength(2);
    await expect(getOrganizationResource(organizations[0].id, organizations[1].id)).rejects.toMatchObject({ code: "RESOURCE_NOT_FOUND", status: 404 });
  });

  it("denies cross-tenant account, fact, and metric IDs without disclosure", async () => {
    const tenantA = await prisma.organization.findUniqueOrThrow({ where: { code: "NORTHSTAR" } });
    const tenantB = await prisma.organization.findUniqueOrThrow({ where: { code: "HORIZON" } });
    const [account, fact, metric] = await Promise.all([
      prisma.account.findFirstOrThrow({ where: { organizationId: tenantB.id } }),
      prisma.financialFact.findFirstOrThrow({ where: { organizationId: tenantB.id } }),
      prisma.metricValue.findFirstOrThrow({ where: { organizationId: tenantB.id } }),
    ]);
    await expect(getTenantAccount(tenantA.id, account.id)).rejects.toMatchObject({ status: 404 });
    await expect(getTenantFact(tenantA.id, fact.id)).rejects.toMatchObject({ status: 404 });
    await expect(getTenantMetricValue(tenantA.id, metric.id)).rejects.toMatchObject({ status: 404 });
  });

  it("denies cross-tenant workbook IDs without disclosure", async () => {
    const tenantA = await prisma.organization.findUniqueOrThrow({ where: { code: "NORTHSTAR" } });
    const tenantB = await prisma.organization.findUniqueOrThrow({ where: { code: "HORIZON" } });
    const workbook = await prisma.excelWorkbook.upsert({ where: { organizationId_sha256: { organizationId: tenantB.id, sha256: "security-workbook-fixture" } }, update: {}, create: { organizationId: tenantB.id, originalFileName: "security.xlsx", sanitizedFileName: "security.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", byteSize: 4, sha256: "security-workbook-fixture", content: Buffer.from("PK00") } });
    await expect(getTenantWorkbook(tenantA.id, workbook.id)).rejects.toMatchObject({ status: 404, code: "RESOURCE_NOT_FOUND" });
  });

  it("denies cross-tenant forecast and commentary IDs without disclosure", async () => {
    const tenantA = await prisma.organization.findUniqueOrThrow({ where: { code: "NORTHSTAR" } }); const tenantB = await prisma.organization.findUniqueOrThrow({ where: { code: "HORIZON" } }); const analyst = await prisma.user.findUniqueOrThrow({ where: { email: "analyst@planora.local" } }); const foreign = await prisma.forecastVersion.findFirstOrThrow({ where: { forecast: { organizationId: tenantB.id } } });
    await expect(getTenantForecastVersion(tenantA.id, foreign.id)).rejects.toMatchObject({ status: 404, code: "RESOURCE_NOT_FOUND" });
    await expect(addForecastComment({ organizationId: tenantA.id, actorId: analyst.id, role: "ANALYST", correlationId: "security-comment", versionId: foreign.id, body: "Manipulated tenant comment" })).rejects.toMatchObject({ status: 404, code: "RESOURCE_NOT_FOUND" });
    await expect(getTenantForecastVersion(tenantA.id, "00000000-0000-4000-8000-000000000000")).rejects.toMatchObject({ status: 404, code: "RESOURCE_NOT_FOUND" });
  });
});

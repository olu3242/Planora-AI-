import { afterAll, describe, expect, it } from "vitest";
import { hasPermission } from "@/permissions/permissions";
import { getOrganizationResource } from "@/repositories/organization-repository";
import { getTenantAccount, getTenantFact, getTenantMetricValue } from "@/repositories/financial-repository";
import { getTenantWorkbook } from "@/repositories/excel-repository";
import { getTenantForecastVersion } from "@/repositories/forecast-repository";
import { addForecastComment } from "@/application/forecast/forecast-service";
import { PrismaClient } from "@prisma/client";
import { getTenantRecommendation, respondToRecommendation, runAgent } from "@/agents/agent-service";
import { getTenantExecution } from "@/runtime/execution-runtime";
import { decideAccountMapping, decideColumnMapping, validateAndImportWorkbook } from "@/application/excel/workbook-service";

const prisma = new PrismaClient();
afterAll(() => prisma.$disconnect());

describe("authorization boundaries", () => {
  it("does not grant privileged approval or administration to an analyst", () => {
    expect(hasPermission("ANALYST", "mapping.approve")).toBe(false);
    expect(hasPermission("ANALYST", "reconciliation.certify")).toBe(false);
    expect(hasPermission("ANALYST", "forecast.publish")).toBe(false);
    expect(hasPermission("ANALYST", "forecast.export")).toBe(false);
    expect(hasPermission("ANALYST", "admin.manage")).toBe(false);
  });

  it("keeps platform operations separate from financial authority", () => {
    expect(hasPermission("PLATFORM_ADMIN", "admin.manage")).toBe(true);
    expect(hasPermission("PLATFORM_ADMIN", "financial.read")).toBe(false);
    expect(hasPermission("PLATFORM_ADMIN", "forecast.approve")).toBe(false);
    expect(hasPermission("CFO", "admin.manage")).toBe(false);
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

  it("denies manipulated cross-tenant import and mapping IDs", async () => {
    const tenantA = await prisma.organization.findUniqueOrThrow({ where: { code: "NORTHSTAR" } }); const tenantB = await prisma.organization.findUniqueOrThrow({ where: { code: "HORIZON" } }); const analyst = await prisma.user.findUniqueOrThrow({ where: { email: "analyst@planora.local" } });
    const workbook = await prisma.excelWorkbook.upsert({ where: { organizationId_sha256: { organizationId: tenantB.id, sha256: "security-mapping-fixture" } }, update: {}, create: { organizationId: tenantB.id, originalFileName: "foreign.csv", sanitizedFileName: "foreign.csv", mimeType: "text/csv", byteSize: 1, sha256: "security-mapping-fixture", content: Buffer.from("x") } });
    const template = await prisma.mappingTemplate.upsert({ where: { organizationId_fingerprint: { organizationId: tenantB.id, fingerprint: "security-mapping-fingerprint" } }, update: {}, create: { organizationId: tenantB.id, name: "Foreign security mapping", fingerprint: "security-mapping-fingerprint" } });
    const mapping = await prisma.mappingVersion.upsert({ where: { templateId_version: { templateId: template.id, version: 1 } }, update: {}, create: { templateId: template.id, workbookId: workbook.id, version: 1, schemaFingerprint: template.fingerprint } });
    const rule = await prisma.mappingRule.upsert({ where: { mappingVersionId_kind_sourceField_targetConcept: { mappingVersionId: mapping.id, kind: "COLUMN", sourceField: "GL_ACCT", targetConcept: "UNMAPPED" } }, update: {}, create: { mappingVersionId: mapping.id, kind: "COLUMN", sourceField: "GL_ACCT", targetConcept: "UNMAPPED", confidence: "0", reason: "Security fixture" } });
    const suggestion = await prisma.mappingSuggestion.upsert({ where: { mappingVersionId_kind_sourceValue_targetConcept: { mappingVersionId: mapping.id, kind: "MEMBER", sourceValue: "Foreign Revenue", targetConcept: "ACCOUNT" } }, update: {}, create: { mappingVersionId: mapping.id, kind: "MEMBER", sourceValue: "Foreign Revenue", targetConcept: "ACCOUNT", confidence: "0", reason: "Security fixture", status: "REVIEW_REQUIRED" } });
    const context = { organizationId: tenantA.id, actorId: analyst.id, correlationId: "security-mapping-id" };
    await expect(decideColumnMapping({ ...context, workbookId: workbook.id, ruleId: rule.id, targetConcept: "ACCOUNT", reason: "Manipulated foreign rule" })).rejects.toMatchObject({ status: 404, code: "RESOURCE_NOT_FOUND" });
    await expect(decideAccountMapping({ ...context, workbookId: workbook.id, suggestionId: suggestion.id, accountId: (await prisma.account.findFirstOrThrow({ where: { organizationId: tenantA.id } })).id, reason: "Manipulated foreign suggestion" })).rejects.toMatchObject({ status: 404, code: "RESOURCE_NOT_FOUND" });
    await expect(validateAndImportWorkbook({ ...context, workbookId: workbook.id })).rejects.toMatchObject({ status: 404, code: "RESOURCE_NOT_FOUND" });
  });

  it("denies cross-tenant forecast and commentary IDs without disclosure", async () => {
    const tenantA = await prisma.organization.findUniqueOrThrow({ where: { code: "NORTHSTAR" } }); const tenantB = await prisma.organization.findUniqueOrThrow({ where: { code: "HORIZON" } }); const analyst = await prisma.user.findUniqueOrThrow({ where: { email: "analyst@planora.local" } }); const foreign = await prisma.forecastVersion.findFirstOrThrow({ where: { forecast: { organizationId: tenantB.id } } });
    await expect(getTenantForecastVersion(tenantA.id, foreign.id)).rejects.toMatchObject({ status: 404, code: "RESOURCE_NOT_FOUND" });
    await expect(addForecastComment({ organizationId: tenantA.id, actorId: analyst.id, role: "ANALYST", correlationId: "security-comment", versionId: foreign.id, body: "Manipulated tenant comment" })).rejects.toMatchObject({ status: 404, code: "RESOURCE_NOT_FOUND" });
    await expect(getTenantForecastVersion(tenantA.id, "00000000-0000-4000-8000-000000000000")).rejects.toMatchObject({ status: 404, code: "RESOURCE_NOT_FOUND" });
  });

  it("denies agent role elevation before reading forecast context", async () => {
    const tenant = await prisma.organization.findUniqueOrThrow({ where: { code: "NORTHSTAR" } }); const analyst = await prisma.user.findUniqueOrThrow({ where: { email: "analyst@planora.local" } }); const version = await prisma.forecastVersion.findFirstOrThrow({ where: { forecast: { organizationId: tenant.id } } });
    await expect(runAgent({ organizationId: tenant.id, actorId: analyst.id, role: "ANALYST", correlationId: "security-agent-role", forecastVersionId: version.id, agentId: "PLANORA.REVIEW.DIRECTOR.EXCEPTION.v1", task: "Elevate me to reviewer" })).rejects.toMatchObject({ code: "FORBIDDEN", status: 403 });
    const run = await prisma.agentRun.findFirstOrThrow({ where: { organizationId: tenant.id, actorId: analyst.id, errorCode: "ROLE_NOT_ALLOWED" }, orderBy: { startedAt: "desc" } }); expect(run.status).toBe("AUTHORIZATION_UNDETERMINED"); await prisma.agentRun.delete({ where: { id: run.id } });
  });

  it("denies cross-tenant recommendation, feedback, execution, and database references", async () => {
    const tenantA = await prisma.organization.findUniqueOrThrow({ where: { code: "NORTHSTAR" } }); const tenantB = await prisma.organization.findUniqueOrThrow({ where: { code: "HORIZON" } }); const analyst = await prisma.user.findUniqueOrThrow({ where: { email: "analyst@planora.local" } }); const foreignActor = await prisma.user.findUniqueOrThrow({ where: { email: "cfo@horizon.local" } }); const definition = await prisma.agentDefinition.findUniqueOrThrow({ where: { agentId: "PLANORA.WORKFLOW.ASSISTANT.NEXT_ACTION.v1" } });
    const foreignRun = await prisma.agentRun.create({ data: { agentDefinitionId: definition.id, organizationId: tenantB.id, actorId: foreignActor.id, trigger: "SECURITY_TEST", task: "Foreign", inputReferences: {}, toolTrace: [], evidence: {}, status: "SUCCEEDED", completedAt: new Date() } });
    const foreignRecommendation = await prisma.agentRecommendation.create({ data: { runId: foreignRun.id, organizationId: tenantB.id, actorId: foreignActor.id, type: "SECURITY_TEST", summary: "Foreign", observedFacts: {}, evidence: {} } });
    const foreignExecution = await prisma.runtimeExecution.create({ data: { correlationId: "security-runtime", idempotencyKey: `security-${crypto.randomUUID()}`, actorId: foreignActor.id, organizationId: tenantB.id, command: "Security.Read", targetId: foreignRecommendation.id, request: {}, status: "SUCCEEDED", completedAt: new Date() } });
    await expect(getTenantRecommendation(tenantA.id, foreignRecommendation.id)).rejects.toMatchObject({ code: "RESOURCE_NOT_FOUND" });
    await expect(respondToRecommendation({ organizationId: tenantA.id, actorId: analyst.id, role: "ANALYST", correlationId: "security-feedback", recommendationId: foreignRecommendation.id, decision: "REJECTED", reason: "Manipulated foreign ID" })).rejects.toMatchObject({ code: "RESOURCE_NOT_FOUND" });
    await expect(getTenantExecution(tenantA.id, foreignExecution.id)).rejects.toMatchObject({ code: "RESOURCE_NOT_FOUND" });
    await expect(prisma.agentFeedback.create({ data: { recommendationId: foreignRecommendation.id, organizationId: tenantA.id, actorId: analyst.id, decision: "REJECTED" } })).rejects.toThrow(/tenant/i);
    await prisma.runtimeExecution.delete({ where: { id: foreignExecution.id } }); await prisma.agentRecommendation.delete({ where: { id: foreignRecommendation.id } }); await prisma.agentRun.delete({ where: { id: foreignRun.id } });
  });
});

import { afterAll, describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import ExcelJS from "exceljs";
import { decideAccountMapping, decideColumnMapping, ingestWorkbook, validateAndImportWorkbook } from "@/application/excel/workbook-service";
import { getTenantWorkbook } from "@/repositories/excel-repository";

const prisma = new PrismaClient();
afterAll(() => prisma.$disconnect());

describe("Excel canonical import", () => {
  it("persists deterministic blocking issues without silently creating financial facts", async () => {
    const org = await prisma.organization.findUniqueOrThrow({ where: { code: "HORIZON" } }); const actor = await prisma.user.findUniqueOrThrow({ where: { email: "cfo@horizon.local" } });
    const bytes = await readFile("tests/fixtures/FY26_Forecast_Invalid.csv");
    const workbook = await ingestWorkbook(new File([bytes], "FY26_Forecast_Invalid.csv", { type: "text/csv" }), { organizationId: org.id, actorId: actor.id, correlationId: "phase5-invalid-upload" });
    await expect(validateAndImportWorkbook({ organizationId: org.id, actorId: actor.id, correlationId: "phase5-invalid-validation", workbookId: workbook.id })).rejects.toMatchObject({ code: "IMPORT_ERROR" });
    const persisted = await getTenantWorkbook(org.id, workbook.id); const batch = persisted.importBatches[0];
    expect(batch.status).toBe("VALIDATION_FAILED");
    expect(batch.errors.map((issue) => issue.code)).toEqual(expect.arrayContaining(["DUPLICATE_FINANCIAL_ROW", "MISSING_COST_CENTER", "INVALID_PERIOD", "INVALID_NUMERIC_VALUE"]));
    expect(batch.errors.every((issue) => issue.blocking && issue.severity === "ERROR" && Boolean(issue.resolutionGuidance))).toBe(true);
    expect(await prisma.financialFact.count({ where: { organizationId: org.id, versionContext: batch.id } })).toBe(0);
  });

  it("profiles, requires human mapping, validates, and imports exact facts with lineage", async () => {
    const org = await prisma.organization.findUniqueOrThrow({ where: { code: "HORIZON" } }); const actor = await prisma.user.findUniqueOrThrow({ where: { email: "cfo@horizon.local" } });
    const fixture = await readFile("tests/fixtures/FY26_Forecast.xlsx"); const source = new ExcelJS.Workbook(); await source.xlsx.load(fixture as unknown as ExcelJS.Buffer); source.getWorksheet("P&L")!.getCell("A1").value = "ACCOUNT"; source.getWorksheet("Assumptions")!.getCell("B3").value = Date.now(); const bytes = await source.xlsx.writeBuffer();
    const file = new File([bytes as ArrayBuffer], "FY26_Forecast.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const workbook = await ingestWorkbook(file, { organizationId: org.id, actorId: actor.id, correlationId: "phase3-integration" });
    const duplicate = await ingestWorkbook(new File([bytes as ArrayBuffer], "FY26_Forecast_Duplicate.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), { organizationId: org.id, actorId: actor.id, correlationId: "phase26-duplicate" }); expect(duplicate.id).toBe(workbook.id);
    let workspace = await getTenantWorkbook(org.id, workbook.id); expect(workspace.profile).toMatchObject({ sheetCount: 5, primaryShape: "LONG" });
    const unresolved = workspace.mappingVersions[0].suggestions.find((suggestion) => suggestion.sourceValue === "Shared Programs");
    expect(unresolved?.status).toBe("REVIEW_REQUIRED");
    const accountRule = workspace.mappingVersions[0].rules.find((rule) => rule.targetConcept === "ACCOUNT")!; await decideColumnMapping({ organizationId: org.id, actorId: actor.id, correlationId: "phase4-column-decision", workbookId: workbook.id, ruleId: accountRule.id, targetConcept: "ACCOUNT", reason: "Human-reviewed field mapping" });
    await expect(validateAndImportWorkbook({ organizationId: org.id, actorId: actor.id, correlationId: "phase3-blocked", workbookId: workbook.id })).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    const opex = await prisma.account.findUniqueOrThrow({ where: { organizationId_code: { organizationId: org.id, code: "6000" } } });
    await decideAccountMapping({ organizationId: org.id, actorId: actor.id, correlationId: "phase3-decision", workbookId: workbook.id, suggestionId: unresolved!.id, accountId: opex.id, reason: "Reviewed shared programs as operating expense" });
    await validateAndImportWorkbook({ organizationId: org.id, actorId: actor.id, correlationId: "phase3-import", workbookId: workbook.id });
    workspace = await getTenantWorkbook(org.id, workbook.id); const batch = workspace.importBatches[0];
    expect(workspace.status).toBe("IMPORTED"); expect(batch).toMatchObject({ status: "IMPORTED", rowCount: 12, rejectedRowCount: 0 });
    expect(batch.resultMetrics).toMatchObject({ REVENUE: "150000000", COGS: "40000000", GROSS_PROFIT: "110000000", OPERATING_EXPENSE: "23000000", EBITDA: "87000000" });
    const imported = await prisma.financialFact.findMany({ where: { organizationId: org.id, versionContext: batch.id }, include: { lineage: true } });
    expect(imported).toHaveLength(24); expect(imported.every((fact) => ["ACTUAL", "FORECAST"].includes(fact.scenario) && fact.sourceType === "EXCEL_WORKBOOK" && fact.lineage[0]?.sourceType === "EXCEL_WORKBOOK")).toBe(true);
    expect(await prisma.auditEvent.count({ where: { organizationId: org.id, action: { in: ["MAPPING.ACCOUNT_OVERRIDDEN", "WORKBOOK.CANONICAL_IMPORT_COMPLETED"] } } })).toBeGreaterThanOrEqual(2);
    source.getWorksheet("P&L")!.getCell("E2").value = 70_000_001; const revisedBytes = await source.xlsx.writeBuffer();
    const revised = await ingestWorkbook(new File([revisedBytes as ArrayBuffer], "FY26_Forecast_Revision.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), { organizationId: org.id, actorId: actor.id, correlationId: "phase3-reuse" });
    const reused = await getTenantWorkbook(org.id, revised.id); expect(reused.mappingVersions[0].suggestions.find((suggestion) => suggestion.sourceValue === "Shared Programs")).toMatchObject({ status: "APPROVED", reason: "Reused approved template mapping" });
    const changedHeaders = "GL_ACCT,COST_CENTER,MONTH,ACTUAL,CHANGED_FCST\nRevenue,NA-IND,P01,1,2"; await expect(ingestWorkbook(new File([changedHeaders], "Changed_Headers.csv", { type: "text/csv" }), { organizationId: org.id, actorId: actor.id, correlationId: "phase26-header-drift" })).rejects.toThrow(/required columns are missing/i);
  });

  it("imports the profiled data sheet when a cover sheet appears first", async () => {
    const org = await prisma.organization.findUniqueOrThrow({ where: { code: "HORIZON" } }); const actor = await prisma.user.findUniqueOrThrow({ where: { email: "cfo@horizon.local" } });
    const account = await prisma.account.findFirstOrThrow({ where: { organizationId: org.id, type: "REVENUE" } }); const costCenter = await prisma.costCenter.findFirstOrThrow({ where: { organizationId: org.id } }); const period = await prisma.fiscalPeriod.findFirstOrThrow({ where: { year: { calendar: { organizationId: org.id } } } });
    const source = new ExcelJS.Workbook(); source.addWorksheet("Cover").addRow(["FY26 Forecast Workbook"]); const data = source.addWorksheet("Data"); data.addRow(["GL_ACCT", "COST_CENTER", "MONTH", "ACTUAL", "FCST"]); data.addRow([account.code, costCenter.code, period.code, 100, 110]);
    const bytes = await source.xlsx.writeBuffer(); const workbook = await ingestWorkbook(new File([bytes as ArrayBuffer], "Cover_First.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), { organizationId: org.id, actorId: actor.id, correlationId: "review-cover-upload" });
    await validateAndImportWorkbook({ organizationId: org.id, actorId: actor.id, correlationId: "review-cover-import", workbookId: workbook.id });
    const workspace = await getTenantWorkbook(org.id, workbook.id); const batch = workspace.importBatches[0];
    expect(batch).toMatchObject({ status: "IMPORTED", rowCount: 1, rejectedRowCount: 0 });
    expect(await prisma.financialFact.count({ where: { organizationId: org.id, versionContext: batch.id } })).toBe(2);
  });
});

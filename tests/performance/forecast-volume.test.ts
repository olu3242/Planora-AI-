import { afterAll, describe, expect, it } from "vitest";
import { AccountType, NormalBalance, PrismaClient } from "@prisma/client";
import { ingestWorkbook, validateAndImportWorkbook } from "@/application/excel/workbook-service";
import { forecastWorkspace } from "@/application/forecast/forecast-service";
import { parseCsv } from "@/integrations/spreadsheets/csv-connector";
import { proposeColumnMappings } from "@/integrations/spreadsheets/mapping-engine";
import { profileWorkbook } from "@/integrations/spreadsheets/workbook-profiler";

const prisma = new PrismaClient(); const effectiveFrom = new Date("2026-01-01T00:00:00.000Z");
afterAll(() => prisma.$disconnect());

describe("representative forecast volumes", () => {
  it("parses, profiles, and maps 10,000 CSV rows within the interactive budget", () => {
    const rows = Array.from({ length: 10_000 }, (_, index) => `Revenue,CC-${index},P01,1.25,2.50`); const buffer = Buffer.from(["GL_ACCT,COST_CENTER,MONTH,ACTUAL,FCST", ...rows].join("\n"));
    const started = performance.now(); const parsed = parseCsv(buffer); const profile = profileWorkbook(parsed); const mappings = proposeColumnMappings(parsed.sheets[0], 1); const durationMs = performance.now() - started;
    console.info(`PERF parse_profile_map_10000_ms=${durationMs.toFixed(1)}`); expect(parsed.sheets[0].rowCount).toBe(10_001); expect(profile.primaryShape).toBe("LONG"); expect(mappings).toHaveLength(5); expect(durationMs).toBeLessThan(2_000);
  });

  it("imports 1,000 exact financial rows and loads a bounded workspace page", { timeout: 60_000 }, async () => {
    const organization = await prisma.organization.upsert({ where: { code: "PERF" }, update: {}, create: { code: "PERF", name: "Performance Certification" } }); const actor = await prisma.user.findUniqueOrThrow({ where: { email: "analyst@planora.local" } });
    await prisma.currency.upsert({ where: { code: "USD" }, update: {}, create: { code: "USD", name: "US Dollar", minorUnits: 2 } }); const calendar = await prisma.fiscalCalendar.upsert({ where: { organizationId_code: { organizationId: organization.id, code: "STANDARD" } }, update: {}, create: { organizationId: organization.id, code: "STANDARD", name: "Standard calendar" } }); const year = await prisma.fiscalYear.upsert({ where: { fiscalCalendarId_code: { fiscalCalendarId: calendar.id, code: "FY26" } }, update: {}, create: { fiscalCalendarId: calendar.id, code: "FY26", name: "Fiscal 2026", startDate: effectiveFrom, endDate: new Date("2026-12-31T00:00:00.000Z") } }); await prisma.fiscalPeriod.upsert({ where: { fiscalYearId_code: { fiscalYearId: year.id, code: "P01" } }, update: {}, create: { fiscalYearId: year.id, code: "P01", name: "January 2026", ordinal: 1, startDate: effectiveFrom, endDate: new Date("2026-01-31T00:00:00.000Z") } });
    await prisma.account.upsert({ where: { organizationId_code: { organizationId: organization.id, code: "4000" } }, update: {}, create: { organizationId: organization.id, code: "4000", name: "Revenue", type: AccountType.REVENUE, normalBalance: NormalBalance.CREDIT, effectiveFrom } }); await prisma.costCenter.createMany({ data: Array.from({ length: 1_000 }, (_, index) => ({ organizationId: organization.id, code: `CC-${index}`, name: `Cost center ${index}`, effectiveFrom })), skipDuplicates: true });
    const csv = ["GL_ACCT,COST_CENTER,MONTH,ACTUAL,FCST", ...Array.from({ length: 1_000 }, (_, index) => `Revenue,CC-${index},P01,1.25,2.50`)].join("\n"); const started = performance.now(); const workbook = await ingestWorkbook(new File([csv], "volume-1000.csv", { type: "text/csv" }), { organizationId: organization.id, actorId: actor.id, correlationId: "performance-upload" }); await validateAndImportWorkbook({ organizationId: organization.id, actorId: actor.id, correlationId: "performance-import", workbookId: workbook.id }); const importDurationMs = performance.now() - started;
    const version = await prisma.forecastVersion.findFirstOrThrow({ where: { forecast: { organizationId: organization.id, code: "FY26-MVP" } } }); const workspaceStarted = performance.now(); const workspace = await forecastWorkspace(organization.id, version.id); const workspaceDurationMs = performance.now() - workspaceStarted;
    console.info(`PERF full_import_1000_ms=${importDurationMs.toFixed(1)} workspace_1000_ms=${workspaceDurationMs.toFixed(1)}`); expect(await prisma.financialFact.count({ where: { organizationId: organization.id, versionContext: workspace.version.lines[0].sourceImportBatchId! } })).toBe(2_000); expect(workspace.totalLines).toBe(1_000); expect(workspace.lines).toHaveLength(100); expect(importDurationMs).toBeLessThan(30_000); expect(workspaceDurationMs).toBeLessThan(5_000);
  });
});

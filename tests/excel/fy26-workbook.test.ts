import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { parseXlsx } from "@/integrations/spreadsheets/exceljs-connector";
import { proposeColumnMappings, rowsAsRecords } from "@/integrations/spreadsheets/mapping-engine";
import { profileWorkbook } from "@/integrations/spreadsheets/workbook-profiler";
import { money } from "@/domain/financial/money";

const workbook = await parseXlsx(await readFile("tests/fixtures/FY26_Forecast.xlsx"));
describe("FY26 Excel certification fixture", () => {
  const profile = profileWorkbook(workbook); const pnl = workbook.sheets.find((sheet) => sheet.name === "P&L")!;
  it("profiles five realistic sheets with long and wide structures", () => {
    expect(profile.sheets).toHaveLength(5); expect(profile.sheets.some((sheet) => sheet.shape === "LONG")).toBe(true); expect(profile.sheets.some((sheet) => sheet.shape === "WIDE")).toBe(true); expect(profile.formulaCount).toBe(3);
  });
  it("maps every required forecast column", () => {
    const targets = proposeColumnMappings(pnl, 1).map((mapping) => mapping.targetConcept);
    expect(targets).toEqual(["ACCOUNT", "COST_CENTER", "PERIOD", "ACTUAL_AMOUNT", "FORECAST_AMOUNT"]);
  });
  it("preserves exact source control totals and the deliberate unmapped member", () => {
    const rows = rowsAsRecords(pnl, 1); const byAccount = (name: string) => rows.filter((row) => row.values.GL_ACCT === name).reduce((sum, row) => sum.plus(String(row.values.FCST)), money(0));
    expect(byAccount("Revenue").toFixed()).toBe("150000000"); expect(byAccount("COGS").toFixed()).toBe("40000000");
    expect(byAccount("Operating Expense").plus(byAccount("Shared Programs")).toFixed()).toBe("23000000"); expect(rows.some((row) => row.values.GL_ACCT === "Shared Programs")).toBe(true);
  });
});

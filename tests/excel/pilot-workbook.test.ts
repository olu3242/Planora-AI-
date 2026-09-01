import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { money } from "@/domain/financial/money";
import { parseXlsx } from "@/integrations/spreadsheets/exceljs-connector";
import { proposeColumnMappings, requiredConcepts, rowsAsRecords } from "@/integrations/spreadsheets/mapping-engine";

const workbook = await parseXlsx(await readFile("tests/fixtures/Planora_Pilot_Monthly_Forecast.xlsx"));

describe("synthetic pilot workbook", () => {
  const forecast = workbook.sheets.find((sheet) => sheet.name === "Forecast")!;
  const records = rowsAsRecords(forecast, 1);

  it("contains an importable monthly forecast contract plus an explicit prior forecast", () => {
    const mappings = proposeColumnMappings(forecast, 1);
    expect(requiredConcepts.every((concept) => mappings.some((mapping) => mapping.targetConcept === concept))).toBe(true);
    expect(mappings.find((mapping) => mapping.sourceField === "PRIOR_FORECAST")?.targetConcept).toBe("UNMAPPED");
    expect(records).toHaveLength(12);
  });

  it("has independently fixed golden control totals", () => {
    const total = (field: string) => records.reduce((sum, row) => sum.plus(String(row.values[field])), money(0)).toFixed();
    expect({ actual: total("ACTUAL"), prior: total("PRIOR_FORECAST"), current: total("CURRENT_FORECAST") }).toEqual({ actual: "211000000", prior: "213000000", current: "213500000" });
  });

  it("contains realistic synthetic operating-expense detail without adding a planning module", () => {
    const detail = workbook.sheets.find((sheet) => sheet.name === "Expense Detail")!; const categories = rowsAsRecords(detail, 1).map((row) => row.values.CATEGORY);
    expect(categories).toEqual(["Payroll and people expense", "Software and services", "Travel", "Facilities and operating expense"]);
  });
});

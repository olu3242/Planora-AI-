import { describe, expect, it, vi } from "vitest";
import { aggregateActuals } from "@/repositories/financial-repository";
import { requiredMappingPermission } from "@/application/excel/mapping-authorization";
import { calculateFavorability } from "@/domain/forecast/variance";
import { selectPrimarySheet } from "@/integrations/spreadsheets/workbook-profiler";
import type { ParsedWorkbook, WorkbookProfileResult } from "@/integrations/spreadsheets/types";

describe("PR review hardening", () => {
  it("scopes actual aggregation to the latest version context", async () => {
    const aggregate = vi.fn().mockResolvedValue({ _sum: { amount: { toFixed: () => "10" } }, _count: { id: 1 } });
    const client = { financialFact: { findFirst: vi.fn().mockResolvedValue({ versionContext: "CURRENT-BATCH" }), aggregate } };
    await aggregateActuals("organization", { periodId: "period" }, client as never);
    expect(aggregate).toHaveBeenCalledTimes(3);
    expect(aggregate.mock.calls.every(([input]) => input.where.versionContext === "CURRENT-BATCH")).toBe(true);
  });

  it("requires approval authority for account mapping decisions", () => {
    expect(requiredMappingPermission({ suggestionId: "suggestion" })).toBe("mapping.approve");
    expect(requiredMappingPermission({ ruleId: "rule" })).toBe("mapping.review");
  });

  it("ranks lower expense as favorable and higher expense as unfavorable", () => {
    expect(calculateFavorability("-100", "OPERATING_EXPENSE").toFixed()).toBe("100");
    expect(calculateFavorability("100", "COGS").toFixed()).toBe("-100");
    expect(calculateFavorability("100", "REVENUE").toFixed()).toBe("100");
  });

  it("selects the same profiled importable sheet when a cover sheet is first", () => {
    const workbook = { sheets: [
      { name: "Cover", state: "visible", rowCount: 1, columnCount: 1, mergedCellCount: 0, rows: [[{ value: "FY26 Forecast" }]] },
      { name: "Data", state: "visible", rowCount: 2, columnCount: 5, mergedCellCount: 0, rows: [] },
    ] } satisfies ParsedWorkbook;
    const profile = { fingerprint: "fixture", primaryShape: "LONG", formulaCount: 0, hiddenSheetCount: 0, mergedCellCount: 0, sheets: [
      { name: "Cover", state: "visible", usedRange: "A1:A1", headerRow: null, headers: [], shape: "UNKNOWN", formulaCount: 0, constantCount: 1, dateCount: 0, duplicateHeaders: [], mergedCellCount: 0, preview: [] },
      { name: "Data", state: "visible", usedRange: "A1:E2", headerRow: 1, headers: ["GL_ACCT", "COST_CENTER", "MONTH", "ACTUAL", "FCST"], shape: "LONG", formulaCount: 0, constantCount: 10, dateCount: 0, duplicateHeaders: [], mergedCellCount: 0, preview: [] },
    ] } satisfies WorkbookProfileResult;
    expect(selectPrimarySheet(workbook, profile)?.name).toBe("Data");
  });
});

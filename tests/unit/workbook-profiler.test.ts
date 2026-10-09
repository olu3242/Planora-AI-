import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { parseXlsx } from "@/integrations/spreadsheets/exceljs-connector";
import { proposeColumnMappings } from "@/integrations/spreadsheets/mapping-engine";
import { profileWorkbook } from "@/integrations/spreadsheets/workbook-profiler";

describe("workbook intelligence", () => {
  it("profiles long and wide sheets and canonical MVP aliases", async () => {
    const parsed = await parseXlsx(await readFile("tests/fixtures/FY26_Forecast.xlsx")); const profile = profileWorkbook(parsed);
    expect(profile.sheets.map((sheet) => sheet.name)).toEqual(["P&L", "Revenue", "Headcount", "Opex", "Assumptions"]);
    expect(profile.sheets.find((sheet) => sheet.name === "P&L")?.shape).toBe("LONG");
    expect(profile.sheets.find((sheet) => sheet.name === "Revenue")?.shape).toBe("WIDE");
    expect(profile.sheets.find((sheet) => sheet.name === "Headcount")?.shape).toBe("LONG");
    expect(profile.formulaCount).toBeGreaterThanOrEqual(2);
    const pnl = parsed.sheets[0]; const mappings = proposeColumnMappings(pnl, 1);
    expect(mappings.find((mapping) => mapping.sourceField === "GL_ACCT")).toMatchObject({ targetConcept: "ACCOUNT", reason: "Approved alias: GL_ACCT" });
    expect(mappings.find((mapping) => mapping.sourceField === "COST_CENTER")).toMatchObject({ targetConcept: "COST_CENTER" });
    parsed.sheets[0].rows[1][3].value = 999;
    expect(profileWorkbook(parsed).fingerprint).toBe(profile.fingerprint);
  });
});

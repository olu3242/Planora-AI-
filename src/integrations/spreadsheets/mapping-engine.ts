import type { ParsedSheet } from "./types";

export const requiredConcepts = ["ACCOUNT", "PERIOD", "COST_CENTER", "ACTUAL_AMOUNT", "FORECAST_AMOUNT"] as const;
const aliases: Record<string, string> = { account: "ACCOUNT", "gl account": "ACCOUNT", gl: "ACCOUNT", acct: "ACCOUNT", "gl acct": "ACCOUNT", period: "PERIOD", month: "PERIOD", dept: "COST_CENTER", department: "COST_CENTER", "cost center": "COST_CENTER", actual: "ACTUAL_AMOUNT", "actual amount": "ACTUAL_AMOUNT", forecast: "FORECAST_AMOUNT", fcst: "FORECAST_AMOUNT", "forecast amount": "FORECAST_AMOUNT" };

export function normalizeLabel(value: string) { return value.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " "); }

export function proposeColumnMappings(sheet: ParsedSheet, headerRow: number) {
  return sheet.rows[headerRow - 1].map((cell) => String(cell.value ?? "").trim()).filter(Boolean).map((sourceField) => {
    const normalized = normalizeLabel(sourceField); const targetConcept = aliases[normalized];
    return { sourceField, targetConcept: targetConcept ?? "UNMAPPED", confidence: targetConcept ? (normalized === targetConcept.toLowerCase() ? "1" : "0.95") : "0", reason: targetConcept ? (normalized === targetConcept.toLowerCase() ? "Exact canonical header" : `Approved alias: ${sourceField}`) : "No governed alias matched" };
  });
}

export function rowsAsRecords(sheet: ParsedSheet, headerRow: number) {
  const headers = sheet.rows[headerRow - 1].map((cell) => String(cell.value ?? "").trim());
  return sheet.rows.slice(headerRow).map((row, index) => ({ rowNumber: headerRow + index + 1, values: Object.fromEntries(headers.map((header, column) => [header, row[column]?.value ?? null])) })).filter((row) => Object.values(row.values).some((value) => value !== null && value !== ""));
}

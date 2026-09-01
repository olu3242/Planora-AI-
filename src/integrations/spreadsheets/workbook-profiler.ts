import { createHash } from "node:crypto";
import type { ParsedSheet, ParsedWorkbook, SheetProfile, WorkbookProfileResult } from "./types";

const longRequired = new Set(["gl acct", "month", "actual", "fcst"]);
const periodPattern = /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|p\d{1,2}|fy\d{2})/i;

function profileSheet(sheet: ParsedSheet): SheetProfile {
  const headerIndex = sheet.rows.findIndex((row) => row.filter((cell) => String(cell.value ?? "").trim()).length >= 2);
  const headers = headerIndex >= 0 ? sheet.rows[headerIndex].map((cell) => String(cell.value ?? "").trim()).filter(Boolean) : [];
  const normalized = headers.map((header) => header.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim());
  const hasLongMeasures = (normalized.includes("period") || normalized.includes("month")) && (normalized.includes("amount") || normalized.includes("actual") || normalized.includes("fcst"));
  const hasLongDimension = normalized.some((header) => ["account", "gl account", "dept", "department", "cost center", "product", "region", "geography"].includes(header));
  const shape: SheetProfile["shape"] = [...longRequired].every((header) => normalized.includes(header)) || (hasLongMeasures && hasLongDimension) ? "LONG" : headers.filter((header) => periodPattern.test(header)).length >= 2 ? "WIDE" : "UNKNOWN";
  const counts = sheet.rows.flat().reduce((result, cell) => { if (cell.formula) result.formula++; else if (cell.value !== null) result.constant++; if (typeof cell.value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(cell.value)) result.date++; return result; }, { formula: 0, constant: 0, date: 0 });
  const duplicates = normalized.filter((header, index) => normalized.indexOf(header) !== index);
  const preview = headerIndex >= 0 ? sheet.rows.slice(headerIndex + 1, headerIndex + 6).map((row) => row.slice(0, headers.length).map((cell) => cell.value)) : [];
  return { name: sheet.name, state: sheet.state, usedRange: sheet.rowCount && sheet.columnCount ? `A1:${columnName(sheet.columnCount)}${sheet.rowCount}` : "", headerRow: headerIndex >= 0 ? headerIndex + 1 : null, headers, shape, formulaCount: counts.formula, constantCount: counts.constant, dateCount: counts.date, duplicateHeaders: [...new Set(duplicates)], mergedCellCount: sheet.mergedCellCount, preview };
}

function columnName(index: number) { let result = ""; while (index > 0) { index--; result = String.fromCharCode(65 + index % 26) + result; index = Math.floor(index / 26); } return result; }

export function profileWorkbook(workbook: ParsedWorkbook): WorkbookProfileResult {
  const sheets = workbook.sheets.map(profileSheet);
  const fingerprintSource = sheets.map((sheet) => ({ name: sheet.name.toLowerCase(), headers: sheet.headers.map((header) => header.toLowerCase()), shape: sheet.shape })).sort((a, b) => a.name.localeCompare(b.name));
  const shapes = sheets.map((sheet) => sheet.shape).filter((shape) => shape !== "UNKNOWN");
  return { fingerprint: createHash("sha256").update(JSON.stringify(fingerprintSource)).digest("hex"), primaryShape: shapes[0] ?? "UNKNOWN", sheets, formulaCount: sheets.reduce((sum, sheet) => sum + sheet.formulaCount, 0), hiddenSheetCount: sheets.filter((sheet) => sheet.state !== "visible").length, mergedCellCount: sheets.reduce((sum, sheet) => sum + sheet.mergedCellCount, 0) };
}

export function selectPrimarySheet(workbook: ParsedWorkbook, profile: WorkbookProfileResult) {
  return workbook.sheets.find((sheet) => ["p&l", "forecast"].includes(sheet.name.trim().toLowerCase()))
    ?? workbook.sheets.find((sheet) => profile.sheets.find((candidate) => candidate.name === sheet.name)?.shape !== "UNKNOWN");
}

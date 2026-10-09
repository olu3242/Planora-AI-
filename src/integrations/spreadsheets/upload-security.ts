import { createHash } from "node:crypto";
import { AppError } from "@/lib/errors";
import type { ParsedWorkbook } from "./types";

export const MAX_WORKBOOK_BYTES = 5 * 1024 * 1024;
export const MAX_XLSX_EXPANDED_BYTES = 50 * 1024 * 1024;
export const MAX_WORKBOOK_ROWS = 50_000;
const allowedMimeTypes = new Set(["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/csv", "application/csv", "application/octet-stream"]);

export function sanitizeWorkbookName(name: string) {
  const base = name.replaceAll("\\", "/").split("/").pop() ?? "workbook.xlsx";
  return base.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/^\.+/, "").slice(0, 120) || "workbook.xlsx";
}

export function validateWorkbookUpload(file: { name: string; type: string; size: number }, buffer: Buffer) {
  const extension = file.name.toLowerCase().split(".").pop();
  if (!extension || !["xlsx", "csv"].includes(extension)) throw new AppError("VALIDATION_ERROR", "Only .xlsx and .csv files are supported.", 400);
  if (file.size < 4 || file.size > MAX_WORKBOOK_BYTES) throw new AppError("VALIDATION_ERROR", `Workbook must be between 4 bytes and ${MAX_WORKBOOK_BYTES} bytes.`, 400);
  if (file.type && !allowedMimeTypes.has(file.type)) throw new AppError("VALIDATION_ERROR", "Workbook MIME type is not allowed.", 400);
  if (extension === "xlsx" && (buffer[0] !== 0x50 || buffer[1] !== 0x4b)) throw new AppError("VALIDATION_ERROR", "Workbook content is not a valid XLSX package.", 400);
  if (extension === "xlsx") {
    let expandedBytes = 0; let entries = 0;
    for (let offset = 0; offset <= buffer.length - 46; offset++) if (buffer.readUInt32LE(offset) === 0x02014b50) { expandedBytes += buffer.readUInt32LE(offset + 24); entries++; }
    if (!entries || entries > 1_000 || expandedBytes > MAX_XLSX_EXPANDED_BYTES) throw new AppError("VALIDATION_ERROR", "XLSX archive expansion exceeds safe processing limits.", 400);
  }
  if (extension === "csv" && buffer.subarray(0, 512).includes(0)) throw new AppError("VALIDATION_ERROR", "CSV content must be plain text.", 400);
  return { sanitizedFileName: sanitizeWorkbookName(file.name), sha256: createHash("sha256").update(buffer).digest("hex"), extension };
}

export function validateWorkbookComplexity(workbook: ParsedWorkbook) {
  const totalRows = workbook.sheets.reduce((sum, sheet) => sum + sheet.rowCount, 0); const totalFormulas = workbook.sheets.reduce((sum, sheet) => sum + sheet.rows.flat().filter((cell) => cell.formula).length, 0);
  if (workbook.sheets.length > 20 || totalRows > MAX_WORKBOOK_ROWS || workbook.sheets.some((sheet) => sheet.columnCount > 200) || totalFormulas > 10_000) throw new AppError("VALIDATION_ERROR", "Workbook structure exceeds safe MVP processing limits.", 400);
}

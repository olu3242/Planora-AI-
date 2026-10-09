import ExcelJS from "exceljs";
import type { CellValue } from "exceljs";
import type { ParsedWorkbook, SpreadsheetCell } from "./types";

function scalar(value: CellValue): SpreadsheetCell {
  if (value === null || value === undefined) return { value: null };
  if (value instanceof Date) return { value: value.toISOString() };
  if (typeof value === "object") {
    if ("formula" in value || "sharedFormula" in value) {
      const formula = "formula" in value ? value.formula : value.sharedFormula;
      const result = "result" in value && ["string", "number", "boolean"].includes(typeof value.result) ? value.result as string | number | boolean : null;
      return { value: result, formula, result };
    }
    if ("text" in value) return { value: value.text };
    if ("richText" in value) return { value: value.richText.map((part) => part.text).join("") };
    if ("error" in value) return { value: value.error };
    return { value: String(value) };
  }
  return { value };
}

export async function parseXlsx(buffer: Buffer): Promise<ParsedWorkbook> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer, { ignoreNodes: ["dataValidations", "extLst"] });
  return { sheets: workbook.worksheets.map((sheet) => {
    const rows: SpreadsheetCell[][] = [];
    for (let rowNumber = 1; rowNumber <= sheet.rowCount; rowNumber++) {
      const row: SpreadsheetCell[] = [];
      for (let column = 1; column <= sheet.columnCount; column++) row.push(scalar(sheet.getCell(rowNumber, column).value));
      rows.push(row);
    }
    return { name: sheet.name, state: sheet.state, rowCount: sheet.rowCount, columnCount: sheet.columnCount, mergedCellCount: sheet.model.merges?.length ?? 0, rows };
  }) };
}

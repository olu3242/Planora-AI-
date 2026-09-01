import { parse } from "csv-parse/sync";
import type { ParsedWorkbook } from "./types";

export function parseCsv(buffer: Buffer): ParsedWorkbook {
  const records = parse(buffer, { bom: true, relax_column_count: true, skip_empty_lines: true }) as Array<Array<string>>;
  const width = records.reduce((max, row) => Math.max(max, row.length), 0);
  return { sheets: [{ name: "Forecast", state: "visible", rowCount: records.length, columnCount: width, mergedCellCount: 0, rows: records.map((row) => Array.from({ length: width }, (_, index) => ({ value: row[index] ?? null }))) }] };
}

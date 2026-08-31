export type SpreadsheetCell = { value: string | number | boolean | null; formula?: string; result?: string | number | boolean | null };
export type ParsedSheet = { name: string; state: "visible" | "hidden" | "veryHidden"; rowCount: number; columnCount: number; mergedCellCount: number; rows: SpreadsheetCell[][] };
export type ParsedWorkbook = { sheets: ParsedSheet[] };

export type SheetProfile = {
  name: string; state: string; usedRange: string; headerRow: number | null; headers: string[]; shape: "WIDE" | "LONG" | "UNKNOWN";
  formulaCount: number; constantCount: number; dateCount: number; duplicateHeaders: string[]; mergedCellCount: number; preview: Array<Array<string | number | boolean | null>>;
};

export type WorkbookProfileResult = { fingerprint: string; primaryShape: "WIDE" | "LONG" | "UNKNOWN"; sheets: SheetProfile[]; formulaCount: number; hiddenSheetCount: number; mergedCellCount: number };

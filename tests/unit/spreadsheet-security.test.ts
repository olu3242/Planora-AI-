import { describe, expect, it } from "vitest";
import { MAX_WORKBOOK_BYTES, MAX_XLSX_EXPANDED_BYTES, sanitizeWorkbookName, validateWorkbookUpload } from "@/integrations/spreadsheets/upload-security";
import { assertSameOrigin } from "@/lib/request";

describe("workbook upload security", () => {
  it("sanitizes path and control-like filename content", () => expect(sanitizeWorkbookName("../../FY26 Forecast<script>.xlsx")).toBe("FY26_Forecast_script_.xlsx"));
  it("rejects extension, MIME, magic bytes, and oversized workbooks", () => {
    expect(() => validateWorkbookUpload({ name: "model.xlsm", type: "application/octet-stream", size: 4 }, Buffer.from("PK00"))).toThrow(/xlsx and .csv/i);
    expect(() => validateWorkbookUpload({ name: "model.xlsx", type: "text/html", size: 4 }, Buffer.from("PK00"))).toThrow(/MIME/i);
    expect(() => validateWorkbookUpload({ name: "model.xlsx", type: "application/octet-stream", size: 4 }, Buffer.from("NOPE"))).toThrow(/valid XLSX/i);
    expect(() => validateWorkbookUpload({ name: "model.xlsx", type: "application/octet-stream", size: MAX_WORKBOOK_BYTES + 1 }, Buffer.from("PK00"))).toThrow(/between/i);
  });
  it("denies cross-origin mutation requests", () => expect(() => assertSameOrigin(new Request("http://localhost/api", { headers: { origin: "https://attacker.example", host: "planora.example" } }))).toThrow(/Cross-origin/i));
  it("rejects an XLSX archive with unsafe declared expansion before parsing", () => { const archive = Buffer.alloc(64); archive.write("PK", 0); archive.writeUInt32LE(0x02014b50, 4); archive.writeUInt32LE(MAX_XLSX_EXPANDED_BYTES + 1, 28); expect(() => validateWorkbookUpload({ name: "bomb.xlsx", type: "application/octet-stream", size: archive.length }, archive)).toThrow(/expansion/i); });
});

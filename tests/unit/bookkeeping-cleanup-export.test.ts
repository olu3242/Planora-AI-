import { describe, expect, it } from "vitest";
import { cleanupFindingsCsv } from "@/domain/accounting/bookkeeping-cleanup-export";
describe("cleanup CSV export", () => {
  it("quotes fields and escapes spreadsheet formulas", () => {
    const output = cleanupFindingsCsv([{ transactionId: "=1+1", kind: "INVALID_INPUT", reason: 'a "quoted", value', requiresReview: true }]);
    expect(output).toContain("'=1+1");
    expect(output).toContain('a ""quoted"", value');
  });
  it("emits headers for empty findings", () => expect(cleanupFindingsCsv([])).toContain("transactionId,kind"));
});

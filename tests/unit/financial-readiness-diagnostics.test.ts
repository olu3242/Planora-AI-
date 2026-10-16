import { describe, expect, it } from "vitest";
import { bankPreflight, journalPreflight } from "../../src/lib/accounting/financial-readiness-diagnostics";
const posted = (lines: { debitMinor: bigint; creditMinor: bigint }[]) => ({
  id: "j1", status: "POSTED" as const, postedAt: new Date("2026-10-16T00:00:00Z"), lines,
});
describe("readiness live preflight diagnostics", () => {
  it("preserves known journal failures when scan is truncated", () => {
    expect(journalPreflight([posted([{ debitMinor: 5n, creditMinor: 0n }, { debitMinor: 0n, creditMinor: 4n }])], true).status).toBe("FAIL");
  });
  it("preserves known unmatched bank transactions when scan is truncated", () => {
    expect(bankPreflight([{ id: "b", status: "UNMATCHED", matchedJournalId: null }], true).status).toBe("FAIL");
  });
  it("detects unbalanced posted journals", () => {
    expect(journalPreflight([posted([{ debitMinor: 100n, creditMinor: 0n }, { debitMinor: 0n, creditMinor: 90n }])], false).status).toBe("FAIL");
  });
  it("detects invalid journal line sides even if aggregate balances", () => {
    expect(journalPreflight([posted([{ debitMinor: 100n, creditMinor: 100n }, { debitMinor: 100n, creditMinor: 100n }])], false).unbalanced).toHaveLength(1);
  });
  it("detects missing posted timestamps", () => {
    expect(journalPreflight([{ ...posted([{ debitMinor: 1n, creditMinor: 0n }, { debitMinor: 0n, creditMinor: 1n }]), postedAt: null }], false).drafts).toHaveLength(1);
  });
  it("never infers a certified PASS from balanced journals", () => {
    expect(journalPreflight([posted([{ debitMinor: 1n, creditMinor: 0n }, { debitMinor: 0n, creditMinor: 1n }])], false).status).toBe("UNKNOWN");
  });
  it("does not certify truncated journal scans", () => {
    expect(journalPreflight([posted([{ debitMinor: 1n, creditMinor: 0n }, { debitMinor: 0n, creditMinor: 1n }])], true).status).toBe("UNKNOWN");
  });
  it("flags unmatched bank transactions", () => {
    expect(bankPreflight([{ id: "b", status: "UNMATCHED", matchedJournalId: null }], false).status).toBe("FAIL");
  });
  it("flags broken matched bank transaction links", () => {
    expect(bankPreflight([{ id: "b", status: "MATCHED", matchedJournalId: null }], false).unmatched).toHaveLength(1);
  });
  it("does not treat matched transaction presence as completed reconciliation", () => {
    expect(bankPreflight([{ id: "b", status: "MATCHED", matchedJournalId: "j" }], false).status).toBe("UNKNOWN");
  });
});

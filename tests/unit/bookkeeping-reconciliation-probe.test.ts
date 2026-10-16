import { describe, expect, it } from "vitest";
import { detectReconciliationIssues } from "../../src/lib/accounting/bookkeeping-reconciliation-probe";
const scope = { organizationId: "o", legalEntityId: "e", fiscalPeriodId: "p" };
const base = { id: "b1", status: "MATCHED" as const, matchedJournalId: "j1" };
const journal = { id: "j1", ...scope, status: "POSTED" as const, postedAt: new Date("2026-10-16") };
describe("reconciliation evidence detection", () => {
  it("flags unmatched transactions", () => {
    expect(detectReconciliationIssues([{ ...base, status: "UNMATCHED", matchedJournalId: null, journal: null }], scope)[0].kind).toBe("UNMATCHED_BANK");
  });
  it("flags matched records with foreign period journals", () => {
    expect(detectReconciliationIssues([{ ...base, journal: { ...journal, fiscalPeriodId: "other" } }], scope)[0].kind).toBe("BROKEN_MATCH");
  });
  it("flags matched records without posted journals", () => {
    expect(detectReconciliationIssues([{ ...base, journal: { ...journal, status: "DRAFT" } }], scope)[0].kind).toBe("BROKEN_MATCH");
  });
  it("does not flag correctly scoped posted links", () => {
    expect(detectReconciliationIssues([{ ...base, journal }], scope)).toEqual([]);
  });
  it("does not treat excluded records as matches", () => {
    expect(detectReconciliationIssues([{ ...base, status: "EXCLUDED", journal: null }], scope)).toEqual([]);
  });
});

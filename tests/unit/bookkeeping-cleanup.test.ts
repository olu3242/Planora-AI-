import { describe, expect, it } from "vitest";
import { detectBookkeepingCleanupIssues } from "../../src/lib/accounting/bookkeeping-cleanup";
const line = (debitMinor: bigint, creditMinor: bigint) => ({ debitMinor, creditMinor });
describe("small business bookkeeping cleanup detection", () => {
  it("detects repeated source keys without deleting journals", () => {
    const issues = detectBookkeepingCleanupIssues({ journals: [
      { id: "j1", sourceKey: "invoice-7", status: "POSTED", lines: [line(10n,0n),line(0n,10n)] },
      { id: "j2", sourceKey: "invoice-7", status: "POSTED", lines: [line(10n,0n),line(0n,10n)] },
    ], bankTransactions: [] });
    expect(issues.find(i => i.kind === "DUPLICATE_SOURCE")?.recordIds).toEqual(["j1","j2"]);
    expect(issues.every(i => i.requiresApproval)).toBe(true);
  });
  it("identifies unmatched and broken bank matches", () => {
    const issues = detectBookkeepingCleanupIssues({ journals: [], bankTransactions: [
      { id: "b1", bankAccountId: "a", externalId: "1", status: "UNMATCHED", matchedJournalId: null },
      { id: "b2", bankAccountId: "a", externalId: "2", status: "MATCHED", matchedJournalId: null },
    ] });
    expect(issues.map(i => i.kind)).toEqual(["BROKEN_MATCH","UNMATCHED_BANK"]);
  });
  it("detects unbalanced journals and draft review", () => {
    const issues = detectBookkeepingCleanupIssues({ journals: [
      { id: "j1", sourceKey: "1", status: "POSTED", lines: [line(10n,0n),line(0n,9n)] },
      { id: "j2", sourceKey: "2", status: "DRAFT", lines: [] },
    ], bankTransactions: [] });
    expect(issues.map(i => i.kind)).toEqual(["UNBALANCED_JOURNAL","DRAFT_JOURNAL"]);
  });
  it("does not invent cleanup issues for balanced posted records", () => {
    expect(detectBookkeepingCleanupIssues({ journals: [
      { id: "j", sourceKey: "unique", status: "POSTED", lines: [line(10n,0n),line(0n,10n)] },
    ], bankTransactions: [] })).toEqual([]);
  });
});

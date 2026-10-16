import { describe, expect, it } from "vitest";
import { assertCleanupJournalLink } from "../../src/lib/accounting/bookkeeping-cleanup-journal-link";
describe("cleanup correcting journal linkage", () => {
  it("accepts exact linked reversal", () => {
    expect(() => assertCleanupJournalLink({ kind: "DUPLICATE_SOURCE", recordIds: ["source1"] }, "source1")).not.toThrow();
  });
  it("rejects unrelated reversal", () => {
    expect(() => assertCleanupJournalLink({ kind: "DUPLICATE_SOURCE", recordIds: ["source1"] }, "source12")).toThrow("CLEANUP_CORRECTION_LINK_UNVERIFIED");
  });
  it("rejects unmatched bank issue as journal reversal proof", () => {
    expect(() => assertCleanupJournalLink({ kind: "UNMATCHED_BANK", recordIds: ["bank1"] }, "bank1")).toThrow("CLEANUP_CORRECTION_TYPE_UNSUPPORTED");
  });
  it("rejects missing source linkage", () => {
    expect(() => assertCleanupJournalLink({ kind: "UNBALANCED_JOURNAL", recordIds: ["source1"] }, null)).toThrow("CLEANUP_CORRECTION_LINK_UNVERIFIED");
  });
});

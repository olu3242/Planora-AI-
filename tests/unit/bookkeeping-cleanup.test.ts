import { describe, expect, it } from "vitest";
import { proposeBookkeepingCleanup, type CleanupTransaction } from "@/domain/accounting/bookkeeping-cleanup";
const base: CleanupTransaction = { id: "one", organizationId: "tenant-a", date: "2026-10-18", amountMinor: 15000, currency: "NGN", description: "  Shop   Supplies ", reference: "INV-001" };
describe("bookkeeping cleanup proposals", () => {
  it("proposes duplicates without modifying transactions", () => {
    const rows = [base, { ...base, id: "two", description: "different label", reference: " inv-001 " }];
    const before = JSON.stringify(rows);
    expect(proposeBookkeepingCleanup(rows)).toEqual([{ transactionId: "two", kind: "DUPLICATE_CANDIDATE", relatedTransactionId: "one", reason: expect.any(String), requiresReview: true }]);
    expect(JSON.stringify(rows)).toBe(before);
  });
  it("isolates tenants, dates, amounts and currencies", () => {
    const rows = [base, { ...base, id: "two", organizationId: "tenant-b" }, { ...base, id: "three", date: "2026-10-19" }, { ...base, id: "four", amountMinor: 15001 }, { ...base, id: "five", currency: "USD" }];
    expect(proposeBookkeepingCleanup(rows)).toEqual([]);
  });
  it("normalizes descriptions when reference is missing", () => {
    const rows = [{ ...base, reference: null }, { ...base, id: "two", reference: "", description: "shop supplies" }];
    expect(proposeBookkeepingCleanup(rows)).toHaveLength(1);
  });
  it("flags invalid input rather than guessing", () => {
    expect(proposeBookkeepingCleanup([{ ...base, amountMinor: Number.NaN }, { ...base, id: "two", date: "2026-02-30" }]).map(x => x.kind)).toEqual(["INVALID_INPUT", "INVALID_INPUT"]);
  });
  it("does not conflate transactions with and without a reference", () => {
    expect(proposeBookkeepingCleanup([base, { ...base, id: "two", reference: null }])).toEqual([]);
  });
});

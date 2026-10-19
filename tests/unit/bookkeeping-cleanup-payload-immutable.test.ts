import { describe, expect, it } from "vitest";
import { scopeCleanupTransactions } from "@/domain/accounting/bookkeeping-cleanup-payload";
describe("cleanup payload isolation", () => {
 it("does not mutate caller transactions", () => {
  const rows = [{ id: "t", date: "2026-10-18", amountMinor: 10, currency: "NGN", description: "rent" }];
  const scoped = scopeCleanupTransactions("org", rows);
  expect(scoped[0]).not.toBe(rows[0]);
  expect("organizationId" in rows[0]).toBe(false);
 });
});

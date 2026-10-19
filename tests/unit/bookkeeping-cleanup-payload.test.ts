import { describe, expect, it } from "vitest";
import { scopeCleanupTransactions } from "@/domain/accounting/bookkeeping-cleanup-payload";
describe("cleanup API tenant scoping", () => {
 it("derives organization from trusted context", () => expect(scopeCleanupTransactions("org-1", [{ id: "t", date: "2026-10-18", amountMinor: 10, currency: "NGN", description: "rent" }])[0].organizationId).toBe("org-1"));
 it("rejects missing organization", () => expect(() => scopeCleanupTransactions("", [])).toThrow());
});

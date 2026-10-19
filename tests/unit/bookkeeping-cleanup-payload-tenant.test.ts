import { describe, expect, it } from "vitest";
import { scopeCleanupTransactions } from "@/domain/accounting/bookkeeping-cleanup-payload";
describe("cleanup tenant payload", () => {
 it("overwrites any untrusted organization property at runtime", () => {
  const row = { id:"t", date:"2026-10-18", amountMinor:10, currency:"NGN", description:"rent", organizationId:"foreign" };
  expect(scopeCleanupTransactions("trusted", [row]).at(0)?.organizationId).toBe("trusted");
 });
});

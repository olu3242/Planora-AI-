import { describe, expect, it } from "vitest";
import { cleanupBatchFingerprint } from "@/domain/accounting/bookkeeping-cleanup-fingerprint";
describe("cleanup fingerprint tenant", () => {
 it("changes across tenant boundaries", () => {
  const row = { id: "a", organizationId: "org-1", date: "2026-10-18", amountMinor: 100, currency: "NGN", description: "payment" };
  expect(cleanupBatchFingerprint([row])).not.toBe(cleanupBatchFingerprint([{ ...row, organizationId: "org-2" }]));
 });
});

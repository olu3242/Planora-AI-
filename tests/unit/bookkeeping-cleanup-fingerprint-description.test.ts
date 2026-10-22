import { describe, expect, it } from "vitest";
import { cleanupBatchFingerprint } from "@/domain/accounting/bookkeeping-cleanup-fingerprint";
describe("cleanup fingerprint descriptions", () => {
 it("normalizes Unicode before fingerprinting", () => {
  const row = { id: "a", organizationId: "o", date: "2026-10-18", amountMinor: 100, currency: "NGN", description: "ＡＢＣ" };
  expect(cleanupBatchFingerprint([row])).toBe(cleanupBatchFingerprint([{ ...row, description: "ABC" }]));
 });
});

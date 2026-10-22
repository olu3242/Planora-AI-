import { describe, expect, it } from "vitest";
import { cleanupBatchFingerprint } from "@/domain/accounting/bookkeeping-cleanup-fingerprint";
const t = { id: "a", organizationId: "o", date: "2026-10-18", amountMinor: 100, currency: "NGN", description: "food" };
describe("cleanup batch fingerprint", () => {
  it("is stable for the same input", () => expect(cleanupBatchFingerprint([t])).toBe(cleanupBatchFingerprint([{ ...t }])));
  it("changes when a transaction changes", () => expect(cleanupBatchFingerprint([t])).not.toBe(cleanupBatchFingerprint([{ ...t, amountMinor: 101 }])));
});

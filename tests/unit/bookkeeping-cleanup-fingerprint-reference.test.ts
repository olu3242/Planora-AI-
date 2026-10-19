import { describe, expect, it } from "vitest";
import { cleanupBatchFingerprint } from "@/domain/accounting/bookkeeping-cleanup-fingerprint";
describe("cleanup fingerprint reference", () => {
 it("captures reference changes", () => {
  const t = { id:"t", organizationId:"o", date:"2026-10-18", amountMinor:10, currency:"NGN", description:"rent", reference:"A" };
  expect(cleanupBatchFingerprint([t])).not.toBe(cleanupBatchFingerprint([{ ...t, reference:"B" }]));
 });
});

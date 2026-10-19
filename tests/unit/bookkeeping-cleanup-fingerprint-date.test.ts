import { describe, expect, it } from "vitest";
import { cleanupBatchFingerprint } from "@/domain/accounting/bookkeeping-cleanup-fingerprint";
describe("cleanup fingerprint date", () => {
 it("captures date changes", () => {
  const t = { id:"t", organizationId:"o", date:"2026-10-18", amountMinor:10, currency:"NGN", description:"rent" };
  expect(cleanupBatchFingerprint([t])).not.toBe(cleanupBatchFingerprint([{ ...t, date:"2026-10-19" }]));
 });
});

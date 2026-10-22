import { describe, expect, it } from "vitest";
import { validateCleanupReviewInput } from "@/domain/accounting/bookkeeping-cleanup-review-policy";
describe("cleanup duplicate review identity", () => {
 it("rejects two matching findings even when reasons differ", () => {
  const base = { transactionId:"a", kind:"INVALID_INPUT" as const, requiresReview:true as const };
  expect(() => validateCleanupReviewInput({ transactionId:"a", kind:"INVALID_INPUT", decision:"ACCEPT_FINDING", reason:"verified" }, [{...base,reason:"one"},{...base,reason:"two"}])).toThrow();
 });
});

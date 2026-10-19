import { describe, expect, it } from "vitest";
import { validateCleanupReviewInput } from "@/domain/accounting/bookkeeping-cleanup-review-policy";
describe("cleanup rejection policy", () => {
 it("accepts rejection when finding exists", () => {
  const finding = { transactionId: "a", kind: "INVALID_INPUT" as const, reason: "invalid", requiresReview: true as const };
  expect(validateCleanupReviewInput({ transactionId: "a", kind: "INVALID_INPUT", decision: "REJECT_FINDING", reason: "False positive" }, [finding]).decision).toBe("REJECT_FINDING");
 });
});

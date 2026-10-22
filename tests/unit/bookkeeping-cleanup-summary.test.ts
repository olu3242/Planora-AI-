import { describe, expect, it } from "vitest";
import { summarizeCleanupFindings } from "@/application/accounting/bookkeeping-cleanup-summary";
describe("cleanup summary", () => {
  it("counts duplicate and invalid proposals separately", () => {
    expect(summarizeCleanupFindings([
      { transactionId: "a", kind: "INVALID_INPUT", reason: "invalid", requiresReview: true },
      { transactionId: "b", kind: "DUPLICATE_CANDIDATE", reason: "duplicate", requiresReview: true },
    ])).toEqual({ total: 2, invalid: 1, duplicateCandidates: 1, requiresReview: true });
  });
  it("handles an empty batch", () => expect(summarizeCleanupFindings([]).requiresReview).toBe(false));
});

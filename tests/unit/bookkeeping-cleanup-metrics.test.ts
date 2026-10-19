import { describe, expect, it } from "vitest";
import { cleanupReviewMetrics } from "@/domain/accounting/bookkeeping-cleanup-metrics";
const finding = { transactionId: "a", kind: "INVALID_INPUT" as const, reason: "invalid", requiresReview: true as const };
describe("cleanup review metrics", () => {
  it("counts pending and decisions", () => expect(cleanupReviewMetrics([{ finding, status: "PENDING" }, { finding, status: "ACCEPT_FINDING" }, { finding, status: "REJECT_FINDING" }])).toEqual({ total: 3, pending: 1, accepted: 1, rejected: 1, complete: false }));
  it("treats an empty queue as complete", () => expect(cleanupReviewMetrics([]).complete).toBe(true));
});

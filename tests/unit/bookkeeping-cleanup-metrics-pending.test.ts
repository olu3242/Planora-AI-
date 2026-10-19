import { describe, expect, it } from "vitest";
import { cleanupReviewMetrics } from "@/domain/accounting/bookkeeping-cleanup-metrics";
describe("cleanup pending metrics", () => {
 it("does not call pending review complete", () => {
  const finding = { transactionId: "a", kind: "INVALID_INPUT" as const, reason: "invalid", requiresReview: true as const };
  expect(cleanupReviewMetrics([{ finding, status: "PENDING" }])).toMatchObject({ pending: 1, complete: false });
 });
});

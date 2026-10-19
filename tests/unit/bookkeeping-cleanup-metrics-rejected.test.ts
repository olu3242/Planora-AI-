import { describe, expect, it } from "vitest";
import { cleanupReviewMetrics } from "@/domain/accounting/bookkeeping-cleanup-metrics";
describe("cleanup rejected metrics", () => {
 it("counts rejected review without counting accepted", () => {
  const finding = { transactionId:"a", kind:"INVALID_INPUT" as const, reason:"invalid", requiresReview:true as const };
  expect(cleanupReviewMetrics([{finding,status:"REJECT_FINDING"}])).toMatchObject({rejected:1,accepted:0,pending:0,complete:true});
 });
});

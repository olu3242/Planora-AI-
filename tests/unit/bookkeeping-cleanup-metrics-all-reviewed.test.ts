import { describe, expect, it } from "vitest";
import { cleanupReviewMetrics } from "@/domain/accounting/bookkeeping-cleanup-metrics";
const finding = {transactionId:"t",kind:"INVALID_INPUT" as const,reason:"bad",requiresReview:true as const};
describe("cleanup complete metrics", () => {
 it("reports completed when every finding is decided", () => expect(cleanupReviewMetrics([{finding,status:"ACCEPT_FINDING"},{finding,status:"REJECT_FINDING"}]).complete).toBe(true));
});

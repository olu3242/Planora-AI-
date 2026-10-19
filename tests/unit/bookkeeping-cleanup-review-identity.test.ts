import { describe, expect, it } from "vitest";
import { validateCleanupReviewInput } from "@/domain/accounting/bookkeeping-cleanup-review-policy";
const findings = [{ transactionId:"t", kind:"INVALID_INPUT" as const, reason:"bad", requiresReview:true as const }];
describe("review identity constraints", () => {
 it("rejects blank transaction id", () => expect(() => validateCleanupReviewInput({ transactionId:"", kind:"INVALID_INPUT", decision:"ACCEPT_FINDING", reason:"ok" }, findings)).toThrow());
});

import { describe, expect, it } from "vitest";
import { validateCleanupReviewInput } from "@/domain/accounting/bookkeeping-cleanup-review-policy";
const findings = [{ transactionId:"t", kind:"INVALID_INPUT" as const, reason:"bad", requiresReview:true as const }];
describe("review kind constraints", () => {
 it("rejects mismatched kind", () => expect(() => validateCleanupReviewInput({ transactionId:"t", kind:"DUPLICATE_CANDIDATE", decision:"ACCEPT_FINDING", reason:"ok" }, findings)).toThrow());
});

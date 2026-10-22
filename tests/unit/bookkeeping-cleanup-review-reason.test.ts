import { describe, expect, it } from "vitest";
import { validateCleanupReviewInput } from "@/domain/accounting/bookkeeping-cleanup-review-policy";
const findings = [{ transactionId: "t", kind: "INVALID_INPUT" as const, reason: "bad", requiresReview: true as const }];
describe("review reason constraints", () => {
 it("rejects 2001 characters", () => expect(() => validateCleanupReviewInput({ transactionId:"t", kind:"INVALID_INPUT", decision:"REJECT_FINDING", reason:"a".repeat(2001) }, findings)).toThrow());
 it("accepts 2000 characters", () => expect(validateCleanupReviewInput({ transactionId:"t", kind:"INVALID_INPUT", decision:"REJECT_FINDING", reason:"a".repeat(2000) }, findings).reason).toHaveLength(2000));
});

import { describe, expect, it } from "vitest";
import { validateCleanupReviewInput } from "@/domain/accounting/bookkeeping-cleanup-review-policy";
const findings = [{ transactionId:"t", kind:"INVALID_INPUT" as const, reason:"bad", requiresReview:true as const }];
describe("review decision constraints", () => {
 it("rejects unknown decision at runtime", () => expect(() => validateCleanupReviewInput({ transactionId:"t", kind:"INVALID_INPUT", decision:"DELETE" as never, reason:"ok" }, findings)).toThrow());
});

import { describe, expect, it } from "vitest";
import { validateCleanupReviewInput } from "@/domain/accounting/bookkeeping-cleanup-review-policy";
const findings = [{ transactionId: "one", kind: "DUPLICATE_CANDIDATE" as const, reason: "match", requiresReview: true as const }];
describe("cleanup review policy", () => {
  it("accepts a supported review with a reason", () => expect(validateCleanupReviewInput({ transactionId: "one", kind: "DUPLICATE_CANDIDATE", decision: "ACCEPT_FINDING", reason: " confirmed " }, findings).reason).toBe("confirmed"));
  it("rejects unknown findings", () => expect(() => validateCleanupReviewInput({ transactionId: "other", kind: "DUPLICATE_CANDIDATE", decision: "REJECT_FINDING", reason: "wrong" }, findings)).toThrow());
  it("rejects empty reasons", () => expect(() => validateCleanupReviewInput({ transactionId: "one", kind: "DUPLICATE_CANDIDATE", decision: "ACCEPT_FINDING", reason: " " }, findings)).toThrow());
  it("rejects ambiguous duplicate finding identities", () => expect(() => validateCleanupReviewInput({ transactionId: "one", kind: "DUPLICATE_CANDIDATE", decision: "ACCEPT_FINDING", reason: "review" }, [...findings, ...findings])).toThrow());
});

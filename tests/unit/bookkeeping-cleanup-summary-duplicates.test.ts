import { describe, expect, it } from "vitest";
import { summarizeCleanupFindings } from "@/application/accounting/bookkeeping-cleanup-summary";
describe("cleanup duplicate summary", () => {
 it("counts duplicate candidates", () => expect(summarizeCleanupFindings([{ transactionId: "a", kind: "DUPLICATE_CANDIDATE", reason: "same", requiresReview: true }]).duplicateCandidates).toBe(1));
});

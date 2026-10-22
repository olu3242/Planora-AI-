import { describe, expect, it } from "vitest";
import { summarizeCleanupFindings } from "@/application/accounting/bookkeeping-cleanup-summary";
describe("cleanup empty summary", () => {
 it("returns zero counts for empty input", () => expect(summarizeCleanupFindings([])).toEqual({total:0,invalid:0,duplicateCandidates:0,requiresReview:false}));
});

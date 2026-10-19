import { describe, expect, it } from "vitest";
import { cleanupFindingsCsv } from "@/domain/accounting/bookkeeping-cleanup-export";
describe("cleanup related transaction export", () => {
 it("includes related transaction identifiers", () => expect(cleanupFindingsCsv([{transactionId:"a",kind:"DUPLICATE_CANDIDATE",relatedTransactionId:"b",reason:"same",requiresReview:true}])).toContain('"b"'));
});

import { describe, expect, it } from "vitest";
import { cleanupFindingsCsv } from "@/domain/accounting/bookkeeping-cleanup-export";
describe("cleanup CSV newline", () => {
 it("quotes embedded newlines", () => expect(cleanupFindingsCsv([{transactionId:"t",kind:"INVALID_INPUT",reason:"first\nsecond",requiresReview:true}])).toContain('"first\nsecond"'));
});

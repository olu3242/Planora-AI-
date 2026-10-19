import { describe, expect, it } from "vitest";
import { cleanupFindingsCsv } from "@/domain/accounting/bookkeeping-cleanup-export";
describe("cleanup CSV quote", () => {
 it("escapes quote characters", () => expect(cleanupFindingsCsv([{transactionId:'a"b',kind:"INVALID_INPUT",reason:"bad",requiresReview:true}])).toContain('"a""b"'));
});

import { describe, expect, it } from "vitest";
import { cleanupProposalMessage } from "@/domain/accounting/bookkeeping-cleanup-api-result";
describe("cleanup proposal messages", () => {
 it("distinguishes replay", () => expect(cleanupProposalMessage(true)).toContain("Existing"));
 it("distinguishes new execution", () => expect(cleanupProposalMessage(false)).toContain("submitted"));
});

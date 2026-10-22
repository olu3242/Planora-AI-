import { describe, expect, it } from "vitest";
import { cleanupProposalMessage } from "@/domain/accounting/bookkeeping-cleanup-api-result";
describe("cleanup proposal acknowledgement", () => {
 it("does not imply ledger posting", () => {
  expect(cleanupProposalMessage(false)).not.toMatch(/posted|deleted|reconciled/i);
 });
});

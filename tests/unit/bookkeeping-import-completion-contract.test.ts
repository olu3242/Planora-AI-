import { describe, expect, it } from "vitest";
import { assertVerifiedBankImportCompletion } from "../../src/lib/accounting/bookkeeping-import-completion-contract";
const event = {
  organizationId: "11111111-1111-4111-8111-111111111111",
  legalEntityId: "22222222-2222-4222-8222-222222222222",
  fiscalPeriodId: "33333333-3333-4333-8333-333333333333",
  importEventId: "44444444-4444-4444-8444-444444444444",
  committed: true as const, importedCount: 3,
};
describe("verified bank import completion contract", () => {
  it("accepts a verified completion", () => expect(() => assertVerifiedBankImportCompletion(event)).not.toThrow());
  it("rejects missing tenant identity", () => expect(() => assertVerifiedBankImportCompletion({ ...event, organizationId: "" })).toThrow("INVALID_VERIFIED_BANK_IMPORT"));
  it("rejects negative import counts", () => expect(() => assertVerifiedBankImportCompletion({ ...event, importedCount: -1 })).toThrow("INVALID_VERIFIED_BANK_IMPORT"));
  it("rejects invalid event identity", () => expect(() => assertVerifiedBankImportCompletion({ ...event, importEventId: "invalid" })).toThrow("INVALID_VERIFIED_BANK_IMPORT"));
});

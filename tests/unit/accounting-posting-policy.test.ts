import { describe, expect, it } from "vitest";
import { validatePostingIntent, type PostingIntent } from "../../src/domain/accounting/posting-policy";

const intent: PostingIntent = {
  organizationId: "tenant-a", legalEntityId: "entity-a", periodId: "p1",
  currency: "USD", sourceKey: "import-1",
  lines: [
    { accountId: "cash", debitMinor: 100n, creditMinor: 0n },
    { accountId: "sales", debitMinor: 0n, creditMinor: 100n },
  ],
};
const context = {
  organizationId: "tenant-a", legalEntityId: "entity-a", periodId: "p1",
  periodState: "OPEN" as const, allowedCurrency: "USD",
};
describe("posting policy", () => {
  it("accepts a valid posting intent", () => expect(() => validatePostingIntent(intent, context)).not.toThrow());
  it("rejects cross-tenant intents", () => expect(() => validatePostingIntent(intent, { ...context, organizationId: "tenant-b" })).toThrow("TENANT_MISMATCH"));
  it("rejects cross-entity intents", () => expect(() => validatePostingIntent(intent, { ...context, legalEntityId: "entity-b" })).toThrow("ENTITY_MISMATCH"));
  it("rejects closed periods", () => expect(() => validatePostingIntent(intent, { ...context, periodState: "HARD_CLOSED" })).toThrow("PERIOD_NOT_OPEN"));
  it("rejects soft closed periods", () => expect(() => validatePostingIntent(intent, { ...context, periodState: "SOFT_CLOSED" })).toThrow("PERIOD_NOT_OPEN"));
  it("rejects duplicate sources", () => expect(() => validatePostingIntent(intent, { ...context, existingSourceKey: "import-1" })).toThrow("DUPLICATE_SOURCE_KEY"));
  it("rejects currency mismatches", () => expect(() => validatePostingIntent(intent, { ...context, allowedCurrency: "EUR" })).toThrow("CURRENCY_MISMATCH"));
  it("rejects wrong periods", () => expect(() => validatePostingIntent(intent, { ...context, periodId: "p2" })).toThrow("PERIOD_MISMATCH"));
});

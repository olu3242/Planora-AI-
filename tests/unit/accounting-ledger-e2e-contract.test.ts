import { describe, expect, it } from "vitest";
import { validatePostingIntent, type PostingIntent } from "../../src/domain/accounting/posting-policy";

const baseline: PostingIntent = {
  organizationId: "org-1", legalEntityId: "entity-1", periodId: "period-1",
  currency: "USD", sourceKey: "source-001",
  lines: [
    { accountId: "cash", debitMinor: 12500n, creditMinor: 0n },
    { accountId: "revenue", debitMinor: 0n, creditMinor: 12500n },
  ],
};
const scope = {
  organizationId: "org-1", legalEntityId: "entity-1", periodId: "period-1",
  allowedCurrency: "USD", periodState: "OPEN" as const,
};
describe("accounting ledger contract: transaction lifecycle preflight", () => {
  it("permits a balanced journal for the current tenant, entity and open period", () => {
    expect(() => validatePostingIntent(baseline, scope)).not.toThrow();
  });
  it.each([
    ["tenant", { organizationId: "org-2" }, "TENANT_MISMATCH"],
    ["entity", { legalEntityId: "entity-2" }, "ENTITY_MISMATCH"],
    ["period", { periodId: "period-2" }, "PERIOD_MISMATCH"],
    ["currency", { allowedCurrency: "EUR" }, "CURRENCY_MISMATCH"],
    ["soft close", { periodState: "SOFT_CLOSED" }, "PERIOD_NOT_OPEN"],
    ["hard close", { periodState: "HARD_CLOSED" }, "PERIOD_NOT_OPEN"],
    ["duplicate", { existingSourceKey: "source-001" }, "DUPLICATE_SOURCE_KEY"],
  ] as const)("blocks %s", (_label, change, error) => {
    expect(() => validatePostingIntent(baseline, { ...scope, ...change })).toThrow(error);
  });
  it("rejects an unbalanced posting before persistence", () => {
    expect(() => validatePostingIntent({
      ...baseline, lines: [
        baseline.lines[0],
        { ...baseline.lines[1], creditMinor: 12499n },
      ],
    }, scope)).toThrow("UNBALANCED_JOURNAL");
  });
});

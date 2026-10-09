import { describe, expect, it } from "vitest";
import { projectActualCandidates } from "../../src/domain/accounting/fpa-bridge";
import { calculateActualForecastVariance } from "../../src/domain/accounting/variance";
const scope = { organizationId: "org", legalEntityId: "entity", fiscalPeriodId: "p1", currency: "USD" };
describe("ledger to FP&A candidates", () => {
  it("applies normal balances without rounding and yields stable lineage keys", () => {
    const rows = projectActualCandidates([
      { accountId: "cash", debitMinor: 200n, creditMinor: 0n, normalBalance: "DEBIT" },
      { accountId: "cash", debitMinor: 0n, creditMinor: 50n, normalBalance: "DEBIT" },
      { accountId: "sales", debitMinor: 0n, creditMinor: 150n, normalBalance: "CREDIT" },
    ], scope);
    expect(rows.map((r) => [r.accountId, r.amountMinor])).toEqual([["cash", 150n], ["sales", 150n]]);
    expect(rows[0].sourceKey).toBe("ledger:org:entity:p1:USD:cash");
    expect(projectActualCandidates([], scope)).toEqual([]);
  });
  it("rejects invalid lines and scope", () => {
    expect(() => projectActualCandidates([], { ...scope, currency: "usd" })).toThrow("INVALID_ACTUAL_SCOPE");
    expect(() => projectActualCandidates([
      { accountId: "cash", debitMinor: -1n, creditMinor: 0n, normalBalance: "DEBIT" },
    ], scope)).toThrow("INVALID_LEDGER_LINE");
  });
});
describe("actual versus forecast", () => {
  it("preserves exact signed differences", () => {
    expect(calculateActualForecastVariance(125n, 100n).deltaMinor).toBe(25n);
    expect(calculateActualForecastVariance(75n, 100n).direction).toBe("BELOW");
    expect(calculateActualForecastVariance(100n, 100n).direction).toBe("ON_TARGET");
  });
});

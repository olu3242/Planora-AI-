import { describe, expect, it } from "vitest";
import { ledgerActualGrainKey, staleLedgerActualKeys } from "../../src/domain/accounting/actuals-reconciliation";

const scope = { organizationId: "org-a", legalEntityId: "entity-a", fiscalPeriodId: "period-a" };
const cash = { currencyCode: "USD", accountId: "cash" };
const sales = { currencyCode: "USD", accountId: "sales" };

describe("ledger actuals reconciliation policy", () => {
  it("produces a deterministic grain key and accepts idempotent replay", () => {
    const key = ledgerActualGrainKey(scope, cash);
    expect(key).toBe("ledger:org-a:entity-a:period-a:USD:cash:ACTUAL");
    expect(staleLedgerActualKeys(scope, [cash], [key, key])).toEqual([]);
  });
  it("rejects a source removed after the prior projection", () => {
    const existing = [ledgerActualGrainKey(scope, cash), ledgerActualGrainKey(scope, sales)];
    expect(staleLedgerActualKeys(scope, [cash], existing)).toEqual([existing[1]]);
  });
  it("detects stale projections when the current journal set is empty", () => {
    expect(staleLedgerActualKeys(scope, [], [ledgerActualGrainKey(scope, cash)])).toHaveLength(1);
  });
  it("isolates currencies, legal entities, and periods in source keys", () => {
    const usd = ledgerActualGrainKey(scope, cash);
    const eur = ledgerActualGrainKey(scope, { ...cash, currencyCode: "EUR" });
    const otherEntity = ledgerActualGrainKey({ ...scope, legalEntityId: "entity-b" }, cash);
    const otherPeriod = ledgerActualGrainKey({ ...scope, fiscalPeriodId: "period-b" }, cash);
    expect(new Set([usd, eur, otherEntity, otherPeriod]).size).toBe(4);
    expect(staleLedgerActualKeys(scope, [cash], [usd, eur])).toEqual([eur]);
  });
  it("deduplicates and sorts stale keys", () => {
    const a = ledgerActualGrainKey(scope, cash);
    const b = ledgerActualGrainKey(scope, sales);
    expect(staleLedgerActualKeys(scope, [], [b, a, b])).toEqual([a, b]);
  });
  it("rejects invalid source currency or account", () => {
    expect(() => ledgerActualGrainKey(scope, { ...cash, currencyCode: "usd" })).toThrow("INVALID_ACTUAL_SCOPE");
    expect(() => ledgerActualGrainKey(scope, { ...cash, accountId: "" })).toThrow("INVALID_ACTUAL_SCOPE");
  });
});

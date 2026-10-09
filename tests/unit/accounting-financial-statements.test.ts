import { describe, expect, it } from "vitest";
import { buildFinancialStatements, serializeFinancialStatementEvidence } from "@/domain/accounting/financial-statements";

describe("accounting financial statement evidence", () => {
  it("serializes exact minor-unit values as strings for JSON persistence", () => {
    const amount = 9_007_199_254_740_993_123n;
    const statements = buildFinancialStatements([
      { accountId: "cash", code: "1000", name: "Cash", type: "ASSET", normalBalance: "DEBIT", debitMinor: amount, creditMinor: 0n },
      { accountId: "equity", code: "3000", name: "Equity", type: "EQUITY", normalBalance: "CREDIT", debitMinor: 0n, creditMinor: amount },
    ]);
    const evidence = serializeFinancialStatementEvidence({
      ...statements,
      currencyCode: "USD",
      coaControl: { mapped: true, unmappedAccounts: [] },
    });

    expect(evidence.balanceSheet.map((account) => [account.debitMinor, account.creditMinor])).toEqual([
      [amount.toString(), "0"],
      ["0", amount.toString()],
    ]);
    expect(() => JSON.stringify(evidence)).not.toThrow();
  });
});
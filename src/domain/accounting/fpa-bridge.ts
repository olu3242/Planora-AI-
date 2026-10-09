/**
 * Pure ledger-to-FP&A candidate projection. This does not persist FinancialFact.
 * Inputs must be authorized, POSTED, and scoped to one entity/period/currency.
 */
export type LedgerActual = Readonly<{
  accountId: string;
  debitMinor: bigint;
  creditMinor: bigint;
  normalBalance: "DEBIT" | "CREDIT";
}>;
export type ActualCandidate = Readonly<{
  accountId: string;
  amountMinor: bigint;
  sourceKey: string;
}>;
export function projectActualCandidates(
  lines: readonly LedgerActual[],
  scope: Readonly<{ organizationId: string; legalEntityId: string; fiscalPeriodId: string; currency: string }>,
): ActualCandidate[] {
  if (!scope.organizationId || !scope.legalEntityId || !scope.fiscalPeriodId ||
      !/^[A-Z]{3}$/.test(scope.currency)) throw new Error("INVALID_ACTUAL_SCOPE");
  const amounts = new Map<string, bigint>();
  for (const line of lines) {
    if (!line.accountId.trim() || line.debitMinor < 0n || line.creditMinor < 0n ||
      (line.debitMinor > 0n) === (line.creditMinor > 0n)) throw new Error("INVALID_LEDGER_LINE");
    const net = line.normalBalance === "DEBIT"
      ? line.debitMinor - line.creditMinor : line.creditMinor - line.debitMinor;
    amounts.set(line.accountId, (amounts.get(line.accountId) ?? 0n) + net);
  }
  return [...amounts.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([accountId, amountMinor]) => ({
    accountId, amountMinor,
    sourceKey: ["ledger", scope.organizationId, scope.legalEntityId,
      scope.fiscalPeriodId, scope.currency, accountId].join(":"),
  }));
}

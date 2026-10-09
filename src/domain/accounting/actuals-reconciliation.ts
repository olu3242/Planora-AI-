/** Pure, tenant-scoped ledger actuals reconciliation. No persistence or side effects. */
export type LedgerActualScope = Readonly<{
  organizationId: string;
  legalEntityId: string;
  fiscalPeriodId: string;
}>;
export type LedgerActualSource = Readonly<{ currencyCode: string; accountId: string }>;
export function ledgerActualGrainKey(scope: LedgerActualScope, source: LedgerActualSource): string {
  if (!scope.organizationId || !scope.legalEntityId || !scope.fiscalPeriodId ||
      !/^[A-Z]{3}$/.test(source.currencyCode) || !source.accountId.trim()) {
    throw new Error("INVALID_ACTUAL_SCOPE");
  }
  return ["ledger", scope.organizationId, scope.legalEntityId, scope.fiscalPeriodId,
    source.currencyCode, source.accountId, "ACTUAL"].join(":");
}
export function staleLedgerActualKeys(
  scope: LedgerActualScope,
  sources: readonly LedgerActualSource[],
  existingGrainKeys: readonly string[],
): string[] {
  const expected = new Set(sources.map(source => ledgerActualGrainKey(scope, source)));
  return [...new Set(existingGrainKeys.filter(key => !expected.has(key)))].sort();
}

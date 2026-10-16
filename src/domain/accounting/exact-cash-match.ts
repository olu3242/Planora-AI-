/**
 * Pure, read-only bank-to-cash-GL matching candidate selector.
 * A candidate is NOT a reconciliation or permission to mutate a bank transaction.
 * The caller must verify a persisted, approved bank-to-cash-account mapping,
 * tenant RLS, dates, posting status, and commit matches atomically.
 */
export type BankMovement = Readonly<{
  id: string; organizationId: string; legalEntityId: string;
  currencyCode: string; amountMinor: bigint;
}>;
export type CashLedgerMovement = Readonly<{
  journalId: string; organizationId: string; legalEntityId: string;
  currencyCode: string; cashAccountId: string; amountMinor: bigint;
  status: 'POSTED' | 'DRAFT' | 'REVERSED';
}>;
export type MatchResult =
  | Readonly<{ status: 'CANDIDATE'; journalId: string }>
  | Readonly<{ status: 'UNMATCHED' | 'AMBIGUOUS' | 'INVALID_INPUT' | 'MAPPING_REQUIRED'; journalId?: never }>;

export function selectExactCashMatch(
  bank: BankMovement,
  approvedCashAccountId: string | null,
  ledger: readonly CashLedgerMovement[],
): MatchResult {
  if (!bank || !bank.id?.trim() || !bank.organizationId?.trim() ||
      !bank.legalEntityId?.trim() || !/^[A-Z]{3}$/.test(bank.currencyCode) ||
      typeof bank.amountMinor !== 'bigint' || bank.amountMinor === 0n ||
      !Array.isArray(ledger)) return { status: 'INVALID_INPUT' };
  if (!approvedCashAccountId?.trim()) return { status: 'MAPPING_REQUIRED' };
  const candidates = ledger.filter(entry =>
    entry && entry.status === 'POSTED' &&
    entry.journalId?.trim() &&
    entry.organizationId === bank.organizationId &&
    entry.legalEntityId === bank.legalEntityId &&
    entry.currencyCode === bank.currencyCode &&
    entry.cashAccountId === approvedCashAccountId &&
    typeof entry.amountMinor === 'bigint' &&
    entry.amountMinor === bank.amountMinor
  );
  const unique = [...new Set(candidates.map(x => x.journalId))];
  if (unique.length === 0) return { status: 'UNMATCHED' };
  if (unique.length > 1) return { status: 'AMBIGUOUS' };
  return { status: 'CANDIDATE', journalId: unique[0] };
}

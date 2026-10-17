/**
 * Pure bookkeeping proposal validation. No database access and no posting authority.
 * Callers MUST separately authenticate, authorize, check tenant/period state,
 * obtain approvals, and commit through the canonical posting transaction.
 */
export type ProposedLine = Readonly<{
  accountId: string;
  debitMinor: bigint;
  creditMinor: bigint;
}>;
export type ProposalValidation =
  | Readonly<{ ok: true; totalDebitMinor: bigint; totalCreditMinor: bigint }>
  | Readonly<{ ok: false; code: 'EMPTY_JOURNAL' | 'INVALID_ACCOUNT' | 'INVALID_AMOUNT' | 'MIXED_SIDES' | 'UNBALANCED_JOURNAL' | 'NO_VALUE' }>;

export function validateProposedJournal(lines: readonly ProposedLine[]): ProposalValidation {
  if (lines.length < 2) return { ok: false, code: 'EMPTY_JOURNAL' };
  let debit = 0n;
  let credit = 0n;
  for (const line of lines) {
    if (typeof line.accountId !== 'string' || !line.accountId.trim())
      return { ok: false, code: 'INVALID_ACCOUNT' };
    if (typeof line.debitMinor !== 'bigint' || typeof line.creditMinor !== 'bigint'
      || line.debitMinor < 0n || line.creditMinor < 0n)
      return { ok: false, code: 'INVALID_AMOUNT' };
    if (line.debitMinor > 0n && line.creditMinor > 0n)
      return { ok: false, code: 'MIXED_SIDES' };
    debit += line.debitMinor;
    credit += line.creditMinor;
  }
  if (debit === 0n || credit === 0n) return { ok: false, code: 'NO_VALUE' };
  if (debit !== credit) return { ok: false, code: 'UNBALANCED_JOURNAL' };
  return { ok: true, totalDebitMinor: debit, totalCreditMinor: credit };
}

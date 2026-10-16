/**
 * Reconciliation is a bank-to-ledger evidence link, not a journal posting.
 * Financial statements and FP&A continue to consume canonical posted journals.
 */
export type ReconciliationTrace = Readonly<{
  bankTransactionId: string;
  journalId: string;
  organizationId: string;
  legalEntityId: string;
  cashAccountId: string;
  amountMinor: bigint;
  currencyCode: string;
  bankStatus: 'MATCHED' | 'UNMATCHED' | 'EXCLUDED';
  journalStatus: 'POSTED' | 'DRAFT' | 'REVERSED';
  journalReversed: boolean;
}>;

export function validateReconciliationTrace(trace: ReconciliationTrace):
  | { valid: true; journalId: string; cashAccountId: string }
  | { valid: false; reason: string } {
  if (!trace.bankTransactionId?.trim() || !trace.journalId?.trim() ||
      !trace.organizationId?.trim() || !trace.legalEntityId?.trim() ||
      !trace.cashAccountId?.trim()) return { valid: false, reason: 'TRACE_IDENTIFIER_REQUIRED' };
  if (!/^[A-Z]{3}$/.test(trace.currencyCode)) return { valid: false, reason: 'TRACE_CURRENCY_INVALID' };
  if (trace.bankStatus !== 'MATCHED' || trace.journalStatus !== 'POSTED' || trace.journalReversed)
    return { valid: false, reason: 'TRACE_NOT_FINAL' };
  if (typeof trace.amountMinor !== 'bigint' || trace.amountMinor === 0n)
    return { valid: false, reason: 'TRACE_AMOUNT_INVALID' };
  return { valid: true, journalId: trace.journalId, cashAccountId: trace.cashAccountId };
}

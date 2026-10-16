export function reconciliationEvidencePath(bankTransactionId: string): string {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bankTransactionId)) {
    throw new Error('BANK_TRANSACTION_ID_INVALID');
  }
  return '/accounting/reconciliation/trace?bankTransactionId=' + encodeURIComponent(bankTransactionId);
}

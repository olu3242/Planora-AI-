/** Reconciliation evidence never creates or changes a financial actual. */
export type LedgerToFpaLineage = Readonly<{
  organizationId: string;
  legalEntityId: string;
  fiscalPeriodId: string;
  journalId: string;
  accountId: string;
  currencyCode: string;
  sourceType: 'POSTED_LEDGER';
  bankEvidenceCount: number;
}>;

export function validateLedgerToFpaLineage(value: LedgerToFpaLineage): boolean {
  return Boolean(value.organizationId && value.legalEntityId &&
    value.fiscalPeriodId && value.journalId && value.accountId &&
    /^[A-Z]{3}$/.test(value.currencyCode) &&
    value.sourceType === 'POSTED_LEDGER' &&
    Number.isSafeInteger(value.bankEvidenceCount) &&
    value.bankEvidenceCount >= 0);
}

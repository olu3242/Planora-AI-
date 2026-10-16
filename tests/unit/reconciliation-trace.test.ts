import { describe, expect, it } from 'vitest';
import { validateReconciliationTrace } from '../../src/domain/accounting/reconciliation-trace';

const valid = {
  bankTransactionId: 'bank-1', journalId: 'journal-1', organizationId: 'org-1',
  legalEntityId: 'entity-1', cashAccountId: 'cash-1', amountMinor: 500n,
  currencyCode: 'USD', bankStatus: 'MATCHED' as const,
  journalStatus: 'POSTED' as const, journalReversed: false,
};

describe('reconciliation trace integrity', () => {
  it('accepts posted, matched, non-reversed cash evidence', () => {
    expect(validateReconciliationTrace(valid)).toEqual({
      valid: true, journalId: 'journal-1', cashAccountId: 'cash-1',
    });
  });
  it.each([
    { bankStatus: 'UNMATCHED' as const },
    { journalStatus: 'DRAFT' as const },
    { journalReversed: true },
    { amountMinor: 0n },
    { currencyCode: 'usd' },
    { journalId: '' },
  ])('rejects invalid trace %o', change => {
    expect(validateReconciliationTrace({ ...valid, ...change }).valid).toBe(false);
  });
});

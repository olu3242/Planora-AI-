import { describe, expect, it } from 'vitest';
import { validateReconciliationTrace } from '../../src/domain/accounting/reconciliation-trace';

const base = {
  bankTransactionId: 'bank', journalId: 'journal', organizationId: 'org',
  legalEntityId: 'entity', cashAccountId: 'cash', amountMinor: -125n,
  currencyCode: 'USD', bankStatus: 'MATCHED' as const,
  journalStatus: 'POSTED' as const, journalReversed: false,
};

describe('reconciliation trace signed amounts', () => {
  it('preserves negative cash movements', () => {
    expect(validateReconciliationTrace(base)).toEqual({
      valid: true, journalId: 'journal', cashAccountId: 'cash',
    });
  });
  it('rejects reversed journals', () => {
    expect(validateReconciliationTrace({ ...base, journalReversed: true }).valid).toBe(false);
  });
  it('rejects excluded bank movements', () => {
    expect(validateReconciliationTrace({ ...base, bankStatus: 'EXCLUDED' }).valid).toBe(false);
  });
});

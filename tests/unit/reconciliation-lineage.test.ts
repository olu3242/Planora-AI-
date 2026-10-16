import { describe, expect, it } from 'vitest';
import { reconciliationEvidencePath } from '../../src/domain/accounting/reconciliation-lineage';

describe('reconciliation evidence path', () => {
  it('accepts a UUID and encodes the destination', () => {
    expect(reconciliationEvidencePath('a6e84d93-01d2-4fa5-a180-028ad9bb3123'))
      .toBe('/accounting/reconciliation/trace?bankTransactionId=a6e84d93-01d2-4fa5-a180-028ad9bb3123');
  });
  it.each(['', 'not-a-uuid', '../ledger', '123'])('rejects invalid ids', id => {
    expect(() => reconciliationEvidencePath(id)).toThrow('BANK_TRANSACTION_ID_INVALID');
  });
});

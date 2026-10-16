import { describe, expect, it } from 'vitest';
import { selectExactCashMatch, type BankMovement, type CashLedgerMovement } from '../../src/domain/accounting/exact-cash-match';

const bank: BankMovement = { id: 'bank-1', organizationId: 'org-a', legalEntityId: 'entity-a', currencyCode: 'USD', amountMinor: -12345n };
const entry: CashLedgerMovement = { journalId: 'journal-1', organizationId: 'org-a', legalEntityId: 'entity-a', currencyCode: 'USD', cashAccountId: 'cash-1', amountMinor: -12345n, status: 'POSTED' };
describe('cash movement candidate selection', () => {
  it('finds a single exact scoped posted cash movement', () => {
    expect(selectExactCashMatch(bank, 'cash-1', [entry])).toEqual({ status: 'CANDIDATE', journalId: 'journal-1' });
  });
  it('requires an approved mapping', () => {
    expect(selectExactCashMatch(bank, null, [entry])).toEqual({ status: 'MAPPING_REQUIRED' });
  });
  it('rejects invalid or zero bank movement', () => {
    expect(selectExactCashMatch({ ...bank, amountMinor: 0n }, 'cash-1', [entry])).toEqual({ status: 'INVALID_INPUT' });
  });
  it.each([
    ['tenant', { organizationId: 'org-b' }],
    ['entity', { legalEntityId: 'entity-b' }],
    ['currency', { currencyCode: 'EUR' }],
    ['cash account', { cashAccountId: 'cash-2' }],
    ['amount', { amountMinor: 12345n }],
    ['draft', { status: 'DRAFT' as const }],
    ['reversed', { status: 'REVERSED' as const }],
  ])('does not match %s mismatch', (_label, change) => {
    expect(selectExactCashMatch(bank, 'cash-1', [{ ...entry, ...change }])).toEqual({ status: 'UNMATCHED' });
  });
  it('refuses to choose between multiple matching journals', () => {
    expect(selectExactCashMatch(bank, 'cash-1', [entry, { ...entry, journalId: 'journal-2' }])).toEqual({ status: 'AMBIGUOUS' });
  });
  it('deduplicates repeated projection rows for one journal', () => {
    expect(selectExactCashMatch(bank, 'cash-1', [entry, entry])).toEqual({ status: 'CANDIDATE', journalId: 'journal-1' });
  });
});

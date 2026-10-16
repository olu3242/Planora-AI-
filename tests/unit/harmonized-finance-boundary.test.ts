import { describe, expect, it } from 'vitest';
import { validateProposedJournal } from '../../src/domain/accounting/proposed-journal-validation';
import { checkPostingApproval } from '../../src/domain/accounting/posting-approval-guard';

const debit = (accountId: string, amount: bigint) => ({ accountId, debitMinor: amount, creditMinor: 0n });
const credit = (accountId: string, amount: bigint) => ({ accountId, debitMinor: 0n, creditMinor: amount });

describe('harmonized finance boundary: journal proposals', () => {
  it('balances in minor units without floating point rounding', () => {
    expect(validateProposedJournal([debit('cash', 20000000001n), credit('revenue', 20000000001n)]))
      .toEqual({ ok: true, totalDebitMinor: 20000000001n, totalCreditMinor: 20000000001n });
  });
  it.each([
    { label: 'single line', lines: [debit('cash', 100n)], code: 'EMPTY_JOURNAL' },
    { label: 'blank account', lines: [debit(' ', 100n), credit('revenue', 100n)], code: 'INVALID_ACCOUNT' },
    { label: 'negative amount', lines: [debit('cash', -100n), credit('revenue', 100n)], code: 'INVALID_AMOUNT' },
    { label: 'both sides', lines: [{ accountId: 'cash', debitMinor: 100n, creditMinor: 100n }, credit('revenue', 100n)], code: 'MIXED_SIDES' },
    { label: 'zero value', lines: [debit('cash', 0n), credit('revenue', 0n)], code: 'NO_VALUE' },
    { label: 'imbalanced', lines: [debit('cash', 100n), credit('revenue', 99n)], code: 'UNBALANCED_JOURNAL' },
  ])('rejects $label', ({ lines, code }) => {
    expect(validateProposedJournal(lines)).toEqual({ ok: false, code });
  });
});

describe('harmonized finance boundary: posting approval preconditions', () => {
  const now = new Date('2026-10-16T12:00:00Z');
  const approval = {
    organizationId: 'org', legalEntityId: 'entity', fiscalPeriodId: 'period',
    sourceKey: 'bank:123', preparedById: 'maker', decidedById: 'checker',
    decision: 'APPROVED', expiresAt: new Date('2026-10-17T12:00:00Z'), consumedAt: null,
  };
  const request = {
    organizationId: 'org', legalEntityId: 'entity', fiscalPeriodId: 'period',
    sourceKey: 'bank:123', actorId: 'poster', now, periodState: 'OPEN' as const,
  };
  it('accepts a correctly scoped approval as a precondition, not authorization', () => {
    expect(checkPostingApproval(approval, request)).toEqual({ ok: true });
  });
  it.each([
    { label: 'different period', change: { fiscalPeriodId: 'other' }, code: 'INVALID_SCOPE' },
    { label: 'different source', change: { sourceKey: 'bank:124' }, code: 'INVALID_SCOPE' },
    { label: 'missing actor', change: { actorId: '' }, code: 'INVALID_SCOPE' },
    { label: 'soft close', change: { periodState: 'SOFT_CLOSED' as const }, code: 'PERIOD_CLOSED' },
  ])('rejects $label', ({ change, code }) => {
    expect(checkPostingApproval(approval, { ...request, ...change })).toEqual({ ok: false, code });
  });
  it('rejects expired approvals', () => {
    expect(checkPostingApproval({ ...approval, expiresAt: now }, request)).toEqual({ ok: false, code: 'APPROVAL_EXPIRED' });
  });
  it('rejects approval reuse', () => {
    expect(checkPostingApproval({ ...approval, consumedAt: now }, request)).toEqual({ ok: false, code: 'APPROVAL_CONSUMED' });
  });
});

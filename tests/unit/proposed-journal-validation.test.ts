import { describe, expect, it } from 'vitest';
import { validateProposedJournal } from '../../src/domain/accounting/proposed-journal-validation';

const valid = [
  { accountId: 'cash', debitMinor: 100n, creditMinor: 0n },
  { accountId: 'revenue', debitMinor: 0n, creditMinor: 100n },
] as const;

describe('proposed journal validation', () => {
  it('accepts exact balanced minor units', () => {
    expect(validateProposedJournal(valid)).toEqual({ ok: true, totalDebitMinor: 100n, totalCreditMinor: 100n });
  });
  it('rejects a single line', () => {
    expect(validateProposedJournal(valid.slice(0, 1))).toEqual({ ok: false, code: 'EMPTY_JOURNAL' });
  });
  it('rejects unbalanced amounts', () => {
    expect(validateProposedJournal([{ ...valid[0], debitMinor: 101n }, valid[1]])).toEqual({ ok: false, code: 'UNBALANCED_JOURNAL' });
  });
  it('rejects negative amounts', () => {
    expect(validateProposedJournal([{ ...valid[0], debitMinor: -1n }, valid[1]])).toEqual({ ok: false, code: 'INVALID_AMOUNT' });
  });
  it('rejects dual-sided lines', () => {
    expect(validateProposedJournal([{ ...valid[0], creditMinor: 1n }, valid[1]])).toEqual({ ok: false, code: 'MIXED_SIDES' });
  });
  it('rejects missing account identifiers', () => {
    expect(validateProposedJournal([{ ...valid[0], accountId: ' ' }, valid[1]])).toEqual({ ok: false, code: 'INVALID_ACCOUNT' });
  });
  it('rejects no-value journals', () => {
    expect(validateProposedJournal([{ ...valid[0], debitMinor: 0n }, { ...valid[1], creditMinor: 0n }])).toEqual({ ok: false, code: 'NO_VALUE' });
  });
  it('does not use floating point for large amounts', () => {
    const n = 9007199254740993n;
    expect(validateProposedJournal([{ ...valid[0], debitMinor: n }, { ...valid[1], creditMinor: n }])).toEqual({ ok: true, totalDebitMinor: n, totalCreditMinor: n });
  });
});

import { describe, expect, it } from 'vitest';
import { validateJournalLines } from '../../src/lib/accounting/ai-native-controls';

const base = [
  { accountId: 'cash', debitMinor: 100n, creditMinor: 0n },
  { accountId: 'revenue', debitMinor: 0n, creditMinor: 100n },
];

describe('canonical journal validation rejects malformed runtime inputs', () => {
  it('accepts balanced bigint minor units', () => {
    expect(validateJournalLines(base)).toEqual({ debitMinor: 100n, creditMinor: 100n, lineCount: 2 });
  });
  it('rejects floating point numbers', () => {
    expect(() => validateJournalLines([{ ...base[0], debitMinor: 100.1 }, base[1]] as never)).toThrow('INVALID_MINOR_UNIT_TYPE');
  });
  it('rejects string minor units', () => {
    expect(() => validateJournalLines([{ ...base[0], debitMinor: '100' }, base[1]] as never)).toThrow('INVALID_MINOR_UNIT_TYPE');
  });
  it('rejects a missing account identifier', () => {
    expect(() => validateJournalLines([{ ...base[0], accountId: undefined }, base[1]] as never)).toThrow('ACCOUNT_REQUIRED');
  });
  it('rejects a null amount', () => {
    expect(() => validateJournalLines([{ ...base[0], creditMinor: null }, base[1]] as never)).toThrow('INVALID_MINOR_UNIT_TYPE');
  });
});

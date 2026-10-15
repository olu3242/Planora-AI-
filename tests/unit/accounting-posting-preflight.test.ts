import { describe, expect, it, vi } from 'vitest';
import { createPrismaJournalPostingRepository } from '../../src/lib/accounting/prisma-posting-adapter';

const lines = [
  { accountId: 'cash', debitMinor: 100n, creditMinor: 0n },
  { accountId: 'revenue', debitMinor: 0n, creditMinor: 100n },
];
const base = {
  organizationId: 'org-a',
  actorId: 'actor-a',
  legalEntityId: 'entity-a',
  fiscalPeriodId: 'period-a',
  sourceKey: 'source-a',
  currencyCode: 'USD',
  lines,
};

describe('posting adapter rejects malformed requests before database access', () => {
  const db = { $transaction: vi.fn(() => { throw new Error('DB_SHOULD_NOT_BE_CALLED'); }) };
  it('rejects an untrusted tenant', async () => {
    await expect(createPrismaJournalPostingRepository(db as never,'actor-a','org-a').postAtomically({...base,organizationId:'org-b'} as never)).rejects.toThrow('UNTRUSTED_POSTING_CONTEXT');
    expect(db.$transaction).not.toHaveBeenCalled();
  });
  it('rejects a missing source key', async () => {
    await expect(createPrismaJournalPostingRepository(db as never,'actor-a','org-a').postAtomically({...base,sourceKey:''} as never)).rejects.toThrow('IDEMPOTENCY_KEY_REQUIRED');
    expect(db.$transaction).not.toHaveBeenCalled();
  });
  it('rejects a non-string source key', async () => {
    await expect(createPrismaJournalPostingRepository(db as never,'actor-a','org-a').postAtomically({...base,sourceKey:null} as never)).rejects.toThrow('IDEMPOTENCY_KEY_REQUIRED');
    expect(db.$transaction).not.toHaveBeenCalled();
  });
  it('rejects an invalid currency', async () => {
    await expect(createPrismaJournalPostingRepository(db as never,'actor-a','org-a').postAtomically({...base,currencyCode:'usd'} as never)).rejects.toThrow('CURRENCY_CODE_INVALID');
    expect(db.$transaction).not.toHaveBeenCalled();
  });
  it('rejects malformed monetary types', async () => {
    await expect(createPrismaJournalPostingRepository(db as never,'actor-a','org-a').postAtomically({...base,lines:[{...lines[0],debitMinor:100.5},lines[1]]} as never)).rejects.toThrow('INVALID_MINOR_UNIT_TYPE');
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});

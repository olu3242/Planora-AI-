import { describe, expect, it } from 'vitest';
import { summarizeJournalBankEvidence } from '../../src/domain/accounting/journal-bank-evidence-summary';

describe('journal bank evidence summary', () => {
  it('deduplicates ids and flags truncated evidence', () => {
    expect(summarizeJournalBankEvidence('journal', ['a','a','b'], 1)).toEqual({
      journalId: 'journal', bankTransactionIds: ['a'], displayedCount: 1, truncated: true,
    });
  });
  it('does not mark complete evidence as truncated', () => {
    expect(summarizeJournalBankEvidence('journal', ['a'], 10).truncated).toBe(false);
  });
  it('rejects invalid limits', () => {
    expect(() => summarizeJournalBankEvidence('journal', [], 0)).toThrow('BANK_EVIDENCE_SUMMARY_INVALID');
  });
});

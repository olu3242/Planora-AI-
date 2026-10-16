import { describe, expect, it } from 'vitest';
import { journalEvidenceDisplay } from '../../src/domain/accounting/journal-evidence-display';
describe('journal evidence display', () => {
  it('shows the total independently of visible evidence', () => {
    expect(journalEvidenceDisplay('line','journal',15,['a','b'])).toEqual({lineId:'line',journalId:'journal',totalCount:15,visibleIds:['a','b'],moreAvailable:true});
  });
  it('marks a complete list', () => {
    expect(journalEvidenceDisplay('line','journal',1,['a']).moreAvailable).toBe(false);
  });
  it('rejects impossible totals', () => {
    expect(() => journalEvidenceDisplay('line','journal',0,['a'])).toThrow('JOURNAL_EVIDENCE_DISPLAY_INVALID');
  });
});

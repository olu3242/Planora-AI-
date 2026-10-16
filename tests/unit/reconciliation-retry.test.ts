import { describe, expect, it } from 'vitest';
import { canReturnExistingMatch } from '../../src/domain/accounting/reconciliation-retry';
const valid = { authorized:true, mappingValid:true, bankMatched:true, sameJournal:true };
describe('reconciliation retries',()=>{
 it('allows a fully verified retry',()=>expect(canReturnExistingMatch(valid)).toBe(true));
 it.each(['authorized','mappingValid','bankMatched','sameJournal'] as const)('rejects missing %s',field=>expect(canReturnExistingMatch({...valid,[field]:false})).toBe(false));
});

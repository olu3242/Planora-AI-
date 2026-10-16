import {describe,it,expect} from 'vitest';
import {reconciliationEligible} from '../../src/domain/accounting/reconciliation-eligibility';
const valid={sameTenant:true,sameEntity:true,sameCurrency:true,mappingApproved:true,bankUnmatched:true,journalPosted:true,journalAvailable:true,bankAmount:100n,cashAmount:100n};
describe('reconciliation eligibility',()=>{
 it('accepts exact approved movement',()=>expect(reconciliationEligible(valid)).toBe(true));
 it.each(['sameTenant','sameEntity','sameCurrency','mappingApproved','bankUnmatched','journalPosted','journalAvailable'] as const)('rejects %s false',key=>expect(reconciliationEligible({...valid,[key]:false})).toBe(false));
 it('rejects zero',()=>expect(reconciliationEligible({...valid,bankAmount:0n,cashAmount:0n})).toBe(false));
 it('rejects amount mismatch',()=>expect(reconciliationEligible({...valid,cashAmount:99n})).toBe(false));
});

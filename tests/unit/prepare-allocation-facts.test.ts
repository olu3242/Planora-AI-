import {describe,expect,it} from 'vitest';
import {prepareAllocationFacts} from '../../src/domain/forecast/prepare-allocation-facts';
const evidence={ruleId:'r',sourceIdentifier:'ledger:a',organizationId:'o',legalEntityId:'e',fiscalPeriodId:'p',accountId:'a',currencyCode:'USD',sourceAmountMinor:'101',allocations:[{costCenterId:'c1',amountMinor:'51',allocationKey:'k1'},{costCenterId:'c2',amountMinor:'50',allocationKey:'k2'}]};
describe('allocation fact preparation',()=>{
 it('conserves amount in decimal currency',()=>expect(prepareAllocationFacts(evidence,2).map(f=>f.amount)).toEqual(['0.51','0.50']));
 it('rejects missing allocation amounts',()=>expect(()=>prepareAllocationFacts({...evidence,sourceAmountMinor:'102'},2)).toThrow('ALLOCATION_EVIDENCE_TOTAL_MISMATCH'));
 it('rejects duplicate cost centers',()=>expect(()=>prepareAllocationFacts({...evidence,allocations:[evidence.allocations[0],evidence.allocations[0]]},2)).toThrow('ALLOCATION_EVIDENCE_DUPLICATE'));
});

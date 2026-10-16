import {describe,expect,it} from 'vitest';
import {prepareAllocationPersistence} from '../../src/domain/forecast/prepare-allocation-persistence';
const evidence={ruleId:'r',sourceIdentifier:'ledger:a',organizationId:'o',legalEntityId:'e',fiscalPeriodId:'p',accountId:'a',currencyCode:'USD',sourceAmountMinor:'100',allocations:[{costCenterId:'c',amountMinor:'100',allocationKey:'key'}]};
describe('allocation persistence preparation',()=>{
 it('preserves source lineage',()=>{const [fact]=prepareAllocationPersistence(evidence,2);expect(fact.amount).toBe('1.00');expect(fact.sourceMetadata.origin).toBe('APPROVED_ALLOCATION');expect(fact.sourceMetadata.sourceIdentifier).toBe('ledger:a')});
 it('keeps deterministic grain',()=>expect(prepareAllocationPersistence(evidence,2)[0].grainKey).toBe(prepareAllocationPersistence(evidence,2)[0].grainKey));
});

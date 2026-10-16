import {describe,expect,it} from 'vitest';
import {assertAllocationLineage} from '../../src/domain/forecast/allocation-lineage-validation';
const rows=[{sourceIdentifier:'ledger:a',costCenterId:'c1',amountMinor:51n},{sourceIdentifier:'ledger:a',costCenterId:'c2',amountMinor:50n}];
describe('allocation lineage',()=>{
 it('accepts conserved source amounts',()=>expect(()=>assertAllocationLineage({sourceIdentifier:'ledger:a',sourceAmountMinor:101n,rows})).not.toThrow());
 it('rejects partial allocations',()=>expect(()=>assertAllocationLineage({sourceIdentifier:'ledger:a',sourceAmountMinor:102n,rows})).toThrow('ALLOCATION_LINEAGE_TOTAL_MISMATCH'));
 it('rejects cross-source allocations',()=>expect(()=>assertAllocationLineage({sourceIdentifier:'ledger:b',sourceAmountMinor:101n,rows})).toThrow('ALLOCATION_SOURCE_MISMATCH'));
 it('rejects duplicate cost centers',()=>expect(()=>assertAllocationLineage({sourceIdentifier:'ledger:a',sourceAmountMinor:102n,rows:[rows[0],rows[0]]})).toThrow('ALLOCATION_COST_CENTER_DUPLICATE'));
});

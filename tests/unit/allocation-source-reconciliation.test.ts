import { describe, expect, it } from 'vitest';
import { validateAllocationSource } from '../../src/domain/forecast/allocation-source-reconciliation';
const base={sourceAmountMinor:101n,allocatedAmountMinor:[51n,50n],shares:[{costCenterId:'a',percentage:'50'},{costCenterId:'b',percentage:'50'}],preparedById:'maker',approvedById:'checker'};
describe('allocation source reconciliation',()=>{
 it('accepts exact totals',()=>expect(()=>validateAllocationSource(base)).not.toThrow());
 it('rejects mismatch',()=>expect(()=>validateAllocationSource({...base,allocatedAmountMinor:[50n,50n]})).toThrow('ALLOCATION_TOTAL_MISMATCH'));
 it('rejects missing allocation row',()=>expect(()=>validateAllocationSource({...base,allocatedAmountMinor:[101n]})).toThrow('ALLOCATION_ROW_COUNT_MISMATCH'));
});

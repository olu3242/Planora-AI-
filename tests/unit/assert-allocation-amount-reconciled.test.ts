import {describe,expect,it} from 'vitest';
import {assertAllocationAmountReconciled} from '../../src/domain/forecast/assert-allocation-amount-reconciled';
describe('allocation amount reconciliation',()=>{
 it('accepts conserved negative source',()=>expect(()=>assertAllocationAmountReconciled({sourceAmountMinor:-101n,derivedAmounts:['-0.51','-0.50'],minorUnits:2})).not.toThrow());
 it('rejects partial persistence',()=>expect(()=>assertAllocationAmountReconciled({sourceAmountMinor:101n,derivedAmounts:['0.50'],minorUnits:2})).toThrow('ALLOCATION_RECONCILIATION_MISMATCH'));
 it('rejects no derived facts',()=>expect(()=>assertAllocationAmountReconciled({sourceAmountMinor:0n,derivedAmounts:[],minorUnits:2})).toThrow('ALLOCATION_RECONCILIATION_EMPTY'));
});

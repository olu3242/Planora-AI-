import type { AllocationShare } from './approved-allocation-policy';
import { validateApprovedAllocation } from './approved-allocation-policy';
export function validateAllocationSource(input:Readonly<{
 sourceAmountMinor:bigint; allocatedAmountMinor:readonly bigint[];
 shares:readonly AllocationShare[];preparedById:string;approvedById:string;
}>):void{
 validateApprovedAllocation(input.shares,input.preparedById,input.approvedById);
 if(input.allocatedAmountMinor.length!==input.shares.length)throw new Error('ALLOCATION_ROW_COUNT_MISMATCH');
 if(input.allocatedAmountMinor.reduce((a,b)=>a+b,0n)!==input.sourceAmountMinor)throw new Error('ALLOCATION_TOTAL_MISMATCH');
}

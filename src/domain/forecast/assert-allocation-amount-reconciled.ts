import {minorUnitsFromDecimal} from './financial-fact-minor-units';
export function assertAllocationAmountReconciled(input:Readonly<{sourceAmountMinor:bigint;derivedAmounts:readonly string[];minorUnits:number}>):void{
 if(input.derivedAmounts.length===0)throw new Error('ALLOCATION_RECONCILIATION_EMPTY');
 const total=input.derivedAmounts.reduce((sum,amount)=>sum+minorUnitsFromDecimal(amount,input.minorUnits),0n);
 if(total!==input.sourceAmountMinor)throw new Error('ALLOCATION_RECONCILIATION_MISMATCH');
}

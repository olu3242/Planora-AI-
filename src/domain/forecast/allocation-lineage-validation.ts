export type AllocationLineageRow=Readonly<{sourceIdentifier:string;costCenterId:string;amountMinor:bigint}>;
export function assertAllocationLineage(input:Readonly<{sourceIdentifier:string;sourceAmountMinor:bigint;rows:readonly AllocationLineageRow[]}>):void{
 if(!input.sourceIdentifier.trim()||input.rows.length===0)throw new Error('ALLOCATION_LINEAGE_MISSING');
 const centers=new Set<string>();
 let total=0n;
 for(const row of input.rows){
  if(row.sourceIdentifier!==input.sourceIdentifier)throw new Error('ALLOCATION_SOURCE_MISMATCH');
  if(!row.costCenterId.trim()||centers.has(row.costCenterId))throw new Error('ALLOCATION_COST_CENTER_DUPLICATE');
  centers.add(row.costCenterId);
  total+=row.amountMinor;
 }
 if(total!==input.sourceAmountMinor)throw new Error('ALLOCATION_LINEAGE_TOTAL_MISMATCH');
}

import {decimalFromMinorUnits} from './financial-fact-minor-units';
export type AllocationEvidenceRecord=Readonly<{ruleId:string;sourceIdentifier:string;organizationId:string;legalEntityId:string;fiscalPeriodId:string;accountId:string;currencyCode:string;sourceAmountMinor:string;allocations:readonly {costCenterId:string;amountMinor:string;allocationKey:string}[]}>;
/** Prepare deterministic, source-linked financial fact values without writing to the ledger. */
export function prepareAllocationFacts(evidence:AllocationEvidenceRecord,minorUnits:number){
 const total=BigInt(evidence.sourceAmountMinor);
 if(!evidence.allocations.length)throw new Error('ALLOCATION_EVIDENCE_EMPTY');
 const centers=new Set<string>();let sum=0n;
 const facts=evidence.allocations.map(row=>{
  if(centers.has(row.costCenterId)||!row.costCenterId||!row.allocationKey)throw new Error('ALLOCATION_EVIDENCE_DUPLICATE');
  centers.add(row.costCenterId);
  const amount=BigInt(row.amountMinor);sum+=amount;
  return {organizationId:evidence.organizationId,legalEntityId:evidence.legalEntityId,fiscalPeriodId:evidence.fiscalPeriodId,accountId:evidence.accountId,currencyCode:evidence.currencyCode,costCenterId:row.costCenterId,amount:decimalFromMinorUnits(amount,minorUnits),sourceIdentifier:evidence.sourceIdentifier,allocationKey:row.allocationKey,ruleId:evidence.ruleId};
 });
 if(sum!==total)throw new Error('ALLOCATION_EVIDENCE_TOTAL_MISMATCH');
 return facts;
}

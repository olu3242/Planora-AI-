import {allocationFactGrain} from './allocation-fact-grain';
import type {AllocationEvidenceRecord} from './prepare-allocation-facts';
import {prepareAllocationFacts} from './prepare-allocation-facts';
export function prepareAllocationPersistence(evidence:AllocationEvidenceRecord,minorUnits:number){
 return prepareAllocationFacts(evidence,minorUnits).map(row=>({
  ...row,grainKey:allocationFactGrain({ruleId:row.ruleId,allocationKey:row.allocationKey}),
  dimensionKey:JSON.stringify(['cost-center',row.costCenterId]),
  sourceMetadata:{origin:'APPROVED_ALLOCATION',ruleId:row.ruleId,sourceIdentifier:row.sourceIdentifier,sourceAmountMinor:evidence.sourceAmountMinor,allocationKey:row.allocationKey},
 }));
}

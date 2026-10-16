import type { AllocationRuleSnapshot } from './allocation-rule-snapshot';
import { previewApprovedAllocation } from './preview-approved-allocation';
import { assertAllocationLineage } from './allocation-lineage-validation';
export function buildAllocationEvidence(input:Readonly<{
 rule:AllocationRuleSnapshot;organizationId:string;legalEntityId:string;fiscalPeriodId:string;
 accountId:string;currencyCode:string;sourceIdentifier:string;amountMinor:bigint;
}>){
 const rows=previewApprovedAllocation(input);
 assertAllocationLineage({sourceIdentifier:input.sourceIdentifier,sourceAmountMinor:input.amountMinor,rows:rows.map(row=>({sourceIdentifier:input.sourceIdentifier,costCenterId:row.costCenterId,amountMinor:row.amountMinor}))});
 return {ruleId:input.rule.id,sourceIdentifier:input.sourceIdentifier,
  organizationId:input.organizationId,legalEntityId:input.legalEntityId,
  fiscalPeriodId:input.fiscalPeriodId,accountId:input.accountId,currencyCode:input.currencyCode,
  sourceAmountMinor:input.amountMinor.toString(),
  allocations:rows.map(row=>({costCenterId:row.costCenterId,amountMinor:row.amountMinor.toString(),allocationKey:row.allocationKey}))};
}

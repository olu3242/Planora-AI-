import type { AllocationRuleSnapshot } from './allocation-rule-snapshot';
import { previewApprovedAllocation } from './preview-approved-allocation';
export function buildAllocationEvidence(input:Readonly<{
 rule:AllocationRuleSnapshot;organizationId:string;legalEntityId:string;fiscalPeriodId:string;
 accountId:string;currencyCode:string;sourceIdentifier:string;amountMinor:bigint;
}>){
 const rows=previewApprovedAllocation(input);
 return {ruleId:input.rule.id,sourceIdentifier:input.sourceIdentifier,
  organizationId:input.organizationId,legalEntityId:input.legalEntityId,
  fiscalPeriodId:input.fiscalPeriodId,accountId:input.accountId,currencyCode:input.currencyCode,
  sourceAmountMinor:input.amountMinor.toString(),
  allocations:rows.map(row=>({costCenterId:row.costCenterId,amountMinor:row.amountMinor.toString(),allocationKey:row.allocationKey}))};
}

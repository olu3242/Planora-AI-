import { previewCostCenterAllocation } from './cost-center-allocation-preview';
import { assertAllocationRuleScope, type AllocationRuleSnapshot } from './allocation-rule-snapshot';
export function previewApprovedAllocation(input: Readonly<{
 rule: AllocationRuleSnapshot; organizationId: string; legalEntityId: string;
 fiscalPeriodId: string; accountId: string; currencyCode: string;
 sourceIdentifier: string; amountMinor: bigint;
}>) {
 assertAllocationRuleScope(input.rule,input);
 return previewCostCenterAllocation({...input,shares:input.rule.shares,preparedById:input.rule.preparedById,approvedById:input.rule.approvedById!}).map(row=>({...row,ruleId:input.rule.id}));
}

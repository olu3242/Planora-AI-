import { validateAllocationSource } from './allocation-source-reconciliation';
import { previewCostCenterAllocation } from './cost-center-allocation-preview';
import { assertAllocationRuleScope, type AllocationRuleSnapshot } from './allocation-rule-snapshot';
export function previewApprovedAllocation(input: Readonly<{
 rule: AllocationRuleSnapshot; organizationId: string; legalEntityId: string;
 fiscalPeriodId: string; accountId: string; currencyCode: string;
 sourceIdentifier: string; amountMinor: bigint;
}>) {
 assertAllocationRuleScope(input.rule,input);
 const rows=previewCostCenterAllocation({...input,shares:input.rule.shares,preparedById:input.rule.preparedById,approvedById:input.rule.approvedById!});
 validateAllocationSource({sourceAmountMinor:input.amountMinor,allocatedAmountMinor:rows.map(row=>row.amountMinor),shares:input.rule.shares,preparedById:input.rule.preparedById,approvedById:input.rule.approvedById!});
 return rows.map(row=>({...row,ruleId:input.rule.id}));
}

import { validateApprovedAllocation, type AllocationShare } from './approved-allocation-policy';
export type AllocationRuleSnapshot = Readonly<{
 id: string; organizationId: string; legalEntityId: string; fiscalPeriodId: string;
 accountId: string; currencyCode: string; sourceIdentifier: string;
 preparedById: string; approvedById: string | null; status: 'DRAFT' | 'APPROVED' | 'REVOKED';
 shares: readonly AllocationShare[];
}>;
export function assertAllocationRuleScope(rule: AllocationRuleSnapshot, input: Readonly<{
 organizationId: string; legalEntityId: string; fiscalPeriodId: string; accountId: string;
 currencyCode: string; sourceIdentifier: string;
}>): void {
 if (!rule.id || !rule.organizationId || rule.organizationId!==input.organizationId ||
 rule.legalEntityId!==input.legalEntityId || rule.fiscalPeriodId!==input.fiscalPeriodId ||
 rule.accountId!==input.accountId || rule.currencyCode!==input.currencyCode ||
 rule.sourceIdentifier!==input.sourceIdentifier) throw new Error('ALLOCATION_RULE_SCOPE_MISMATCH');
 if(rule.status!=='APPROVED') throw new Error('ALLOCATION_RULE_NOT_APPROVED');
 validateApprovedAllocation(rule.shares,rule.preparedById,rule.approvedById);
}

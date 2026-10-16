import type { AllocationRuleSnapshot } from './allocation-rule-snapshot';
export function assertAllocationRuleApprovalTransition(input: Readonly<{
 rule: AllocationRuleSnapshot; actorId: string; organizationId: string;
}>): void {
 if (input.rule.organizationId !== input.organizationId) throw new Error('ALLOCATION_CROSS_TENANT');
 if (input.rule.status !== 'DRAFT') throw new Error('ALLOCATION_NOT_DRAFT');
 if (!input.actorId || input.actorId === input.rule.preparedById) throw new Error('ALLOCATION_INDEPENDENT_APPROVAL_REQUIRED');
 if (!input.rule.shares.length) throw new Error('ALLOCATION_SHARES_INVALID');
}

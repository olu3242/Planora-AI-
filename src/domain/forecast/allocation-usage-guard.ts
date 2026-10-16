import type { AllocationLifecycle } from './allocation-lifecycle';
export function assertAllocationUsable(input: Readonly<{
 rule: AllocationLifecycle;
 organizationId: string;
}>): void {
 if (input.rule.organizationId !== input.organizationId) throw new Error('ALLOCATION_CROSS_TENANT');
 if (input.rule.status !== 'APPROVED' || !input.rule.approvedById || input.rule.approvedById === input.rule.preparedById) throw new Error('ALLOCATION_NOT_APPROVED');
}

export type AllocationLifecycleStatus = 'DRAFT' | 'APPROVED' | 'REVOKED';
export type AllocationLifecycle = Readonly<{
 organizationId: string; preparedById: string; approvedById: string | null;
 status: AllocationLifecycleStatus;
}>;
export function approveAllocation(current: AllocationLifecycle, actorId: string): AllocationLifecycle {
 if (current.status !== 'DRAFT') throw new Error('ALLOCATION_NOT_DRAFT');
 if (!actorId.trim() || actorId === current.preparedById) throw new Error('ALLOCATION_INDEPENDENT_APPROVAL_REQUIRED');
 return {...current, approvedById:actorId, status:'APPROVED'};
}
export function revokeAllocation(current: AllocationLifecycle, actorId: string): AllocationLifecycle {
 if (current.status !== 'APPROVED' || !actorId.trim()) throw new Error('ALLOCATION_REVOCATION_INVALID');
 return {...current, status:'REVOKED'};
}

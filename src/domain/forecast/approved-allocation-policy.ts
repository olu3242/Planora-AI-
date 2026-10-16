import Decimal from 'decimal.js';
export type AllocationShare = Readonly<{ costCenterId: string; percentage: string }>;
export function validateApprovedAllocation(shares: readonly AllocationShare[], preparedById: string, approvedById: string | null): void {
 if (!approvedById || approvedById === preparedById) throw new Error('ALLOCATION_INDEPENDENT_APPROVAL_REQUIRED');
 if (!shares.length || new Set(shares.map(s => s.costCenterId)).size !== shares.length) throw new Error('ALLOCATION_SHARES_INVALID');
 let total = new Decimal(0);
 for (const share of shares) {
  const value = new Decimal(share.percentage);
  if (!share.costCenterId.trim() || !value.isFinite() || value.lte(0) || value.gt(100)) throw new Error('ALLOCATION_SHARE_INVALID');
  total = total.plus(value);
 }
 if (!total.equals(100)) throw new Error('ALLOCATION_SHARES_NOT_100_PERCENT');
}

import { allocateMinorUnits } from './allocate-minor-units';
import type { AllocationShare } from './approved-allocation-policy';
export type AllocationPreviewInput = Readonly<{
 organizationId: string; legalEntityId: string; fiscalPeriodId: string;
 accountId: string; currencyCode: string; sourceIdentifier: string;
 amountMinor: bigint; shares: readonly AllocationShare[];
 preparedById: string; approvedById: string;
}>;
export function previewCostCenterAllocation(input: AllocationPreviewInput) {
 if (![input.organizationId,input.legalEntityId,input.fiscalPeriodId,input.accountId,input.sourceIdentifier].every(v=>v.trim()) || !/^[A-Z]{3}$/.test(input.currencyCode)) throw new Error('ALLOCATION_SCOPE_INVALID');
 const allocations=allocateMinorUnits(input.amountMinor,input.shares,input.preparedById,input.approvedById);
 return allocations.map(row=>({
  organizationId:input.organizationId,legalEntityId:input.legalEntityId,fiscalPeriodId:input.fiscalPeriodId,
  accountId:input.accountId,currencyCode:input.currencyCode,costCenterId:row.costCenterId,
  amountMinor:row.amountMinor,sourceIdentifier:input.sourceIdentifier,
  allocationKey:JSON.stringify([input.organizationId,input.legalEntityId,input.fiscalPeriodId,input.accountId,input.currencyCode,input.sourceIdentifier,row.costCenterId]),
 }));
}

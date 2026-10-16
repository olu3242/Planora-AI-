import type { Prisma, PrismaClient } from '@prisma/client';
import { withBankMappingTenant } from '@/lib/accounting/bank-mapping-tenant-context';
import { previewApprovedAllocation } from '@/domain/forecast/preview-approved-allocation';
import type { AllocationShare } from '@/domain/forecast/approved-allocation-policy';

export async function previewPersistedForecastAllocation(db:PrismaClient,actor:Readonly<{organizationId:string;actorId:string}>,input:Readonly<{
 ruleId:string;amountMinor:bigint;
}>){
 return withBankMappingTenant(db,actor,async(tx:Prisma.TransactionClient)=>{
  const member=await tx.organizationMembership.findFirst({where:{organizationId:actor.organizationId,userId:actor.actorId,active:true},select:{role:true}});
  if(!member||!['CFO','FPA_DIRECTOR','ANALYST'].includes(member.role))throw new Error('ALLOCATION_PREVIEW_ROLE_DENIED');
  const rule=await tx.forecastAllocationRule.findFirst({where:{id:input.ruleId,organizationId:actor.organizationId,status:'APPROVED'}});
  if(!rule)throw new Error('ALLOCATION_RULE_NOT_APPROVED');
  return previewApprovedAllocation({rule:{id:rule.id,organizationId:rule.organizationId,legalEntityId:rule.legalEntityId,fiscalPeriodId:rule.fiscalPeriodId,accountId:rule.accountId,currencyCode:rule.currencyCode,sourceIdentifier:rule.sourceIdentifier,shares:rule.shares as unknown as AllocationShare[],preparedById:rule.preparedById,approvedById:rule.approvedById,status:'APPROVED'},organizationId:actor.organizationId,legalEntityId:rule.legalEntityId,fiscalPeriodId:rule.fiscalPeriodId,accountId:rule.accountId,currencyCode:rule.currencyCode,sourceIdentifier:rule.sourceIdentifier,amountMinor:input.amountMinor});
 });
}

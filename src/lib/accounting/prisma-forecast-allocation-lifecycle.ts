import type { Prisma, PrismaClient } from '@prisma/client';
import { withBankMappingTenant } from '@/lib/accounting/bank-mapping-tenant-context';
import { validateApprovedAllocation, type AllocationShare } from '@/domain/forecast/approved-allocation-policy';

export type AllocationActor = Readonly<{organizationId:string;actorId:string}>;
async function requireAllocationRole(tx:Prisma.TransactionClient,actor:AllocationActor){
 const membership=await tx.organizationMembership.findFirst({where:{organizationId:actor.organizationId,userId:actor.actorId,active:true},select:{role:true}});
 if(!membership||!['CFO','FPA_DIRECTOR'].includes(membership.role))throw new Error('ALLOCATION_ROLE_DENIED');
}
export async function proposeForecastAllocation(db:PrismaClient,actor:AllocationActor,input:Readonly<{
 legalEntityId:string;fiscalPeriodId:string;accountId:string;currencyCode:string;sourceIdentifier:string;shares:readonly AllocationShare[];
}>){
 if(!input.sourceIdentifier?.trim()||!/^[A-Z]{3}$/.test(input.currencyCode))throw new Error('ALLOCATION_INPUT_INVALID');
 return withBankMappingTenant(db,actor,async tx=>{
  await requireAllocationRole(tx,actor);
  const [entity,period,account,currency,centers]=await Promise.all([
   tx.legalEntity.findFirst({where:{id:input.legalEntityId,organizationId:actor.organizationId,active:true},select:{id:true}}),
   tx.fiscalPeriod.findFirst({where:{id:input.fiscalPeriodId,year:{calendar:{organizationId:actor.organizationId}}},select:{id:true}}),
   tx.account.findFirst({where:{id:input.accountId,organizationId:actor.organizationId,active:true},select:{id:true}}),
   tx.currency.findUnique({where:{code:input.currencyCode},select:{code:true}}),
   tx.costCenter.findMany({where:{organizationId:actor.organizationId,id:{in:input.shares.map(s=>s.costCenterId)},active:true},select:{id:true}}),
  ]);
  if(!entity||!period||!account||!currency||centers.length!==new Set(input.shares.map(s=>s.costCenterId)).size)throw new Error('ALLOCATION_SCOPE_INVALID');
  validateApprovedAllocation(input.shares,actor.actorId,'__preview_checker__');
  const created=await tx.forecastAllocationRule.create({data:{organizationId:actor.organizationId,legalEntityId:entity.id,fiscalPeriodId:period.id,accountId:account.id,currencyCode:currency.code,sourceIdentifier:input.sourceIdentifier,shares:input.shares.map(s=>({costCenterId:s.costCenterId,percentage:s.percentage})),preparedById:actor.actorId}});
  await tx.auditEvent.create({data:{organizationId:actor.organizationId,actorId:actor.actorId,action:'FORECAST_ALLOCATION_PROPOSED',entityType:'ForecastAllocationRule',entityId:created.id,correlationId:created.id,newState:{status:'DRAFT',sourceIdentifier:input.sourceIdentifier}}});
  return {ruleId:created.id};
 });
}

export async function approveForecastAllocation(db:PrismaClient,actor:AllocationActor,ruleId:string){
 return withBankMappingTenant(db,actor,async tx=>{
  await requireAllocationRole(tx,actor);
  const rule=await tx.forecastAllocationRule.findFirst({where:{id:ruleId,organizationId:actor.organizationId,status:'DRAFT'}});
  if(!rule||rule.preparedById===actor.actorId)throw new Error('ALLOCATION_APPROVAL_DENIED');
  const shares=rule.shares as unknown as AllocationShare[];
  if(!Array.isArray(shares))throw new Error('ALLOCATION_SHARES_INVALID');
  validateApprovedAllocation(shares,rule.preparedById,actor.actorId);
  const centers=await tx.costCenter.count({where:{organizationId:actor.organizationId,active:true,id:{in:shares.map(s=>s.costCenterId)}}});
  if(centers!==shares.length)throw new Error('ALLOCATION_COST_CENTER_INVALID');
  const approvedAt=new Date();
  const updated=await tx.forecastAllocationRule.updateMany({where:{id:ruleId,organizationId:actor.organizationId,status:'DRAFT',approvedById:null},data:{status:'APPROVED',approvedById:actor.actorId,approvedAt}});
  if(updated.count!==1)throw new Error('ALLOCATION_APPROVAL_CONFLICT');
  await tx.auditEvent.create({data:{organizationId:actor.organizationId,actorId:actor.actorId,action:'FORECAST_ALLOCATION_APPROVED',entityType:'ForecastAllocationRule',entityId:ruleId,correlationId:ruleId,newState:{status:'APPROVED',approvedById:actor.actorId}}});
  return {ruleId,approvedAt};
 });
}

export async function revokeForecastAllocation(db:PrismaClient,actor:AllocationActor,ruleId:string){
 return withBankMappingTenant(db,actor,async tx=>{
  await requireAllocationRole(tx,actor);
  const revokedAt=new Date();
  const updated=await tx.forecastAllocationRule.updateMany({where:{id:ruleId,organizationId:actor.organizationId,status:'APPROVED'},data:{status:'REVOKED',revokedById:actor.actorId,revokedAt}});
  if(updated.count!==1)throw new Error('ALLOCATION_REVOCATION_CONFLICT');
  await tx.auditEvent.create({data:{organizationId:actor.organizationId,actorId:actor.actorId,action:'FORECAST_ALLOCATION_REVOKED',entityType:'ForecastAllocationRule',entityId:ruleId,correlationId:ruleId,newState:{status:'REVOKED',revokedById:actor.actorId}}});
  return {ruleId,revokedAt};
 });
}

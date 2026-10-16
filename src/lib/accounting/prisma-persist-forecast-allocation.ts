import type {Prisma,PrismaClient} from '@prisma/client';
import type {AllocationShare} from '@/domain/forecast/approved-allocation-policy';
import {withBankMappingTenant} from '@/lib/accounting/bank-mapping-tenant-context';
import {verifyLedgerAllocationSource} from '@/domain/forecast/verify-ledger-allocation-source';
import {buildAllocationEvidence} from '@/domain/forecast/allocation-evidence';
import {prepareAllocationPersistence} from '@/domain/forecast/prepare-allocation-persistence';
import {assertAllocationRetryIdentity} from '@/domain/forecast/allocation-retry-identity';
import {minorUnitsFromDecimal} from '@/domain/forecast/financial-fact-minor-units';
import {assertAllocationAmountReconciled} from '@/domain/forecast/assert-allocation-amount-reconciled';
/** Fail-closed, transaction-scoped materialization of derived FP&A facts. */
export async function persistVerifiedForecastAllocation(db:PrismaClient,actor:Readonly<{organizationId:string;actorId:string}>,ruleId:string){
 return withBankMappingTenant(db,actor,async(tx:Prisma.TransactionClient)=>{
  const membership=await tx.organizationMembership.findFirst({where:{organizationId:actor.organizationId,userId:actor.actorId,active:true},select:{role:true}});
  if(!membership||!['CFO','FPA_DIRECTOR'].includes(membership.role))throw new Error('ALLOCATION_PERSIST_ROLE_DENIED');
  const rule=await tx.forecastAllocationRule.findFirst({where:{id:ruleId,organizationId:actor.organizationId,status:'APPROVED'}});
  if(!rule)throw new Error('ALLOCATION_RULE_NOT_APPROVED');
  const sources=await tx.financialFact.findMany({where:{organizationId:actor.organizationId,legalEntityId:rule.legalEntityId,fiscalPeriodId:rule.fiscalPeriodId,accountId:rule.accountId,currencyCode:rule.currencyCode,sourceIdentifier:rule.sourceIdentifier,scenario:'ACTUAL'},select:{organizationId:true,legalEntityId:true,fiscalPeriodId:true,accountId:true,currencyCode:true,sourceIdentifier:true,costCenterId:true,amount:true,sourceMetadata:true}});
  const ledgerSources=sources.filter(f=>f.costCenterId===null&&f.sourceMetadata&&typeof f.sourceMetadata==='object'&&!Array.isArray(f.sourceMetadata)&&(f.sourceMetadata as Record<string,unknown>).origin==='POSTED_LEDGER');
  if(ledgerSources.length!==1||sources.some(f=>f.costCenterId===null&&f!==ledgerSources[0]))throw new Error('ALLOCATION_LEDGER_SOURCE_CARDINALITY');
  const currency=await tx.currency.findUnique({where:{code:rule.currencyCode},select:{minorUnits:true}});
  if(!currency)throw new Error('ALLOCATION_CURRENCY_MISSING');
  const amountMinor=verifyLedgerAllocationSource({...ledgerSources[0],amount:ledgerSources[0].amount.toFixed()},rule,currency.minorUnits);
  const scope={organizationId:actor.organizationId,legalEntityId:rule.legalEntityId,fiscalPeriodId:rule.fiscalPeriodId,accountId:rule.accountId,currencyCode:rule.currencyCode,sourceIdentifier:rule.sourceIdentifier};
  const evidence=buildAllocationEvidence({...scope,amountMinor,rule:{...scope,id:rule.id,shares:rule.shares as unknown as AllocationShare[],preparedById:rule.preparedById,approvedById:rule.approvedById,status:'APPROVED'}});
  const rows=prepareAllocationPersistence(evidence,currency.minorUnits);
  const existing=await tx.financialFact.findMany({where:{organizationId:actor.organizationId,grainKey:{in:rows.map(row=>row.grainKey)}},select:{grainKey:true,organizationId:true,legalEntityId:true,fiscalPeriodId:true,accountId:true,currencyCode:true,costCenterId:true,sourceIdentifier:true,amount:true,sourceMetadata:true}});
  if(existing.length){
   if(existing.length!==rows.length)throw new Error('ALLOCATION_PARTIAL_PERSISTENCE');
   for(const row of rows){
    const saved=existing.find(f=>f.grainKey===row.grainKey);
    if(saved)assertAllocationRetryIdentity(row,saved);
    const meta=saved?.sourceMetadata;
    if(!saved||minorUnitsFromDecimal(saved.amount.toFixed(),currency.minorUnits)!==minorUnitsFromDecimal(row.amount,currency.minorUnits)||!meta||typeof meta!=='object'||Array.isArray(meta)||(meta as Record<string,unknown>).origin!=='APPROVED_ALLOCATION'||(meta as Record<string,unknown>).ruleId!==rule.id||(meta as Record<string,unknown>).allocationKey!==row.allocationKey||(meta as Record<string,unknown>).sourceIdentifier!==row.sourceIdentifier||(meta as Record<string,unknown>).sourceAmountMinor!==amountMinor.toString())throw new Error('ALLOCATION_PERSISTENCE_CONFLICT');
   }
   assertAllocationAmountReconciled({sourceAmountMinor:amountMinor,derivedAmounts:existing.map(f=>f.amount.toFixed()),minorUnits:currency.minorUnits});
   return {ruleId,created:0,alreadyPresent:rows.length};
  }
  for(const row of rows){
   await tx.financialFact.create({data:{organizationId:actor.organizationId,legalEntityId:row.legalEntityId,fiscalPeriodId:row.fiscalPeriodId,accountId:row.accountId,currencyCode:row.currencyCode,costCenterId:row.costCenterId,scenario:'ACTUAL',amount:row.amount,sourceType:'SYSTEM_CALCULATION',sourceIdentifier:row.sourceIdentifier,sourceMetadata:row.sourceMetadata,grainKey:row.grainKey,dimensionKey:row.dimensionKey}});
  }
  await tx.auditEvent.create({data:{organizationId:actor.organizationId,actorId:actor.actorId,action:'FORECAST_ALLOCATION_MATERIALIZED',entityType:'ForecastAllocationRule',entityId:ruleId,correlationId:ruleId,newState:{factCount:rows.length,sourceIdentifier:rule.sourceIdentifier,sourceAmountMinor:amountMinor.toString()}}});
  return {ruleId,created:rows.length,alreadyPresent:0};
 });
}

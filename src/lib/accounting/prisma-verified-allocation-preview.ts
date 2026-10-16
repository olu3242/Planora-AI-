import type {Prisma,PrismaClient} from '@prisma/client';
import type {AllocationShare} from '@/domain/forecast/approved-allocation-policy';
import {withBankMappingTenant} from '@/lib/accounting/bank-mapping-tenant-context';
import {verifyLedgerAllocationSource} from '@/domain/forecast/verify-ledger-allocation-source';
import {buildAllocationEvidence} from '@/domain/forecast/allocation-evidence';
import {prepareAllocationFacts} from '@/domain/forecast/prepare-allocation-facts';
/** Read-only preview derived from a verified posted-ledger source, not caller-provided amounts. */
export async function previewVerifiedAllocationFacts(db:PrismaClient,actor:Readonly<{organizationId:string;actorId:string}>,ruleId:string){
 return withBankMappingTenant(db,actor,async(tx:Prisma.TransactionClient)=>{
  const member=await tx.organizationMembership.findFirst({where:{organizationId:actor.organizationId,userId:actor.actorId,active:true},select:{role:true}});
  if(!member||!['CFO','FPA_DIRECTOR','ANALYST'].includes(member.role))throw new Error('ALLOCATION_PREVIEW_ROLE_DENIED');
  const rule=await tx.forecastAllocationRule.findFirst({where:{id:ruleId,organizationId:actor.organizationId,status:'APPROVED'}});
  if(!rule)throw new Error('ALLOCATION_RULE_NOT_APPROVED');
  const sources=await tx.financialFact.findMany({where:{organizationId:actor.organizationId,legalEntityId:rule.legalEntityId,fiscalPeriodId:rule.fiscalPeriodId,accountId:rule.accountId,currencyCode:rule.currencyCode,sourceIdentifier:rule.sourceIdentifier,scenario:'ACTUAL'},select:{organizationId:true,legalEntityId:true,fiscalPeriodId:true,accountId:true,currencyCode:true,sourceIdentifier:true,costCenterId:true,amount:true,sourceMetadata:true}});
  if(sources.length!==1)throw new Error('ALLOCATION_LEDGER_SOURCE_CARDINALITY');
  const currency=await tx.currency.findUnique({where:{code:rule.currencyCode},select:{minorUnits:true}});
  if(!currency)throw new Error('ALLOCATION_CURRENCY_MISSING');
  const amountMinor=verifyLedgerAllocationSource({...sources[0],amount:sources[0].amount.toFixed()},rule,currency.minorUnits);
  const scope={organizationId:actor.organizationId,legalEntityId:rule.legalEntityId,fiscalPeriodId:rule.fiscalPeriodId,accountId:rule.accountId,currencyCode:rule.currencyCode,sourceIdentifier:rule.sourceIdentifier};
  const evidence=buildAllocationEvidence({...scope,amountMinor,rule:{...scope,id:rule.id,shares:rule.shares as unknown as AllocationShare[],preparedById:rule.preparedById,approvedById:rule.approvedById,status:'APPROVED'}});
  return {evidence,facts:prepareAllocationFacts(evidence,currency.minorUnits)};
 });
}

import type { Prisma, PrismaClient } from '@prisma/client';
import { withBankMappingTenant } from '@/lib/accounting/bank-mapping-tenant-context';
import { verifyLedgerAllocationSource } from '@/domain/forecast/verify-ledger-allocation-source';
export async function verifyPersistedAllocationSource(db:PrismaClient,actor:Readonly<{organizationId:string;actorId:string}>,ruleId:string){
 return withBankMappingTenant(db,actor,async(tx:Prisma.TransactionClient)=>{
  const member=await tx.organizationMembership.findFirst({where:{organizationId:actor.organizationId,userId:actor.actorId,active:true},select:{role:true}});
  if(!member||!['CFO','FPA_DIRECTOR','ANALYST'].includes(member.role))throw new Error('ALLOCATION_SOURCE_ROLE_DENIED');
  const rule=await tx.forecastAllocationRule.findFirst({where:{id:ruleId,organizationId:actor.organizationId,status:'APPROVED'}});
  if(!rule)throw new Error('ALLOCATION_RULE_NOT_APPROVED');
  const facts=await tx.financialFact.findMany({where:{organizationId:actor.organizationId,legalEntityId:rule.legalEntityId,fiscalPeriodId:rule.fiscalPeriodId,accountId:rule.accountId,currencyCode:rule.currencyCode,scenario:'ACTUAL',sourceIdentifier:rule.sourceIdentifier},select:{organizationId:true,legalEntityId:true,fiscalPeriodId:true,accountId:true,currencyCode:true,sourceIdentifier:true,costCenterId:true,amount:true,sourceMetadata:true}});
  if(facts.length!==1)throw new Error('ALLOCATION_LEDGER_SOURCE_CARDINALITY');
  const currency=await tx.currency.findUnique({where:{code:rule.currencyCode},select:{minorUnits:true}});
  if(!currency)throw new Error('ALLOCATION_CURRENCY_MISSING');
  const amountMinor=verifyLedgerAllocationSource({...facts[0],amount:facts[0].amount.toFixed()},rule,currency.minorUnits);
  return {ruleId:rule.id,sourceIdentifier:rule.sourceIdentifier,amountMinor:amountMinor.toString(),minorUnits:currency.minorUnits};
 });
}

import "server-only";
import { FinancialScenario, FinancialSourceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { projectActualCandidates } from "@/domain/accounting/fpa-bridge";

export async function syncLedgerActuals(input:Readonly<{
 organizationId:string; legalEntityId:string; fiscalPeriodId:string; actorId:string; correlationId:string;
}>){
 return prisma.$transaction(async(tx)=>{
  const period=await tx.fiscalPeriod.findFirst({where:{id:input.fiscalPeriodId,year:{calendar:{organizationId:input.organizationId}}},select:{id:true,accountingCloseState:true}});
  if(!period) throw new Error("PERIOD_NOT_IN_TENANT");
  if(period.accountingCloseState!=="HARD_CLOSED") throw new Error("PERIOD_NOT_HARD_CLOSED");
  const entity=await tx.legalEntity.findFirst({where:{id:input.legalEntityId,organizationId:input.organizationId,active:true},select:{id:true}});
  if(!entity) throw new Error("ENTITY_NOT_IN_TENANT");
  const journals=await tx.accountingJournal.findMany({where:{organizationId:input.organizationId,legalEntityId:input.legalEntityId,fiscalPeriodId:input.fiscalPeriodId,status:"POSTED"},select:{currencyCode:true,lines:{select:{accountId:true,debitMinor:true,creditMinor:true,account:{select:{normalBalance:true}}}}}});
  // Reject ledger lines pointing to accounts outside the current tenant.
  const accountIds=[...new Set(journals.flatMap(j=>j.lines.map(l=>l.accountId)))];
  if(accountIds.length){
   const ownedAccounts=await tx.account.count({where:{id:{in:accountIds},organizationId:input.organizationId}});
   if(ownedAccounts!==accountIds.length) throw new Error("LEDGER_ACCOUNT_NOT_IN_TENANT");
  }
  const currencies=[...new Set(journals.map(j=>j.currencyCode))];
  let count=0;
  for(const currency of currencies){
   const currencyRow=await tx.currency.findUnique({where:{code:currency},select:{minorUnits:true}});
   if(!currencyRow) throw new Error("INVALID_ACTUAL_CURRENCY");
   const scoped=journals.filter(j=>j.currencyCode===currency).flatMap(j=>j.lines);
   const candidates=projectActualCandidates(scoped.map(l=>({accountId:l.accountId,debitMinor:l.debitMinor,creditMinor:l.creditMinor,normalBalance:l.account.normalBalance})),{organizationId:input.organizationId,legalEntityId:input.legalEntityId,fiscalPeriodId:input.fiscalPeriodId,currency});
   const divisor=10n**BigInt(currencyRow.minorUnits);
   for(const candidate of candidates){
    const sign=candidate.amountMinor<0n?"-":"";
    const absolute=candidate.amountMinor<0n?-candidate.amountMinor:candidate.amountMinor;
    const whole=absolute/divisor; const fraction=(absolute%divisor).toString().padStart(currencyRow.minorUnits,"0");
    const amount=currencyRow.minorUnits===0?`${sign}${whole}`:`${sign}${whole}.${fraction}`;
    const dimensionKey=`ledger:${input.legalEntityId}:${candidate.accountId}`;
    const grainKey=`${candidate.sourceKey}:ACTUAL`;
    await tx.financialFact.upsert({where:{organizationId_grainKey:{organizationId:input.organizationId,grainKey}},create:{organizationId:input.organizationId,accountId:candidate.accountId,fiscalPeriodId:input.fiscalPeriodId,legalEntityId:input.legalEntityId,scenario:FinancialScenario.ACTUAL,currencyCode:currency,amount,sourceType:FinancialSourceType.SYSTEM_CALCULATION,sourceIdentifier:candidate.sourceKey,sourceMetadata:{correlationId:input.correlationId},dimensionKey,grainKey},update:{amount,sourceMetadata:{correlationId:input.correlationId}}});
    count++;
   }
  }
  await tx.auditEvent.create({data:{organizationId:input.organizationId,actorId:input.actorId,action:"ACCOUNTING.ACTUALS_SYNC",entityType:"FiscalPeriod",entityId:input.fiscalPeriodId,newState:{factCount:count},correlationId:input.correlationId}});
  return {factCount:count};
 });
}

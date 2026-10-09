import "server-only";
import { prisma } from "@/lib/prisma";
import { requireApiSession } from "@/auth/session";
import { createReversalLines } from "@/domain/accounting/reversal";

export async function reverseJournal(journalId:string,reason:string){
 const session=await requireApiSession("financial.write");
 if(!reason.trim()) throw new Error("REVERSAL_REASON_REQUIRED");
 const organizationId=session.organization.id;
 return prisma.$transaction(async tx=>{
  const original=await tx.accountingJournal.findFirst({where:{id:journalId,organizationId,status:"POSTED"},include:{lines:{orderBy:{ordinal:"asc"}}}});
  if(!original) throw new Error("JOURNAL_NOT_FOUND");
  if(original.reversalOfId) throw new Error("REVERSAL_OF_REVERSAL_NOT_ALLOWED");
  const existing=await tx.accountingJournal.findFirst({where:{organizationId,reversalOfId:original.id},select:{id:true}});
  if(existing) return {journalId:existing.id,status:"POSTED" as const,replayed:true};
  const period=await tx.fiscalPeriod.findFirst({where:{id:original.fiscalPeriodId,accountingCloseState:"OPEN",year:{calendar:{organizationId}}},select:{id:true}});
  if(!period) throw new Error("PERIOD_NOT_OPEN");
  const lines=createReversalLines(original.lines.map(l=>({accountId:l.accountId,debitMinor:l.debitMinor,creditMinor:l.creditMinor})));
  const reversal=await tx.accountingJournal.create({data:{organizationId,legalEntityId:original.legalEntityId,fiscalPeriodId:original.fiscalPeriodId,postedById:session.user.id,sourceKey:"reversal:"+original.id,currencyCode:original.currencyCode,description:"Reversal: "+reason.trim(),status:"POSTED",postedAt:new Date(),reversalOfId:original.id,lines:{create:lines.map((line,ordinal)=>({...line,ordinal}))}},select:{id:true}});
  await tx.auditEvent.create({data:{organizationId,actorId:session.user.id,action:"accounting.journal.reverse",entityType:"AccountingJournal",entityId:reversal.id,correlationId:"reversal:"+original.id,metadata:{originalJournalId:original.id,reason:reason.trim()}}});
  return {journalId:reversal.id,status:"POSTED" as const,replayed:false};
 });
}

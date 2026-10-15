import "server-only";
import { prisma } from "@/lib/prisma";
import { assembleCleanBooksScan } from "@/lib/cleanbooks/scan-pipeline";
import { pageCoverage } from "@/lib/cleanbooks/b20-pagination";
import { normalizeBankAmount, normalizeBankDate } from "@/lib/cleanbooks/b32-normalization";
import { validateScanInput } from "@/lib/cleanbooks/b41-validation";
import { cleanBooksPolicy } from "@/lib/cleanbooks/b22-policy";

/** Governed, read-only CleanBooks scan. Requires upstream authenticated actor authorization. */
export async function runCleanBooksScan(input: Readonly<{
 organizationId:string; legalEntityId:string; actorId:string; correlationId:string;
}>) {
 validateScanInput(input);
 const membership = await prisma.organizationMembership.findFirst({
   where:{organizationId:input.organizationId,userId:input.actorId,active:true},
   select:{id:true}
 });
 if (!membership) throw new Error("CLEANBOOKS_FORBIDDEN");
 const entity = await prisma.legalEntity.findFirst({where:{id:input.legalEntityId,organizationId:input.organizationId},select:{id:true}});
 if (!entity) throw new Error("CLEANBOOKS_ENTITY_NOT_FOUND");
 cleanBooksPolicy({activeMember:true,activeEntity:true,canReview:false,killSwitchEnabled:true});
 const accounts = await prisma.bankAccount.findMany({
   where:{organizationId:input.organizationId,legalEntityId:input.legalEntityId,active:true},
   select:{id:true,currencyCode:true,transactions:{take:500,orderBy:{postedDate:"desc"},select:{id:true,postedDate:true,amountMinor:true,reference:true,externalId:true}}}
 });
 const transactions = accounts.flatMap(a=>a.transactions.map(t=>({
   id:t.id,organizationId:input.organizationId,legalEntityId:input.legalEntityId,
   currency:a.currencyCode,amountMinor: normalizeBankAmount(t.amountMinor),bookedAt:normalizeBankDate(t.postedDate),
   description:t.reference ?? "",sourceReference:t.externalId,sourceAccountId:a.id,accountId:null
 })));
 const coverage = pageCoverage(accounts.map(a=>({accountId:a.id,count:a.transactions.length,limit:500,hasMore:a.transactions.length===500})));
 const scan = assembleCleanBooksScan(transactions,{organizationId:input.organizationId,legalEntityId:input.legalEntityId},coverage.complete);
 return {...scan.profile,duplicates:scan.duplicates,dashboard:scan.dashboard,source:"BANK_TRANSACTIONS",correlationId:input.correlationId,
   coverage:{bankAccounts:accounts.length,transactionsFetched:transactions.length,perAccountLimit:500,complete:coverage.complete,truncatedAccountIds:coverage.truncatedAccountIds},
   decision:"REVIEW_REQUIRED" as const};
}

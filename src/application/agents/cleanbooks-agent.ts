import "server-only";
import { prisma } from "@/lib/prisma";
import { findDuplicateCandidates } from "@/lib/cleanbooks/duplicate-candidates";
import { summarizeCleanBooks } from "@/lib/cleanbooks/dashboard";
import { profileTransactions } from "@/lib/cleanbooks/profile-transactions";

/** Governed, read-only CleanBooks scan. Requires upstream authenticated actor authorization. */
export async function runCleanBooksScan(input: Readonly<{
 organizationId:string; legalEntityId:string; actorId:string; correlationId:string;
}>) {
 if (!input.organizationId || !input.legalEntityId || !input.actorId || !input.correlationId) throw new Error("CLEANBOOKS_SCOPE_REQUIRED");
 const membership = await prisma.organizationMembership.findFirst({
   where:{organizationId:input.organizationId,userId:input.actorId,active:true},
   select:{id:true}
 });
 if (!membership) throw new Error("CLEANBOOKS_FORBIDDEN");
 const entity = await prisma.legalEntity.findFirst({where:{id:input.legalEntityId,organizationId:input.organizationId},select:{id:true}});
 if (!entity) throw new Error("CLEANBOOKS_ENTITY_NOT_FOUND");
 const accounts = await prisma.bankAccount.findMany({
   where:{organizationId:input.organizationId,legalEntityId:input.legalEntityId,active:true},
   select:{id:true,currencyCode:true,transactions:{take:500,orderBy:{postedDate:"desc"},select:{id:true,postedDate:true,amountMinor:true,reference:true,externalId:true}}}
 });
 const transactions = accounts.flatMap(a=>a.transactions.map(t=>({
   id:t.id,organizationId:input.organizationId,legalEntityId:input.legalEntityId,
   currency:a.currencyCode,amountMinor: Number(t.amountMinor),bookedAt:t.postedDate.toISOString().slice(0,10),
   description:t.reference ?? "",sourceReference:t.externalId,sourceAccountId:a.id,accountId:null
 })));
 if (accounts.some(a=>a.transactions.some(t=>t.amountMinor > BigInt(Number.MAX_SAFE_INTEGER) || t.amountMinor < BigInt(Number.MIN_SAFE_INTEGER)))) throw new Error("CLEANBOOKS_AMOUNT_OUT_OF_RANGE");
 const duplicates = findDuplicateCandidates(transactions,{organizationId:input.organizationId,legalEntityId:input.legalEntityId});
 const result = profileTransactions(transactions,{organizationId:input.organizationId,legalEntityId:input.legalEntityId});
 const truncatedAccountIds = accounts.filter(a=>a.transactions.length===500).map(a=>a.id);
 const dashboard = summarizeCleanBooks({
   scanned:result.scanned,
   profileExceptions:result.exceptions.length,
   duplicateCandidates:duplicates.length,
   suspenseItems:0,
   reconciliationUnmatched:0,
   overdueItems:0,
   integrityExceptions:0,
   coverageComplete:truncatedAccountIds.length===0
 });
 return {...result,duplicates,dashboard,source:"BANK_TRANSACTIONS",correlationId:input.correlationId,
   coverage:{bankAccounts:accounts.length,transactionsFetched:transactions.length,perAccountLimit:500,complete:truncatedAccountIds.length===0,truncatedAccountIds},
   decision:"REVIEW_REQUIRED" as const};
}

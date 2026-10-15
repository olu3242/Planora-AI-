import "server-only";
import { prisma } from "@/lib/prisma";
import { assembleCleanBooksScan } from "@/lib/cleanbooks/scan-pipeline";
import { pageCoverage } from "@/lib/cleanbooks/b20-pagination";
import { enforceScanBudget } from "@/lib/cleanbooks/b51-scan-budget";
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
 const entity = await prisma.legalEntity.findFirst({where:{id:input.legalEntityId,organizationId:input.organizationId,active:true},select:{id:true}});
 if (!entity) throw new Error("CLEANBOOKS_ENTITY_NOT_FOUND");
 cleanBooksPolicy({activeMember:true,activeEntity:true,canReview:false,killSwitchEnabled:true});
 const accounts = await prisma.bankAccount.findMany({
   where:{organizationId:input.organizationId,legalEntityId:input.legalEntityId,active:true},
   select:{id:true,currencyCode:true},orderBy:{id:"asc"},take:101
 });
 enforceScanBudget({accounts:accounts.length,rows:0,maxAccounts:100,maxRows:20000});
 const transactions: import("@/lib/cleanbooks/profile-transactions").CleanupTransaction[] = [];
 const pages: {accountId:string;count:number;limit:number;hasMore:boolean}[] = [];
 for (const account of accounts) {
   let cursor: string | undefined;
   let count = 0;
   let hasMore = false;
   do {
     const remaining = 20000 - transactions.length;
     if (remaining <= 0) { hasMore = true; break; }
     const limit = Math.min(500,remaining);
     const batch = await prisma.bankTransaction.findMany({
       where:{bankAccountId:account.id},
       orderBy:{id:"asc"},
       take:limit+1,
       ...(cursor?{cursor:{id:cursor},skip:1}:{}),
       select:{id:true,postedDate:true,amountMinor:true,reference:true,externalId:true}
     });
     const current = batch.slice(0,limit);
     transactions.push(...current.map(t=>({
       id:t.id,organizationId:input.organizationId,legalEntityId:input.legalEntityId,
       currency:account.currencyCode,amountMinor:normalizeBankAmount(t.amountMinor),
       bookedAt:normalizeBankDate(t.postedDate),description:t.reference ?? "",
       sourceReference:t.externalId,sourceAccountId:account.id,accountId:null
     })));
     count+=current.length;
     hasMore=batch.length>limit;
     cursor=current.at(-1)?.id;
   } while(hasMore && transactions.length<20000);
   pages.push({accountId:account.id,count,limit:20000,hasMore});
 }
 const coverage = pageCoverage(pages);
 const scan = assembleCleanBooksScan(transactions,{organizationId:input.organizationId,legalEntityId:input.legalEntityId},coverage.complete);
 return {...scan.profile,duplicates:scan.duplicates,dashboard:scan.dashboard,source:"BANK_TRANSACTIONS",correlationId:input.correlationId,
   coverage:{bankAccounts:accounts.length,transactionsFetched:transactions.length,maxAccounts:100,maxTransactions:20000,complete:coverage.complete,truncatedAccountIds:coverage.truncatedAccountIds},
   decision:"REVIEW_REQUIRED" as const};
}

import "server-only";
import { prisma } from "@/lib/prisma";
import { reconcileExact } from "@/domain/accounting/reconciliation";
export async function previewReconciliation(organizationId:string,bankAccountId:string){
 const account=await prisma.bankAccount.findFirst({where:{id:bankAccountId,organizationId,active:true},select:{legalEntityId:true,currencyCode:true}});
 if(!account) throw new Error("BANK_ACCOUNT_NOT_FOUND");
 const [bank,journals]=await Promise.all([
  prisma.bankTransaction.findMany({where:{bankAccountId,status:"UNMATCHED"},orderBy:{postedDate:"asc"},select:{reference:true,amountMinor:true}}),
  prisma.accountingJournal.findMany({where:{organizationId,legalEntityId:account.legalEntityId,currencyCode:account.currencyCode,status:"POSTED"},select:{sourceKey:true,lines:{select:{debitMinor:true,creditMinor:true}}}})
 ]);
 const ledger=journals.map(j=>({reference:j.sourceKey,amountMinor:j.lines.reduce((n,l)=>n+l.debitMinor-l.creditMinor,0n)}));
 return reconcileExact(bank,ledger);
}
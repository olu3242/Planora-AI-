import "server-only";
import { prisma } from "@/lib/prisma";
export async function previewReconciliation(organizationId:string,bankAccountId:string){
 const account=await prisma.bankAccount.findFirst({where:{id:bankAccountId,organizationId,active:true},select:{legalEntityId:true,currencyCode:true}});
 if(!account) throw new Error("BANK_ACCOUNT_NOT_FOUND");
 // A balanced journal nets to zero across all accounts. It is not a bank
 // movement. Until BankAccount has an approved, persisted cash-ledger mapping,
 // fail closed rather than return a misleading reconciliation preview.
 throw new Error("BANK_LEDGER_MAPPING_REQUIRED");
}

import "server-only";
import { prisma } from "@/lib/prisma";

type Scope=Readonly<{organizationId:string;legalEntityId:string;fiscalPeriodId:string}>;

async function periodEnd(scope:Scope){
 const period=await prisma.fiscalPeriod.findFirst({where:{id:scope.fiscalPeriodId,year:{calendar:{organizationId:scope.organizationId}}},select:{endDate:true}});
 if(!period) throw new Error("PERIOD_NOT_IN_TENANT");
 return period.endDate;
}

export async function validateBankCloseReadiness(scope:Scope){
 const endDate=await periodEnd(scope);
 const unmatched=await prisma.bankTransaction.count({where:{bankAccount:{organizationId:scope.organizationId,legalEntityId:scope.legalEntityId},postedDate:{lte:endDate},status:"UNMATCHED"}});
 if(unmatched>0) throw new Error(`BANK_RECONCILIATION_INCOMPLETE:${unmatched}`);
 return {unmatched};
}

export async function validateApCloseReadiness(scope:Scope){
 const endDate=await periodEnd(scope);
 const bills=await prisma.apBill.findMany({where:{organizationId:scope.organizationId,legalEntityId:scope.legalEntityId,invoiceDate:{lte:endDate},status:{not:"VOID"}},select:{id:true,totalMinor:true,allocations:{select:{amountMinor:true}}}});
 for(const bill of bills){
  if(bill.totalMinor<0n) throw new Error("INVALID_AP_BILL_TOTAL");
  const allocated=bill.allocations.reduce((n,a)=>n+a.amountMinor,0n);
  if(bill.allocations.some(a=>a.amountMinor<0n)||allocated>bill.totalMinor) throw new Error(`AP_OVERALLOCATED:${bill.id}`);
 }
 return {validated:bills.length};
}

export async function validateArCloseReadiness(scope:Scope){
 const endDate=await periodEnd(scope);
 const invoices=await prisma.arInvoice.findMany({where:{organizationId:scope.organizationId,legalEntityId:scope.legalEntityId,invoiceDate:{lte:endDate},status:{not:"VOID"}},select:{id:true,totalMinor:true,allocations:{select:{amountMinor:true}}}});
 for(const invoice of invoices){
  if(invoice.totalMinor<0n) throw new Error("INVALID_AR_INVOICE_TOTAL");
  const allocated=invoice.allocations.reduce((n,a)=>n+a.amountMinor,0n);
  if(invoice.allocations.some(a=>a.amountMinor<0n)||allocated>invoice.totalMinor) throw new Error(`AR_OVERALLOCATED:${invoice.id}`);
 }
 return {validated:invoices.length};
}

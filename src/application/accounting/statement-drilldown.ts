import "server-only";
import { prisma } from "@/lib/prisma";
import { summarizeJournalBankEvidence } from '@/domain/accounting/journal-bank-evidence-summary';

export async function getStatementAccountDrilldown(organizationId:string,input:{legalEntityId:string;fiscalPeriodId:string;accountId:string}){
 const account=await prisma.account.findFirst({where:{id:input.accountId,organizationId},select:{id:true,code:true,name:true,type:true,normalBalance:true,reportingCode:true,statementClass:true,statementSection:true,cashFlowClass:true,systemPurpose:true}});
 if(!account) throw new Error("ACCOUNT_NOT_IN_TENANT");
 const lines=await prisma.accountingJournalLine.findMany({where:{accountId:input.accountId,journal:{organizationId,legalEntityId:input.legalEntityId,fiscalPeriodId:input.fiscalPeriodId,status:"POSTED"}},orderBy:[{journal:{postedAt:"asc"}},{ordinal:"asc"}],select:{id:true,debitMinor:true,creditMinor:true,ordinal:true,journal:{select:{id:true,sourceKey:true,description:true,currencyCode:true,postedAt:true,reversalOfId:true,_count:{select:{matchedBankTransactions:{where:{status:'MATCHED',bankAccount:{organizationId}}}}},matchedBankTransactions:{where:{status:'MATCHED',bankAccount:{organizationId}},select:{id:true},take:10,orderBy:{id:'asc'}}}}}}});
 const evidence = lines.map(line => ({ ...summarizeJournalBankEvidence(line.journal.id, line.journal.matchedBankTransactions.map(item => item.id), 10), totalCount: line.journal._count.matchedBankTransactions, truncated: line.journal._count.matchedBankTransactions > 10 }));
 return {account,lines,evidence,totalDebitMinor:lines.reduce((n,l)=>n+l.debitMinor,0n),totalCreditMinor:lines.reduce((n,l)=>n+l.creditMinor,0n)};
}

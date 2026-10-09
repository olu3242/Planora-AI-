import "server-only";
import { prisma } from "@/lib/prisma";
import { assertTrialBalance, calculateTrialBalance } from "@/domain/accounting/trial-balance";

export async function getTrialBalance(organizationId:string,input:{legalEntityId?:string;fiscalPeriodId?:string}={}){
 const journals=await prisma.accountingJournal.findMany({
  where:{organizationId,status:"POSTED",...(input.legalEntityId?{legalEntityId:input.legalEntityId}:{}),...(input.fiscalPeriodId?{fiscalPeriodId:input.fiscalPeriodId}:{})},
  select:{currencyCode:true,lines:{select:{accountId:true,debitMinor:true,creditMinor:true,account:{select:{code:true,name:true,type:true}}}}}
 });
 const currencies=[...new Set(journals.map(j=>j.currencyCode))];
 if(currencies.length>1) throw new Error("TRIAL_BALANCE_REQUIRES_SINGLE_CURRENCY");
 const lines=journals.flatMap(j=>j.lines);
 const rows=calculateTrialBalance(lines);
 assertTrialBalance(rows);
 const accounts=new Map(lines.map(l=>[l.accountId,l.account]));
 return {currencyCode:currencies[0]??"USD",rows:rows.map(row=>({...row,account:accounts.get(row.accountId)!})),debitMinor:rows.reduce((n,row)=>n+row.debitMinor,0n),creditMinor:rows.reduce((n,row)=>n+row.creditMinor,0n)};
}

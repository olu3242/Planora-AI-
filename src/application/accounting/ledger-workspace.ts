import "server-only";
import { prisma } from "@/lib/prisma";

export async function getLedgerWorkspace(organizationId:string,input:{legalEntityId?:string;fiscalPeriodId?:string}={}){
 const [entities,periods,accounts,journals]=await Promise.all([
  prisma.legalEntity.findMany({where:{organizationId,active:true},orderBy:{code:"asc"},select:{id:true,code:true,name:true}}),
  prisma.fiscalPeriod.findMany({where:{year:{calendar:{organizationId}}},orderBy:[{year:{startDate:"desc"}},{ordinal:"asc"}],take:24,select:{id:true,code:true,name:true,accountingCloseState:true,year:{select:{code:true}}}}),
  prisma.account.findMany({where:{organizationId,active:true},orderBy:{code:"asc"},select:{id:true,code:true,name:true,type:true}}),
  prisma.accountingJournal.findMany({where:{organizationId,...(input.legalEntityId?{legalEntityId:input.legalEntityId}:{}),...(input.fiscalPeriodId?{fiscalPeriodId:input.fiscalPeriodId}:{})},orderBy:{createdAt:"desc"},take:50,select:{id:true,sourceKey:true,description:true,currencyCode:true,status:true,postedAt:true,legalEntity:{select:{code:true,name:true}},fiscalPeriod:{select:{code:true,name:true}},lines:{select:{debitMinor:true,creditMinor:true}}}})
 ]);
 return {entities,periods,accounts,journals:journals.map(j=>({...j,debitMinor:j.lines.reduce((n,l)=>n+l.debitMinor,0n),creditMinor:j.lines.reduce((n,l)=>n+l.creditMinor,0n)}))};
}

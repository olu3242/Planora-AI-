import "server-only";
import { prisma } from "@/lib/prisma";
export async function getBankWorkspace(organizationId:string,legalEntityId?:string){
 const accounts=await prisma.bankAccount.findMany({where:{organizationId,active:true,...(legalEntityId?{legalEntityId}:{})},orderBy:{name:"asc"},select:{id:true,name:true,currencyCode:true,legalEntity:{select:{code:true,name:true}},transactions:{orderBy:{postedDate:"desc"},take:100,select:{id:true,externalId:true,postedDate:true,reference:true,amountMinor:true,status:true,matchedJournalId:true}}}});
 return {accounts,unmatched:accounts.reduce((n,a)=>n+a.transactions.filter(t=>t.status==="UNMATCHED").length,0)};
}
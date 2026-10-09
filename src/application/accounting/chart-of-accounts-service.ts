import "server-only";
import { prisma } from "@/lib/prisma";

export async function getChartOfAccounts(organizationId:string){
 const accounts=await prisma.account.findMany({where:{organizationId,active:true},orderBy:{code:"asc"},select:{id:true,code:true,name:true,type:true,normalBalance:true,parentId:true,statementClass:true,statementSection:true,reportingCode:true,cashFlowClass:true,systemPurpose:true,suspenseAllowed:true,children:{where:{active:true},select:{id:true}}}});
 return accounts.map(a=>({...a,isPostingAccount:a.children.length===0,mappingComplete:a.type==="STATISTICAL"||Boolean(a.statementClass&&a.reportingCode&&a.cashFlowClass)}));
}

import "server-only";
import { prisma } from "@/lib/prisma";

export type CoaMappingCommand={accountId:string;statementClass:"PROFIT_AND_LOSS"|"BALANCE_SHEET"|"STATISTICAL";statementSection:string;reportingCode:string;cashFlowClass:"OPERATING"|"INVESTING"|"FINANCING"|"CASH"|"NOT_APPLICABLE";systemPurpose:"NONE"|"CASH"|"ACCOUNTS_RECEIVABLE"|"ACCOUNTS_PAYABLE"|"RETAINED_EARNINGS"|"SUSPENSE";suspenseAllowed:boolean;correlationId:string};

export async function updateCoaMapping(organizationId:string,actorId:string,command:CoaMappingCommand){
 if(!command.statementSection.trim()||!command.reportingCode.trim()||!command.correlationId.trim()) throw new Error("COA_MAPPING_REQUIRED");
 return prisma.$transaction(async tx=>{
  const current=await tx.account.findFirst({where:{id:command.accountId,organizationId,active:true},select:{id:true,type:true,statementClass:true,statementSection:true,reportingCode:true,cashFlowClass:true,systemPurpose:true,suspenseAllowed:true}});
  if(!current) throw new Error("ACCOUNT_NOT_IN_TENANT");
  if(command.systemPurpose==="SUSPENSE"&&!command.suspenseAllowed) throw new Error("SUSPENSE_ACCOUNT_MUST_ALLOW_SUSPENSE");
  const next=await tx.account.update({where:{id:current.id},data:{statementClass:command.statementClass,statementSection:command.statementSection.trim(),reportingCode:command.reportingCode.trim().toUpperCase(),cashFlowClass:command.cashFlowClass,systemPurpose:command.systemPurpose,suspenseAllowed:command.suspenseAllowed},select:{id:true,statementClass:true,statementSection:true,reportingCode:true,cashFlowClass:true,systemPurpose:true,suspenseAllowed:true}});
  await tx.auditEvent.create({data:{organizationId,actorId,action:"COA_REPORTING_MAPPING_UPDATED",entityType:"Account",entityId:current.id,previousState:current,newState:next,metadata:{governed:true},correlationId:command.correlationId}});
  return next;
 });
}

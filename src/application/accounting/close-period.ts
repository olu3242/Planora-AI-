import "server-only";
import { prisma } from "@/lib/prisma";

export async function closeAccountingPeriod(input: Readonly<{
 organizationId:string; fiscalPeriodId:string; actorId:string; correlationId:string;
}>){
 return prisma.$transaction(async(tx)=>{
  const rows=await tx.$queryRaw<Array<{id:string;accountingCloseState:string}>>`
   SELECT fp."id", fp."accountingCloseState"
   FROM "FiscalPeriod" fp
   JOIN "FiscalYear" fy ON fy."id"=fp."fiscalYearId"
   JOIN "FiscalCalendar" fc ON fc."id"=fy."fiscalCalendarId"
   WHERE fp."id"=${input.fiscalPeriodId}::uuid AND fc."organizationId"=${input.organizationId}::uuid
   FOR UPDATE
  `;
  const period=rows[0];
  if(!period) throw new Error("PERIOD_NOT_IN_TENANT");
  if(period.accountingCloseState==="HARD_CLOSED") return {status:"HARD_CLOSED" as const,alreadyClosed:true};
  await tx.fiscalPeriod.update({where:{id:input.fiscalPeriodId},data:{accountingCloseState:"HARD_CLOSED"}});
  await tx.auditEvent.create({data:{organizationId:input.organizationId,actorId:input.actorId,action:"ACCOUNTING.PERIOD_CLOSE",entityType:"FiscalPeriod",entityId:input.fiscalPeriodId,previousState:{accountingCloseState:period.accountingCloseState},newState:{accountingCloseState:"HARD_CLOSED"},correlationId:input.correlationId}});
  return {status:"HARD_CLOSED" as const,alreadyClosed:false};
 });
}

import "server-only";
import { prisma } from "@/lib/prisma";

export async function acceptedDecisionContext(organizationId:string,types:string[],legalEntityId?:string,fiscalPeriodId?:string){
 const rows=await prisma.agentRecommendation.findMany({where:{organizationId,type:{in:types},status:{in:["ACCEPTED","EDITED"]}},orderBy:{decidedAt:"desc"},take:12,select:{id:true,type:true,summary:true,evidence:true,decisionReason:true,decidedAt:true}});
 return rows.filter(row=>{const evidence=row.evidence as Record<string,unknown>;return (!legalEntityId||evidence.legalEntityId===legalEntityId)&&(!fiscalPeriodId||evidence.fiscalPeriodId===fiscalPeriodId);});
}

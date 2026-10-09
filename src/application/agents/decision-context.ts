import "server-only";
import { prisma } from "@/lib/prisma";

export type DecisionMemoryOptions={legalEntityId?:string;fiscalPeriodId?:string;accountId?:string;before?:Date;take?:number};

export async function acceptedDecisionContext(organizationId:string,types:string[],legalEntityId?:string,fiscalPeriodId?:string){
 return acceptedDecisionMemory(organizationId,types,{legalEntityId,fiscalPeriodId});
}

export async function acceptedDecisionMemory(organizationId:string,types:string[],options:DecisionMemoryOptions={}){
 const rows=await prisma.agentRecommendation.findMany({where:{organizationId,type:{in:types},status:{in:["ACCEPTED","EDITED"]},...(options.before?{decidedAt:{lt:options.before}}:{})},orderBy:{decidedAt:"desc"},take:Math.min(options.take??24,50),select:{id:true,type:true,summary:true,observedFacts:true,evidence:true,decisionReason:true,decidedAt:true,runId:true}});
 const scoped=rows.filter(row=>{const e=row.evidence as Record<string,unknown>;return (!options.legalEntityId||e.legalEntityId===options.legalEntityId)&&(!options.fiscalPeriodId||e.fiscalPeriodId===options.fiscalPeriodId)&&(!options.accountId||e.accountId===options.accountId);});
 const latest=new Map<string,(typeof scoped)[number]>();
 for(const row of scoped){const e=row.evidence as Record<string,unknown>;const key=[row.type,e.legalEntityId??"",e.fiscalPeriodId??"",e.accountId??""].join(":");if(!latest.has(key))latest.set(key,row);}
 return [...latest.values()];
}

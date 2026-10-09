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


export async function pendingRecommendationInbox(organizationId:string,excludeActorId?:string){
 return prisma.agentRecommendation.findMany({where:{organizationId,status:"PENDING",...(excludeActorId?{NOT:{actorId:excludeActorId}}:{})},orderBy:{createdAt:"asc"},take:50,select:{id:true,type:true,summary:true,observedFacts:true,evidence:true,createdAt:true,actorId:true,run:{select:{agentDefinition:{select:{agentId:true,displayName:true}}}}}});
}


export async function decideAgentRecommendation(input:{organizationId:string;actorId:string;recommendationId:string;decision:"ACCEPTED"|"EDITED"|"REJECTED";reason:string;finalContent?:string}){
 if(!input.reason.trim()) throw new Error("DECISION_REASON_REQUIRED");
 return prisma.$transaction(async tx=>{
  const current=await tx.agentRecommendation.findFirst({where:{id:input.recommendationId,organizationId:input.organizationId,status:"PENDING"},select:{id:true,actorId:true,summary:true}});
  if(!current) throw new Error("RECOMMENDATION_NOT_PENDING");
  if(current.actorId===input.actorId) throw new Error("SELF_DECISION_FORBIDDEN");
  if(input.decision==="EDITED"&&!input.finalContent?.trim()) throw new Error("EDITED_CONTENT_REQUIRED");
  const result=await tx.agentRecommendation.update({where:{id:current.id},data:{status:input.decision,decidedById:input.actorId,decidedAt:new Date(),decisionReason:input.reason.trim(),...(input.decision==="EDITED"?{proposedContent:input.finalContent!.trim()}:{})}});
  await tx.agentFeedback.create({data:{recommendationId:current.id,organizationId:input.organizationId,actorId:input.actorId,decision:input.decision,originalContent:current.summary,finalContent:input.decision==="EDITED"?input.finalContent:current.summary,candidateImprovement:{reason:input.reason.trim()},requiresVersionChange:input.decision!=="ACCEPTED"}});
  return result;
 });
}

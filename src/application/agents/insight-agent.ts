import "server-only";
import { prisma } from "@/lib/prisma";

export async function runInsightAgent(input:{organizationId:string;legalEntityId:string;fiscalPeriodId:string;actorId:string;correlationId:string}){
 const def=await prisma.agentDefinition.findUnique({where:{agentId:"planora-forecast-agent"},select:{id:true}});
 if(!def) throw new Error("FORECAST_AGENT_EVIDENCE_UNAVAILABLE");
 const sources=await prisma.agentRecommendation.findMany({where:{organizationId:input.organizationId,type:{in:["ACCOUNTING_CLOSE_READINESS","FORECAST_REFRESH_REVIEW"]}},orderBy:{createdAt:"desc"},take:20,select:{id:true,type:true,evidence:true}});
 const scoped=sources.filter(s=>{const e=s.evidence as Record<string,unknown>;return e.fiscalPeriodId===input.fiscalPeriodId&&e.legalEntityId===input.legalEntityId;});
 const facts=await prisma.financialFact.count({where:{organizationId:input.organizationId,legalEntityId:input.legalEntityId,fiscalPeriodId:input.fiscalPeriodId,scenario:"ACTUAL"}});
 const run=await prisma.agentRun.create({data:{agentDefinitionId:def.id,organizationId:input.organizationId,actorId:input.actorId,trigger:"INSIGHT_REVIEW",task:"Assemble management review evidence",inputReferences:{legalEntityId:input.legalEntityId,fiscalPeriodId:input.fiscalPeriodId},toolTrace:[],evidence:{actualFactCount:facts,sourceRecommendationIds:scoped.map(s=>s.id)},status:"RUNNING"}});
 const rec=await prisma.agentRecommendation.create({data:{runId:run.id,organizationId:input.organizationId,actorId:input.actorId,type:"MANAGEMENT_INSIGHT_REVIEW",summary:"Governed accounting and forecast evidence is ready for management review.",observedFacts:{actualFactCount:facts,sourceRecommendationCount:scoped.length},evidence:{correlationId:input.correlationId,legalEntityId:input.legalEntityId,fiscalPeriodId:input.fiscalPeriodId,sourceRecommendationIds:scoped.map(s=>s.id)},unsupportedClaim:false,status:"PENDING"}});
 await prisma.agentRun.update({where:{id:run.id},data:{status:"SUCCEEDED",completedAt:new Date(),output:{recommendationId:rec.id,decision:"RECOMMEND_MANAGEMENT_REVIEW"}}});
 return {recommendationId:rec.id};
}

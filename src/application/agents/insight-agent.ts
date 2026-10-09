import "server-only";
import { prisma } from "@/lib/prisma";
import { acceptedDecisionMemory } from "@/application/agents/decision-context";

export async function runInsightAgent(input:{organizationId:string;legalEntityId:string;fiscalPeriodId:string;actorId:string;correlationId:string}){
 const def=await prisma.agentDefinition.upsert({where:{agentId:"planora-insight-agent"},create:{agentId:"planora-insight-agent",displayName:"Insight Agent",purpose:"Assemble governed accounting and FP&A evidence for management review.",persona:"Evidence-first management insight analyst",authorityClass:"A1_RECOMMEND",allowedTools:["financial-fact.read","agent-evidence.read","decision-memory.read"],forbiddenActions:["journal.post","period.close","forecast.publish","financial.write"],requiredContext:["organizationId","legalEntityId","fiscalPeriodId"],workflowStates:[],humanApprovalRequired:true,financialWritePermission:false,retryPolicy:{maxAttempts:1},memoryPolicy:{persist:"accepted-decisions-only"},learningPolicy:{humanFeedback:true},failurePolicy:{failClosed:true},auditPolicy:{evidenceRequired:true}},update:{authorityClass:"A1_RECOMMEND",financialWritePermission:false,humanApprovalRequired:true},select:{id:true,killSwitch:true}});
 if(def.killSwitch!=="ENABLED") throw new Error("INSIGHT_AGENT_DISABLED");
 const [sources,memory,facts]=await Promise.all([
  prisma.agentRecommendation.findMany({where:{organizationId:input.organizationId,type:{in:["ACCOUNTING_CLOSE_READINESS","FINANCIAL_STATEMENT_REVIEW","FORECAST_REFRESH_REVIEW"]}},orderBy:{createdAt:"desc"},take:30,select:{id:true,type:true,evidence:true}}),
  acceptedDecisionMemory(input.organizationId,["ACCOUNTING_CLOSE_READINESS","FINANCIAL_STATEMENT_REVIEW","FORECAST_REFRESH_REVIEW","MANAGEMENT_INSIGHT_REVIEW"],{legalEntityId:input.legalEntityId,fiscalPeriodId:input.fiscalPeriodId}),
  prisma.financialFact.count({where:{organizationId:input.organizationId,legalEntityId:input.legalEntityId,fiscalPeriodId:input.fiscalPeriodId,scenario:"ACTUAL"}})
 ]);
 const scoped=sources.filter(s=>{const e=s.evidence as Record<string,unknown>;return e.fiscalPeriodId===input.fiscalPeriodId&&e.legalEntityId===input.legalEntityId;});
 const run=await prisma.agentRun.create({data:{agentDefinitionId:def.id,organizationId:input.organizationId,actorId:input.actorId,trigger:"INSIGHT_REVIEW",task:"Assemble management review evidence",inputReferences:{legalEntityId:input.legalEntityId,fiscalPeriodId:input.fiscalPeriodId},toolTrace:[],evidence:{actualFactCount:facts,sourceRecommendationIds:scoped.map(s=>s.id),memoryPolicy:"accepted-latest-by-scope",memoryRecommendationIds:memory.map(m=>m.id)},status:"RUNNING"}});
 const rec=await prisma.agentRecommendation.create({data:{runId:run.id,organizationId:input.organizationId,actorId:input.actorId,type:"MANAGEMENT_INSIGHT_REVIEW",summary:"Governed accounting, forecast, and accepted decision memory are ready for management review.",observedFacts:{actualFactCount:facts,sourceRecommendationCount:scoped.length,memoryCount:memory.length},evidence:{correlationId:input.correlationId,legalEntityId:input.legalEntityId,fiscalPeriodId:input.fiscalPeriodId,sourceRecommendationIds:scoped.map(s=>s.id),memoryRecommendationIds:memory.map(m=>m.id)},unsupportedClaim:false,status:"PENDING"}});
 await prisma.agentRun.update({where:{id:run.id},data:{status:"SUCCEEDED",completedAt:new Date(),output:{recommendationId:rec.id,decision:"RECOMMEND_MANAGEMENT_REVIEW"}}});
 return {recommendationId:rec.id};
}

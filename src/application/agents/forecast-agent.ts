import "server-only";
import { prisma } from "@/lib/prisma";
import { calculateVariance } from "@/domain/forecast/variance";

export async function runForecastAgent(input:Readonly<{organizationId:string;legalEntityId:string;fiscalPeriodId:string;actorId:string;correlationId:string}>){
 const definition=await prisma.agentDefinition.upsert({where:{agentId:"planora-forecast-agent"},create:{agentId:"planora-forecast-agent",displayName:"Forecast Agent",purpose:"Analyze closed-period actuals against forecast and recommend forecast review.",persona:"Evidence-first FP&A forecast analyst",authorityClass:"ADVISORY",allowedTools:["financial-fact.read","forecast.read","variance.calculate"],forbiddenActions:["forecast.publish","forecast.approve","forecast.lock","forecast.line.write","financial.write"],requiredContext:["organizationId","legalEntityId","fiscalPeriodId"],workflowStates:[],humanApprovalRequired:true,financialWritePermission:false,retryPolicy:{maxAttempts:1},memoryPolicy:{persist:"evidence-only"},learningPolicy:{humanFeedback:true},failurePolicy:{failClosed:true},auditPolicy:{evidenceRequired:true}},update:{financialWritePermission:false,humanApprovalRequired:true,forbiddenActions:["forecast.publish","forecast.approve","forecast.lock","forecast.line.write","financial.write"]},select:{id:true,killSwitch:true}});
 if(definition.killSwitch!=="ENABLED") throw new Error("FORECAST_AGENT_DISABLED");
 const run=await prisma.agentRun.create({data:{agentDefinitionId:definition.id,organizationId:input.organizationId,actorId:input.actorId,trigger:"ACTUALS_SYNC_COMPLETED",task:"Analyze actual-to-forecast variance",inputReferences:{legalEntityId:input.legalEntityId,fiscalPeriodId:input.fiscalPeriodId,correlationId:input.correlationId},toolTrace:[],evidence:{},status:"RUNNING"}});
 try{
  const [actuals,forecastLines]=await Promise.all([
   prisma.financialFact.findMany({where:{organizationId:input.organizationId,legalEntityId:input.legalEntityId,fiscalPeriodId:input.fiscalPeriodId,scenario:"ACTUAL"},select:{accountId:true,amount:true,currencyCode:true}}),
   prisma.forecastLine.findMany({where:{fiscalPeriodId:input.fiscalPeriodId,forecastVersion:{forecast:{organizationId:input.organizationId},status:{in:["DRAFT","REVISION_REQUIRED"]}}},select:{id:true,accountId:true,currentForecast:true,forecastVersionId:true}})
  ]);
  const actualByAccount=new Map(actuals.map(a=>[a.accountId,a]));
  const variances=forecastLines.flatMap(line=>{const actual=actualByAccount.get(line.accountId);if(!actual)return[];const v=calculateVariance(actual.amount.toFixed(),line.currentForecast.toFixed());return[{lineId:line.id,versionId:line.forecastVersionId,accountId:line.accountId,actual:actual.amount.toFixed(),forecast:line.currentForecast.toFixed(),variance:v.amount.toFixed(),variancePct:v.percentage.toFixed()}];});
  const ranked=[...variances].sort((a,b)=>Math.abs(Number(b.variance))-Math.abs(Number(a.variance)));
  const observedFacts={actualFactCount:actuals.length,forecastLineCount:forecastLines.length,varianceCount:variances.length,largestVariances:ranked.slice(0,10)};
  const recommendation=await prisma.agentRecommendation.create({data:{runId:run.id,organizationId:input.organizationId,actorId:input.actorId,type:"FORECAST_REFRESH_REVIEW",summary:"Closed-period actuals were compared with editable forecast lines. Human FP&A review is required before any forecast change or publication.",observedFacts,evidence:{correlationId:input.correlationId,fiscalPeriodId:input.fiscalPeriodId,legalEntityId:input.legalEntityId},unsupportedClaim:false,status:"PENDING"}});
  await prisma.agentRun.update({where:{id:run.id},data:{status:"SUCCEEDED",completedAt:new Date(),output:{recommendationId:recommendation.id,decision:"RECOMMEND_FORECAST_REVIEW"},evidence:observedFacts}});
  return {runId:run.id,recommendationId:recommendation.id};
 }catch(error){await prisma.agentRun.update({where:{id:run.id},data:{status:"FAILED",completedAt:new Date(),errorCode:error instanceof Error?error.message:"FORECAST_AGENT_FAILURE"}});throw error;}
}

import "server-only";
import { prisma } from "@/lib/prisma";

export async function getCoaMappingExceptions(organizationId:string){
 const accounts=await prisma.account.findMany({where:{organizationId,active:true,NOT:{type:"STATISTICAL"}},orderBy:{code:"asc"},select:{id:true,code:true,name:true,type:true,statementClass:true,statementSection:true,reportingCode:true,cashFlowClass:true,systemPurpose:true}});
 return accounts.filter(a=>!a.statementClass||!a.reportingCode||!a.cashFlowClass).map(a=>({accountId:a.id,code:a.code,name:a.name,type:a.type,missing:[!a.statementClass&&"statementClass",!a.reportingCode&&"reportingCode",!a.cashFlowClass&&"cashFlowClass"].filter(Boolean)}));
}

export async function runCoaMappingAgent(input:{organizationId:string;actorId:string;correlationId:string}){
 const definition=await prisma.agentDefinition.upsert({where:{agentId:"planora-coa-mapping-agent"},create:{agentId:"planora-coa-mapping-agent",displayName:"COA Mapping Agent",purpose:"Detect incomplete financial reporting mappings without mutating the chart of accounts.",persona:"Evidence-first chart of accounts controller",authorityClass:"A1_RECOMMEND",allowedTools:["chart-of-accounts.read","mapping.validate"],forbiddenActions:["account.write","journal.post","period.close","financial.write"],requiredContext:["organizationId"],workflowStates:[],humanApprovalRequired:true,financialWritePermission:false,retryPolicy:{maxAttempts:1},memoryPolicy:{persist:"evidence-only"},learningPolicy:{humanFeedback:true},failurePolicy:{failClosed:true},auditPolicy:{evidenceRequired:true}},update:{authorityClass:"A1_RECOMMEND",financialWritePermission:false,humanApprovalRequired:true},select:{id:true,killSwitch:true}});
 if(definition.killSwitch!=="ENABLED") throw new Error("COA_MAPPING_AGENT_DISABLED");
 const exceptions=await getCoaMappingExceptions(input.organizationId);
 const run=await prisma.agentRun.create({data:{agentDefinitionId:definition.id,organizationId:input.organizationId,actorId:input.actorId,trigger:"COA_MAPPING_REVIEW",task:"Detect incomplete statement and cash-flow mappings",inputReferences:{organizationId:input.organizationId},toolTrace:[],evidence:{exceptionCount:exceptions.length},status:"RUNNING"}});
 const rec=await prisma.agentRecommendation.create({data:{runId:run.id,organizationId:input.organizationId,actorId:input.actorId,type:"COA_MAPPING_REVIEW",summary:exceptions.length?exceptions.length+" active COA account(s) require reporting mapping review.":"Active COA reporting mappings are complete.",observedFacts:{exceptionCount:exceptions.length,exceptions},evidence:{correlationId:input.correlationId},unsupportedClaim:false,status:"PENDING"}});
 await prisma.agentRun.update({where:{id:run.id},data:{status:"SUCCEEDED",completedAt:new Date(),output:{recommendationId:rec.id,decision:"RECOMMEND_COA_MAPPING_REVIEW"}}});
 return {recommendationId:rec.id,exceptions};
}

import "server-only";
import { prisma } from "@/lib/prisma";
import { validateBankCloseReadiness, validateApCloseReadiness, validateArCloseReadiness } from "@/application/accounting/close-readiness";
import { assertTrialBalance, calculateTrialBalance } from "@/domain/accounting/trial-balance";

export async function runCloseAgent(input:Readonly<{organizationId:string;legalEntityId:string;fiscalPeriodId:string;actorId:string;correlationId:string}>){
 const definition=await prisma.agentDefinition.upsert({
  where:{agentId:"planora-close-agent"},
  create:{agentId:"planora-close-agent",displayName:"Close Agent",purpose:"Assess accounting close readiness and recommend controller action.",persona:"Evidence-first accounting close analyst",authorityClass:"ADVISORY",allowedTools:["close-readiness.read","trial-balance.read"],forbiddenActions:["period.close","journal.post","financial.write"],requiredContext:["organizationId","legalEntityId","fiscalPeriodId"],workflowStates:[],humanApprovalRequired:true,financialWritePermission:false,retryPolicy:{maxAttempts:1},memoryPolicy:{persist:"evidence-only"},learningPolicy:{humanFeedback:true},failurePolicy:{failClosed:true},auditPolicy:{evidenceRequired:true}},
  update:{financialWritePermission:false,humanApprovalRequired:true,forbiddenActions:["period.close","journal.post","financial.write"]},
  select:{id:true,version:true,killSwitch:true}
 });
 if(definition.killSwitch!=="ENABLED") throw new Error("CLOSE_AGENT_DISABLED");
 const run=await prisma.agentRun.create({data:{agentDefinitionId:definition.id,organizationId:input.organizationId,actorId:input.actorId,trigger:"ACCOUNTING_CLOSE_WORKFLOW",task:"Assess close readiness",inputReferences:{legalEntityId:input.legalEntityId,fiscalPeriodId:input.fiscalPeriodId,correlationId:input.correlationId},toolTrace:[],evidence:{},status:"RUNNING"}});
 try{
  const scope={organizationId:input.organizationId,legalEntityId:input.legalEntityId,fiscalPeriodId:input.fiscalPeriodId};
  const [bank,ap,ar,journals]=await Promise.all([
   validateBankCloseReadiness(scope),validateApCloseReadiness(scope),validateArCloseReadiness(scope),
   prisma.accountingJournal.findMany({where:{...scope,status:"POSTED"},select:{lines:{select:{accountId:true,debitMinor:true,creditMinor:true}}}})
  ]);
  const trialBalance=calculateTrialBalance(journals.flatMap(j=>j.lines)); assertTrialBalance(trialBalance);
  const observedFacts={bankUnmatched:bank.unmatched,apValidated:ap.validated,arValidated:ar.validated,trialBalanceAccounts:trialBalance.length};
  const recommendation=await prisma.agentRecommendation.create({data:{runId:run.id,organizationId:input.organizationId,actorId:input.actorId,type:"ACCOUNTING_CLOSE_READINESS",summary:"Deterministic close prerequisites passed. Controller review is required before hard close.",observedFacts,evidence:{correlationId:input.correlationId,fiscalPeriodId:input.fiscalPeriodId,legalEntityId:input.legalEntityId},unsupportedClaim:false,status:"PENDING"}});
  await prisma.agentRun.update({where:{id:run.id},data:{status:"SUCCEEDED",completedAt:new Date(),output:{recommendationId:recommendation.id,decision:"RECOMMEND_CONTROLLER_REVIEW"},evidence:observedFacts}});
  return {runId:run.id,recommendationId:recommendation.id};
 }catch(error){
  await prisma.agentRun.update({where:{id:run.id},data:{status:"FAILED",completedAt:new Date(),errorCode:error instanceof Error?error.message:"CLOSE_AGENT_FAILURE"}});
  throw error;
 }
}

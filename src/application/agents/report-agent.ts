import "server-only";
import { prisma } from "@/lib/prisma";
import { acceptedDecisionContext } from "@/application/agents/decision-context";

export async function runPlanoraReportAgent(input:{organizationId:string;reportingRunId:string;actorId:string;correlationId:string}){
 const definition=await prisma.agentDefinition.upsert({
  where:{agentId:"planora-report-agent"},
  create:{agentId:"planora-report-agent",displayName:"PLANORA REPORT",purpose:"Orchestrate evidence-grounded financial reporting review without changing accounting figures or exercising human approval authority.",persona:"Evidence-first financial reporting orchestrator",authorityClass:"A2_ASSIST",allowedTools:["reporting-run.read","statement-evidence.read","disclosure-evidence.read","approval-history.read"],forbiddenActions:["journal.post","period.close","financial.write","report.approve","report.publish","report.lock","disclosure.override"],requiredContext:["organizationId","reportingRunId","authenticatedActor"],workflowStates:[],humanApprovalRequired:true,financialWritePermission:false,retryPolicy:{maxAttempts:1},memoryPolicy:{persist:"evidence-only"},learningPolicy:{humanFeedback:true},failurePolicy:{failClosed:true},auditPolicy:{evidenceRequired:true}},
  update:{authorityClass:"A2_ASSIST",allowedTools:["reporting-run.read","statement-evidence.read","disclosure-evidence.read","approval-history.read"],forbiddenActions:["journal.post","period.close","financial.write","report.approve","report.publish","report.lock","disclosure.override"],humanApprovalRequired:true,financialWritePermission:false},
  select:{id:true,killSwitch:true}
 });
 if(definition.killSwitch!=="ENABLED") throw new Error("PLANORA_REPORT_DISABLED");
 const reportingRun=await prisma.reportingRun.findFirst({where:{id:input.reportingRunId,organizationId:input.organizationId},include:{frameworkVersion:true,disclosures:true,approvals:true}});
 if(!reportingRun) throw new Error("REPORTING_RUN_NOT_IN_TENANT");
 const memory=await acceptedDecisionContext(input.organizationId,["PLANORA_REPORT_REVIEW"],reportingRun.legalEntityId,reportingRun.fiscalPeriodId);
 const required=reportingRun.disclosures.filter(d=>d.required);
 const missing=required.filter(d=>!d.satisfied).map(d=>d.requirementCode);
 const reviewed=reportingRun.approvals.some(a=>a.decision==="REVIEWED");
 const approved=reportingRun.approvals.some(a=>a.decision==="APPROVED");
 const observedFacts={reportingRunId:reportingRun.id,status:reportingRun.status,frameworkCode:reportingRun.frameworkVersion.frameworkCode,frameworkVersion:reportingRun.frameworkVersion.version,requiredDisclosures:required.length,missingDisclosures:missing,reviewed,approved,locked:reportingRun.lockedAt!==null,published:reportingRun.publishedAt!==null,memoryPolicy:"accepted-decisions-only",memoryRecommendationIds:memory.map(m=>m.id)};
 const run=await prisma.agentRun.create({data:{agentDefinitionId:definition.id,organizationId:input.organizationId,actorId:input.actorId,trigger:"REPORTING_GOVERNANCE_REVIEW",task:"Assess reporting evidence, disclosure completeness, and approval state",inputReferences:{reportingRunId:reportingRun.id,legalEntityId:reportingRun.legalEntityId,fiscalPeriodId:reportingRun.fiscalPeriodId},toolTrace:[],evidence:observedFacts,status:"RUNNING"}});
 const readyForHumanApproval=missing.length===0&&reviewed&&!approved&&reportingRun.status==="IN_REVIEW";
 const summary=readyForHumanApproval?"Reporting controls and required disclosures are complete and independent review is recorded. CFO approval remains a human-only action.":`Reporting run is not ready for CFO approval. Missing disclosures: ${missing.join(", ")||"none"}; independent review recorded: ${reviewed}.`;
 const rec=await prisma.agentRecommendation.create({data:{runId:run.id,organizationId:input.organizationId,actorId:input.actorId,type:"PLANORA_REPORT_REVIEW",summary,observedFacts,evidence:{correlationId:input.correlationId,reportingRunId:reportingRun.id,legalEntityId:reportingRun.legalEntityId,fiscalPeriodId:reportingRun.fiscalPeriodId,frameworkVersionId:reportingRun.frameworkVersionId},unsupportedClaim:false,status:"PENDING"}});
 await prisma.agentRun.update({where:{id:run.id},data:{status:"SUCCEEDED",completedAt:new Date(),output:{recommendationId:rec.id,decision:readyForHumanApproval?"RECOMMEND_CFO_REVIEW":"RECOMMEND_REMEDIATION"}}});
 return {runId:run.id,recommendationId:rec.id,readyForHumanApproval,missingDisclosures:missing};
}

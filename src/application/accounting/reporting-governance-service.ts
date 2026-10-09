import "server-only";
import type { Prisma, ReportingRun } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { assertPermission } from "@/permissions/permissions";
import { getLedgerFinancialStatements } from "@/application/accounting/financial-statements-service";
import { serializeFinancialStatementEvidence } from "@/domain/accounting/financial-statements";
import { getTrialBalance } from "./trial-balance-service";
import { ledgerSnapshotHash, mapFrameworkDraft, ReportingManifest, verifyCloseEvidence } from "@/domain/accounting/reporting-foundation";
type Actor={id:string};

async function lockRun(tx:Prisma.TransactionClient, organizationId:string, runId:string){
 await tx.$queryRaw`SELECT "id" FROM "ReportingRun" WHERE "id"=${runId}::uuid AND "organizationId"=${organizationId}::uuid FOR UPDATE`;
}
async function assertSnapshot(tx:Prisma.TransactionClient, run:ReportingRun){
 const control=run.controlEvidence as Prisma.JsonObject;
 if(typeof control.ledgerSnapshotHash!=="string") throw new Error("REPORTING_SNAPSHOT_REQUIRED");
 const trial=await getTrialBalance(run.organizationId,{legalEntityId:run.legalEntityId,fiscalPeriodId:run.fiscalPeriodId},tx);
 if(ledgerSnapshotHash(trial.rows)!==control.ledgerSnapshotHash) throw new Error("REPORTING_LEDGER_CHANGED_AFTER_PREPARATION");
 if(control.manifest){
  const draft=mapFrameworkDraft(trial.rows,control.manifest);
  verifyCloseEvidence(trial.rows,draft,control.closeEvidence);
 }
}


async function authorizeActor(organizationId:string,actorId:string,permission:Parameters<typeof assertPermission>[1]){
 const membership=await prisma.organizationMembership.findUnique({where:{userId_organizationId:{userId:actorId,organizationId}}});
 if(!membership?.active) throw new Error("REPORTING_ACTOR_NOT_ACTIVE_IN_TENANT");
 assertPermission(membership.role,permission);
 return membership;
}

export async function prepareReportingRun(input:{organizationId:string;legalEntityId:string;fiscalPeriodId:string;frameworkVersionId:string;actor:Actor;closeEvidence?:unknown}){
 await authorizeActor(input.organizationId,input.actor.id,"reporting.prepare");
 return prisma.$transaction(async tx=>{
  const [framework,period,entity]=await Promise.all([
   tx.reportingFrameworkVersion.findFirst({where:{id:input.frameworkVersionId,organizationId:input.organizationId,active:true}}),
   tx.fiscalPeriod.findFirst({where:{id:input.fiscalPeriodId,year:{calendar:{organizationId:input.organizationId}}}}),
   tx.legalEntity.findFirst({where:{id:input.legalEntityId,organizationId:input.organizationId,active:true}}),
  ]);
  if(!framework) throw new Error("REPORTING_FRAMEWORK_NOT_ACTIVE_IN_TENANT");
  if(!period) throw new Error("REPORTING_PERIOD_NOT_IN_TENANT");
  if(!entity) throw new Error("REPORTING_ENTITY_NOT_IN_TENANT");
  if(framework.effectiveFrom>period.startDate||(framework.effectiveTo&&framework.effectiveTo<period.endDate)) throw new Error("REPORTING_FRAMEWORK_NOT_EFFECTIVE_FOR_PERIOD");
  const manifest=ReportingManifest.parse(framework.ruleManifest);
  if(manifest.policy.framework!==framework.frameworkCode||manifest.policy.version!==framework.version) throw new Error("REPORTING_FRAMEWORK_VERSION_MISMATCH");
  if(new Date(manifest.policy.effectiveFrom)>period.startDate||(manifest.policy.effectiveTo&&new Date(manifest.policy.effectiveTo)<period.endDate)) throw new Error("REPORTING_POLICY_NOT_EFFECTIVE_FOR_PERIOD");
  const statements=await getLedgerFinancialStatements(input.organizationId,input,tx);
  if(!statements.controls.trialBalanceBalanced||!statements.controls.balanceSheetBalanced||!statements.coaControl.mapped) throw new Error("REPORTING_STATEMENT_CONTROLS_FAILED");
  const trial=await getTrialBalance(input.organizationId,input,tx);
  const draft=mapFrameworkDraft(trial.rows,manifest);
  const closeEvidence=input.closeEvidence===undefined?null:verifyCloseEvidence(trial.rows,draft,input.closeEvidence);
  const requirements=Array.isArray(framework.disclosureManifest)?framework.disclosureManifest:[];
  if(!requirements.length||requirements.some(raw=>!raw||typeof raw!=="object"||Array.isArray(raw)||typeof raw.code!=="string"||!raw.code.trim())) throw new Error("REPORTING_DISCLOSURE_MANIFEST_REQUIRED");
  const run=await tx.reportingRun.create({data:{
   organizationId:input.organizationId,legalEntityId:input.legalEntityId,fiscalPeriodId:input.fiscalPeriodId,frameworkVersionId:framework.id,preparedById:input.actor.id,
   statementEvidence:{...serializeFinancialStatementEvidence(statements),frameworkDraft:{...draft,sections:draft.sections.map(s=>({...s,amountMinor:s.amountMinor.toString()}))}},
   controlEvidence:{controls:statements.controls,coaControl:statements.coaControl,ledgerSnapshotHash:ledgerSnapshotHash(trial.rows),manifest,closeEvidence},
  }});
  for(const raw of requirements){const r=raw as {code:string;required?:boolean};await tx.reportingDisclosureEvidence.create({data:{runId:run.id,requirementCode:r.code,required:r.required!==false,satisfied:false,evidence:{}}});}
  await tx.auditEvent.create({data:{organizationId:input.organizationId,actorId:input.actor.id,action:"reporting.run.prepared",entityType:"ReportingRun",entityId:run.id,newState:{status:run.status,frameworkVersionId:framework.id,ledgerSnapshotHash:ledgerSnapshotHash(trial.rows)},correlationId:`reporting:${run.id}:prepare`}});
  return run;
 },{isolationLevel:"Serializable"});
}

export async function recordReportingCloseEvidence(input:{organizationId:string;runId:string;actor:Actor;evidence:unknown}){
 await authorizeActor(input.organizationId,input.actor.id,"reporting.prepare");
 return prisma.$transaction(async tx=>{
  await lockRun(tx,input.organizationId,input.runId);
  const run=await tx.reportingRun.findFirst({where:{id:input.runId,organizationId:input.organizationId,status:"DRAFT",lockedAt:null}});
  if(!run) throw new Error("REPORTING_RUN_NOT_EDITABLE");
  const control=run.controlEvidence as Prisma.JsonObject;
  const trial=await getTrialBalance(input.organizationId,{legalEntityId:run.legalEntityId,fiscalPeriodId:run.fiscalPeriodId},tx);
  if(ledgerSnapshotHash(trial.rows)!==control.ledgerSnapshotHash) throw new Error("REPORTING_LEDGER_CHANGED_AFTER_PREPARATION");
  const evidence=verifyCloseEvidence(trial.rows,mapFrameworkDraft(trial.rows,control.manifest),input.evidence);
  const updated=await tx.reportingRun.update({where:{id:run.id},data:{controlEvidence:{...control,closeEvidence:evidence} as Prisma.InputJsonObject}});
  await tx.auditEvent.create({data:{organizationId:input.organizationId,actorId:input.actor.id,action:"reporting.close.evidence_recorded",entityType:"ReportingRun",entityId:run.id,newState:{ledgerSnapshotHash:control.ledgerSnapshotHash},correlationId:`reporting:${run.id}:close-evidence`}});
  return updated;
 });
}

export async function recordDisclosureEvidence(input:{organizationId:string;runId:string;requirementCode:string;evidence:Prisma.InputJsonObject;actor:Actor}){
 await authorizeActor(input.organizationId,input.actor.id,"reporting.prepare");
 if(!Object.keys(input.evidence).length) throw new Error("DISCLOSURE_EVIDENCE_REQUIRED");
 return prisma.$transaction(async tx=>{
  await lockRun(tx,input.organizationId,input.runId);
  const run=await tx.reportingRun.findFirst({where:{id:input.runId,organizationId:input.organizationId,status:"DRAFT",lockedAt:null}});
  if(!run) throw new Error("REPORTING_RUN_NOT_EDITABLE");
  const updated=await tx.reportingDisclosureEvidence.update({where:{runId_requirementCode:{runId:run.id,requirementCode:input.requirementCode}},data:{satisfied:true,evidence:input.evidence}});
  await tx.auditEvent.create({data:{organizationId:input.organizationId,actorId:input.actor.id,action:"reporting.disclosure.recorded",entityType:"ReportingRun",entityId:run.id,newState:{requirementCode:input.requirementCode,evidence:input.evidence},correlationId:`reporting:${run.id}:disclosure`}});
  return updated;
 });
}

export async function reviewReportingRun(input:{organizationId:string;runId:string;actor:Actor;reason:string}){
 await authorizeActor(input.organizationId,input.actor.id,"reporting.review"); if(!input.reason.trim()) throw new Error("REVIEW_REASON_REQUIRED");
 return prisma.$transaction(async tx=>{
  await lockRun(tx,input.organizationId,input.runId);
  const run=await tx.reportingRun.findFirst({where:{id:input.runId,organizationId:input.organizationId,status:"DRAFT"},include:{disclosures:true}});
  if(!run||run.lockedAt) throw new Error("REPORTING_RUN_NOT_REVIEWABLE");
  if(run.preparedById===input.actor.id) throw new Error("REPORTING_SELF_REVIEW_FORBIDDEN");
  if(run.disclosures.some(d=>d.required&&!d.satisfied)) throw new Error("REPORTING_DISCLOSURES_INCOMPLETE");
  await assertSnapshot(tx,run);
  await tx.reportingApproval.create({data:{runId:run.id,actorId:input.actor.id,decision:"REVIEWED",reason:input.reason.trim(),evidence:{disclosuresComplete:true}}});
  const updated=await tx.reportingRun.update({where:{id:run.id},data:{status:"IN_REVIEW"}});
  await tx.auditEvent.create({data:{organizationId:input.organizationId,actorId:input.actor.id,action:"reporting.run.reviewed",entityType:"ReportingRun",entityId:run.id,previousState:{status:run.status},newState:{status:updated.status},correlationId:`reporting:${run.id}:review`}});
  return updated;
 });
}

export async function approveReportingRun(input:{organizationId:string;runId:string;actor:Actor;reason:string}){
 await authorizeActor(input.organizationId,input.actor.id,"reporting.approve"); if(!input.reason.trim()) throw new Error("APPROVAL_REASON_REQUIRED");
 return prisma.$transaction(async tx=>{
  await lockRun(tx,input.organizationId,input.runId);
  const run=await tx.reportingRun.findFirst({where:{id:input.runId,organizationId:input.organizationId,status:"IN_REVIEW"},include:{approvals:true,disclosures:true}});
  if(!run||run.lockedAt) throw new Error("REPORTING_RUN_NOT_APPROVABLE");
  if(run.preparedById===input.actor.id||run.approvals.some(a=>a.actorId===input.actor.id)) throw new Error("REPORTING_SELF_APPROVAL_FORBIDDEN");
  if(!run.approvals.some(a=>a.decision==="REVIEWED")) throw new Error("REPORTING_REVIEW_REQUIRED");
  if(run.disclosures.some(d=>d.required&&!d.satisfied)) throw new Error("REPORTING_DISCLOSURES_INCOMPLETE");
  await assertSnapshot(tx,run);
  await tx.reportingApproval.create({data:{runId:run.id,actorId:input.actor.id,decision:"APPROVED",reason:input.reason.trim(),evidence:{reviewed:true,disclosuresComplete:true}}});
  const updated=await tx.reportingRun.update({where:{id:run.id},data:{status:"APPROVED",lockedAt:new Date()}});
  await tx.auditEvent.create({data:{organizationId:input.organizationId,actorId:input.actor.id,action:"reporting.run.approved_locked",entityType:"ReportingRun",entityId:run.id,previousState:{status:run.status},newState:{status:updated.status,locked:true},correlationId:`reporting:${run.id}:approve`}});
  return updated;
 });
}

export async function publishReportingRun(input:{organizationId:string;runId:string;actor:Actor}){
 await authorizeActor(input.organizationId,input.actor.id,"reporting.publish");
 return prisma.$transaction(async tx=>{
  await lockRun(tx,input.organizationId,input.runId);
  const run=await tx.reportingRun.findFirst({where:{id:input.runId,organizationId:input.organizationId,status:"APPROVED"}});
  if(!run?.lockedAt) throw new Error("REPORTING_APPROVAL_AND_LOCK_REQUIRED");
  await assertSnapshot(tx,run);
  const updated=await tx.reportingRun.update({where:{id:run.id},data:{status:"PUBLISHED",publishedAt:new Date()}});
  await tx.auditEvent.create({data:{organizationId:input.organizationId,actorId:input.actor.id,action:"reporting.run.published",entityType:"ReportingRun",entityId:run.id,previousState:{status:run.status},newState:{status:updated.status},correlationId:`reporting:${run.id}:publish`}});
  return updated;
 });
}

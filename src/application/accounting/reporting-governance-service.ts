import "server-only";
import { prisma } from "@/lib/prisma";
import { assertPermission } from "@/permissions/permissions";
import { getLedgerFinancialStatements } from "@/application/accounting/financial-statements-service";
type Actor={id:string};

async function authorizeActor(organizationId:string,actorId:string,permission:Parameters<typeof assertPermission>[1]){
 const membership=await prisma.organizationMembership.findUnique({where:{userId_organizationId:{userId:actorId,organizationId}}});
 if(!membership?.active) throw new Error("REPORTING_ACTOR_NOT_ACTIVE_IN_TENANT");
 assertPermission(membership.role,permission);
 return membership;
}

export async function prepareReportingRun(input:{organizationId:string;legalEntityId:string;fiscalPeriodId:string;frameworkVersionId:string;actor:Actor}){
 await authorizeActor(input.organizationId,input.actor.id,"reporting.prepare");
 const framework=await prisma.reportingFrameworkVersion.findFirst({where:{id:input.frameworkVersionId,organizationId:input.organizationId,active:true}});
 if(!framework) throw new Error("REPORTING_FRAMEWORK_NOT_ACTIVE_IN_TENANT");
 const statements=await getLedgerFinancialStatements(input.organizationId,{legalEntityId:input.legalEntityId,fiscalPeriodId:input.fiscalPeriodId});
 if(!statements.controls.trialBalanceBalanced||!statements.controls.balanceSheetBalanced||!statements.coaControl.mapped) throw new Error("REPORTING_STATEMENT_CONTROLS_FAILED");
 const requirements=Array.isArray(framework.disclosureManifest)?framework.disclosureManifest:[];
 return prisma.$transaction(async tx=>{
  const run=await tx.reportingRun.create({data:{organizationId:input.organizationId,legalEntityId:input.legalEntityId,fiscalPeriodId:input.fiscalPeriodId,frameworkVersionId:framework.id,preparedById:input.actor.id,statementEvidence:statements as any,controlEvidence:{controls:statements.controls,coaControl:statements.coaControl}}});
  for(const raw of requirements){const r=raw as any;if(!r?.code) continue;await tx.reportingDisclosureEvidence.create({data:{runId:run.id,requirementCode:String(r.code),required:r.required!==false,satisfied:false,evidence:{}}});}
  return run;
 });
}

export async function recordDisclosureEvidence(input:{organizationId:string;runId:string;requirementCode:string;evidence:Record<string,unknown>;actor:Actor}){
 await authorizeActor(input.organizationId,input.actor.id,"reporting.prepare");
 const run=await prisma.reportingRun.findFirst({where:{id:input.runId,organizationId:input.organizationId,status:"DRAFT"}});
 if(!run||run.lockedAt) throw new Error("REPORTING_RUN_NOT_EDITABLE");
 return prisma.reportingDisclosureEvidence.update({where:{runId_requirementCode:{runId:run.id,requirementCode:input.requirementCode}},data:{satisfied:true,evidence:input.evidence as any}});
}

export async function reviewReportingRun(input:{organizationId:string;runId:string;actor:Actor;reason:string}){
 await authorizeActor(input.organizationId,input.actor.id,"reporting.review"); if(!input.reason.trim()) throw new Error("REVIEW_REASON_REQUIRED");
 return prisma.$transaction(async tx=>{
  const run=await tx.reportingRun.findFirst({where:{id:input.runId,organizationId:input.organizationId,status:"DRAFT"},include:{disclosures:true}});
  if(!run||run.lockedAt) throw new Error("REPORTING_RUN_NOT_REVIEWABLE");
  if(run.preparedById===input.actor.id) throw new Error("REPORTING_SELF_REVIEW_FORBIDDEN");
  if(run.disclosures.some(d=>d.required&&!d.satisfied)) throw new Error("REPORTING_DISCLOSURES_INCOMPLETE");
  await tx.reportingApproval.create({data:{runId:run.id,actorId:input.actor.id,decision:"REVIEWED",reason:input.reason.trim(),evidence:{disclosuresComplete:true}}});
  return tx.reportingRun.update({where:{id:run.id},data:{status:"IN_REVIEW"}});
 });
}

export async function approveReportingRun(input:{organizationId:string;runId:string;actor:Actor;reason:string}){
 await authorizeActor(input.organizationId,input.actor.id,"reporting.approve"); if(!input.reason.trim()) throw new Error("APPROVAL_REASON_REQUIRED");
 return prisma.$transaction(async tx=>{
  const run=await tx.reportingRun.findFirst({where:{id:input.runId,organizationId:input.organizationId,status:"IN_REVIEW"},include:{approvals:true,disclosures:true}});
  if(!run||run.lockedAt) throw new Error("REPORTING_RUN_NOT_APPROVABLE");
  if(run.preparedById===input.actor.id||run.approvals.some(a=>a.actorId===input.actor.id)) throw new Error("REPORTING_SELF_APPROVAL_FORBIDDEN");
  if(!run.approvals.some(a=>a.decision==="REVIEWED")) throw new Error("REPORTING_REVIEW_REQUIRED");
  if(run.disclosures.some(d=>d.required&&!d.satisfied)) throw new Error("REPORTING_DISCLOSURES_INCOMPLETE");
  await tx.reportingApproval.create({data:{runId:run.id,actorId:input.actor.id,decision:"APPROVED",reason:input.reason.trim(),evidence:{reviewed:true,disclosuresComplete:true}}});
  return tx.reportingRun.update({where:{id:run.id},data:{status:"APPROVED",lockedAt:new Date()}});
 });
}

export async function publishReportingRun(input:{organizationId:string;runId:string;actor:Actor}){
 await authorizeActor(input.organizationId,input.actor.id,"reporting.publish");
 const run=await prisma.reportingRun.findFirst({where:{id:input.runId,organizationId:input.organizationId,status:"APPROVED"}});
 if(!run?.lockedAt) throw new Error("REPORTING_APPROVAL_AND_LOCK_REQUIRED");
 return prisma.reportingRun.update({where:{id:run.id},data:{status:"PUBLISHED",publishedAt:new Date()}});
}

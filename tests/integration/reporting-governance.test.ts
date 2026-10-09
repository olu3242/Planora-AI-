import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { approveReportingRun, publishReportingRun, reviewReportingRun } from "@/application/accounting/reporting-governance-service";

import { getTrialBalance } from "@/application/accounting/trial-balance-service";
import { ledgerSnapshotHash } from "@/domain/accounting/reporting-foundation";
const prisma=new PrismaClient();
afterAll(()=>prisma.$disconnect());

async function fixture(preparer: "analyst" | "director" = "analyst"){
 const org=await prisma.organization.findUniqueOrThrow({where:{code:"NORTHSTAR"}});
 const other=await prisma.organization.findUniqueOrThrow({where:{code:"HORIZON"}});
 const analyst=await prisma.user.findUniqueOrThrow({where:{email:"analyst@planora.local"}});
 const director=await prisma.user.findUniqueOrThrow({where:{email:"director@planora.local"}});
 const cfo=await prisma.user.findUniqueOrThrow({where:{email:"cfo@planora.local"}});
 const entity=await prisma.legalEntity.findFirstOrThrow({where:{organizationId:org.id}});
 const period=await prisma.fiscalPeriod.findFirstOrThrow({where:{year:{calendar:{organizationId:org.id}}}});
 const version=randomUUID();
 const framework=await prisma.reportingFrameworkVersion.upsert({where:{organizationId_frameworkCode_version:{organizationId:org.id,frameworkCode:"US_GAAP",version}},update:{active:true},create:{organizationId:org.id,frameworkCode:"US_GAAP",version,effectiveFrom:new Date("2026-01-01"),ruleManifest:{},disclosureManifest:[{code:"POLICIES",required:true}]}});
 // Preserve immutable reports; each fixture has a unique framework version.
 const trial=await getTrialBalance(org.id,{legalEntityId:entity.id,fiscalPeriodId:period.id});
 const run=await prisma.reportingRun.create({data:{organizationId:org.id,legalEntityId:entity.id,fiscalPeriodId:period.id,frameworkVersionId:framework.id,preparedById:preparer==="director"?director.id:analyst.id,statementEvidence:{source:"test"},controlEvidence:{balanced:true,ledgerSnapshotHash:ledgerSnapshotHash(trial.rows)},disclosures:{create:{requirementCode:"POLICIES",required:true,satisfied:false,evidence:{}}}}});
 return {org,other,analyst,director,cfo,run};
}

describe("reporting governance persistence",()=>{
 it("serializes competing reviews and preserves one approval event",async()=>{
  const x=await fixture();
  await prisma.reportingDisclosureEvidence.updateMany({where:{runId:x.run.id},data:{satisfied:true,evidence:{ref:"note"}}});
  const results=await Promise.allSettled([
   reviewReportingRun({organizationId:x.org.id,runId:x.run.id,actor:x.director,reason:"first"}),
   reviewReportingRun({organizationId:x.org.id,runId:x.run.id,actor:x.cfo,reason:"second"}),
  ]);
  expect(results.filter(r=>r.status==="fulfilled")).toHaveLength(1);
  expect(await prisma.reportingApproval.count({where:{runId:x.run.id}})).toBe(1);
 });
 it("denies review when the prepared ledger snapshot no longer matches",async()=>{
  const x=await fixture();
  await prisma.reportingRun.update({where:{id:x.run.id},data:{controlEvidence:{ledgerSnapshotHash:"outdated"}}});
  await prisma.reportingDisclosureEvidence.updateMany({where:{runId:x.run.id},data:{satisfied:true,evidence:{ref:"note"}}});
  await expect(reviewReportingRun({organizationId:x.org.id,runId:x.run.id,actor:x.director,reason:"review"})).rejects.toThrow("REPORTING_LEDGER_CHANGED_AFTER_PREPARATION");
  expect(await prisma.reportingApproval.count({where:{runId:x.run.id}})).toBe(0);
 });
 it("denies self-approval to a CFO who performed the review",async()=>{
  const x=await fixture();
  await prisma.reportingDisclosureEvidence.updateMany({where:{runId:x.run.id},data:{satisfied:true,evidence:{ref:"note"}}});
  await reviewReportingRun({organizationId:x.org.id,runId:x.run.id,actor:x.cfo,reason:"reviewed"});
  await expect(approveReportingRun({organizationId:x.org.id,runId:x.run.id,actor:x.cfo,reason:"approve"})).rejects.toThrow("REPORTING_SELF_APPROVAL_FORBIDDEN");
 });

 it("blocks cross-tenant review",async()=>{const x=await fixture();await expect(reviewReportingRun({organizationId:x.other.id,runId:x.run.id,actor:{id:x.director.id},reason:"review"})).rejects.toThrow("REPORTING_ACTOR_NOT_ACTIVE_IN_TENANT");});
 it("blocks review while required disclosures are incomplete",async()=>{const x=await fixture();await expect(reviewReportingRun({organizationId:x.org.id,runId:x.run.id,actor:{id:x.director.id},reason:"review"})).rejects.toThrow("REPORTING_DISCLOSURES_INCOMPLETE");});
 it("blocks preparer self-review even with a review-capable role",async()=>{const x=await fixture("director");await prisma.reportingDisclosureEvidence.updateMany({where:{runId:x.run.id},data:{satisfied:true,evidence:{ref:"note"}}});await expect(reviewReportingRun({organizationId:x.org.id,runId:x.run.id,actor:{id:x.director.id},reason:"review"})).rejects.toThrow("REPORTING_SELF_REVIEW_FORBIDDEN");});
 it("blocks publication before approval and lock",async()=>{const x=await fixture();await expect(publishReportingRun({organizationId:x.org.id,runId:x.run.id,actor:{id:x.cfo.id}})).rejects.toThrow("REPORTING_APPROVAL_AND_LOCK_REQUIRED");});
 it("requires independent CFO approval and makes locked evidence immutable",async()=>{const x=await fixture();await prisma.reportingDisclosureEvidence.updateMany({where:{runId:x.run.id},data:{satisfied:true,evidence:{ref:"note"}}});await reviewReportingRun({organizationId:x.org.id,runId:x.run.id,actor:{id:x.director.id},reason:"reviewed"});await expect(approveReportingRun({organizationId:x.org.id,runId:x.run.id,actor:{id:x.director.id},reason:"approve"})).rejects.toThrow("Missing permission: reporting.approve");await approveReportingRun({organizationId:x.org.id,runId:x.run.id,actor:{id:x.cfo.id},reason:"approved"});await expect(prisma.reportingDisclosureEvidence.updateMany({where:{runId:x.run.id},data:{evidence:{tampered:true}}})).rejects.toThrow(/immutable/i);});
});

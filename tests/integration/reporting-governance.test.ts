import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { approveReportingRun, publishReportingRun, reviewReportingRun } from "@/application/accounting/reporting-governance-service";

const prisma=new PrismaClient();
afterAll(()=>prisma.$disconnect());

async function fixture(){
 const org=await prisma.organization.findUniqueOrThrow({where:{code:"NORTHSTAR"}});
 const other=await prisma.organization.findUniqueOrThrow({where:{code:"HORIZON"}});
 const analyst=await prisma.user.findUniqueOrThrow({where:{email:"analyst@planora.local"}});
 const director=await prisma.user.findUniqueOrThrow({where:{email:"director@planora.local"}});
 const cfo=await prisma.user.findUniqueOrThrow({where:{email:"cfo@planora.local"}});
 const entity=await prisma.legalEntity.findFirstOrThrow({where:{organizationId:org.id}});
 const period=await prisma.fiscalPeriod.findFirstOrThrow({where:{year:{calendar:{organizationId:org.id}}}});
 const framework=await prisma.reportingFrameworkVersion.upsert({where:{organizationId_frameworkCode_version:{organizationId:org.id,frameworkCode:"US_GAAP",version:"2026.1"}},update:{active:true},create:{organizationId:org.id,frameworkCode:"US_GAAP",version:"2026.1",effectiveFrom:new Date("2026-01-01"),ruleManifest:{},disclosureManifest:[{code:"POLICIES",required:true}]}});
 await prisma.reportingRun.deleteMany({where:{organizationId:org.id}});
 const run=await prisma.reportingRun.create({data:{organizationId:org.id,legalEntityId:entity.id,fiscalPeriodId:period.id,frameworkVersionId:framework.id,preparedById:analyst.id,statementEvidence:{source:"test"},controlEvidence:{balanced:true},disclosures:{create:{requirementCode:"POLICIES",required:true,satisfied:false,evidence:{}}}}});
 return {org,other,analyst,director,cfo,run};
}

describe("reporting governance persistence",()=>{
 beforeEach(async()=>{await prisma.reportingApproval.deleteMany();await prisma.reportingDisclosureEvidence.deleteMany();await prisma.reportingRun.deleteMany();});
 it("blocks cross-tenant review",async()=>{const x=await fixture();await expect(reviewReportingRun({organizationId:x.other.id,runId:x.run.id,actor:{id:x.director.id},reason:"review"})).rejects.toThrow("REPORTING_RUN_NOT_REVIEWABLE");});
 it("blocks review while required disclosures are incomplete",async()=>{const x=await fixture();await expect(reviewReportingRun({organizationId:x.org.id,runId:x.run.id,actor:{id:x.director.id},reason:"review"})).rejects.toThrow("REPORTING_DISCLOSURES_INCOMPLETE");});
 it("blocks preparer self-review even with a review-capable role",async()=>{const x=await fixture();await prisma.reportingDisclosureEvidence.updateMany({where:{runId:x.run.id},data:{satisfied:true,evidence:{ref:"note"}}});await expect(reviewReportingRun({organizationId:x.org.id,runId:x.run.id,actor:{id:x.analyst.id},reason:"review"})).rejects.toThrow("REPORTING_SELF_REVIEW_FORBIDDEN");});
 it("blocks publication before approval and lock",async()=>{const x=await fixture();await expect(publishReportingRun({organizationId:x.org.id,runId:x.run.id,actor:{id:x.cfo.id}})).rejects.toThrow("REPORTING_APPROVAL_AND_LOCK_REQUIRED");});
 it("requires independent CFO approval and makes locked evidence immutable",async()=>{const x=await fixture();await prisma.reportingDisclosureEvidence.updateMany({where:{runId:x.run.id},data:{satisfied:true,evidence:{ref:"note"}}});await reviewReportingRun({organizationId:x.org.id,runId:x.run.id,actor:{id:x.director.id},reason:"reviewed"});await expect(approveReportingRun({organizationId:x.org.id,runId:x.run.id,actor:{id:x.director.id},reason:"approve"})).rejects.toThrow("REPORTING_SELF_APPROVAL_FORBIDDEN");await approveReportingRun({organizationId:x.org.id,runId:x.run.id,actor:{id:x.cfo.id},reason:"approved"});await expect(prisma.reportingDisclosureEvidence.updateMany({where:{runId:x.run.id},data:{evidence:{tampered:true}}})).rejects.toThrow(/immutable/i);});
});

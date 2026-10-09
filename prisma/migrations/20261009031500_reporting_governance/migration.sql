CREATE TYPE "ReportingRunStatus" AS ENUM ('DRAFT','IN_REVIEW','APPROVED','PUBLISHED','REJECTED');
CREATE TYPE "ReportingApprovalDecision" AS ENUM ('REVIEWED','APPROVED','REJECTED');

CREATE TABLE "ReportingFrameworkVersion" (
 "id" UUID PRIMARY KEY, "organizationId" UUID NOT NULL, "frameworkCode" TEXT NOT NULL, "version" TEXT NOT NULL,
 "effectiveFrom" DATE NOT NULL, "effectiveTo" DATE, "ruleManifest" JSONB NOT NULL, "disclosureManifest" JSONB NOT NULL,
 "active" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "ReportingFrameworkVersion_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT
);
CREATE UNIQUE INDEX "ReportingFrameworkVersion_organizationId_frameworkCode_version_key" ON "ReportingFrameworkVersion"("organizationId","frameworkCode","version");
CREATE INDEX "ReportingFrameworkVersion_organizationId_frameworkCode_effectiveFrom_idx" ON "ReportingFrameworkVersion"("organizationId","frameworkCode","effectiveFrom");

CREATE TABLE "ReportingRun" (
 "id" UUID PRIMARY KEY, "organizationId" UUID NOT NULL, "legalEntityId" UUID NOT NULL, "fiscalPeriodId" UUID NOT NULL,
 "frameworkVersionId" UUID NOT NULL, "preparedById" UUID NOT NULL, "status" "ReportingRunStatus" NOT NULL DEFAULT 'DRAFT',
 "statementEvidence" JSONB NOT NULL, "controlEvidence" JSONB NOT NULL, "lockedAt" TIMESTAMP(3), "publishedAt" TIMESTAMP(3),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "ReportingRun_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT,
 CONSTRAINT "ReportingRun_legalEntityId_fkey" FOREIGN KEY ("legalEntityId") REFERENCES "LegalEntity"("id") ON DELETE RESTRICT,
 CONSTRAINT "ReportingRun_fiscalPeriodId_fkey" FOREIGN KEY ("fiscalPeriodId") REFERENCES "FiscalPeriod"("id") ON DELETE RESTRICT,
 CONSTRAINT "ReportingRun_frameworkVersionId_fkey" FOREIGN KEY ("frameworkVersionId") REFERENCES "ReportingFrameworkVersion"("id") ON DELETE RESTRICT,
 CONSTRAINT "ReportingRun_preparedById_fkey" FOREIGN KEY ("preparedById") REFERENCES "User"("id") ON DELETE RESTRICT
);
CREATE UNIQUE INDEX "ReportingRun_organizationId_legalEntityId_fiscalPeriodId_frameworkVersionId_key" ON "ReportingRun"("organizationId","legalEntityId","fiscalPeriodId","frameworkVersionId");
CREATE INDEX "ReportingRun_organizationId_status_updatedAt_idx" ON "ReportingRun"("organizationId","status","updatedAt");

CREATE TABLE "ReportingDisclosureEvidence" (
 "id" UUID PRIMARY KEY, "runId" UUID NOT NULL, "requirementCode" TEXT NOT NULL, "required" BOOLEAN NOT NULL DEFAULT true,
 "satisfied" BOOLEAN NOT NULL DEFAULT false, "evidence" JSONB NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "ReportingDisclosureEvidence_runId_fkey" FOREIGN KEY ("runId") REFERENCES "ReportingRun"("id") ON DELETE RESTRICT
);
CREATE UNIQUE INDEX "ReportingDisclosureEvidence_runId_requirementCode_key" ON "ReportingDisclosureEvidence"("runId","requirementCode");
CREATE INDEX "ReportingDisclosureEvidence_runId_required_satisfied_idx" ON "ReportingDisclosureEvidence"("runId","required","satisfied");

CREATE TABLE "ReportingApproval" (
 "id" UUID PRIMARY KEY, "runId" UUID NOT NULL, "actorId" UUID NOT NULL, "decision" "ReportingApprovalDecision" NOT NULL,
 "reason" TEXT NOT NULL, "evidence" JSONB NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "ReportingApproval_runId_fkey" FOREIGN KEY ("runId") REFERENCES "ReportingRun"("id") ON DELETE RESTRICT,
 CONSTRAINT "ReportingApproval_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT
);
CREATE INDEX "ReportingApproval_runId_createdAt_idx" ON "ReportingApproval"("runId","createdAt");
CREATE INDEX "ReportingApproval_actorId_createdAt_idx" ON "ReportingApproval"("actorId","createdAt");

CREATE OR REPLACE FUNCTION planora_reporting_run_immutable() RETURNS trigger AS $$
BEGIN
 IF OLD."lockedAt" IS NOT NULL AND (
   NEW."organizationId" IS DISTINCT FROM OLD."organizationId" OR NEW."legalEntityId" IS DISTINCT FROM OLD."legalEntityId" OR
   NEW."fiscalPeriodId" IS DISTINCT FROM OLD."fiscalPeriodId" OR NEW."frameworkVersionId" IS DISTINCT FROM OLD."frameworkVersionId" OR
   NEW."preparedById" IS DISTINCT FROM OLD."preparedById" OR NEW."statementEvidence" IS DISTINCT FROM OLD."statementEvidence" OR
   NEW."controlEvidence" IS DISTINCT FROM OLD."controlEvidence" OR NEW."lockedAt" IS DISTINCT FROM OLD."lockedAt"
 ) THEN RAISE EXCEPTION 'locked reporting run is immutable'; END IF;
 RETURN NEW;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER "ReportingRun_locked_immutable" BEFORE UPDATE ON "ReportingRun" FOR EACH ROW EXECUTE FUNCTION planora_reporting_run_immutable();

CREATE OR REPLACE FUNCTION planora_reporting_child_immutable() RETURNS trigger AS $$
DECLARE locked_at TIMESTAMP(3);
BEGIN
 SELECT "lockedAt" INTO locked_at FROM "ReportingRun" WHERE "id"=COALESCE(NEW."runId",OLD."runId");
 IF locked_at IS NOT NULL THEN RAISE EXCEPTION 'locked reporting evidence is immutable'; END IF;
 RETURN COALESCE(NEW,OLD);
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER "ReportingDisclosureEvidence_locked_immutable" BEFORE UPDATE OR DELETE ON "ReportingDisclosureEvidence" FOR EACH ROW EXECUTE FUNCTION planora_reporting_child_immutable();
CREATE TRIGGER "ReportingApproval_append_only" BEFORE UPDATE OR DELETE ON "ReportingApproval" FOR EACH ROW EXECUTE FUNCTION planora_reporting_child_immutable();

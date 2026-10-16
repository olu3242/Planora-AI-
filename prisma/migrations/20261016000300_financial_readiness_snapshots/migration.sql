-- Append-only snapshots. The application writes evidence and the resulting evaluation
-- in one transaction after validating tenant, legal entity and period scope.
CREATE TABLE "FinancialReadinessAssessment" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"("id") ON DELETE RESTRICT,
  "legalEntityId" UUID NOT NULL REFERENCES "LegalEntity"("id") ON DELETE RESTRICT,
  "periodId" UUID NOT NULL REFERENCES "FiscalPeriod"("id") ON DELETE RESTRICT,
  "asOf" TIMESTAMPTZ NOT NULL,
  "score" INTEGER CHECK ("score" BETWEEN 0 AND 100),
  "status" TEXT NOT NULL CHECK ("status" IN ('BLOCKED','INCOMPLETE','CANDIDATE_FOR_APPROVAL')),
  "blockers" JSONB NOT NULL,
  "actions" JSONB NOT NULL,
  "dimensions" JSONB NOT NULL,
  "policyVersion" TEXT NOT NULL,
  "sourceFingerprint" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("organizationId","legalEntityId","periodId","policyVersion","sourceFingerprint"),
  UNIQUE ("id","organizationId")
);
CREATE TABLE "FinancialReadinessEvidence" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "assessmentId" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "checkId" TEXT NOT NULL,
  "dimension" TEXT NOT NULL CHECK ("dimension" IN ('DATA_COMPLETENESS','BOOKKEEPING_INTEGRITY','RECONCILIATION','ACCOUNTING_CONTROLS','CLOSE_READINESS','REPORTING_READINESS')),
  "status" TEXT NOT NULL CHECK ("status" IN ('PASS','FAIL','UNKNOWN')),
  "weight" DOUBLE PRECISION NOT NULL CHECK ("weight" > 0),
  "material" BOOLEAN NOT NULL,
  "sourceEvidenceIds" JSONB NOT NULL,
  "verifiedAt" TIMESTAMPTZ,
  "expiresAt" TIMESTAMPTZ,
  "ownerRole" TEXT NOT NULL CHECK ("ownerRole" IN ('BOOKKEEPER','ACCOUNTANT','CONTROLLER','CFO')),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("assessmentId","dimension","checkId"),
  FOREIGN KEY ("assessmentId","organizationId") REFERENCES "FinancialReadinessAssessment"("id","organizationId") ON DELETE RESTRICT
);
CREATE INDEX "FinancialReadinessAssessment_lookup_idx" ON "FinancialReadinessAssessment" ("organizationId","legalEntityId","periodId","createdAt");
ALTER TABLE "FinancialReadinessAssessment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FinancialReadinessEvidence" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FinancialReadinessAssessment" FORCE ROW LEVEL SECURITY;
ALTER TABLE "FinancialReadinessEvidence" FORCE ROW LEVEL SECURITY;
CREATE POLICY "financial_readiness_assessment_select" ON "FinancialReadinessAssessment"
 FOR SELECT USING ("organizationId" = NULLIF(current_setting('app.organization_id',true),'')::uuid);
CREATE POLICY "financial_readiness_assessment_insert" ON "FinancialReadinessAssessment"
 FOR INSERT WITH CHECK ("organizationId" = NULLIF(current_setting('app.organization_id',true),'')::uuid);
CREATE POLICY "financial_readiness_evidence_select" ON "FinancialReadinessEvidence"
 FOR SELECT USING ("organizationId" = NULLIF(current_setting('app.organization_id',true),'')::uuid);
CREATE POLICY "financial_readiness_evidence_insert" ON "FinancialReadinessEvidence"
 FOR INSERT WITH CHECK ("organizationId" = NULLIF(current_setting('app.organization_id',true),'')::uuid);
-- No UPDATE/DELETE policies; use non-owner, non-BYPASSRLS restricted runtime role.

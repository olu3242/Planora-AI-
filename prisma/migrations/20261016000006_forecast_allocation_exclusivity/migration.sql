-- Only one approved allocation may own a given source financial grain.
CREATE UNIQUE INDEX "ForecastAllocationRule_one_approved_scope"
 ON "ForecastAllocationRule" ("organizationId","legalEntityId","fiscalPeriodId","accountId","currencyCode","sourceIdentifier")
 WHERE "status" = 'APPROVED';
-- Database-enforced approval metadata coherence.
ALTER TABLE "ForecastAllocationRule"
 ADD CONSTRAINT "ForecastAllocationRule_approval_coherent"
 CHECK (
  ("status"='DRAFT' AND "approvedById" IS NULL AND "approvedAt" IS NULL AND "revokedAt" IS NULL)
  OR ("status"='APPROVED' AND "approvedById" IS NOT NULL AND "approvedAt" IS NOT NULL AND "revokedAt" IS NULL)
  OR ("status"='REVOKED' AND "approvedById" IS NOT NULL AND "approvedAt" IS NOT NULL AND "revokedById" IS NOT NULL AND "revokedAt" IS NOT NULL)
 );

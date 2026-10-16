-- Durable, tenant-isolated advisory cleanup jobs. No financial posting privileges.
CREATE TABLE "BookkeepingCleanupJob" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"("id") ON DELETE RESTRICT,
  "legalEntityId" UUID NOT NULL REFERENCES "LegalEntity"("id") ON DELETE RESTRICT,
  "fiscalPeriodId" UUID NOT NULL REFERENCES "FiscalPeriod"("id") ON DELETE RESTRICT,
  "jobKey" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'QUEUED'
    CHECK ("status" IN ('QUEUED','RUNNING','RETRY_WAIT','COMPLETED','ESCALATED')),
  "attempts" INTEGER NOT NULL DEFAULT 0 CHECK ("attempts" >= 0),
  "nextAttemptAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "leaseToken" UUID,
  "leaseExpiresAt" TIMESTAMPTZ,
  "lastError" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("organizationId","jobKey"),
  CHECK (("status" = 'RUNNING' AND "leaseToken" IS NOT NULL AND "leaseExpiresAt" IS NOT NULL)
    OR ("status" <> 'RUNNING' AND "leaseToken" IS NULL AND "leaseExpiresAt" IS NULL))
);
CREATE INDEX "BookkeepingCleanupJob_claim_idx" ON "BookkeepingCleanupJob" ("status","nextAttemptAt");
ALTER TABLE "BookkeepingCleanupJob" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BookkeepingCleanupJob" FORCE ROW LEVEL SECURITY;
CREATE POLICY "cleanup_job_tenant_select" ON "BookkeepingCleanupJob" FOR SELECT
  USING ("organizationId" = NULLIF(current_setting('app.organization_id',true),'')::uuid);
CREATE POLICY "cleanup_job_tenant_insert" ON "BookkeepingCleanupJob" FOR INSERT
  WITH CHECK ("organizationId" = NULLIF(current_setting('app.organization_id',true),'')::uuid);
CREATE POLICY "cleanup_job_tenant_update" ON "BookkeepingCleanupJob" FOR UPDATE
  USING ("organizationId" = NULLIF(current_setting('app.organization_id',true),'')::uuid)
  WITH CHECK ("organizationId" = NULLIF(current_setting('app.organization_id',true),'')::uuid);

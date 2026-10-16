-- Governed bookkeeping cleanup cases; never grant direct financial posting here.
CREATE TABLE "BookkeepingCleanupCase" (
  "id" TEXT PRIMARY KEY,
  "organizationId" UUID NOT NULL REFERENCES "Organization"("id") ON DELETE RESTRICT,
  "legalEntityId" UUID NOT NULL REFERENCES "LegalEntity"("id") ON DELETE RESTRICT,
  "fiscalPeriodId" UUID NOT NULL REFERENCES "FiscalPeriod"("id") ON DELETE RESTRICT,
  "issueKey" TEXT NOT NULL,
  "issue" JSONB NOT NULL,
  "state" TEXT NOT NULL CHECK ("state" IN ('DETECTED','INVESTIGATING','PROPOSED','APPROVED','REJECTED','EXECUTION_PENDING','VERIFIED','REOPENED')),
  "revision" INTEGER NOT NULL DEFAULT 0 CHECK ("revision" >= 0),
  "assignedRole" TEXT NOT NULL CHECK ("assignedRole" IN ('BOOKKEEPER','ACCOUNTANT','CONTROLLER')),
  "proposal" TEXT,
  "proposedBy" TEXT,
  "approvedBy" TEXT,
  "evidenceIds" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "history" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("organizationId","legalEntityId","fiscalPeriodId","issueKey"),
  UNIQUE ("id","organizationId")
);
CREATE INDEX "BookkeepingCleanupCase_queue_idx" ON "BookkeepingCleanupCase" ("organizationId","state","updatedAt");
ALTER TABLE "BookkeepingCleanupCase" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BookkeepingCleanupCase" FORCE ROW LEVEL SECURITY;
CREATE POLICY "bookkeeping_cleanup_select" ON "BookkeepingCleanupCase"
  FOR SELECT USING ("organizationId" = NULLIF(current_setting('app.organization_id',true),'')::uuid);
CREATE POLICY "bookkeeping_cleanup_insert" ON "BookkeepingCleanupCase"
  FOR INSERT WITH CHECK ("organizationId" = NULLIF(current_setting('app.organization_id',true),'')::uuid);
CREATE POLICY "bookkeeping_cleanup_update" ON "BookkeepingCleanupCase"
  FOR UPDATE USING ("organizationId" = NULLIF(current_setting('app.organization_id',true),'')::uuid)
  WITH CHECK ("organizationId" = NULLIF(current_setting('app.organization_id',true),'')::uuid);
-- UPDATE is required for versioned workflow transitions. Service authorization and
-- compare-and-swap are mandatory; restrict grants to a dedicated application role.

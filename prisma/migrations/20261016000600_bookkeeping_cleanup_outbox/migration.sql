CREATE TABLE "BookkeepingCleanupOutbox" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"("id"),
  "legalEntityId" UUID NOT NULL REFERENCES "LegalEntity"("id"),
  "fiscalPeriodId" UUID NOT NULL REFERENCES "FiscalPeriod"("id"),
  "importEventId" UUID NOT NULL,
  "state" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "deliveredAt" TIMESTAMPTZ,
  CONSTRAINT "BookkeepingCleanupOutbox_state_check" CHECK ("state" IN ('PENDING','DELIVERED')),
  CONSTRAINT "BookkeepingCleanupOutbox_unique_event" UNIQUE ("organizationId","importEventId")
);
CREATE INDEX "BookkeepingCleanupOutbox_pending_idx" ON "BookkeepingCleanupOutbox" ("organizationId","state","createdAt");
ALTER TABLE "BookkeepingCleanupOutbox" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BookkeepingCleanupOutbox" FORCE ROW LEVEL SECURITY;
CREATE POLICY "cleanup_outbox_select" ON "BookkeepingCleanupOutbox" FOR SELECT USING ("organizationId" = NULLIF(current_setting('app.organization_id',true),'')::uuid);
CREATE POLICY "cleanup_outbox_insert" ON "BookkeepingCleanupOutbox" FOR INSERT WITH CHECK ("organizationId" = NULLIF(current_setting('app.organization_id',true),'')::uuid);
CREATE POLICY "cleanup_outbox_update" ON "BookkeepingCleanupOutbox" FOR UPDATE USING ("organizationId" = NULLIF(current_setting('app.organization_id',true),'')::uuid) WITH CHECK ("organizationId" = NULLIF(current_setting('app.organization_id',true),'')::uuid);

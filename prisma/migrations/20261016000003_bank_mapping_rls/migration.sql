-- Restrict bank mapping reads and writes to the authenticated organization.
-- The application must SET LOCAL app.organization_id and app.actor_id in its
-- transaction after validating a trusted session.
CREATE POLICY "BankCashMapping_tenant_read" ON "BankCashMapping"
  FOR SELECT USING (
    "organizationId" = NULLIF(current_setting('app.organization_id', true), '')::uuid
    AND EXISTS (
      SELECT 1 FROM "OrganizationMembership" m
      WHERE m."organizationId" = "BankCashMapping"."organizationId"
        AND m."userId" = NULLIF(current_setting('app.actor_id', true), '')::uuid
        AND m."active" = true
    )
  );
CREATE POLICY "BankCashMapping_tenant_insert" ON "BankCashMapping"
  FOR INSERT WITH CHECK (
    "organizationId" = NULLIF(current_setting('app.organization_id', true), '')::uuid
    AND "preparedById" = NULLIF(current_setting('app.actor_id', true), '')::uuid
    AND "approvedAt" IS NULL AND "approvedById" IS NULL AND "revokedAt" IS NULL
    AND EXISTS (
      SELECT 1 FROM "OrganizationMembership" m
      WHERE m."organizationId" = "BankCashMapping"."organizationId"
        AND m."userId" = "BankCashMapping"."preparedById"
        AND m."active" = true AND m."role" IN ('CFO', 'FPA_DIRECTOR')
    )
  );
CREATE POLICY "BankCashMapping_tenant_update" ON "BankCashMapping"
  FOR UPDATE USING (
    "organizationId" = NULLIF(current_setting('app.organization_id', true), '')::uuid
    AND EXISTS (
      SELECT 1 FROM "OrganizationMembership" m
      WHERE m."organizationId" = "BankCashMapping"."organizationId"
        AND m."userId" = NULLIF(current_setting('app.actor_id', true), '')::uuid
        AND m."active" = true AND m."role" IN ('CFO', 'FPA_DIRECTOR')
    )
  ) WITH CHECK (
    "organizationId" = NULLIF(current_setting('app.organization_id', true), '')::uuid
  );

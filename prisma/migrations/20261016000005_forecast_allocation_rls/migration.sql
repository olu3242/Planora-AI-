ALTER TABLE "ForecastAllocationRule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ForecastAllocationRule" FORCE ROW LEVEL SECURITY;
CREATE POLICY "ForecastAllocationRule_tenant_select" ON "ForecastAllocationRule"
 FOR SELECT USING ("organizationId" = NULLIF(current_setting('app.organization_id', true),'')::uuid);
CREATE POLICY "ForecastAllocationRule_tenant_insert" ON "ForecastAllocationRule"
 FOR INSERT WITH CHECK ("organizationId" = NULLIF(current_setting('app.organization_id', true),'')::uuid);
CREATE POLICY "ForecastAllocationRule_tenant_update" ON "ForecastAllocationRule"
 FOR UPDATE USING ("organizationId" = NULLIF(current_setting('app.organization_id', true),'')::uuid)
 WITH CHECK ("organizationId" = NULLIF(current_setting('app.organization_id', true),'')::uuid);

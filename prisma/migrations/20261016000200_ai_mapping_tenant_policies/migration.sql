-- Tenant-isolated policies. These are inert without a trusted, transaction-local
-- app.organization_id set by the server for a non-BYPASSRLS runtime role.
-- Never set this variable from client-provided tenant input.
CREATE POLICY "ai_mapping_proposal_tenant" ON "AiTransactionMappingProposal"
  FOR ALL USING ("organizationId" = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK ("organizationId" = NULLIF(current_setting('app.organization_id', true), '')::uuid);
CREATE POLICY "ai_mapping_work_item_tenant" ON "AiTransactionMappingWorkItem"
  FOR ALL USING ("organizationId" = NULLIF(current_setting('app.organization_id', true), '')::uuid)
  WITH CHECK ("organizationId" = NULLIF(current_setting('app.organization_id', true), '')::uuid);
CREATE POLICY "ai_mapping_review_tenant" ON "AiTransactionMappingReview"
  FOR SELECT USING ("organizationId" = NULLIF(current_setting('app.organization_id', true), '')::uuid);
CREATE POLICY "ai_mapping_review_insert" ON "AiTransactionMappingReview"
  FOR INSERT WITH CHECK ("organizationId" = NULLIF(current_setting('app.organization_id', true), '')::uuid);
-- No UPDATE or DELETE policy for immutable review records.
-- Role GRANTs are intentionally deferred pending a reviewed runtime-role design.

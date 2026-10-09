BEGIN;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" FORCE ROW LEVEL SECURITY;
CREATE POLICY planora_maintenance ON "User" TO CURRENT_USER USING (true) WITH CHECK (true);
CREATE POLICY planora_tenant_profile ON "User" FOR SELECT USING (
 EXISTS (SELECT 1 FROM "OrganizationMembership" m WHERE m."userId"="User".id AND m.active)
);
-- Runtime provisioning grants only profile columns, never passwordHash.
COMMIT;

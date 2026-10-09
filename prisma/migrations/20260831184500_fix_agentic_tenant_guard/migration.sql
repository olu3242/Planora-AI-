-- The first tenant guard referenced table-specific NEW fields in a shared
-- trigger function. PostgreSQL resolves record fields before boolean
-- short-circuiting, so valid AgentFeedback rows could fail. JSON field access
-- keeps the shared guard polymorphic without weakening any tenant check.
CREATE OR REPLACE FUNCTION enforce_agentic_tenant_consistency() RETURNS trigger AS $$
DECLARE
  row_data JSONB := to_jsonb(NEW);
  row_organization_id UUID := (row_data->>'organizationId')::UUID;
  row_actor_id UUID := (row_data->>'actorId')::UUID;
  referenced_org UUID;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "OrganizationMembership"
    WHERE "organizationId" = row_organization_id AND "userId" = row_actor_id AND active = true
  ) THEN
    RAISE EXCEPTION 'Agentic actor must have an active membership in the referenced organization';
  END IF;

  IF TG_TABLE_NAME = 'AgentRun' AND row_data->>'forecastVersionId' IS NOT NULL THEN
    SELECT f."organizationId" INTO referenced_org FROM "ForecastVersion" v JOIN "Forecast" f ON f.id = v."forecastId" WHERE v.id = (row_data->>'forecastVersionId')::UUID;
  ELSIF TG_TABLE_NAME = 'AgentRecommendation' THEN
    SELECT "organizationId" INTO referenced_org FROM "AgentRun" WHERE id = (row_data->>'runId')::UUID;
    IF referenced_org IS DISTINCT FROM row_organization_id THEN RAISE EXCEPTION 'Recommendation tenant must match its run'; END IF;
    IF row_data->>'forecastVersionId' IS NOT NULL THEN
      SELECT f."organizationId" INTO referenced_org FROM "ForecastVersion" v JOIN "Forecast" f ON f.id = v."forecastId" WHERE v.id = (row_data->>'forecastVersionId')::UUID;
    ELSE
      referenced_org := row_organization_id;
    END IF;
  ELSIF TG_TABLE_NAME = 'AgentFeedback' THEN
    SELECT "organizationId" INTO referenced_org FROM "AgentRecommendation" WHERE id = (row_data->>'recommendationId')::UUID;
  ELSIF TG_TABLE_NAME = 'RuntimeExecution' AND row_data->>'forecastVersionId' IS NOT NULL THEN
    SELECT f."organizationId" INTO referenced_org FROM "ForecastVersion" v JOIN "Forecast" f ON f.id = v."forecastId" WHERE v.id = (row_data->>'forecastVersionId')::UUID;
  ELSE
    referenced_org := row_organization_id;
  END IF;

  IF referenced_org IS DISTINCT FROM row_organization_id THEN
    RAISE EXCEPTION 'Cross-tenant agentic/runtime reference denied';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

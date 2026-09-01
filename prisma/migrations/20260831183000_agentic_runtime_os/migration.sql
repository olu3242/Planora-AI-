-- Governed Agentic OS and execution runtime. Agents persist recommendations only;
-- authoritative financial changes remain behind existing workflow commands.
CREATE TYPE "AgentAuthorityClass" AS ENUM ('A0_OBSERVE', 'A1_RECOMMEND', 'A2_ASSIST', 'A3_EXECUTE', 'A4_GOVERNED', 'A5_RESERVED');
CREATE TYPE "AgentKillSwitch" AS ENUM ('ENABLED', 'READ_ONLY', 'DISABLED');
CREATE TYPE "AgentRunStatus" AS ENUM ('RUNNING', 'SUCCEEDED', 'NO_RECOMMENDATION', 'INSUFFICIENT_DATA', 'AUTHORIZATION_UNDETERMINED', 'ERROR');
CREATE TYPE "AgentRecommendationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EDITED', 'REJECTED');
CREATE TYPE "AgentFeedbackDecision" AS ENUM ('ACCEPTED', 'EDITED', 'REJECTED');
CREATE TYPE "RuntimeExecutionStatus" AS ENUM ('PENDING', 'RUNNING', 'RETRY_PENDING', 'SUCCEEDED', 'FAILED', 'RECOVERED');
CREATE TYPE "RuntimeErrorCategory" AS ENUM ('TRANSIENT', 'VALIDATION', 'AUTHORIZATION', 'DATA_INTEGRITY', 'DEPENDENCY', 'LOGIC', 'UNKNOWN');

CREATE TABLE "AgentDefinition" (
  "id" UUID NOT NULL,
  "agentId" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "purpose" TEXT NOT NULL,
  "persona" TEXT NOT NULL,
  "tenantScope" TEXT NOT NULL DEFAULT 'AUTHENTICATED_ORGANIZATION',
  "authorityClass" "AgentAuthorityClass" NOT NULL,
  "allowedTools" TEXT[],
  "forbiddenActions" TEXT[],
  "requiredContext" TEXT[],
  "workflowStates" "ForecastVersionStatus"[],
  "humanApprovalRequired" BOOLEAN NOT NULL DEFAULT true,
  "financialWritePermission" BOOLEAN NOT NULL DEFAULT false,
  "retryPolicy" JSONB NOT NULL,
  "memoryPolicy" JSONB NOT NULL,
  "learningPolicy" JSONB NOT NULL,
  "failurePolicy" JSONB NOT NULL,
  "auditPolicy" JSONB NOT NULL,
  "killSwitch" "AgentKillSwitch" NOT NULL DEFAULT 'ENABLED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AgentDefinition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgentRun" (
  "id" UUID NOT NULL,
  "agentDefinitionId" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "actorId" UUID NOT NULL,
  "forecastVersionId" UUID,
  "trigger" TEXT NOT NULL,
  "task" TEXT NOT NULL,
  "inputReferences" JSONB NOT NULL,
  "toolTrace" JSONB NOT NULL,
  "evidence" JSONB NOT NULL,
  "output" JSONB,
  "status" "AgentRunStatus" NOT NULL DEFAULT 'RUNNING',
  "confidence" DECIMAL(5,4),
  "errorCode" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "AgentRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgentRecommendation" (
  "id" UUID NOT NULL,
  "runId" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "actorId" UUID NOT NULL,
  "forecastVersionId" UUID,
  "type" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "proposedContent" TEXT,
  "observedFacts" JSONB NOT NULL,
  "evidence" JSONB NOT NULL,
  "unsupportedClaim" BOOLEAN NOT NULL DEFAULT false,
  "status" "AgentRecommendationStatus" NOT NULL DEFAULT 'PENDING',
  "decidedById" UUID,
  "decidedAt" TIMESTAMP(3),
  "decisionReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AgentRecommendation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgentFeedback" (
  "id" UUID NOT NULL,
  "recommendationId" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "actorId" UUID NOT NULL,
  "decision" "AgentFeedbackDecision" NOT NULL,
  "originalContent" TEXT,
  "finalContent" TEXT,
  "candidateImprovement" JSONB,
  "requiresVersionChange" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AgentFeedback_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RuntimeExecution" (
  "id" UUID NOT NULL,
  "correlationId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "agentDefinitionId" UUID,
  "agentVersion" INTEGER,
  "actorId" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "forecastVersionId" UUID,
  "command" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "status" "RuntimeExecutionStatus" NOT NULL DEFAULT 'PENDING',
  "attempt" INTEGER NOT NULL DEFAULT 0,
  "retrySafe" BOOLEAN NOT NULL DEFAULT false,
  "request" JSONB NOT NULL,
  "result" JSONB,
  "errorCategory" "RuntimeErrorCategory",
  "errorCode" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "RuntimeExecution_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AgentDefinition_agentId_key" ON "AgentDefinition"("agentId");
CREATE INDEX "AgentRun_organizationId_startedAt_idx" ON "AgentRun"("organizationId", "startedAt");
CREATE INDEX "AgentRun_forecastVersionId_startedAt_idx" ON "AgentRun"("forecastVersionId", "startedAt");
CREATE INDEX "AgentRecommendation_organizationId_createdAt_idx" ON "AgentRecommendation"("organizationId", "createdAt");
CREATE INDEX "AgentRecommendation_forecastVersionId_createdAt_idx" ON "AgentRecommendation"("forecastVersionId", "createdAt");
CREATE INDEX "AgentFeedback_organizationId_createdAt_idx" ON "AgentFeedback"("organizationId", "createdAt");
CREATE UNIQUE INDEX "RuntimeExecution_organizationId_command_idempotencyKey_key" ON "RuntimeExecution"("organizationId", "command", "idempotencyKey");
CREATE INDEX "RuntimeExecution_organizationId_startedAt_idx" ON "RuntimeExecution"("organizationId", "startedAt");
CREATE INDEX "RuntimeExecution_correlationId_idx" ON "RuntimeExecution"("correlationId");

ALTER TABLE "AgentRun" ADD CONSTRAINT "AgentRun_agentDefinitionId_fkey" FOREIGN KEY ("agentDefinitionId") REFERENCES "AgentDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AgentRun" ADD CONSTRAINT "AgentRun_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AgentRun" ADD CONSTRAINT "AgentRun_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AgentRun" ADD CONSTRAINT "AgentRun_forecastVersionId_fkey" FOREIGN KEY ("forecastVersionId") REFERENCES "ForecastVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AgentRecommendation" ADD CONSTRAINT "AgentRecommendation_runId_fkey" FOREIGN KEY ("runId") REFERENCES "AgentRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AgentRecommendation" ADD CONSTRAINT "AgentRecommendation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AgentRecommendation" ADD CONSTRAINT "AgentRecommendation_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AgentRecommendation" ADD CONSTRAINT "AgentRecommendation_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AgentRecommendation" ADD CONSTRAINT "AgentRecommendation_forecastVersionId_fkey" FOREIGN KEY ("forecastVersionId") REFERENCES "ForecastVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AgentFeedback" ADD CONSTRAINT "AgentFeedback_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "AgentRecommendation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AgentFeedback" ADD CONSTRAINT "AgentFeedback_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AgentFeedback" ADD CONSTRAINT "AgentFeedback_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RuntimeExecution" ADD CONSTRAINT "RuntimeExecution_agentDefinitionId_fkey" FOREIGN KEY ("agentDefinitionId") REFERENCES "AgentDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RuntimeExecution" ADD CONSTRAINT "RuntimeExecution_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RuntimeExecution" ADD CONSTRAINT "RuntimeExecution_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RuntimeExecution" ADD CONSTRAINT "RuntimeExecution_forecastVersionId_fkey" FOREIGN KEY ("forecastVersionId") REFERENCES "ForecastVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Database-level defense in depth: application services derive organization from
-- the authenticated membership, and these triggers prevent mismatched tenant
-- references even if a future code path is defective.
CREATE OR REPLACE FUNCTION enforce_agentic_tenant_consistency() RETURNS trigger AS $$
DECLARE referenced_org UUID;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "OrganizationMembership"
    WHERE "organizationId" = NEW."organizationId" AND "userId" = NEW."actorId" AND active = true
  ) THEN
    RAISE EXCEPTION 'Agentic actor must have an active membership in the referenced organization';
  END IF;

  IF TG_TABLE_NAME = 'AgentRun' AND NEW."forecastVersionId" IS NOT NULL THEN
    SELECT f."organizationId" INTO referenced_org FROM "ForecastVersion" v JOIN "Forecast" f ON f.id = v."forecastId" WHERE v.id = NEW."forecastVersionId";
  ELSIF TG_TABLE_NAME = 'AgentRecommendation' THEN
    SELECT "organizationId" INTO referenced_org FROM "AgentRun" WHERE id = NEW."runId";
    IF referenced_org IS DISTINCT FROM NEW."organizationId" THEN RAISE EXCEPTION 'Recommendation tenant must match its run'; END IF;
    IF NEW."forecastVersionId" IS NOT NULL THEN
      SELECT f."organizationId" INTO referenced_org FROM "ForecastVersion" v JOIN "Forecast" f ON f.id = v."forecastId" WHERE v.id = NEW."forecastVersionId";
    ELSE
      referenced_org := NEW."organizationId";
    END IF;
  ELSIF TG_TABLE_NAME = 'AgentFeedback' THEN
    SELECT "organizationId" INTO referenced_org FROM "AgentRecommendation" WHERE id = NEW."recommendationId";
  ELSIF TG_TABLE_NAME = 'RuntimeExecution' AND NEW."forecastVersionId" IS NOT NULL THEN
    SELECT f."organizationId" INTO referenced_org FROM "ForecastVersion" v JOIN "Forecast" f ON f.id = v."forecastId" WHERE v.id = NEW."forecastVersionId";
  ELSE
    referenced_org := NEW."organizationId";
  END IF;

  IF referenced_org IS DISTINCT FROM NEW."organizationId" THEN
    RAISE EXCEPTION 'Cross-tenant agentic/runtime reference denied';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agent_run_tenant_guard BEFORE INSERT OR UPDATE ON "AgentRun" FOR EACH ROW EXECUTE FUNCTION enforce_agentic_tenant_consistency();
CREATE TRIGGER agent_recommendation_tenant_guard BEFORE INSERT OR UPDATE ON "AgentRecommendation" FOR EACH ROW EXECUTE FUNCTION enforce_agentic_tenant_consistency();
CREATE TRIGGER agent_feedback_tenant_guard BEFORE INSERT OR UPDATE ON "AgentFeedback" FOR EACH ROW EXECUTE FUNCTION enforce_agentic_tenant_consistency();
CREATE TRIGGER runtime_execution_tenant_guard BEFORE INSERT OR UPDATE ON "RuntimeExecution" FOR EACH ROW EXECUTE FUNCTION enforce_agentic_tenant_consistency();

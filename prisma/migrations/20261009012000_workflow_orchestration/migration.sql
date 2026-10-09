-- Durable Planora workflow orchestration persistence.
CREATE TABLE "WorkflowRunRecord" (
  "id" TEXT NOT NULL,
  "organizationId" UUID NOT NULL,
  "definitionId" TEXT NOT NULL,
  "definitionVersion" INTEGER NOT NULL,
  "status" TEXT NOT NULL,
  "state" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WorkflowRunRecord_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WorkflowRunRecord_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "WorkflowRunRecord_organizationId_status_updatedAt_idx" ON "WorkflowRunRecord"("organizationId","status","updatedAt");
CREATE INDEX "WorkflowRunRecord_definitionId_definitionVersion_idx" ON "WorkflowRunRecord"("definitionId","definitionVersion");

CREATE TABLE "WorkflowExecutionRecord" (
  "id" UUID NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "runId" TEXT NOT NULL,
  "stepId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "evidenceId" TEXT,
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WorkflowExecutionRecord_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WorkflowExecutionRecord_runId_fkey" FOREIGN KEY ("runId") REFERENCES "WorkflowRunRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "WorkflowExecutionRecord_idempotencyKey_key" ON "WorkflowExecutionRecord"("idempotencyKey");
CREATE INDEX "WorkflowExecutionRecord_runId_stepId_idx" ON "WorkflowExecutionRecord"("runId","stepId");
CREATE INDEX "WorkflowExecutionRecord_status_updatedAt_idx" ON "WorkflowExecutionRecord"("status","updatedAt");

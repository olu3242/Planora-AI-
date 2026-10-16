-- Separate from the existing workbook MappingDecision table.
-- Apply only after reviewing migration order and database permissions.
CREATE TABLE "AiTransactionMappingProposal" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"("id") ON DELETE RESTRICT,
  "transactionId" TEXT NOT NULL,
  "sourceHash" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "accountId" TEXT,
  "confidence" DOUBLE PRECISION NOT NULL CHECK ("confidence" BETWEEN 0 AND 1),
  "explanation" TEXT NOT NULL,
  "agent" TEXT NOT NULL CHECK ("agent" IN ('BOOKKEEPING','AR','RECONCILIATION','GL')),
  "route" TEXT NOT NULL CHECK ("route" IN ('AUTO_PREPARE','HUMAN_REVIEW','EXCEPTION')),
  "status" TEXT NOT NULL DEFAULT 'PROPOSED' CHECK ("status" = 'PROPOSED'),
  "modelVersion" TEXT NOT NULL,
  "policyVersion" TEXT NOT NULL,
  "evidenceIds" JSONB NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("organizationId","idempotencyKey"),
  UNIQUE ("id","organizationId")
);
CREATE TABLE "AiTransactionMappingWorkItem" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "proposalId" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "assignedRole" TEXT NOT NULL CHECK ("assignedRole" IN ('BOOKKEEPER','ACCOUNTANT','CONTROLLER')),
  "state" TEXT NOT NULL CHECK ("state" IN ('READY_FOR_VALIDATION','WAITING_REVIEW','BLOCKED_EXCEPTION')),
  "priority" TEXT NOT NULL CHECK ("priority" IN ('NORMAL','HIGH')),
  "reason" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("proposalId"),
  FOREIGN KEY ("proposalId","organizationId") REFERENCES "AiTransactionMappingProposal"("id","organizationId") ON DELETE RESTRICT
);
CREATE TABLE "AiTransactionMappingReview" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "proposalId" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "reviewerId" UUID NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT,
  "action" TEXT NOT NULL CHECK ("action" IN ('APPROVE','REJECT','OVERRIDE')),
  "selectedAccountId" TEXT,
  "reason" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("proposalId"),
  FOREIGN KEY ("proposalId","organizationId") REFERENCES "AiTransactionMappingProposal"("id","organizationId") ON DELETE RESTRICT
);
CREATE INDEX "AiTransactionMappingWorkItem_queue_idx" ON "AiTransactionMappingWorkItem" ("organizationId","assignedRole","createdAt");
CREATE INDEX "AiTransactionMappingReview_tenant_idx" ON "AiTransactionMappingReview" ("organizationId","createdAt");
ALTER TABLE "AiTransactionMappingProposal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AiTransactionMappingWorkItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AiTransactionMappingReview" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AiTransactionMappingProposal" FORCE ROW LEVEL SECURITY;
ALTER TABLE "AiTransactionMappingWorkItem" FORCE ROW LEVEL SECURITY;
ALTER TABLE "AiTransactionMappingReview" FORCE ROW LEVEL SECURITY;
-- No broad policies: database roles without BYPASSRLS have no access until
-- dedicated authenticated tenant-bound policies are certified.

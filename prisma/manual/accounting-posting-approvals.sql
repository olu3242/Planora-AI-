-- Staged only: review against Prisma schema before executing on any database.
CREATE TYPE "AccountingPostingApprovalDecision" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REVOKED');
CREATE TABLE "AccountingPostingApproval" (
  "id" UUID NOT NULL PRIMARY KEY,
  "organizationId" UUID NOT NULL REFERENCES "Organization"("id"),
  "legalEntityId" UUID NOT NULL,
  "fiscalPeriodId" UUID NOT NULL,
  "sourceKey" TEXT NOT NULL,
  "preparedById" UUID NOT NULL REFERENCES "User"("id"),
  "decidedById" UUID REFERENCES "User"("id"),
  "decision" "AccountingPostingApprovalDecision" NOT NULL DEFAULT 'PENDING',
  "evidence" JSONB NOT NULL,
  "expiresAt" TIMESTAMP(3),
  "decidedAt" TIMESTAMP(3),
  "consumedAt" TIMESTAMP(3),
  "journalId" UUID UNIQUE REFERENCES "AccountingJournal"("id"),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AccountingApprovalSeparation" CHECK ("decidedById" IS NULL OR "decidedById" <> "preparedById")
);
CREATE UNIQUE INDEX "AccountingPostingApproval_organizationId_sourceKey_key" ON "AccountingPostingApproval"("organizationId", "sourceKey");
CREATE INDEX "AccountingPostingApproval_organizationId_decision_expiresAt_idx" ON "AccountingPostingApproval"("organizationId", "decision", "expiresAt");

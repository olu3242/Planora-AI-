-- Missing canonical ledger prerequisite, required before bank/AP/AR foreign keys.
-- Fresh-database recovery only is certified here; reconcile existing hosted history separately.
BEGIN;
CREATE TYPE "AccountingPeriodState" AS ENUM ('OPEN', 'SOFT_CLOSED', 'HARD_CLOSED');
CREATE TYPE "AccountingJournalStatus" AS ENUM ('DRAFT', 'POSTED');
ALTER TABLE "FiscalPeriod" ADD COLUMN "accountingCloseState" "AccountingPeriodState" NOT NULL DEFAULT 'OPEN';

CREATE TABLE "AccountingJournal" (
  "id" UUID PRIMARY KEY,
  "organizationId" UUID NOT NULL REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "legalEntityId" UUID NOT NULL REFERENCES "LegalEntity"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "fiscalPeriodId" UUID NOT NULL REFERENCES "FiscalPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "postedById" UUID REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "sourceKey" TEXT NOT NULL,
  "currencyCode" CHAR(3) NOT NULL,
  "description" TEXT,
  "status" "AccountingJournalStatus" NOT NULL DEFAULT 'DRAFT',
  "postedAt" TIMESTAMP(3),
  "reversalOfId" UUID REFERENCES "AccountingJournal"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "AccountingJournal_reversalOfId_key" ON "AccountingJournal"("reversalOfId");
CREATE UNIQUE INDEX "AccountingJournal_organizationId_sourceKey_key" ON "AccountingJournal"("organizationId", "sourceKey");
CREATE INDEX "AccountingJournal_organizationId_legalEntityId_fiscalPeriodId_status_idx" ON "AccountingJournal"("organizationId", "legalEntityId", "fiscalPeriodId", "status");

CREATE TABLE "AccountingJournalLine" (
  "id" UUID PRIMARY KEY,
  "journalId" UUID NOT NULL REFERENCES "AccountingJournal"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "accountId" UUID NOT NULL REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "ordinal" INTEGER NOT NULL,
  "debitMinor" BIGINT NOT NULL DEFAULT 0,
  "creditMinor" BIGINT NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX "AccountingJournalLine_journalId_ordinal_key" ON "AccountingJournalLine"("journalId", "ordinal");
CREATE INDEX "AccountingJournalLine_accountId_idx" ON "AccountingJournalLine"("accountId");
COMMIT;

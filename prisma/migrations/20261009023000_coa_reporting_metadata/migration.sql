CREATE TYPE "FinancialStatementClass" AS ENUM ('PROFIT_AND_LOSS','BALANCE_SHEET','STATISTICAL');
CREATE TYPE "CashFlowClass" AS ENUM ('OPERATING','INVESTING','FINANCING','CASH','NOT_APPLICABLE');
CREATE TYPE "SystemAccountPurpose" AS ENUM ('NONE','CASH','ACCOUNTS_RECEIVABLE','ACCOUNTS_PAYABLE','RETAINED_EARNINGS','SUSPENSE');

ALTER TABLE "Account"
 ADD COLUMN "statementClass" "FinancialStatementClass",
 ADD COLUMN "statementSection" TEXT,
 ADD COLUMN "reportingCode" TEXT,
 ADD COLUMN "cashFlowClass" "CashFlowClass",
 ADD COLUMN "systemPurpose" "SystemAccountPurpose" NOT NULL DEFAULT 'NONE',
 ADD COLUMN "suspenseAllowed" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "Account_organizationId_statementClass_idx" ON "Account"("organizationId","statementClass");
CREATE INDEX "Account_organizationId_cashFlowClass_idx" ON "Account"("organizationId","cashFlowClass");
CREATE INDEX "Account_organizationId_systemPurpose_idx" ON "Account"("organizationId","systemPurpose");

-- CreateEnum
CREATE TYPE "ValidationSeverity" AS ENUM ('ERROR', 'WARNING', 'INFO');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ForecastVersionStatus" ADD VALUE 'SUBMITTED';
ALTER TYPE "ForecastVersionStatus" ADD VALUE 'IN_REVIEW';
ALTER TYPE "ForecastVersionStatus" ADD VALUE 'REVISION_REQUIRED';
ALTER TYPE "ForecastVersionStatus" ADD VALUE 'APPROVED';
ALTER TYPE "ForecastVersionStatus" ADD VALUE 'LOCKED';

-- AlterTable
ALTER TABLE "ForecastVersion" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "lockedAt" TIMESTAMP(3),
ADD COLUMN     "submittedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ImportError" ADD COLUMN     "resolutionGuidance" TEXT,
ADD COLUMN     "resolvedAt" TIMESTAMP(3),
ADD COLUMN     "severity" "ValidationSeverity" NOT NULL DEFAULT 'ERROR';

-- CreateTable
CREATE TABLE "ForecastLine" (
    "id" UUID NOT NULL,
    "forecastVersionId" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "costCenterId" UUID NOT NULL,
    "fiscalPeriodId" UUID NOT NULL,
    "actualAmount" DECIMAL(24,6) NOT NULL,
    "priorForecast" DECIMAL(24,6) NOT NULL,
    "currentForecast" DECIMAL(24,6) NOT NULL,
    "sourceImportBatchId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForecastLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForecastComment" (
    "id" UUID NOT NULL,
    "forecastVersionId" UUID NOT NULL,
    "forecastLineId" UUID,
    "authorId" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "context" JSONB NOT NULL,
    "editedFromId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForecastComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ForecastLine_forecastVersionId_fiscalPeriodId_idx" ON "ForecastLine"("forecastVersionId", "fiscalPeriodId");

-- CreateIndex
CREATE UNIQUE INDEX "ForecastLine_forecastVersionId_accountId_costCenterId_fisca_key" ON "ForecastLine"("forecastVersionId", "accountId", "costCenterId", "fiscalPeriodId");

-- CreateIndex
CREATE INDEX "ForecastComment_forecastVersionId_createdAt_idx" ON "ForecastComment"("forecastVersionId", "createdAt");

-- AddForeignKey
ALTER TABLE "ForecastLine" ADD CONSTRAINT "ForecastLine_forecastVersionId_fkey" FOREIGN KEY ("forecastVersionId") REFERENCES "ForecastVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForecastLine" ADD CONSTRAINT "ForecastLine_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForecastLine" ADD CONSTRAINT "ForecastLine_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "CostCenter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForecastLine" ADD CONSTRAINT "ForecastLine_fiscalPeriodId_fkey" FOREIGN KEY ("fiscalPeriodId") REFERENCES "FiscalPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForecastComment" ADD CONSTRAINT "ForecastComment_forecastVersionId_fkey" FOREIGN KEY ("forecastVersionId") REFERENCES "ForecastVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForecastComment" ADD CONSTRAINT "ForecastComment_forecastLineId_fkey" FOREIGN KEY ("forecastLineId") REFERENCES "ForecastLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForecastComment" ADD CONSTRAINT "ForecastComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForecastComment" ADD CONSTRAINT "ForecastComment_editedFromId_fkey" FOREIGN KEY ("editedFromId") REFERENCES "ForecastComment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION prevent_locked_forecast_line_mutation() RETURNS trigger AS $$
DECLARE version_status "ForecastVersionStatus";
BEGIN
  SELECT status INTO version_status FROM "ForecastVersion" WHERE id = COALESCE(OLD."forecastVersionId", NEW."forecastVersionId");
  IF version_status IN ('APPROVED', 'LOCKED', 'PUBLISHED', 'SUPERSEDED') THEN
    RAISE EXCEPTION 'Finalized forecast lines are immutable';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER forecast_line_protected BEFORE INSERT OR UPDATE OR DELETE ON "ForecastLine"
FOR EACH ROW EXECUTE FUNCTION prevent_locked_forecast_line_mutation();

CREATE OR REPLACE FUNCTION prevent_published_forecast_version_mutation() RETURNS trigger AS $$
BEGIN
  IF OLD.status IN ('LOCKED', 'PUBLISHED', 'SUPERSEDED') THEN
    RAISE EXCEPTION 'Locked forecast versions are immutable';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

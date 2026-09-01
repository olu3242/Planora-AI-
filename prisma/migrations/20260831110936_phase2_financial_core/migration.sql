-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('REVENUE', 'COGS', 'OPERATING_EXPENSE', 'OTHER_INCOME', 'OTHER_EXPENSE', 'ASSET', 'LIABILITY', 'EQUITY', 'STATISTICAL');

-- CreateEnum
CREATE TYPE "NormalBalance" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "FinancialScenario" AS ENUM ('ACTUAL', 'BUDGET', 'FORECAST', 'PLAN', 'TARGET', 'PRIOR_YEAR', 'SCENARIO');

-- CreateEnum
CREATE TYPE "FinancialSourceType" AS ENUM ('SEED', 'MANUAL_TEST_FIXTURE', 'SYSTEM_CALCULATION');

-- CreateEnum
CREATE TYPE "MetricUnit" AS ENUM ('CURRENCY', 'PERCENT', 'NUMBER');

-- CreateEnum
CREATE TYPE "PlanVersionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'CHANGES_REQUESTED', 'RESUBMITTED', 'APPROVED', 'LOCKED');

-- CreateEnum
CREATE TYPE "ForecastVersionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'SUPERSEDED');

-- CreateTable
CREATE TABLE "LegalEntity" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" UUID,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),

    CONSTRAINT "LegalEntity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessUnit" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" UUID,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),

    CONSTRAINT "BusinessUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Geography" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" UUID,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),

    CONSTRAINT "Geography_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" UUID,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostCenter" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" UUID,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),

    CONSTRAINT "CostCenter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AccountType" NOT NULL,
    "normalBalance" "NormalBalance" NOT NULL,
    "parentId" UUID,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Currency" (
    "code" CHAR(3) NOT NULL,
    "name" TEXT NOT NULL,
    "minorUnits" INTEGER NOT NULL,

    CONSTRAINT "Currency_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "FiscalCalendar" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "FiscalCalendar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FiscalYear" (
    "id" UUID NOT NULL,
    "fiscalCalendarId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,

    CONSTRAINT "FiscalYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FiscalPeriod" (
    "id" UUID NOT NULL,
    "fiscalYearId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,

    CONSTRAINT "FiscalPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialFact" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "fiscalPeriodId" UUID NOT NULL,
    "legalEntityId" UUID,
    "businessUnitId" UUID,
    "geographyId" UUID,
    "productId" UUID,
    "customerId" UUID,
    "costCenterId" UUID,
    "scenario" "FinancialScenario" NOT NULL,
    "currencyCode" CHAR(3) NOT NULL,
    "amount" DECIMAL(24,6) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'currency',
    "sourceType" "FinancialSourceType" NOT NULL,
    "sourceIdentifier" TEXT NOT NULL,
    "sourceMetadata" JSONB,
    "versionContext" TEXT NOT NULL DEFAULT 'UNVERSIONED',
    "dimensionKey" TEXT NOT NULL,
    "grainKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialFact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LineageReference" (
    "id" UUID NOT NULL,
    "financialFactId" UUID NOT NULL,
    "sourceType" "FinancialSourceType" NOT NULL,
    "sourceIdentifier" TEXT NOT NULL,
    "sourceLocation" JSONB NOT NULL,
    "transformation" JSONB,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LineageReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricDefinition" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "unit" "MetricUnit" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "MetricDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalculationDefinition" (
    "id" UUID NOT NULL,
    "metricDefinitionId" UUID NOT NULL,
    "expression" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "CalculationDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricDependency" (
    "id" UUID NOT NULL,
    "metricDefinitionId" UUID NOT NULL,
    "dependsOnMetricId" UUID NOT NULL,

    CONSTRAINT "MetricDependency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricValue" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "metricDefinitionId" UUID NOT NULL,
    "fiscalPeriodId" UUID NOT NULL,
    "scenario" "FinancialScenario" NOT NULL,
    "currencyCode" CHAR(3),
    "value" DECIMAL(28,10) NOT NULL,
    "contextKey" TEXT NOT NULL,
    "provenance" JSONB NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MetricValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanVersion" (
    "id" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "PlanVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "correctionOfId" UUID,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Forecast" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Forecast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForecastVersion" (
    "id" UUID NOT NULL,
    "forecastId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "ForecastVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "correctionOfId" UUID,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForecastVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LegalEntity_organizationId_parentId_idx" ON "LegalEntity"("organizationId", "parentId");

-- CreateIndex
CREATE UNIQUE INDEX "LegalEntity_organizationId_code_key" ON "LegalEntity"("organizationId", "code");

-- CreateIndex
CREATE INDEX "BusinessUnit_organizationId_parentId_idx" ON "BusinessUnit"("organizationId", "parentId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessUnit_organizationId_code_key" ON "BusinessUnit"("organizationId", "code");

-- CreateIndex
CREATE INDEX "Geography_organizationId_parentId_idx" ON "Geography"("organizationId", "parentId");

-- CreateIndex
CREATE UNIQUE INDEX "Geography_organizationId_code_key" ON "Geography"("organizationId", "code");

-- CreateIndex
CREATE INDEX "Product_organizationId_parentId_idx" ON "Product"("organizationId", "parentId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_organizationId_code_key" ON "Product"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_organizationId_code_key" ON "Customer"("organizationId", "code");

-- CreateIndex
CREATE INDEX "CostCenter_organizationId_parentId_idx" ON "CostCenter"("organizationId", "parentId");

-- CreateIndex
CREATE UNIQUE INDEX "CostCenter_organizationId_code_key" ON "CostCenter"("organizationId", "code");

-- CreateIndex
CREATE INDEX "Account_organizationId_type_idx" ON "Account"("organizationId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Account_organizationId_code_key" ON "Account"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "FiscalCalendar_organizationId_code_key" ON "FiscalCalendar"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "FiscalYear_fiscalCalendarId_code_key" ON "FiscalYear"("fiscalCalendarId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "FiscalPeriod_fiscalYearId_code_key" ON "FiscalPeriod"("fiscalYearId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "FiscalPeriod_fiscalYearId_ordinal_key" ON "FiscalPeriod"("fiscalYearId", "ordinal");

-- CreateIndex
CREATE INDEX "FinancialFact_organizationId_fiscalPeriodId_scenario_accoun_idx" ON "FinancialFact"("organizationId", "fiscalPeriodId", "scenario", "accountId");

-- CreateIndex
CREATE INDEX "FinancialFact_organizationId_geographyId_productId_idx" ON "FinancialFact"("organizationId", "geographyId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialFact_organizationId_grainKey_key" ON "FinancialFact"("organizationId", "grainKey");

-- CreateIndex
CREATE INDEX "LineageReference_financialFactId_idx" ON "LineageReference"("financialFactId");

-- CreateIndex
CREATE UNIQUE INDEX "MetricDefinition_organizationId_code_key" ON "MetricDefinition"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "CalculationDefinition_metricDefinitionId_key" ON "CalculationDefinition"("metricDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "MetricDependency_metricDefinitionId_dependsOnMetricId_key" ON "MetricDependency"("metricDefinitionId", "dependsOnMetricId");

-- CreateIndex
CREATE INDEX "MetricValue_organizationId_fiscalPeriodId_scenario_idx" ON "MetricValue"("organizationId", "fiscalPeriodId", "scenario");

-- CreateIndex
CREATE UNIQUE INDEX "MetricValue_organizationId_metricDefinitionId_fiscalPeriodI_key" ON "MetricValue"("organizationId", "metricDefinitionId", "fiscalPeriodId", "scenario", "contextKey");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_organizationId_code_key" ON "Plan"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "PlanVersion_planId_version_key" ON "PlanVersion"("planId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "Forecast_organizationId_code_key" ON "Forecast"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "ForecastVersion_forecastId_version_key" ON "ForecastVersion"("forecastId", "version");

-- AddForeignKey
ALTER TABLE "LegalEntity" ADD CONSTRAINT "LegalEntity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalEntity" ADD CONSTRAINT "LegalEntity_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "LegalEntity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessUnit" ADD CONSTRAINT "BusinessUnit_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessUnit" ADD CONSTRAINT "BusinessUnit_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "BusinessUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Geography" ADD CONSTRAINT "Geography_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Geography" ADD CONSTRAINT "Geography_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Geography"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostCenter" ADD CONSTRAINT "CostCenter_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostCenter" ADD CONSTRAINT "CostCenter_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "CostCenter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalCalendar" ADD CONSTRAINT "FiscalCalendar_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalYear" ADD CONSTRAINT "FiscalYear_fiscalCalendarId_fkey" FOREIGN KEY ("fiscalCalendarId") REFERENCES "FiscalCalendar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalPeriod" ADD CONSTRAINT "FiscalPeriod_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "FiscalYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialFact" ADD CONSTRAINT "FinancialFact_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialFact" ADD CONSTRAINT "FinancialFact_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialFact" ADD CONSTRAINT "FinancialFact_fiscalPeriodId_fkey" FOREIGN KEY ("fiscalPeriodId") REFERENCES "FiscalPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialFact" ADD CONSTRAINT "FinancialFact_currencyCode_fkey" FOREIGN KEY ("currencyCode") REFERENCES "Currency"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialFact" ADD CONSTRAINT "FinancialFact_legalEntityId_fkey" FOREIGN KEY ("legalEntityId") REFERENCES "LegalEntity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialFact" ADD CONSTRAINT "FinancialFact_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "BusinessUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialFact" ADD CONSTRAINT "FinancialFact_geographyId_fkey" FOREIGN KEY ("geographyId") REFERENCES "Geography"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialFact" ADD CONSTRAINT "FinancialFact_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialFact" ADD CONSTRAINT "FinancialFact_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialFact" ADD CONSTRAINT "FinancialFact_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "CostCenter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineageReference" ADD CONSTRAINT "LineageReference_financialFactId_fkey" FOREIGN KEY ("financialFactId") REFERENCES "FinancialFact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricDefinition" ADD CONSTRAINT "MetricDefinition_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalculationDefinition" ADD CONSTRAINT "CalculationDefinition_metricDefinitionId_fkey" FOREIGN KEY ("metricDefinitionId") REFERENCES "MetricDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricDependency" ADD CONSTRAINT "MetricDependency_metricDefinitionId_fkey" FOREIGN KEY ("metricDefinitionId") REFERENCES "MetricDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricDependency" ADD CONSTRAINT "MetricDependency_dependsOnMetricId_fkey" FOREIGN KEY ("dependsOnMetricId") REFERENCES "MetricDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricValue" ADD CONSTRAINT "MetricValue_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricValue" ADD CONSTRAINT "MetricValue_metricDefinitionId_fkey" FOREIGN KEY ("metricDefinitionId") REFERENCES "MetricDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricValue" ADD CONSTRAINT "MetricValue_fiscalPeriodId_fkey" FOREIGN KEY ("fiscalPeriodId") REFERENCES "FiscalPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanVersion" ADD CONSTRAINT "PlanVersion_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanVersion" ADD CONSTRAINT "PlanVersion_correctionOfId_fkey" FOREIGN KEY ("correctionOfId") REFERENCES "PlanVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Forecast" ADD CONSTRAINT "Forecast_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForecastVersion" ADD CONSTRAINT "ForecastVersion_forecastId_fkey" FOREIGN KEY ("forecastId") REFERENCES "Forecast"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForecastVersion" ADD CONSTRAINT "ForecastVersion_correctionOfId_fkey" FOREIGN KEY ("correctionOfId") REFERENCES "ForecastVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Published/approved finance versions are historical records. Corrections must be new drafts.
CREATE OR REPLACE FUNCTION prevent_protected_plan_version_mutation() RETURNS trigger AS $$
BEGIN
  IF OLD.status IN ('APPROVED', 'LOCKED') THEN
    RAISE EXCEPTION 'Approved or locked PlanVersion is immutable';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER plan_version_protected BEFORE UPDATE OR DELETE ON "PlanVersion"
FOR EACH ROW EXECUTE FUNCTION prevent_protected_plan_version_mutation();

CREATE OR REPLACE FUNCTION prevent_published_forecast_version_mutation() RETURNS trigger AS $$
BEGIN
  IF OLD.status IN ('PUBLISHED', 'SUPERSEDED') THEN
    RAISE EXCEPTION 'Published or superseded ForecastVersion is immutable';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER forecast_version_protected BEFORE UPDATE OR DELETE ON "ForecastVersion"
FOR EACH ROW EXECUTE FUNCTION prevent_published_forecast_version_mutation();

ALTER TABLE "FinancialFact" ADD CONSTRAINT "FinancialFact_amount_finite" CHECK ("amount" BETWEEN -999999999999999999::numeric AND 999999999999999999::numeric);
ALTER TABLE "Currency" ADD CONSTRAINT "Currency_minorUnits_valid" CHECK ("minorUnits" BETWEEN 0 AND 6);

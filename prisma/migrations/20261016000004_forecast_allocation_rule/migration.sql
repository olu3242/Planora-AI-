CREATE TABLE "ForecastAllocationRule" (
 "id" UUID PRIMARY KEY,
 "organizationId" UUID NOT NULL REFERENCES "Organization"("id") ON DELETE RESTRICT,
 "legalEntityId" UUID NOT NULL REFERENCES "LegalEntity"("id") ON DELETE RESTRICT,
 "fiscalPeriodId" UUID NOT NULL REFERENCES "FiscalPeriod"("id") ON DELETE RESTRICT,
 "accountId" UUID NOT NULL REFERENCES "Account"("id") ON DELETE RESTRICT,
 "currencyCode" CHAR(3) NOT NULL REFERENCES "Currency"("code") ON DELETE RESTRICT,
 "sourceIdentifier" TEXT NOT NULL,
 "shares" JSONB NOT NULL,
 "status" TEXT NOT NULL DEFAULT 'DRAFT' CHECK ("status" IN ('DRAFT','APPROVED','REVOKED')),
 "preparedById" UUID NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT,
 "approvedById" UUID REFERENCES "User"("id") ON DELETE RESTRICT,
 "approvedAt" TIMESTAMP(3),
 "revokedById" UUID REFERENCES "User"("id") ON DELETE RESTRICT,
 "revokedAt" TIMESTAMP(3),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "ForecastAllocationRule_independent_approval" CHECK ("approvedById" IS NULL OR "approvedById" <> "preparedById")
);
CREATE INDEX "ForecastAllocationRule_scope_idx" ON "ForecastAllocationRule" ("organizationId","legalEntityId","fiscalPeriodId","accountId");
CREATE INDEX "ForecastAllocationRule_status_idx" ON "ForecastAllocationRule" ("organizationId","status");

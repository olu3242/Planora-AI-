-- Bank cash mapping proposal. Apply only after isolated migration review.
CREATE TABLE "BankCashMapping" (
 "id" UUID PRIMARY KEY,
 "organizationId" UUID NOT NULL REFERENCES "Organization"("id") ON DELETE RESTRICT,
 "bankAccountId" UUID NOT NULL REFERENCES "BankAccount"("id") ON DELETE RESTRICT,
 "cashAccountId" UUID NOT NULL REFERENCES "Account"("id") ON DELETE RESTRICT,
 "preparedById" UUID NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT,
 "approvedById" UUID REFERENCES "User"("id") ON DELETE RESTRICT,
 "approvedAt" TIMESTAMP(3),
 "effectiveFrom" DATE NOT NULL,
 "effectiveTo" DATE,
 "revokedAt" TIMESTAMP(3),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "BankCashMapping_effective_dates_check" CHECK ("effectiveTo" IS NULL OR "effectiveTo" >= "effectiveFrom"),
 CONSTRAINT "BankCashMapping_approval_pair_check" CHECK (("approvedById" IS NULL AND "approvedAt" IS NULL) OR ("approvedById" IS NOT NULL AND "approvedAt" IS NOT NULL)),
 CONSTRAINT "BankCashMapping_maker_checker_check" CHECK ("approvedById" IS NULL OR "preparedById" <> "approvedById")
);
CREATE INDEX "BankCashMapping_organizationId_bankAccountId_effectiveFrom_idx" ON "BankCashMapping"("organizationId","bankAccountId","effectiveFrom");
CREATE INDEX "BankCashMapping_cashAccountId_idx" ON "BankCashMapping"("cashAccountId");
CREATE UNIQUE INDEX "BankCashMapping_one_active_approved_idx" ON "BankCashMapping"("bankAccountId") WHERE "approvedAt" IS NOT NULL AND "revokedAt" IS NULL AND "effectiveTo" IS NULL;
ALTER TABLE "BankCashMapping" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BankCashMapping" FORCE ROW LEVEL SECURITY;
-- No tenant policy is granted until the runtime role, session scope and security
-- functions are certified. The new table intentionally fails closed.

-- Prevent concurrent approval of overlapping cash-account mapping periods.
-- This constraint covers finite and open-ended effective windows.
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE "BankCashMapping"
  ADD CONSTRAINT "BankCashMapping_no_approved_overlap"
  EXCLUDE USING gist (
    "bankAccountId" WITH =,
    daterange("effectiveFrom", "effectiveTo", '[]') WITH &&
  )
  WHERE ("approvedAt" IS NOT NULL AND "revokedAt" IS NULL);

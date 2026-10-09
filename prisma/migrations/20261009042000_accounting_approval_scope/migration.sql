BEGIN;

ALTER TABLE "AccountingPostingApproval"
  ADD CONSTRAINT "AccountingPostingApproval_legalEntityId_fkey"
  FOREIGN KEY ("legalEntityId") REFERENCES "LegalEntity"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "AccountingPostingApproval_fiscalPeriodId_fkey"
  FOREIGN KEY ("fiscalPeriodId") REFERENCES "FiscalPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION planora_guard_accounting_approval_scope()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "LegalEntity"
    WHERE "id" = NEW."legalEntityId" AND "organizationId" = NEW."organizationId"
  ) THEN
    RAISE EXCEPTION 'ACCOUNTING_APPROVAL_ENTITY_SCOPE_MISMATCH' USING ERRCODE = '23514';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM "FiscalPeriod" p
    JOIN "FiscalYear" y ON y."id" = p."fiscalYearId"
    JOIN "FiscalCalendar" c ON c."id" = y."fiscalCalendarId"
    WHERE p."id" = NEW."fiscalPeriodId" AND c."organizationId" = NEW."organizationId"
  ) THEN
    RAISE EXCEPTION 'ACCOUNTING_APPROVAL_PERIOD_SCOPE_MISMATCH' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER accounting_posting_approval_scope_guard
BEFORE INSERT OR UPDATE ON "AccountingPostingApproval"
FOR EACH ROW EXECUTE FUNCTION planora_guard_accounting_approval_scope();

CREATE OR REPLACE FUNCTION planora_protect_accounting_posting_approval()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'ACCOUNTING_APPROVAL_IMMUTABLE' USING ERRCODE = '23514';
  END IF;
  IF OLD."consumedAt" IS NOT NULL THEN
    RAISE EXCEPTION 'ACCOUNTING_APPROVAL_CONSUMED_IMMUTABLE' USING ERRCODE = '23514';
  END IF;
  IF NEW."organizationId" IS DISTINCT FROM OLD."organizationId" OR
     NEW."legalEntityId" IS DISTINCT FROM OLD."legalEntityId" OR
     NEW."fiscalPeriodId" IS DISTINCT FROM OLD."fiscalPeriodId" OR
     NEW."sourceKey" IS DISTINCT FROM OLD."sourceKey" OR
     NEW."preparedById" IS DISTINCT FROM OLD."preparedById" OR
     NEW."evidence" IS DISTINCT FROM OLD."evidence" OR
     NEW."createdAt" IS DISTINCT FROM OLD."createdAt" THEN
    RAISE EXCEPTION 'ACCOUNTING_APPROVAL_PROVENANCE_IMMUTABLE' USING ERRCODE = '23514';
  END IF;
  IF OLD."decision" <> 'PENDING' AND (
    NEW."decision" IS DISTINCT FROM OLD."decision" OR
    NEW."decidedById" IS DISTINCT FROM OLD."decidedById" OR
    NEW."decidedAt" IS DISTINCT FROM OLD."decidedAt" OR
    NEW."expiresAt" IS DISTINCT FROM OLD."expiresAt"
  ) THEN
    RAISE EXCEPTION 'ACCOUNTING_APPROVAL_DECISION_IMMUTABLE' USING ERRCODE = '23514';
  END IF;
  IF NEW."consumedAt" IS NOT NULL AND (
    NEW."decision" <> 'APPROVED' OR NEW."expiresAt" IS NULL OR
    NEW."expiresAt" <= clock_timestamp() OR NEW."consumedAt" > NEW."expiresAt"
  ) THEN
    RAISE EXCEPTION 'ACCOUNTING_APPROVAL_NOT_CONSUMABLE' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER accounting_posting_approval_immutable
BEFORE UPDATE OR DELETE ON "AccountingPostingApproval"
FOR EACH ROW EXECUTE FUNCTION planora_protect_accounting_posting_approval();

COMMIT;
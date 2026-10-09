-- Accounting immutability guard. Apply only after reviewing existing migrations.
-- PostgreSQL triggers protect posted journals, journal lines, and accounting audit history.
CREATE OR REPLACE FUNCTION planora_protect_posted_journal()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' AND OLD.status = 'POSTED' THEN
    RAISE EXCEPTION 'POSTED_JOURNAL_IMMUTABLE' USING ERRCODE = '23514';
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'POSTED' THEN
    RAISE EXCEPTION 'POSTED_JOURNAL_IMMUTABLE' USING ERRCODE = '23514';
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'DRAFT' AND NEW.status = 'POSTED' THEN
    IF NEW."postedAt" IS NULL OR NEW."postedById" IS NULL THEN
      RAISE EXCEPTION 'POSTING_PROVENANCE_REQUIRED' USING ERRCODE = '23514';
    END IF;
    IF (SELECT COUNT(*) FROM "AccountingJournalLine" WHERE "journalId" = NEW.id) < 2 THEN
      RAISE EXCEPTION 'JOURNAL_REQUIRES_TWO_LINES' USING ERRCODE = '23514';
    END IF;
    IF EXISTS (SELECT 1 FROM "AccountingJournalLine" WHERE "journalId" = NEW.id
      AND ("debitMinor" < 0 OR "creditMinor" < 0 OR
        (("debitMinor" > 0) = ("creditMinor" > 0)))) THEN
      RAISE EXCEPTION 'INVALID_JOURNAL_LINE' USING ERRCODE = '23514';
    END IF;
    IF (SELECT COALESCE(SUM("debitMinor"), 0) FROM "AccountingJournalLine" WHERE "journalId" = NEW.id)
      <> (SELECT COALESCE(SUM("creditMinor"), 0) FROM "AccountingJournalLine" WHERE "journalId" = NEW.id) THEN
      RAISE EXCEPTION 'UNBALANCED_JOURNAL' USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

DROP TRIGGER IF EXISTS planora_posted_journal_immutable ON "AccountingJournal";
CREATE TRIGGER planora_posted_journal_immutable
BEFORE UPDATE OR DELETE ON "AccountingJournal"
FOR EACH ROW EXECUTE FUNCTION planora_protect_posted_journal();

CREATE OR REPLACE FUNCTION planora_protect_posted_journal_line()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  parent_status text;
BEGIN
  SELECT status::text INTO parent_status FROM "AccountingJournal"
    WHERE id = CASE WHEN TG_OP = 'INSERT' THEN NEW."journalId" ELSE OLD."journalId" END
    FOR UPDATE;
  IF parent_status IS NULL THEN
    RAISE EXCEPTION 'JOURNAL_PARENT_NOT_FOUND' USING ERRCODE = '23503';
  END IF;
  IF parent_status = 'POSTED' THEN
    RAISE EXCEPTION 'POSTED_JOURNAL_LINE_IMMUTABLE' USING ERRCODE = '23514';
  END IF;
  IF TG_OP = 'UPDATE' AND NEW."journalId" IS DISTINCT FROM OLD."journalId" THEN
    RAISE EXCEPTION 'JOURNAL_LINE_REPARENT_DENIED' USING ERRCODE = '23514';
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

DROP TRIGGER IF EXISTS planora_posted_journal_line_immutable ON "AccountingJournalLine";
CREATE TRIGGER planora_posted_journal_line_immutable
BEFORE INSERT OR UPDATE OR DELETE ON "AccountingJournalLine"
FOR EACH ROW EXECUTE FUNCTION planora_protect_posted_journal_line();

-- Audit events are append-only. Corrections require a new compensating event.
CREATE OR REPLACE FUNCTION planora_protect_audit_event()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'AUDIT_EVENT_IMMUTABLE' USING ERRCODE = '23514';
END;
$$;

DROP TRIGGER IF EXISTS planora_audit_event_immutable ON "AuditEvent";
CREATE TRIGGER planora_audit_event_immutable
BEFORE UPDATE OR DELETE ON "AuditEvent"
FOR EACH ROW EXECUTE FUNCTION planora_protect_audit_event();

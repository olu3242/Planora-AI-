BEGIN;
CREATE OR REPLACE FUNCTION planora_reporting_delete_guard() RETURNS trigger AS $$
BEGIN
 IF OLD."lockedAt" IS NOT NULL THEN RAISE EXCEPTION 'locked reporting run is immutable'; END IF;
 RETURN OLD;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER "ReportingRun_locked_delete" BEFORE DELETE ON "ReportingRun"
FOR EACH ROW EXECUTE FUNCTION planora_reporting_delete_guard();

-- Parent locking makes evidence edits atomic with review/approval. Locking only an
-- application read is insufficient when a direct database writer races approval.
CREATE OR REPLACE FUNCTION planora_reporting_child_immutable() RETURNS trigger AS $$
DECLARE locked_at TIMESTAMP(3); run_status "ReportingRunStatus";
BEGIN
 SELECT "lockedAt", "status" INTO locked_at, run_status FROM "ReportingRun"
 WHERE "id"=CASE WHEN TG_OP='DELETE' THEN OLD."runId" ELSE NEW."runId" END FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'reporting parent missing'; END IF;
 IF locked_at IS NOT NULL THEN RAISE EXCEPTION 'locked reporting evidence is immutable'; END IF;
 IF TG_OP='UPDATE' AND NEW."runId" IS DISTINCT FROM OLD."runId" THEN RAISE EXCEPTION 'reporting evidence reparent denied'; END IF;
 IF TG_TABLE_NAME='ReportingDisclosureEvidence' AND run_status<>'DRAFT' THEN RAISE EXCEPTION 'reviewed reporting evidence is immutable'; END IF;
 IF TG_TABLE_NAME='ReportingApproval' AND TG_OP<>'INSERT' THEN RAISE EXCEPTION 'reporting approvals are append-only'; END IF;
 RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END; $$ LANGUAGE plpgsql;
DROP TRIGGER "ReportingDisclosureEvidence_locked_immutable" ON "ReportingDisclosureEvidence";
CREATE TRIGGER "ReportingDisclosureEvidence_locked_immutable" BEFORE INSERT OR UPDATE OR DELETE ON "ReportingDisclosureEvidence"
FOR EACH ROW EXECUTE FUNCTION planora_reporting_child_immutable();
DROP TRIGGER "ReportingApproval_append_only" ON "ReportingApproval";
CREATE TRIGGER "ReportingApproval_append_only" BEFORE INSERT OR UPDATE OR DELETE ON "ReportingApproval"
FOR EACH ROW EXECUTE FUNCTION planora_reporting_child_immutable();
COMMIT;

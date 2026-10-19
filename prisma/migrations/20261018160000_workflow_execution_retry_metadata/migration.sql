-- Preserve retry metadata across worker restarts without rewriting existing rows.
ALTER TABLE "WorkflowExecutionRecord"
  ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "errorClass" TEXT;

ALTER TABLE "WorkflowExecutionRecord"
  ADD CONSTRAINT "WorkflowExecutionRecord_attempts_nonnegative"
  CHECK ("attempts" >= 0);

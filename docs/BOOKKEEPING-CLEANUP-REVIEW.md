# Bookkeeping cleanup review workflow

The proposal engine detects deterministic duplicate candidates and invalid financial input. It does not change source rows, journals or bank transactions.

## Routes
- `/bookkeeping-cleanup`: tenant-scoped list of completed cleanup executions.
- `/bookkeeping-cleanup/[executionId]`: finding review with decision form.
- `GET /api/accounting/bookkeeping-cleanup/runs`: completed executions.
- `GET /api/accounting/bookkeeping-cleanup/review?executionId=<uuid>`: findings and persisted review state.
- `POST /api/accounting/bookkeeping-cleanup/review`: accept or reject an individual finding with a reason.

## Security and certification
Sessions and membership roles are resolved server-side. Reviewer permission is required. The proposal author cannot decide their own findings. Review outcomes are append-only audit events. This workflow does not authorize posting, deletion, or reconciliation certification.

Remaining: authenticated route tests, PostgreSQL race and tenant-isolation tests, browser review journey, approved correction workflow, CI audit gate. Release NO-GO until all applicable checks pass.

# Planora harmonization — ten-batch execution continuation (B21–B30)
Date: 2026-10-15
Status: PARTIAL — SOURCE RECONCILIATION IN PROGRESS

| Batch | Task | Evidence/status |
|---|---|---|
| B21 | Restore tenant transaction Prisma client | DONE (source merge conflict resolved in src/lib/prisma.ts) |
| B22 | Validate tenant context API callers | Pending code review |
| B23 | Reconcile Prisma schema conflicts | BLOCKED pending migration/branch semantic audit |
| B24 | Reconcile package scripts/dependencies | BLOCKED pending dependency lock review |
| B25 | Reconcile CI workflow | BLOCKED pending validated runtime and DB fixtures |
| B26 | Enumerate tenant tables and restricted DB roles | Pending |
| B27 | Enforce RLS USING/WITH CHECK | BLOCKED by B23/B26 |
| B28 | Certify posting/approval/immutability | BLOCKED by B23/B27 |
| B29 | Certify reconciliation fail-closed mapping | Existing guard confirmed, full tests pending |
| B30 | Full isolated PostgreSQL + E2E gates | NO-GO pending B23-B29 |

## Source evidence
- src/lib/prisma.ts had a HEAD implementation using AsyncLocalStorage and transaction-scoped Prisma proxy versus origin/main singleton. Kept the transaction-scoped implementation because it is needed for existing tenant transaction call sites; do not assume this alone enforces RLS.
- src/application/accounting/reconciliation-service.ts denies reconciliation without BANK_LEDGER_MAPPING_REQUIRED.
- package.json, prisma/schema.prisma, CLAUDE.md, and .github/workflows/ci.yml still contain unresolved conflict markers at inspection.
- scripts/check-merge-conflicts.mjs and independent preflight workflow already exist on this branch.

## Safety decision
Do not blindly resolve complex schema or dependency conflicts. Preserve all financial models and historical migrations, then run local schema validation, isolated DB, authorization, posting, and E2E certification. No production deployment or hosted migration approved.

## Execution honesty
B21 source edit is committed; B22–B30 are tracked but not implemented or certified. No tests were executed in this GitHub-only pass.

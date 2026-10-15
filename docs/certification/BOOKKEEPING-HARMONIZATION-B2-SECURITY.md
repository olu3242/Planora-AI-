# B2 Security and Accounting Integrity — Execution Contract
Date: 2026-10-15
Status: BLOCKED PENDING SCHEMA RECONCILIATION AND EXECUTABLE CERTIFICATION
Branch: work/bookkeeping-harmonization-b1-20261015

## Evidence-backed observations
- prisma/schema.prisma contains unresolved Git conflict markers, including enums and model relations. Do not run schema migrations until all conflicts are semantically reconciled.
- src/application/accounting/reconciliation-service.ts intentionally throws BANK_LEDGER_MAPPING_REQUIRED without a persisted approved cash-ledger mapping. Preserve this fail-closed behavior.
- docs/SECURITY-RBAC.md specifies session-derived organization scope, deny-by-default authorization, and audit requirements.
- IMPLEMENTATION-BATCH-REGISTER.md records zero certified RLS policies and blocked tenant security.

## Required implementation sequence
1. Preserve existing work. Reconcile schema conflict sections against the integration branches and migration history; run Prisma validate and migration drift checks before editing database structure.
2. Inventory all tenant-owned tables, their organization or legal-entity relationship, and every runtime query/posting entrypoint.
3. Introduce transaction-scoped, fail-closed tenant context for the restricted database runtime role. Do not use a privileged owner role for tenant-facing traffic.
4. Add PostgreSQL row-level policies with both USING and WITH CHECK as appropriate, including indirect tenant relationships. Apply FORCE ROW LEVEL SECURITY where necessary after evaluating migration/admin paths.
5. Validate membership and permission from authenticated session, not request-supplied organization ID. Deny missing/invalid context and cross-tenant identifiers.
6. Enforce journal posting through one authenticated transaction: balanced lines in minor units, legal entity/period scope, idempotency key, required approval, maker-checker separation, immutable posted journal and audit event.
7. Maintain explicit reversal/restatement commands rather than mutating posted journals. Reject hard-closed period writes.
8. Keep bank reconciliation blocked until approved bank-to-ledger mapping exists; no fabricated matches or synthetic balances.
9. Add positive and negative tests for RLS bypass, cross-tenant reads/writes, role escalation, approval self-decision, replay, concurrency, failure rollback, and period locks.
10. Run Prisma validate, lint, typecheck, build, unit/integration, isolated PostgreSQL, browser E2E, and security suites on the exact commit. Record command outputs, pass/fail counts, and blockers.

## Acceptance
No claim of B2 completion until isolated PostgreSQL verifies tenant isolation under a non-bypass runtime role and the posting/approval lifecycle passes end-to-end. No production migration, merge, or deploy without explicit approval.

## Current execution result
Tracked B2 implementation specification only. No database policies or posting code were changed, and no test suite was executed by this GitHub-only execution.

# Planora G371–G380 — Browser E2E failure isolation

Date: 2026-10-17. Release: **NO-GO / NOT CERTIFIED**.

| Batch | Workstream | Evidence |
|---|---|---|
| G371 | Inspect prior exact-SHA run 39043565018 | CI failed |
| G372 | Inspect Accounting Integrity 39043565098 | PASS |
| G373 | Inspect Merge Conflict Preflight 39043565073 | PASS |
| G374 | Inspect security-audit job | FAILED; five high-severity findings |
| G375 | Inspect full certify logs | browser E2E: 14 passed, 13 failed |
| G376 | Confirm runtime env repair | RUNTIME_DATABASE_URL_REQUIRED no longer reported |
| G377 | Identify next browser backend failure | PostgreSQL 42883: planora_session_tenant() function does not exist |
| G378 | Add structured Playwright JSON reporter | Committed |
| G379 | Upload structured E2E result artifact in CI | Committed |
| G380 | Restore missing database function and certify | Pending investigation; no function fabricated |

## Required migration analysis
The application calls `planora_session_tenant()` in `src/lib/tenant-database.ts`. The browser server reports PostgreSQL 42883: undefined function, despite migrations and RLS test setup. Inspect the canonical migration history and actual `pg_proc` state after the second test reset/seed. Determine whether the function was never migrated, dropped by reset, installed in a different schema, or missing from the checked-in migrations. Fix the authoritative migration and add a function-presence regression test. Do not bypass session validation, substitute a hardcoded tenant, grant BYPASSRLS, or hide browser failures.

## Evidence boundary
The 13 browser failures may have multiple causes; missing session function is one confirmed backend cause, not proven to explain all failures. Security audit remains a mandatory failing gate. No production migration, deployment or PR merge.

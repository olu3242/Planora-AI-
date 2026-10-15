# Planora gap execution G31–G40
Date: 2026-10-15
Status: PARTIAL — NOT CERTIFIED

| Batch | Scope | Result |
|---|---|---|
| G31 | Inspect canonical posting adapter | Done |
| G32 | Confirm authenticated actor/tenant checks | Source inspected |
| G33 | Confirm serializable transaction and audit | Source inspected, not executed |
| G34 | Harden malformed trusted actor/tenant IDs | Code committed |
| G35 | Harden null/non-string source key | Code committed |
| G36 | Add cross-tenant preflight regression | Test committed |
| G37 | Add invalid source-key regressions | Tests committed |
| G38 | Add invalid currency and minor-unit regressions | Tests committed |
| G39 | Run isolated PostgreSQL concurrency/RLS/rollback | Pending |
| G40 | Full exact-SHA certification | NO-GO |

## Evidence
Updated src/lib/accounting/prisma-posting-adapter.ts and added tests/unit/accounting-posting-preflight.test.ts with five cases. Source inspections confirm the adapter's transaction boundary and approval consumption logic, but not its behavior under live PostgreSQL. No test runner was executed in this connector-only pass.

## Remaining implementation and certification
- Run targeted unit tests, typecheck, Prisma validate, and full suite.
- Verify restricted database role and RLS with cross-tenant negative tests.
- Certify concurrent duplicate requests, approval races, transaction rollback, immutable audit and period locking against isolated PostgreSQL.
- Verify posting is reachable only through trusted server-side session command.
- No production migration or deployment until explicit authorization and green evidence.

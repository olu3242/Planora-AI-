# Planora G301–G310 — Isolated tenant RLS runtime provisioning

Date: 2026-10-17. Release decision: **NO-GO**.

| Batch | Change | Result |
|---|---|---|
| G301 | Inspect CI security test blocker | TEST_RUNTIME_DATABASE_URL missing |
| G302 | Inspect test database URL guard | Loopback and *_test database enforced |
| G303 | Inspect tenant RLS assertions | Non-owner role required; no owner fallback |
| G304 | Implement isolated role provisioning | scripts/provision-rls-runtime-test.ts committed |
| G305 | Reject unsafe runtime URL | Same host, port, database and schema enforced |
| G306 | Restrict runtime role privileges | No superuser, createdb, createrole, bypassrls; User and Session access revoked |
| G307 | Wire runtime test connection in CI | TEST_RUNTIME_DATABASE_URL configured |
| G308 | Provision after database reset and seed | test:security script updated |
| G309 | Avoid premature grants before database reset | CI sequence corrected |
| G310 | Re-run exact-SHA CI and RLS verification | Pending; no passing evidence yet |

## Security conditions
Role provisioning is limited to APP_ENV=test and a loopback *_test PostgreSQL database. Role has no superuser, BYPASSRLS, CREATEDB or CREATEROLE. The RLS suite must still demonstrate all 56 tenant policies, no-session denial, cross-tenant CRUD isolation, concurrency isolation, and membership/session revocation. If role grants or function execution fail, correct the minimal required privileges; do not disable RLS or substitute owner credentials.

## Outstanding release gates
Full exact-SHA CI, independent moderate-or-higher security audit, PostgreSQL RLS and browser E2E must pass. Security audit previously reported five high-severity dependency advisories. Do not merge PR #7, migrate hosted databases or deploy until all release gates are green.

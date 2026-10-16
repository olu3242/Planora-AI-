# Bookkeeping Cleanup BC11–BC20 — persistence and authorization foundation

| Batch | Scope | Result |
|---|---|---|
| BC11 | Persistent cleanup case table | Committed |
| BC12 | Tenant and legal entity foreign keys | Committed |
| BC13 | Fiscal period foreign key | Committed |
| BC14 | RLS ENABLE/FORCE and tenant policies | Committed |
| BC15 | Prisma model and opposite relations | Committed |
| BC16 | Idempotent case registration | Committed (upsert by deterministic key) |
| BC17 | Transactional scope verification | Committed |
| BC18 | Revision-fenced workflow transitions | Committed |
| BC19 | Four migration regression checks | Written, not executed |
| BC20 | CI coverage and production certification | CI configured; NO-GO |

## Critical boundaries
- Repository methods are internal server functions. Callers must derive organization ID, actor ID and role from an authenticated session, not client input. This wave does not yet provide an authenticated action API.
- Workflow state EXECUTION_PENDING is not proof of a journal correction. VERIFICATION must eventually require an independent accounting execution receipt, rather than arbitrary evidence text.
- RLS UPDATE policy allows tenant updates; column immutability, role grants, audit append-only enforcement and transition integrity must be proven at DB level. Do not expose this repository to untrusted callers.
- PostgreSQL role-based cross-tenant tests, migration deployment, Prisma validation/typecheck, integration E2E, and full bookkeeping-to-readiness recalculation remain pending.
- Do not rewrite already-applied migrations; use forward migrations when required.

Certification: PARTIAL / NO-GO. No hosted deployment.

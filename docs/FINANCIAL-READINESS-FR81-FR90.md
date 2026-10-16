# FR81–FR90 — database integrity and certification

| Batch | Scope | Outcome |
|---|---|---|
| FR81 | Inspect prior commit PR workflow runs | No runs returned (PR-filtered lookup only) |
| FR82 | Legal entity referential integrity | FK committed to migration |
| FR83 | Assessment RLS enforcement | Static regression check written |
| FR84 | Evidence RLS enforcement | Static regression check written |
| FR85 | Immutable write policy | Static regression check written |
| FR86 | Evidence organization-scoped FK | Static regression check written |
| FR87 | Include migration tests in CI | Committed |
| FR88 | Prisma schema validation | Workflow configured; not observed passing |
| FR89 | Live PostgreSQL cross-tenant verification | Not executed |
| FR90 | Full readiness certification | NO-GO |

Important unresolved mismatch: assessment periodId is currently TEXT, while Planora FiscalPeriod.id is UUID. Harmonize the column and Prisma model before migration is applied to hosted databases. Migration editing is only safe while unapplied; if already applied, create a forward migration instead.

Additional blockers: runtime non-BYPASSRLS role proof, Prisma typecheck, actual accounting source certification, entity-period authorization, read-only HTTP/browser E2E, idempotency and source-revision invalidation. Static SQL checks do not prove PostgreSQL RLS behavior. No deployment or certification claimed.

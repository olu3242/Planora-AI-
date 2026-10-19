# G461–G470 — Authoritative tenant RLS migration provenance

Date: 2026-10-17. Decision: **NO-GO / NOT CERTIFIED**.

| Batch | Scope | Result |
|---|---|---|
| G461 | Inspect exact-SHA CI 39077774940 | Certify in progress at inspection |
| G462 | Verify accounting-integrity gate | PASS |
| G463 | Verify merge-conflict preflight | PASS |
| G464 | Verify independent security audit | FAIL |
| G465 | Search authoritative migration sources | Found prisma/migrations/20261009060000_tenant_rls/migration.sql |
| G466 | Inspect migration SQL | Contains session function and forced tenant policies |
| G467 | Inspect migration generator | scripts/generate-tenant-rls.mjs defines function and policy SQL |
| G468 | Require migration record finished, not rolled back | Implemented in isolated database diagnostic |
| G469 | Verify applied migration checksum against checked-in SQL | Implemented |
| G470 | Execute Docker migration reproduction and repair | Pending; Docker unavailable in assistant environment |

The missing PostgreSQL function was reported in a prior browser E2E run, but the repository's canonical migration already contains its definition. The root cause is not yet proven. Possible causes include an unapplied/failed migration, schema mismatch, reset sequencing, or database targeting. The shared diagnostic now checks `public._prisma_migrations`, exact SHA-256 checksum, exact function signature, and forced policies on all 56 manifest tables. It fails closed rather than rewriting historical migrations or inventing session validation.

No production migration, merge or deployment. Independent dependency security audit remains mandatory and failing.

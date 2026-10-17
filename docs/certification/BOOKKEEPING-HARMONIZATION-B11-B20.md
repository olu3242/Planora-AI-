# Planora bookkeeping harmonization — next 10 batches (B11–B20)
Date: 2026-10-15
Status: BLOCKED BY EXISTING MERGE CONFLICTS AND B2 SECURITY CERTIFICATION

## Verified blocker
GitHub branch contains unresolved conflict markers in package.json, prisma/schema.prisma and CLAUDE.md. A package manager, Prisma parser or TypeScript build cannot be assumed valid. Existing README and accounting docs also have conflict markers. Never auto-select HEAD or origin/main without semantic reconciliation.

## Batch register
| Batch | Implementation slice | Acceptance |
| --- | --- | --- |
| B11 | Repository conflict inventory and merge gate | Run node scripts/check-merge-conflicts.mjs; zero markers |
| B12 | Semantic Prisma model and migration reconciliation | Prisma validate; migration drift reviewed; no dropped models |
| B13 | Package/toolchain harmonization | install, lint, typecheck, build pass on same SHA |
| B14 | Tenant-owned table and runtime-role inventory | explicit table-to-tenant mapping; no bypass role |
| B15 | Tenant RLS policies | PostgreSQL USING/WITH CHECK tests for each tenant-owned table |
| B16 | Authenticated posting command | atomic balanced journal, period check, idempotency |
| B17 | Maker-checker approvals | self-approval denied; role/tenant restrictions |
| B18 | Immutable audit and reversal | tampering rejected; reversible through controlled journal |
| B19 | Bank-ledger mapping controls | approved mapping required before reconciliation |
| B20 | Integrated B11-B19 certification | isolated DB, negative tests, browser, security, exact SHA evidence |

## This execution
Implemented a dependency-free merge-conflict gate at scripts/check-merge-conflicts.mjs. It exits nonzero when conflict markers remain. It is intentionally not wired into package.json because package.json is presently syntactically invalid. No financial posting, migration, or deployment performed.

## Next required work
Run the gate in a local checkout and reconcile all conflicts against source branches and migrations. Do not begin B15-B20 until B12-B14 prerequisites pass. Preserve existing dirty work.

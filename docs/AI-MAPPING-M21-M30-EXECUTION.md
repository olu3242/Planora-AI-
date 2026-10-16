# Planora AI Mapping — M21–M30 execution

## Committed artifacts
- New PostgreSQL migration for proposal, work-item, review records, composite tenant foreign keys, unique idempotency and default-deny RLS.
- Matching Prisma models with names distinct from workbook MappingDecision.
- Transactional repository adapter and five mock-backed contract tests.

## Batch register
| Batch | Work | Status |
|---|---|---|
| M21 | Database proposal schema | Committed, unverified |
| M22 | Work item and review schema | Committed, unverified |
| M23 | Tenant uniqueness / idempotency | Committed, unverified |
| M24 | Restrictive RLS foundation | Committed; policies pending |
| M25 | Prisma schema model integration | Committed, validation pending |
| M26 | Atomic proposal/work item repository | Committed, DB integration pending |
| M27 | Review persistence | Committed, authenticated role checks pending |
| M28 | Tenant work-item query | Committed, auth integration pending |
| M29 | Repository contract tests | Five written, not executed |
| M30 | Hosted end-to-end certification | BLOCKED |

## Must resolve before GO
1. Run Prisma validate and migrate against isolated disposable PostgreSQL; confirm schema SQL and Prisma client agree.
2. Add authenticated tenant-scoped RLS policies or a certified tenant-bound DB role strategy. No BYPASSRLS. FORCE RLS currently defaults deny.
3. Resolve server-derived session identity and role authorization before calling repository; repository parameters alone are not authentication.
4. Validate review decisions and account eligibility from trusted database reads within the same transaction; review repository currently trusts prevalidated review objects.
5. Make review writes and work-item state transitions atomic and record immutable audit evidence.
6. Address proposal replay and concurrent writes under a real database unique constraint.
7. Add accounting policy and reporting E2E plus posting gate negative cases.
8. Run unit, integration, security, Prisma validation, migration and browser E2E; record raw results.
9. No merge or deployment until all accounting certification gates pass.

Status: PARTIAL / NO-GO. This is not a certified E2E implementation.

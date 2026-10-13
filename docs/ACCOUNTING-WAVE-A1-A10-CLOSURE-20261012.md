# Accounting Core Wave A1-A10 Closure Register

Branch: `work/accounting-e2e-certification-20261012`
Baseline: `d2c819e53f52d9fefec131f52114d0f96992fb4c`
Certification anchor: Issue #5
Status: **CODE-COMPLETE / CERTIFICATION PENDING**

This register reconciles the old A1-A10 wave to the implementation actually present on the branch. It does not convert unexecuted database or hosted checks into PASS.

| Batch | Control | Code state | Certification state |
|---|---|---|---|
| A1 | Schema/contracts inventory | COMPLETE | Prisma/migration execution pending |
| A2 | Balanced journal + posting state | PRESENT | execution pending |
| A3 | Tenant/entity/period/currency/account preflight | PRESENT | execution pending |
| A4 | Reversal provenance + idempotency | PRESENT | DB execution pending |
| A5 | Approval + segregation of duties | PRESENT in governed posting/control layer | DB negative-path execution pending |
| A6 | Tenant/entity isolation/RLS | PRESENT with security tests | DB/RLS execution pending |
| A7 | Concurrency/double-post prevention | PRESENT via transactional period locking + unique source semantics | concurrent DB execution pending |
| A8 | Accounting audit provenance/immutability | PRESENT | trigger execution pending |
| A9 | Migration integrity | PRESENT in accounting integrity CI/migrations | CI + disposable DB execution pending |
| A10 | Core certification suite | PRESENT | full suite/build/browser execution pending |

## Evidence already in repository
- `src/application/accounting/post-journal.ts`: authenticated transactional posting, period row lock, tenant/entity/period checks, posting-account validation, source-key idempotency preflight and audit event.
- `src/domain/accounting/posting-policy.ts` and journal validation: deterministic posting preflight and balanced-entry rules.
- `prisma/migrations/20261009041000_accounting_immutability/migration.sql`: posted journal/line immutability database triggers.
- `tests/integration/accounting-database-certification.test.ts`: database assertions for immutability and approval controls.
- Accounting unit tests cover approval policy, posting policy, journal validation, reversal provenance, close orchestration, reconciliation/aging, FP&A bridge and governed posting.
- Security suite contains tenant-isolation negative paths.
- `.github/workflows/accounting-integrity.yml` provides the accounting integrity CI boundary.

## Deferred executable gate
When a repository checkout and PostgreSQL environment are available, run the exact package-supported equivalents of:
1. dependency install;
2. Prisma validate + generate;
3. migration history/integrity against an isolated disposable database;
4. typecheck + lint;
5. accounting unit/integration/security suites;
6. full test suite + coverage;
7. production build;
8. browser Golden Accounting Journey.

Record exact commands, pass/fail counts, coverage, database identity, migration checksums and commit SHA.

## Closure decision
**A1-A10 is closed for implementation progression, not production certification.**
No missing-control redesign is required before beginning B1-B10. Any defect found by deferred execution reopens the affected A-batch. Production release remains NO-GO until Issue #5 gates pass.

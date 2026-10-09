# S03 — Schema and Migration Reconciliation
Date: 2026-10-09
Status: STATIC INSPECTION COMPLETE; RUNTIME VALIDATION PENDING

## Compared baselines
| Branch | Prisma schema blob | Models | Migration SQL files |
| --- | --- | ---: | ---: |
| feat/forecast-mvp-certification | 0241e623853151fabf051772007a4cfe7c278cf2 | 43 | 9 |
| feat/accounting-ledger-foundation | fbdfff0e572f2a6aff97518266d451fa68e56fe1 | 56 | 12 |
| feat/reporting-governance-convergence | 71bfb39fae1806b1e6070b36d0a30dc8a06f84fe | 60 | 13 |
| feat/ai-native-accounting-execution | 27611a88b3cf7c6ecf51e6b1f60d7ebfb20b1d54 | 61 | 13 |
| fix/accounting-fpa-schema-harmonization | e3978c83d10a5d433dd1d356361d59feae1ad96a | 61 | 13 |

Note: schema blob SHA shown for the harmonization branch is the fetched file's GitHub blob identifier. Distinct schema content was confirmed by inspecting BusinessUnit and Customer relationship fields.

## Migration lineage
The nine original forecast migrations are identical by path and blob SHA across compared branches.
Accounting adds:
- 20261009012000_workflow_orchestration
- 20261009015500_bank_ap_ar_foundation
- 20261009023000_coa_reporting_metadata
Reporting adds:
- 20261009031500_reporting_governance

All 13 SQL migration paths and blob SHAs match between reporting governance and harmonization. No migration history rewrite was detected in the compared branch trees.

## Confirmed schema correction
- Earlier accounting schema has BusinessUnit.arInvoices without an ArInvoice.businessUnit inverse.
- Earlier accounting schema has ArInvoice.customer without Customer.arInvoices inverse.
- Harmonization removes BusinessUnit.arInvoices and adds Customer.arInvoices.
- This is a code-level correction only. Prisma validation and migration drift checks have not been run.

## Manual scripts outside migration sequence
- prisma/manual/accounting-immutability.sql
- prisma/manual/accounting-posting-approvals.sql
These reference copies are not executable migration history. Their original posting-approval and immutability definitions were added to the Prisma sequence as `20261009040000_accounting_posting_approvals` and `20261009041000_accounting_immutability` on the harmonization baseline.

## Wave 2A follow-up — 2026-10-09
- The baseline contains the original 13 migrations plus the two accounting migrations above. A new forward-only, transaction-wrapped migration, `20261009042000_accounting_approval_scope`, adds approval foreign keys to legal entity and fiscal period, enforces same-organization scope, and prevents expired consumption or mutation/deletion after consumption.
- The matching Prisma relations validate successfully on the current worktree. The SQL has not been executed against PostgreSQL, so migration-history drift and trigger behavior remain runtime-blocked.
- `scripts/migrate-test.ts` requires `APP_ENV=test` and an explicit `TEST_DATABASE_URL` targeting loopback PostgreSQL with a database name ending `_test`; it validates the target, applies migrations, then verifies migration status. CI provisions a job-scoped `planora_test` database with test-only credentials.
- `tests/integration/accounting-database-certification.test.ts` checks migration completion, constraints, trigger presence, tenant scope, approval expiration/consumption, balance enforcement, and journal/line/audit immutability. It requires the isolated PostgreSQL CI service and has not run locally.
- No existing migration was rewritten. No hosted database was connected or modified.

### Recovery plan
Migrations are forward-only and no down migration is supplied. Hosted use requires explicit authorization and a verified restorable backup/PITR point. Run the test preflight and migration on a production-shaped disposable clone first. On failure, stop financial writes, preserve database and migration logs, inspect `_prisma_migrations`, and do not manually edit migration history. Use a reviewed forward repair migration, or restore the pre-migration snapshot only if no financial writes occurred after migration. Hosted recovery is not certified.

## Blockers and follow-up gates
1. Run `npm run db:migrate:test` and the accounting PostgreSQL integration suite using an explicitly configured isolated `_test` database.
2. Compare `prisma migrate status` and schema drift on that disposable PostgreSQL database; never use production `.env.local` credentials.
3. Execute direct database UPDATE/DELETE attempts against posted journals, lines, audit events, and consumed approvals.
4. Review tenant scoping, source lineage, posting/reversal, and reporting effective-dating evidence.
5. Preserve HOLD status until database migration, integration, and E2E evidence exists at the exact commit.

## Release decision
NO MERGE, NO HOSTED MIGRATION, NO PRODUCTION POSTING. Static reconciliation does not equal successful Prisma validation or database certification.

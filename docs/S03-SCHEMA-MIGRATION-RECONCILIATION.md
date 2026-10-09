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
These are not counted among the 13 Prisma migration files. Their application state and compatibility with the canonical schema must be verified before accounting certification.

## Blockers and follow-up gates
1. Run npm ci, npx prisma validate, npx prisma generate and npm run typecheck on the exact branch HEAD.
2. Compare prisma migrate status and schema diff against a disposable PostgreSQL database; do not point destructive commands at hosted/production.
3. Review whether AccountingPostingApproval is backed by a migration or only the manual approval SQL; test generated schema against actual database objects.
4. Test SQL immutability guards against direct UPDATE/DELETE and reversal semantics.
5. Review tenant foreign keys, journal uniqueness, source lineage, and report framework effective dating.
6. Compare commit ancestry and unique file diffs across PR #2/#3/#4 before selecting merge target.
7. Preserve current HOLD status until exact-SHA test and E2E evidence exists.

## Release decision
NO MERGE, NO HOSTED MIGRATION, NO PRODUCTION POSTING. Static reconciliation does not equal successful Prisma validation or database certification.

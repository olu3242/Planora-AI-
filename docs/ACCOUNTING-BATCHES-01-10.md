# Accounting expansion — Batches 01–10

Status: IN PROGRESS. These batches are an accounting extension to the existing certified Forecast MVP, not a replacement.

| Batch | Deliverable | State |
|---|---|---|
| 01 | Repository/accounting audit against existing FP&A baseline | PARTIAL |
| 02 | Accounting gap register and dependency plan | PARTIAL |
| 03 | Reuse existing Organization, LegalEntity, Account, FiscalCalendar | DESIGN ONLY |
| 04 | Journal validation in integer minor units | CODE ADDED; TESTS NOT RUN |
| 05 | Entity, period, currency and idempotency preflight policy | CODE ADDED; TESTS NOT RUN |
| 06 | JournalHeader and JournalLine schema/migration | NOT STARTED |
| 07 | Atomic, authorized posting service | NOT STARTED |
| 08 | Immutable reversal and audit provenance | NOT STARTED |
| 09 | Posted-ledger trial balance and FP&A actuals projection | NOT STARTED |
| 10 | Tenant/security/integration/browser certification | NOT STARTED |

## Required gates for batches 06–10
Inspect existing schema/migrations and membership-derived auth in full. Design unique tenant-scoped source keys, account/entity ownership validation, row locking or equivalent concurrent period-close protection, currency precision, and reversal linkage. Never rely on client-provided tenant identity. Make journal posting and audit atomic in one database transaction. Reject closed periods and unauthorized users at the server. A posted journal is append-only; corrections require a new reversing journal. Projection into canonical FinancialFact must be idempotent and traceable; never overwrite approved Actuals.

## Accounting-specific test cases
Balanced vs unbalanced entries; cross-tenant/account/entity references; same source key replay; simultaneous posting; close/post race; soft/hard close; reversal once only; posted mutation denial; currency mismatch; precision; failed transaction rollback; trial balance; period reopening authorization; projection reconciliation; existing Forecast MVP regression.

## Deployment boundary
Synthetic data only. No production migrations, merge, hosted posting, external bank connections, or live money movement without explicit approval. All batch statuses remain PARTIAL until executed certification evidence exists.

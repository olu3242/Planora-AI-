# Accounting batches 11–20: E2E register

Status is based on committed implementation and verified execution. Unfinished items remain PENDING.

| Batch | Scope | Status |
|---|---|---|
| 11 | Pure posted-ledger trial balance projection | CODE ADDED; TEST PENDING |
| 12 | Pure reversal line construction | CODE ADDED; TEST PENDING |
| 13 | Reversal persistence, approval and audit | PENDING |
| 14 | Tenant-scoped ledger repository and reporting API | PENDING |
| 15 | Journal and trial balance UI | PENDING |
| 16 | Bank statement ingestion and lineage | PENDING |
| 17 | Categorization rules and human review | PENDING |
| 18 | Bank reconciliation and exceptions | PENDING |
| 19 | Governed FP&A actuals projection | PENDING |
| 20 | Integration, security, browser E2E and release certification | PENDING |

Required dependency: migrate and validate the journal schema, certify atomic posting and period-close locking, then implement authorized queries, reversal persistence, imports, reconciliation, and UI. The trial balance calculator accepts only pre-filtered POSTED lines for a single tenant/entity/period/currency. The reversal helper does not persist or authorize reversals.

Target synthetic E2E: sign in, choose entity, import bank statement, review and approve, post balanced journal, inspect audit, reconcile, reverse, verify trial balance, close period, verify posting denial, and compare FP&A actuals. Negative journeys cover tenant isolation, permissions, duplicates, unbalanced journals, malformed files, and concurrent close/post.

No production migration, deployment, or live financial processing is authorized. Classification: NOT E2E CERTIFIED.

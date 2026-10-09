# Planora Financial OS — Batches 31–40: Accounting-to-FP&A integration

| Batch | Deliverable | Classification |
|---|---|---|
| 31 | Ledger actuals candidate projection with normal-balance signs | CODE ADDED; TEST EXECUTION PENDING |
| 32 | Stable source identifiers for lineage and idempotency | DOMAIN CODE ADDED; PERSISTENCE PENDING |
| 33 | Actual-versus-forecast signed variance calculation | CODE ADDED; TEST EXECUTION PENDING |
| 34 | Authorized POSTED journal query and account dimension mapping | PENDING |
| 35 | Governed FinancialFact projection and duplicate-safe versioning | PENDING |
| 36 | Budget-to-actual reconciliation and approval | PENDING |
| 37 | Forecast refresh from certified actuals | PENDING |
| 38 | Scenario planning and sensitivity integration | PENDING |
| 39 | Consolidated finance dashboard and drill-down lineage | PENDING |
| 40 | Financial, security, integration and browser E2E certification | PENDING |

## Financial contract
Actual candidates are derived from posted ledger entries scoped to one organization, legal entity, fiscal period and currency. Account normal balance determines the sign; the source key is stable per scope/account. The persistence adapter must map minor units to the currency's configured scale and the FinancialFact Decimal(24,6) contract. Do not write unapproved candidates, overwrite certified actuals or merge across currencies without an approved FX policy. Reconcile total journal debits and credits, verify statement integrity, and preserve journal-to-fact lineage.

## End-to-end acceptance
Authorized user posts a balanced journal in an open period, reviews trial balance and reconciliations, certifies actuals, projects them into a new governed FP&A actuals version, refreshes forecast, views variances, drills into source journals and audit history, and confirms cross-tenant access and unauthorized modifications are rejected.

## Blockers
The accounting migration, atomic posting integration certification, period-close service, authorized ledger query, and UI/API flows remain PENDING. Unit tests committed in this wave have not been executed. No hosted migrations, deployment, merge or live financial operations are authorized.

Overall: IMPLEMENTATION IN PROGRESS — NOT E2E CERTIFIED.

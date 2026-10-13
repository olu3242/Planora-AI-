# Planora Accounting E2E Production Certification

Baseline: `d2c819e53f52d9fefec131f52114d0f96992fb4c`
Execution branch: `work/accounting-e2e-certification-20261012`

## Objective
Certify one deterministic accounting lifecycle end to end:
source transaction -> AP/AR/banking -> accounting event -> journal -> GL -> reconciliation -> trial balance -> close -> P&L / Balance Sheet / Cash Flow -> FP&A actuals -> variance -> AI explanation -> immutable audit trail.

## Non-negotiable invariants
- Posted journals balance and are immutable; correction is by governed reversal/adjustment.
- Tenant/entity/period/currency authorization is enforced server-side and at the database boundary.
- AP, AR and cash control accounts reconcile to the GL with zero unexplained differences.
- Trial balance debits equal credits.
- Financial statements are derived from posted ledger data, not AI-generated values.
- Cash flow reconciles beginning cash + net movement = ending cash.
- Closed periods reject posting unless a governed reopen occurs.
- FP&A actuals use the certified accounting dataset as the canonical source.
- AI may recommend/classify/explain but cannot bypass deterministic accounting controls.
- Every material action has actor, source, evidence, provenance and audit history.

## Execution batches
### A1-A10 Core hardening
1. Inventory current accounting schema/services/migrations and remove contract drift.
2. Enforce journal balance, posting state machine and immutable posted entries.
3. Enforce entity/currency/effective-period validation.
4. Complete reversal/adjustment provenance and idempotency.
5. Complete approval and segregation-of-duties controls.
6. Complete tenant/entity RLS and negative authorization tests.
7. Add concurrency/double-post prevention.
8. Add accounting audit events.
9. Add migration integrity checks.
10. Certify core accounting invariants.

### B1-B10 Bookkeeping
Complete vendor/customer masters, bills, invoices, credits, payments, receipts, bank transactions, categorization, deterministic accounting-event mapping and transaction-to-journal lineage.

### C1-C10 Reconciliation
Complete bank matching, split/transfer/fee handling, duplicate detection, unmatched queues, bank reconciliation, AP/AR control reconciliation, GL reconciliation and exception evidence.

### D1-D10 Statements
Complete trial balance, P&L, Balance Sheet, Cash Flow, GL detail, AP/AR aging, comparative periods and drill-through to source.

### E1-E10 Close
Complete checklist, accruals, prepaids, depreciation, adjustments, reconciliations, approvals, statement certification, period lock and governed reopen.

### F1-F10 Consolidation
Complete multi-entity, intercompany, eliminations, FX translation and consolidated statements after single-entity certification.

### G1-G10 FP&A convergence
Publish certified actuals, enforce one canonical actuals dataset, budget/forecast variance and management reporting.

### H1-H10 Accounting intelligence
Add evidence-backed coding/matching/anomaly/close/variance recommendations with confidence, provenance and HIL thresholds.

### I1-I10 Golden journey
Automate the full accounting lifecycle with seeded data and assertions at every ledger, reconciliation, statement, close, FP&A and audit boundary.

### J1-J10 Production gate
Run lint, typecheck, build, unit, integration, database, security, migration, browser E2E and coverage. Require zero critical/high security findings, zero unexplained reconciliation differences, zero statement integrity failures, >=80% module coverage and stronger coverage for posting/security controls.

## Golden Accounting Journey
Create company/period/COA -> vendor bill -> approve -> pay -> import bank transaction -> propose/approve match -> reconcile -> customer invoice -> receive cash -> accrual/depreciation/adjustment -> reconcile AP/AR/cash to GL -> trial balance -> close -> lock -> generate P&L/BS/CF -> drill statement amount to source -> publish FP&A actuals -> compute variance -> produce evidence-backed AI explanation.

## Release rule
Any failed link in the Golden Accounting Journey or any failed security/accounting-integrity gate means NO-GO. Passing unit tests alone is not certification.

## Required evidence
Each batch must record changed files, migrations, tests added/changed, commands executed, pass/fail counts, coverage, unresolved risks and commit SHA. Do not mark a batch complete without executable evidence.
# Planora Financial OS — Accounting batches 21–30

Status is evidence-based. Pure domain modules do not constitute end-to-end application delivery.

| Batch | Capability | Classification |
|---|---|---|
| 21 | Bank-to-ledger exact reconciliation rules | CODE ADDED; TEST EXECUTION PENDING |
| 22 | Ambiguous-match exception handling | DOMAIN CODE ADDED; REVIEW UI PENDING |
| 23 | Accounts receivable aging calculation | CODE ADDED; TEST EXECUTION PENDING |
| 24 | Accounts payable aging calculation | CODE ADDED; TEST EXECUTION PENDING |
| 25 | Customer and vendor records, permissions | PENDING |
| 26 | Invoice and bill lifecycle, approvals | PENDING |
| 27 | Payment allocation and cash application | PENDING |
| 28 | Income statement, balance sheet, cash flow | PENDING |
| 29 | Period close and audited adjustments | PENDING |
| 30 | Full accounting UI, API, persistence, security, browser E2E | PENDING |

## Acceptance conditions
All ledger-derived data must be filtered by organization, legal entity, period and currency. Bank reconciliation must retain unmatched and ambiguous items for human review, preserve source provenance and never post automatically. AR/AP aging must use canonical open-item balances and explicit as-of dates. AP payments require separate approval and payment-provider authorization; no money movement in this wave. Statements must reconcile to posted journal balances, and closed periods must reject posting. Never mutate approved FP&A actuals.

## Full E2E target
Finance user signs in, selects entity and period, imports synthetic transactions, reviews matches, records invoice/bill, approves journal, posts, reconciles, inspects AP/AR aging, produces statements, closes period, and compares governed FP&A actuals to forecast. Include duplicate imports, cross-tenant access, approval denial, bad currency, unmatched bank lines and close/post concurrency.

## Certification
Tests added in this wave have NOT been run. Database migration, journal posting service, UI/API, integration, browser, security and existing Forecast MVP regression certification remain PENDING. No production or hosted operations are authorized.

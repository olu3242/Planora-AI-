# Planora Accounting Operating Surface — Batches 61–70

Status: IMPLEMENTATION IN PROGRESS. Branch: `feat/accounting-ledger-foundation`.

| Batch | Capability | Classification |
| --- | --- | --- |
| 61 | Tenant-scoped General Ledger query service | CODE ADDED; certification PENDING |
| 62 | General Ledger workspace | CODE ADDED; browser certification PENDING |
| 63 | Journal preparation/review/post UI | PENDING |
| 64 | Reversal workflow and evidence UI | PENDING |
| 65 | Trial Balance workspace | PENDING |
| 66 | Banking workspace and statement ingestion | PENDING |
| 67 | Reconciliation Center | PENDING |
| 68 | Accounts Payable workspace | PENDING |
| 69 | Accounts Receivable workspace | PENDING |
| 70 | Close Center and accounting-surface E2E | PENDING |

## Guardrails
The workspace derives tenant scope from the authenticated session. It is read-only in this slice. Existing posting/close services are not exposed through new mutation routes until their migrations, authorization, segregation-of-duties behavior, and integration tests pass. No hosted migration, production deployment, or real financial data is authorized.

## E2E target
Sign in → Accounting → select legal entity/period → inspect journal register → prepare/review journal → post → inspect trial balance → reconcile bank → inspect AP/AR → close checklist → authorized close → posting denial → actuals sync → forecast → insight.

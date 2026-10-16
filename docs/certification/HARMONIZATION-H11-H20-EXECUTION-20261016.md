# Harmonization Continuation: H11-H20
Date: 2026-10-16
Branch: work/planora-canonical-harmonization-20261016
Status: PARTIAL / NO-GO (no runtime certification)

## Source inspection
- Prisma posting adapter already performs role/entity/period checks, approval consumption and journal/audit write in a serializable transaction. This is source evidence only, not runtime proof of concurrency or RLS.
- BankAccount schema has no approved cash-GL mapping field or separate mapping table. Reconciliation service intentionally throws BANK_LEDGER_MAPPING_REQUIRED.
- BankTransaction links matchedJournalId, but matching against the whole balanced journal would be incorrect: must use cash-account lines and explicit sign convention.
- Existing journal proposal and approval tests are pure unit tests; exact-SHA integration certification remains pending.

## Work performed
- H11: Inspected posting adapter and chart-of-accounts read model. PARTIAL.
- H12: Inspected BankAccount/BankTransaction/AccountingJournal schema. PARTIAL.
- H13: Implemented pure, read-only exact cash-movement candidate selection. SOURCE ADDED.
- H14: Added candidate selector regression tests for isolation, currency, status, mapping, amounts and ambiguity. TEST SOURCE ADDED.
- H15: Persistent mapping approval model not implemented. BLOCKED.
- H16: Transactional bank reconciliation mutation not implemented. BLOCKED.
- H17: AP/AR settlement integration not implemented. PENDING.
- H18: Ledger-to-statements lineage not implemented. PENDING.
- H19: Forecast actuals propagation not implemented. PENDING.
- H20: Exact-SHA certification not run. NO-GO.

## Guardrails for integration
1. Add a tenant/entity/currency-scoped effective-dated BankCashAccountMapping with approver and revocation evidence, migration and RLS.
2. Read bank transaction, approved mapping and posted cash-account journal lines under tenant-scoped transaction. Compute net cash amount per journal, not entire balanced journal.
3. Enforce matching uniqueness, sign convention, dates, account ownership, period status, already-matched exclusion and reconciliation evidence.
4. Commit matchedJournalId and status atomically with audit; reject competing claims; idempotent retry.
5. Run tests on isolated PostgreSQL with a non-bypass tenant role, including two concurrent workers, cross-tenant denial and reversal behavior.
6. Do not expose pure candidate selection as a completed reconciliation workflow.

## Certification
No npm install, Prisma migration, unit tests, integration tests, E2E or hosted commands were executed in this tool session. All new tests are UNVERIFIED. No deployment, production posting or database migration performed.

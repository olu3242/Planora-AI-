# Persisted accounting execution

Implemented:
- tenant-scoped, row-locked HARD_CLOSED period transition
- idempotent already-closed behavior
- immutable audit evidence for period close
- ledger-to-FinancialFact ACTUAL synchronization after hard close
- currency minor-unit conversion without floating-point arithmetic
- deterministic grain/source keys and upsert idempotency
- audit evidence for actuals synchronization

PENDING because source-of-truth persistence does not yet exist:
- bank statements / bank transactions / reconciliation records
- vendors, bills, AP open items, payments and allocations
- invoices, AR open items, receipts and allocations

These missing domains must be modeled before the close workflow can truthfully certify bank/AP/AR prerequisites.
No hosted migration or production execution is performed by this change.

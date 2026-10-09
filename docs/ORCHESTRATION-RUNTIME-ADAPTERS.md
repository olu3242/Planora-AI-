# Accounting runtime adapters

Implemented:
- authenticated Resume route
- tenant/entity/period preflight
- posted-ledger trial balance handler
- runtime execution persistence through existing orchestration stores
- resume audit event
- fail-closed handlers for capabilities not yet backed by persisted application services

Fail-closed PENDING capabilities:
- bank reconciliation persistence
- AP validation persistence
- AR validation persistence
- close analysis agent
- period close transaction
- ledger-to-FinancialFact actuals sync
- forecast refresh agent
- insight agent

The runtime intentionally raises RUNTIME_CAPABILITY_PENDING for these steps. It does not synthesize evidence or mark unavailable financial operations successful.

Migration deployment, Prisma generation/validation, integration tests and browser certification remain PENDING.

# Accounting Expansion — Initial Evidence and Implementation Gate

Status: PARTIAL. Branch: feat/accounting-ledger-foundation.

## Existing verified foundation
- `prisma/schema.prisma` defines Organization, LegalEntity, Account, AccountType, NormalBalance, FiscalCalendar and FinancialFact.
- `docs/ACCOUNTING.md` specifies statements, period close, accounting treatment and multi-entity principles.
- `CLAUDE.md` requires repository audit, gap matrix, target architecture, domain model, and vertical-slice certification before marking work complete.
- Forecast MVP is a controlled-validation baseline; production and real financial workbooks are not authorized.

## Accounting gaps (not yet certified)
- Double-entry journal persistence and posting service: NOT VERIFIED.
- Period-level posting authorization and hard-close enforcement: NOT VERIFIED.
- Immutable reversals and posting idempotency: NOT VERIFIED.
- Source-to-journal lineage, account ownership and tenant isolation: NOT VERIFIED.
- Trial balance derived from posted journal lines: NOT VERIFIED.
- Bank import and reconciliation: NOT VERIFIED.

## First incremental deliverable
A pure journal-line validator using bigint minor units with regression tests. This is **not** a posting engine, accounting ledger, or end-to-end feature. It does not touch hosted data.

## Required before posting-engine implementation
1. Inspect full Prisma schema, migrations, existing accounting services, authorization, and audit infrastructure.
2. Complete repository-wide current-state audit and GAP matrix.
3. Update target architecture, domain model, and implementation plan.
4. Design entity-scoped journal header/line persistence, fiscal-period state, idempotency, transactional posting, and reversals.
5. Add tenant authorization and financial integrity integration/E2E tests.
6. Run all CLAUDE.md certification gates and report evidence.

No merge, deployment, live integrations, or production financial operations are authorized.

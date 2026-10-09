# Accounting / FP&A Harmonization — Execution Register

Branch: `fix/accounting-fpa-schema-harmonization`

## Verified changes
- Fixed Prisma inverse relation `Customer.arInvoices` for `ArInvoice.customer`.
- Removed unsupported `BusinessUnit.arInvoices` inverse: `ArInvoice` has no `businessUnitId`.
- Existing legal-entity invoice association, customer dimension, accounting services, FP&A sync and reporting remain intact.
- No database migration, hosted data mutation, or production deployment performed.

## Existing architecture reused
- `src/application/accounting/`: posting, reversal, close, AP/AR, reconciliation, statements, FP&A actuals sync.
- `src/domain/accounting/`: journal validation, trial balance, forecasting bridge, controls.
- `src/lib/orchestration/accounting-runtime.ts`: agent runtime.
- `prisma/schema.prisma`: canonical shared financial schema.

## Certification status
- Schema relationship repair and approval-scope relations: IMPLEMENTED; `npx prisma validate` PASS on the current worktree.
- Typecheck: PASS. Focused test database URL tests: 6/6 PASS.
- Full unit suite: PASS, 153/153 across 38 files. Three stale orchestration/posting test assumptions were corrected and their focused checks pass.
- Financial-calculation suite: PASS, 8/8. Excel suite: PASS, 6/6.
- Lint: PASS with one pre-existing unused-variable warning. Build: PASS with an unreachable test URL override.
- Security suite: BLOCKED; seven database-backed cases hit the deliberately unreachable fallback URL, while three non-database cases passed.
- PostgreSQL migration/integration tests: BLOCKED; no explicit `TEST_DATABASE_URL` is configured.
- Hosted PostgreSQL migrations, production access and deployment: NOT AUTHORIZED.
- Release: HOLD; do not merge or deploy until evidence gates pass.

## Wave 2A — Database Certification (Tasks 01–10)

| Task | Status | Evidence / blocker |
| --- | --- | --- |
| 01 Migration history and Prisma drift | BLOCKED | Static history reviewed; current database migration state cannot be inspected without an isolated PostgreSQL URL. |
| 02 Approval migration/schema parity | BLOCKED | Existing SQL/schema statically reconciled. Added migration `20261009042000_accounting_approval_scope`; runtime application remains unverified. |
| 03 Journal immutability semantics | BLOCKED | Trigger branches statically reviewed and PostgreSQL assertions added; not executed locally. |
| 04 Safe preflight and recovery plan | PASS | Test migration entry point requires `APP_ENV=test` and a loopback PostgreSQL database ending `_test`; migration DDL is transaction-wrapped; recovery procedure below. |
| 05 Isolated PostgreSQL test configuration | PASS | Vitest ignores ambient `DATABASE_URL`; absent explicit test URL resolves to unreachable loopback port 1. URL guard tests: 6/6 PASS. |
| 06 Migration smoke/integrity assertions | BLOCKED | PostgreSQL integration suite added; cannot execute without an explicit isolated database. |
| 07 Maker-checker, expiry and consumption | BLOCKED | Database and posting assertions added; PostgreSQL execution unavailable. |
| 08 Posted journal/line/audit immutability | BLOCKED | Direct Prisma write rejection assertions added; PostgreSQL execution unavailable. |
| 09 Migration CI with test credentials | BLOCKED | Both CI workflows now provision `planora_test` with test-only credentials; GitHub Actions has not run because no push/dispatch was authorized. |
| 10 Migration execution certification | BLOCKED | Exact reason: `TEST_DATABASE_URL` is absent locally; no local isolated PostgreSQL database is authorized/identified. |

### Wave 2A local evidence
- Branch: `fix/accounting-fpa-schema-harmonization`, baseline `d2c819e53f52d9fefec131f52114d0f96992fb4c`.
- `npx prisma validate`: PASS, using an explicit harmless test URL; no database connection.
- `npx prisma generate`, `npm run typecheck`, `npm run lint`, and `npm run build`: PASS. Lint retains one unrelated unused-variable warning.
- `npm run test:unit`: PASS, 153/153 across 38 files. `npm run test:financial`: 8/8 PASS. `npm run test:excel`: 6/6 PASS.
- `npm run test:security`: BLOCKED for seven database-backed authorization cases; the bootstrap used the unreachable fallback at `127.0.0.1:1`, never an ambient database. Three cases passed.
- No migration, reset, seed, accounting integration test, hosted database, or Docker command was run locally.
- No migration, reset, seed, integration test, hosted database, or Docker command was run locally.

### Preflight and recovery
Database operations in tests require `APP_ENV=test` and an explicit `TEST_DATABASE_URL`. The URL validator allows PostgreSQL only, requires a loopback host, and requires a database name ending in `_test`; the migration command prints only host/database, never credentials. Run `npm run db:migrate:test` only against that isolated database; it validates the target, applies migrations, then verifies migration status. The reset command has the same gate.

These migrations are forward-only; there is no automatic down migration. Before any hosted execution, obtain explicit authorization, verify a restorable backup/PITR point, run the preflight queries and migration on a production-shaped disposable clone, and record the applied migration checksums. If execution fails, stop posting and do not edit `_prisma_migrations` or manually drop partially created objects. Inspect migration state and logs; if the SQL transaction rolled back, correct the migration and rerun only after review. If a migration partially committed or incompatible data is found, preserve the database, restore the approved pre-migration snapshot only when no post-migration financial writes occurred, or create a reviewed forward repair migration. Hosted recovery remains blocked pending authorization and database evidence.

## Local verification
```powershell
git fetch origin
git checkout fix/accounting-fpa-schema-harmonization
npm ci
npx prisma validate
npx prisma generate
npm run typecheck
npm run lint
npm test
npm run build
```

Confirm the actual package scripts before executing optional commands. Do not run migrations against production without explicit authorization.

## Next implementation sequence
1. Capture validation output and inspect all remaining Prisma relation errors.
2. Reconcile schema and migration history against current hosted and local environments.
3. Verify tenant/entity scoping and posted-ledger accounting invariants.
4. Test accounting actuals flowing to existing FP&A facts without duplication.
5. Run database-backed approval, idempotency, reversal and close controls.
6. Certify UI and API end-to-end journeys before any release.

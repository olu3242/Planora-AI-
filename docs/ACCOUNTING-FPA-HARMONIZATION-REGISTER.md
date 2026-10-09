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
- Schema relationship repair: IMPLEMENTED, NOT YET VALIDATED.
- `npx prisma validate`: PENDING (execution environment has no repository checkout or dependency installation).
- Typecheck, lint, unit tests, integration tests, build: PENDING.
- Hosted PostgreSQL migrations, immutability guards, authorization evidence, browser E2E: BLOCKED / NOT AUTHORIZED.
- Release: HOLD; do not merge or deploy until evidence gates pass.

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

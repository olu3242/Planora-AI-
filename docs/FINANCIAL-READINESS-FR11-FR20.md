# Planora Financial Readiness FR11–FR20

| Batch | Objective | Status |
|---|---|---|
| FR11 | Assessment snapshot table | Committed migration |
| FR12 | Immutable evidence table | Committed migration |
| FR13 | Tenant-scoped foreign keys and RLS | Committed, DB verification pending |
| FR14 | Prisma assessment model | Committed, validate pending |
| FR15 | Prisma evidence model | Committed, validate pending |
| FR16 | Transaction-local tenant persistence | Committed |
| FR17 | Atomic assessment and evidence save | Committed |
| FR18 | Source fingerprint and policy version | Committed |
| FR19 | Snapshot unit contract tests | Three written, not executed |
| FR20 | Live data adapters and certification | BLOCKED |

## Remaining integration and security gates
- Verify `legalEntityId` and `periodId` references against existing LegalEntity/FiscalPeriod schema; currently scope columns are not foreign-key enforced.
- Assessments are insert-only. Duplicate source fingerprints currently return unique constraint errors rather than an idempotent existing snapshot response.
- Verify the transaction client typing against generated Prisma client; no successful build or migration run is claimed.
- Use a non-BYPASSRLS runtime role with appropriate GRANTs; current RLS policies require trusted transaction-local tenant context. A custom session setting alone is not an authorization boundary.
- Integrate trusted accounting/reconciliation/close/statement/FP&A source adapters. Do not expose saveReadinessSnapshot directly to clients or accept user-supplied evidence.
- Add immutable audit events, source-revision invalidation, materiality governance, approval workflow and Command Center read model.
- Run `npx prisma validate`, `npx prisma generate`, `npm run typecheck`, readiness unit tests, isolated PostgreSQL migration/RLS tests, and full accounting E2E.
- Do not merge or deploy before passing all gates.

Certification: PARTIAL / NO-GO.

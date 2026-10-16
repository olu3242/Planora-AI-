# Financial Readiness FR31–FR40 — authenticated read integration

| Batch | Objective | Status |
|---|---|---|
| FR31 | Read-only assessment projection | Committed |
| FR32 | Stored JSON and dimension validation | Committed |
| FR33 | Existing Planora session authorization | Committed |
| FR34 | Reject platform admin finance access | Committed |
| FR35 | Tenant-local RLS transaction | Committed |
| FR36 | Legal entity and period query validation | Committed |
| FR37 | Latest immutable assessment lookup | Committed |
| FR38 | Missing-assessment NOT_ASSESSED response | Committed |
| FR39 | Read-model unit regression tests | Five written; unexecuted |
| FR40 | Live Command Center and DB E2E certification | Pending |

## API
`GET /api/accounting/readiness?legalEntityId=<uuid>&periodId=<period>`

Returns the latest persisted assessment with score, blockers, actions, dimension breakdown, source fingerprint, policy version, and an explicit disclaimer. Missing data returns `NOT_ASSESSED`. Authentication uses existing `requireApiSession("financial.read")`, and queries execute inside `withMappingTenant`. API is read-only and does not evaluate live records, post journals, approve or close periods.

## Next blockers
- Actual source fetchers for banking, GL, reconciliations, statements, FP&A and close are not yet connected.
- UI Command Center is not wired to this endpoint.
- The repository's Prisma migrations and models are not validated; RLS role grants and source freshness require real PostgreSQL tests.
- Run `npx prisma validate`, `npx prisma generate`, `npm run typecheck`, readiness unit tests and authenticated HTTP integration tests.
- Verify Prisma transaction client typing and persisted JSON read model at runtime.
- Confirm the period and entity access policies in addition to tenant isolation.

Decision: PARTIAL / NO-GO. No tests executed, migration applied, merge or deployment claimed.

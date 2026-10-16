# Planora next implementation checkpoint — import integration

## Source-grounded finding
Repository search found BankTransaction model and read-side references, but did not identify an authoritative bank-import completion writer in the inspected search results. The live bank-import transaction is therefore not modified.

## Committed work
- Validated import-completion event contract with tenant/entity/period/event identifiers and imported count.
- Added transaction-bound outbox adapter to be called by a trusted bank-import writer.
- Removed a standalone recovery path that could enqueue based only on a caller assertion.
- Added four unit tests and CI coverage.

## Remaining integration and certification gates
1. Locate or implement a real bank-import writer and invoke appendCleanupOutboxForCommittedImport inside the same committed database transaction.
2. Derive organization identity from an authenticated session or trusted service principal, not from an event payload.
3. Verify import event references an actually completed persisted import batch; a boolean committed flag alone is not proof.
4. Execute Prisma validate/generate/typecheck and unit suites.
5. Run PostgreSQL migrations, restricted-role RLS, parallel outbox dispatch, lease recovery and full E2E.
6. Deploy an authenticated scheduler and monitor queue alerts.

No tests were executed during this GitHub-only wave. No deployment was made. Production decision: NO-GO.

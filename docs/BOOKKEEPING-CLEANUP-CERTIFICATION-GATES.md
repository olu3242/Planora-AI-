# Bookkeeping cleanup certification gates

## Implemented source-level safeguards
Tenant-scoped proposal execution, authenticated import/review routes, separation of duties, immutable review audit events, request idempotency, and proposal-only behavior.

## Evidence required before release
1. Full CI completed successfully on the latest PR head.
2. PostgreSQL tests for duplicate review, concurrent decisions, and idempotency replay/conflict passed.
3. Authenticated browser journey validated for import-only and reviewer roles.
4. Full dependency audit passed without suppressing advisories.
5. Reviewer findings and ledger non-mutation independently checked.

No release readiness percentage is asserted from unexecuted tests. Do not merge or deploy while any gate is unverified.

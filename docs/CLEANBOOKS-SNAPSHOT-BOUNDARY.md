# CleanBooks snapshot transaction boundary

## Implemented
- The Prisma client exports `requireIndependentSnapshotTransaction()`.
- The CleanBooks scan checks the guard before opening a repeatable-read transaction.
- A scan called inside an ambient tenant transaction now fails closed with `CLEANBOOKS_NESTED_SNAPSHOT_UNSUPPORTED`.
- Nested Prisma calls requesting an isolation level remain explicitly rejected.

## Security and architecture caveat
The guard does **not** authorize bypassing tenant RLS. A standalone transaction is not a substitute for a tenant-bound authenticated session. The scan currently accepts a caller-supplied actor ID and checks membership inside the database, but no independently verified API session binding, tenant RLS context, or controller permission is established. Do not expose the standalone scan as a public endpoint until these are implemented and tested.

## Certification required
- Execute Prisma validation, typecheck and Vitest.
- Verify PostgreSQL transaction isolation with concurrent inserts/updates.
- Verify tenant RLS under the exact execution identity used by CleanBooks.
- Verify ambient tenant transaction rejection.
- Validate kill-switch behavior and authorization under an authenticated route.
- Complete browser E2E and hosted release certification.

**Decision: NO-GO.** Source changes have not been executed against PostgreSQL.

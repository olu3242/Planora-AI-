# Planora CleanBooks database-client recovery

## Change
Resolved the conflict in `src/lib/prisma.ts` while retaining the tenant transaction AsyncLocalStorage proxy and its nested-savepoint implementation.

## Required follow-up validation
1. Verify the proxy's `$transaction` override accepts the options supplied by CleanBooks, especially `isolationLevel: RepeatableRead`. The current nested transaction proxy does not forward options and may silently use its enclosing transaction isolation level.
2. Ensure CleanBooks is invoked through an authenticated, tenant-bound transaction or independently verifies the actor's session and RLS.
3. Run `npm ci`, `npx prisma validate`, `npx prisma generate`, `npm run typecheck`, and CleanBooks Vitest suites.
4. Run PostgreSQL concurrency tests: insert during scan, tenant-crossing denial, transaction rollback, locked-period controls, and large cursor scans.
5. Do not merge or deploy until passing CI evidence is recorded.

**Status: NO-GO.** Source repair alone does not prove tenant isolation or snapshot consistency.

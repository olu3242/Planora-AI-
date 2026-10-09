# Accounting E2E certification gates

Status: NOT CERTIFIED. These gates are mandatory and must be evidenced by actual command output.

1. Run Prisma generate and validate against the target schema.
2. Run TypeScript typecheck, lint, unit tests, and production build.
3. Apply migrations only through `npm run db:migrate:test` with `APP_ENV=test` and an explicit loopback `TEST_DATABASE_URL` whose database name ends in `_test`; the command fails closed otherwise.
4. Verify balanced posting, draft-to-posted transition, journal audit atomicity, and rollback on audit failure.
5. Verify cross-tenant, inactive membership, invalid account, wrong entity, and closed-period rejection.
6. Run two concurrent requests using one source key: exactly one journal must persist.
7. Verify replay with identical payload returns existing journal, and altered payload fails.
8. Verify reversal is append-only, swaps debit and credit, and has exactly one reversal per original.
9. Attempt direct SQL UPDATE and DELETE of posted journals, lines, approvals, and audit events: all must fail.
10. Verify human approval against trusted persisted authorization evidence, then run browser E2E.

No migration, merge, production posting, or deployment is authorized by this document.

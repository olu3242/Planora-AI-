# Bookkeeping cleanup PostgreSQL test coverage

The integration test `tests/integration/bookkeeping-cleanup-review.test.ts` uses the seeded NORTHSTAR and HORIZON tenants, plus seeded analyst and director users. It creates a successful cleanup RuntimeExecution fixture and exercises:
- Review decision persistence and readback.
- Prevention of duplicate review.
- Separation of duties between proposer and reviewer.
- Cross-tenant execution access rejection.
- Review permission enforcement.

Run through the existing PostgreSQL integration-test workflow with seeded data. These are source-level tests until a CI run reports success. Concurrency and browser tests remain separate certification gates. No test should modify actual financial journals or source bank records.

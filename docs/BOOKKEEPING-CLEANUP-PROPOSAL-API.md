# Bookkeeping Cleanup proposal API

POST `/api/accounting/bookkeeping-cleanup` requires an authenticated tenant session with `financial.import` permission, a same-origin request, and JSON `{batchId, idempotencyKey?, transactions}`. Transaction rows contain `id`, `date`, integer `amountMinor`, `currency`, `description`, and optional `reference`.

The server derives the organization ID from the authenticated session; clients cannot supply tenant scope. Up to 10,000 transactions are accepted per request. Results are persisted through the existing runtime proposal command, with a batch fingerprint in the execution request.

This endpoint only creates cleanup findings; it never posts financial transactions or deletes data. Idempotency keys are optional UUIDs. Reuse of an idempotency key with different inputs must be tested and guarded before production certification.

Review: `/bookkeeping-cleanup`. Release requires PostgreSQL integration tests, API authentication tests, browser E2E tests, and clean full dependency audit.

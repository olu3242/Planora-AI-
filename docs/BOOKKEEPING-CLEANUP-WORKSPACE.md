# Bookkeeping Cleanup workspace

The tenant-scoped `/bookkeeping-cleanup` page now includes a JSON batch submission form for users with financial import permission and a review queue for users with accounting recommendation review permission.

Submission uses the existing authenticated proposal API, which persists findings and returns an execution ID. The form retains a request UUID across retries, preventing accidental duplicate executions, and generates a new key only when the user explicitly starts a new request.

The execution page shows findings, decisions and review metrics. Review does not post financial corrections. CSV import is not implemented; CSV export utility is not yet exposed in the workspace.

**Certification remains blocked:** execute browser tests, authenticated API tests, PostgreSQL concurrency and idempotency tests, and the complete dependency audit before production use.

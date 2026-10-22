# Cleanup proposal idempotency

The cleanup proposal API accepts an optional UUID idempotency key. The runtime stores batch ID, transaction count and deterministic input fingerprint. A repeated key with identical batch and payload returns the existing execution with duplicate=true. A repeated key with a different batch or input returns HTTP 409, rather than silently replaying a mismatched result.

This guard applies to BOOKKEEPING.CLEANUP_PROPOSE only; other runtime commands retain their prior behavior. The request identity is based on the exact ordered rows, so reordering input changes the fingerprint. The fingerprint is not a secret or authorization credential.

Certification still requires an executed PostgreSQL replay test, authenticated API tests, and browser E2E. Do not deploy or merge until CI and security release gates pass.

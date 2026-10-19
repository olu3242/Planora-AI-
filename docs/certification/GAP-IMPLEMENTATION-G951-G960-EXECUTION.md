# G951-G960 — Governed runtime fail-closed regression tests

Date: 2026-10-18. Release decision: **NO-GO / NOT CERTIFIED**.

| Batch | Execution | Result |
|---|---|---|
| G951 | Inspect governed runtime branch head c1c944c | Confirmed |
| G952 | Inspect existing workflow context and run types | Confirmed |
| G953 | Inspect existing in-memory run and execution stores | Confirmed |
| G954 | Add authorized execution regression | Committed; CI pending |
| G955 | Add cross-tenant and actor mismatch rejection tests | Committed; CI pending |
| G956 | Add correlation and definition version mismatch tests | Committed; CI pending |
| G957 | Add missing policy version and idempotency key tests | Committed; CI pending |
| G958 | Add external runtime rejection and policy denial tests | Committed; CI pending |
| G959 | Add approval evidence gate test | Committed; CI pending |
| G960 | Integrate actual core policy service, PostgreSQL stores and restart recovery | Not completed |

Added `tests/unit/governed-runtime.test.ts`. Tests use in-memory stores and a mock authorization callback, and are not evidence of production-grade authorization, persistence, concurrent idempotency, or crash recovery. At inspection, CI, accounting integrity, dependency candidate, and preflight were still queued or running for the test commit. Security vulnerabilities and production release gate remain unresolved. No production migration, merge or deployment.

# G1001-G1010 — Persisted workflow snapshot compare-and-swap

Date: 2026-10-18. Release decision: **NO-GO / NOT CERTIFIED**.

| Batch | Execution | Result |
|---|---|---|
| G1001 | Inspect previous head 1611e9c | Confirmed |
| G1002 | Inspect Merge Conflict Preflight | PASS on previous head |
| G1003 | Inspect Accounting Integrity | PASS on previous head |
| G1004 | Inspect CI and dependency candidate | In progress on previous head |
| G1005 | Review persisted run store | Unconditional save identified |
| G1006 | Add snapshot compare-and-swap method | Committed |
| G1007 | Check tenant, run, actor and definition scope in CAS | Committed |
| G1008 | Reject stale writes with WORKFLOW_SCOPE_STALE_WRITE | Committed |
| G1009 | Add CAS success, stale-write and cross-tenant unit tests | Committed; CI pending |
| G1010 | Replace unsafe runner saves, preserve execution attempt metadata, real DB concurrency | Not completed |

`PostgresWorkflowRunStore.saveIfUnchanged` conditionally updates a row only if its status and JSON state match an expected snapshot. This is an opt-in method, not a runner-wide safety guarantee. The original `save()` still performs an unconditional update and the runtime has not been migrated to CAS. The existing execution record schema still lacks attempt/error-class columns. Unit tests use mocked database methods; live PostgreSQL concurrency, recovery and transactional financial effects are unverified. Existing security release gate remains unresolved. No production migration, merge or deployment.

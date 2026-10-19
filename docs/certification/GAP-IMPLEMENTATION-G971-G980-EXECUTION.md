# G971-G980 — Atomic PostgreSQL workflow claim primitive

Date: 2026-10-18. Release decision: **NO-GO / NOT CERTIFIED**.

| Batch | Execution | Result |
|---|---|---|
| G971 | Inspect branch head 197977f | Confirmed |
| G972 | Inspect preflight | PASS on inspected head |
| G973 | Inspect accounting, CI and candidate | In progress on inspected head |
| G974 | Inspect WorkflowRunRecord model | Existing PostgreSQL model with tenant ID and status |
| G975 | Inspect WorkflowExecutionRecord | Existing unique idempotency key |
| G976 | Identify atomic claim requirement | Current runtime lacks compare-and-swap |
| G977 | Implement scoped conditional READY -> RUNNING claim | Committed as separate primitive |
| G978 | Add claim success and conflict unit tests | Committed; CI pending |
| G979 | Add missing scope rejection unit tests | Committed; CI pending |
| G980 | Integrate claim into persisted runner with recovery and real policy checks | Pending |

`src/lib/orchestration/postgres-run-claim.ts` uses a single conditional `workflowRunRecord.updateMany` to claim an existing READY run, scoped by organization, run ID, definition ID and version. It fails closed unless exactly one row is updated. This is **not** a lease and has **not** been connected to the existing `executeReadySteps` path; it does not guarantee step idempotency, crash recovery or authorization. Its unit tests mock the database interface, so PostgreSQL concurrency tests are still required. Existing security audit and release certification gates remain in force. No production migrations, merge or deployment.

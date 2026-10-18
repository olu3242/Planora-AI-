# G981-G990 — Opt-in atomic claim integrated with governed runtime

Date: 2026-10-18. Release decision: **NO-GO / NOT CERTIFIED**.

| Batch | Execution | Result |
|---|---|---|
| G981 | Inspect head fa8a67d | Confirmed |
| G982 | Inspect Merge Conflict Preflight | PASS on prior head |
| G983 | Inspect CI and accounting integrity | In progress on prior head |
| G984 | Inspect PostgreSQL claim primitive | Confirmed |
| G985 | Inspect governed runtime and existing stores | Confirmed |
| G986 | Add optional atomic claim DB dependency | Committed |
| G987 | Order core authorization before claim | Implemented |
| G988 | Reject losing database claim before invoking handler | Implemented |
| G989 | Add ordering, conflict and denied-policy unit tests | Committed, CI pending |
| G990 | Persistent store, live database concurrency and crash recovery | Not completed |

The opt-in `claimDb` path in `executeGovernedWorkflow` calls `claimReadyWorkflowRun` before `executeReadySteps`. The claim uses one conditional update on the existing WorkflowRunRecord table. It is not a renewable lease, and a persistent `WorkflowRunStore` must operate on the same record. The current runner may still overwrite state, does not use a transactional outbox, and has no proven safe replay after process crashes. Unit tests use a mocked claim DB. The security audit remains a release blocker. No production migrations, merge or deployment.

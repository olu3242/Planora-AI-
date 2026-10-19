# G1011-G1020 — Runtime state-transition CAS integration

Date: 2026-10-18. Release decision: **NO-GO / NOT CERTIFIED**.

| Batch | Execution | Result |
|---|---|---|
| G1011 | Inspect head 33c3d91 | Confirmed |
| G1012 | Inspect Merge Conflict Preflight | PASS on prior head |
| G1013 | Inspect Accounting Integrity | PASS on prior head |
| G1014 | Inspect CI | FAIL on prior head |
| G1015 | Inspect Dependency Remediation Candidate | FAIL on prior head |
| G1016 | Inspect runtime state transitions and persisted CAS method | Confirmed |
| G1017 | Add optional CAS method to WorkflowRunStore contract | Committed |
| G1018 | Route runtime state transitions through CAS when available | Committed |
| G1019 | Add regression test preventing unconditional-save fallback on CAS stores | Committed; CI pending |
| G1020 | Preserve execution retry metadata and validate real DB concurrency | Pending |

`executeReadySteps` now uses `saveIfUnchanged(next, expected)` on stores that expose it. The in-memory store continues using the legacy save path. This does not establish transactionality across run and execution records, and the previous governed claim may still leave a mismatch between SQL status and JSON state. The PostgreSQL execution record model still lacks attempt/error-class fields. No live PostgreSQL concurrency, crash-recovery or financial-posting certification has been completed. The CI and dependency candidate failures remain release blockers. No production migration, merge or deployment.

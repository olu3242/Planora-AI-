# G1061-G1070 — Mandatory verified-snapshot claims and contention simulation

Date: 2026-10-18. Release decision: **NO-GO / NOT CERTIFIED**.

| Batch | Execution | Result |
|---|---|---|
| G1061 | Inspect prior head cabd2d5 | Confirmed |
| G1062 | Inspect Merge Conflict Preflight | PASS on prior head |
| G1063 | Inspect Accounting Integrity | PASS on prior head |
| G1064 | Inspect CI | In progress at inspection |
| G1065 | Inspect Dependency Remediation Candidate | FAIL on prior head |
| G1066 | Inspect claim API and tests | Optional snapshot path identified |
| G1067 | Require verified workflow snapshot on every atomic claim | Committed |
| G1068 | Remove status-only claim update path | Committed |
| G1069 | Update claim contract tests for mandatory state snapshot | Committed |
| G1070 | Add ten-contender one-winner simulation | Committed; CI pending |

`claimReadyWorkflowRun` now requires `expectedRun` and conditionally updates both SQL status and JSON state together. This removes the legacy status-only claim path. The ten-contender unit test uses a serialized mocked store; it is not a live PostgreSQL concurrency test. No real database migration, lease/recovery verification or exactly-once financial effects have been certified. The dependency remediation candidate remains a release blocker. No production migration, merge or deployment.

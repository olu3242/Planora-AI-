# G1021-G1030 — Synchronize claimed workflow SQL and JSON state

Date: 2026-10-18. Release decision: **NO-GO / NOT CERTIFIED**.

| Batch | Execution | Result |
|---|---|---|
| G1021 | Inspect head 8b8d503 | Confirmed |
| G1022 | Inspect Merge Conflict Preflight | PASS on previous head |
| G1023 | Inspect Accounting Integrity | FAIL on previous head |
| G1024 | Inspect CI | FAIL on previous head |
| G1025 | Inspect Dependency Remediation Candidate | FAIL on previous head |
| G1026 | Identify SQL status/JSON state divergence after claim | Confirmed |
| G1027 | Conditionally claim and update SQL status and JSON snapshot together | Committed |
| G1028 | Pass verified run snapshot into atomic claim | Committed |
| G1029 | Fail closed when claimed run cannot be reloaded as RUNNING | Committed |
| G1030 | Add synchronization regression tests | Committed; CI pending |

This batch fixes a state synchronization bug in the opt-in claimed execution path. `claimReadyWorkflowRun` now accepts a verified `expectedRun` snapshot and uses one conditional update to set both SQL status and JSON status to RUNNING. `executeReadySteps` rejects a claimed execution when the backing run store does not reflect RUNNING. A mock claim paired with a memory run store now correctly fails closed. The old claim API without a snapshot remains available for legacy callers and is not sufficient for persisted-state synchronization. No real PostgreSQL concurrency/recovery tests, retry metadata schema changes, or transactional financial effects are certified. CI, accounting integrity and dependency candidate failed on the previous head; current changes are unverified. No production migration, merge or deployment.

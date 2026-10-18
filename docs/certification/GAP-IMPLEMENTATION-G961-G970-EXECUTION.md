# G961-G970 — Active governed run re-entry guard

Date: 2026-10-18. Release decision: **NO-GO / NOT CERTIFIED**.

| Batch | Execution | Result |
|---|---|---|
| G961 | Inspect prior head dd77a7c | Confirmed |
| G962 | Inspect Merge Conflict Preflight | PASS on prior head |
| G963 | Inspect CI security audit | FAIL on prior head |
| G964 | Inspect CI certify | In progress at inspection |
| G965 | Review orchestration engine and runtime | In-memory load/save, no atomic claim |
| G966 | Identify concurrent duplicate execution risk | Read-then-write idempotency cannot prevent parallel workers |
| G967 | Add fail-closed guard for RUNNING/RETRYING/COMPENSATING governed runs | Committed |
| G968 | Add tests for each active status | Committed, not yet verified by CI |
| G969 | Preserve core policy authorization and tenant checks | Preserved |
| G970 | Implement atomic durable lease, policy integration and restart recovery | Pending |

The new guard prevents sequential re-entry of already active runs through the opt-in governed runtime path. **It does not prevent concurrent requests that both load READY before either saves RUNNING**, and does not establish exactly-once effects. The correct production fix is a tenant-scoped atomic database lease/claim, transactional outbox and step-level idempotency enforced in the financial core. No persistent store, approval service wiring, or deployed recovery testing was completed in this batch. No production migration, merge or deployment.

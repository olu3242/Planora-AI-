# G941-G950 — Three-OS governed runtime integration

Date: 2026-10-18. Release decision: **NO-GO / NOT CERTIFIED**.

| Batch | Execution | Result |
|---|---|---|
| G941 | Inspect harmonized branch head 50401354 | Confirmed |
| G942 | Inspect Merge Conflict Preflight | PASS |
| G943 | Inspect Accounting Integrity | PASS |
| G944 | Inspect CI and dependency candidate | In progress at inspection |
| G945 | Review existing orchestration definition engine and runtime | Confirmed |
| G946 | Review shared three-OS catalog contract | Confirmed |
| G947 | Implement opt-in governed runtime entry point | Committed |
| G948 | Validate workflow version, tenant, actor, correlation, entity and period against loaded run | Implemented |
| G949 | Require core authorization callback and governance identifiers | Implemented |
| G950 | Wire real policy service, persistence, tests and exact-SHA certification | Pending |

New `src/lib/orchestration/governed-runtime.ts` delegates to existing `executeReadySteps` rather than creating a second state machine. It rejects direct n8n runtime execution, validates envelope/run scope, and requires an injected core policy authorization callback. The callback must verify actual approvals, SoD, fiscal-period locks, role and policy version; it is not supplied by this module. Current in-memory stores remain unsuitable for production durability and idempotency under concurrency. No migration of existing handlers or workflows has occurred, and this entry point has not yet been certified by CI. No production migration, merge or deployment.

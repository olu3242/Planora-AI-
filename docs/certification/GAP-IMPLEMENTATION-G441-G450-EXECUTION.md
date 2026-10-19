# G441–G450 — Tenant RLS policy and function grant diagnostics

Date: 2026-10-17. Release decision: **NO-GO / NOT CERTIFIED**.

| Batch | Scope | Result |
|---|---|---|
| G441 | Inspect G431–G440 exact-SHA workflows | Accounting Integrity PASS |
| G442 | Inspect merge-conflict preflight | PASS |
| G443 | Inspect full CI | In progress at inspection |
| G444 | Review tenant session function invocation | Required for session-based tenant authorization |
| G445 | Review test reset/migration entrypoints | Guarded isolated test DB |
| G446 | Verify policy definition existence on 56 manifest tables | Added pg_policy catalog check |
| G447 | Check function execute permission for migration owner | Added |
| G448 | Add optional runtime function execute grant verification | Added behind CHECK_RUNTIME_ROLE=1 |
| G449 | Ensure initial migration check does not require unprovisioned role | Runtime grant check gated |
| G450 | Execute full Docker suite and repair missing migration | Not executed; no Docker daemon in this environment |

The migration diagnostic now requires exact public.planora_session_tenant(), forced RLS and at least one policy definition on every manifest table. Optional CHECK_RUNTIME_ROLE=1 checks function execution through the restricted role **after provisioning**; do not enable it before the role exists. This checks presence and grants, not session-function semantics or policy correctness. No production changes or deployment. Security audit remains failing.

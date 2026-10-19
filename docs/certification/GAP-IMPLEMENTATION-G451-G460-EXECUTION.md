# G451–G460 — Mandatory restricted-role tenant function verification

Date: 2026-10-17. Release decision: **NO-GO / NOT CERTIFIED**.

| Batch | Action | Evidence |
|---|---|---|
| G451 | Inspect G441–G450 exact-SHA CI | In progress at inspection |
| G452 | Inspect Accounting Integrity | PASS |
| G453 | Inspect Merge Conflict Preflight | PASS |
| G454 | Review tenant migration gate | Checks exact session function and 56 forced-RLS tables |
| G455 | Review runtime grant check | Previously optional and not invoked by certify |
| G456 | Add mandatory post-provisioning runtime grant test | package.json certify updated |
| G457 | Add dedicated test:tenant-migration:runtime command | Implemented |
| G458 | Remove undeclared cross-env dependency | Replaced with --runtime CLI flag |
| G459 | Preserve pre-provisioning owner-only migration checks | Preserved |
| G460 | Run Docker and exact-SHA certification | Pending; no passing evidence |

Canonical certify now checks the tenant migration after reset/seed, provisions the isolated non-owner PostgreSQL runtime role, then executes the tenant function permission check as that role before browser E2E. The permission check is not proof of the session function's behavior. Actual migration repair, Docker execution, and independent security audit remain unresolved. No production migration, PR merge or deployment.

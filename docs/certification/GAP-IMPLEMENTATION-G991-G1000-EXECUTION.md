# G991-G1000 — Tenant-scoped PostgreSQL workflow stores

Date: 2026-10-18. Release decision: **NO-GO / NOT CERTIFIED**.

| Batch | Execution | Result |
|---|---|---|
| G991 | Inspect prior head 483d9f7 | Confirmed |
| G992 | Inspect Merge Conflict Preflight | PASS on prior head |
| G993 | Inspect Accounting Integrity | PASS on prior head |
| G994 | Inspect Dependency Remediation Candidate | FAIL on prior head |
| G995 | Inspect CI | In progress on prior head |
| G996 | Inspect existing workflow run and execution persistence schema | Confirmed |
| G997 | Implement organization-scoped persisted run store | Committed |
| G998 | Implement organization-scoped persisted execution store | Committed |
| G999 | Add persisted identity and idempotency collision checks | Committed; CI not verified |
| G1000 | Certify concurrent PostgreSQL claims, crash recovery, leases, and financial effects | Not completed |

Added `src/lib/orchestration/postgres-stores.ts` using the existing Prisma `WorkflowRunRecord` and `WorkflowExecutionRecord` models. No schema migration was needed for these adapters. The persisted execution schema does not currently retain attempt counts and error classes; the adapter cannot faithfully round-trip those fields. The run store uses unconditional updates and therefore does **not** provide optimistic concurrency or protect the atomic claim from stale overwrites. Do not enable the adapters for production financial mutations until this is resolved with versioned CAS, a worker lease, and transactional execution/outbox. Existing security audit is still a release blocker. No production merge or deployment.

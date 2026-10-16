# BC81–BC90: durable cleanup job foundation

| Batch | Capability | Status |
|---|---|---|
| BC81 | Durable cleanup job table | Committed |
| BC82 | Tenant RLS enable and force | Committed |
| BC83 | Organization-scoped idempotency key | Committed |
| BC84 | Lease token and expiry fields | Committed |
| BC85 | Prisma job model | Committed |
| BC86 | Scope-verified enqueue | Committed |
| BC87 | Atomic conditional lease claim | Committed |
| BC88 | Fenced completion and bounded retry escalation | Committed |
| BC89 | Four migration invariants tests | Written, unexecuted |
| BC90 | CI registration | Configured, not verified |

Limitations: This is persistence and claim/finalization logic only. No deployed scheduler, job polling worker, bank event hook, real E2E or operational monitoring. RUNNING leases are not yet reclaimable after worker crash; implement expiry recovery with fencing before relying on it. The job queue must never be used to authorize posting, and service-only callers must obtain trusted organization context. Migration/typecheck/PostgreSQL RLS and runtime tests have not run. NO-GO.

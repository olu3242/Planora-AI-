# BC151–BC160 — durable import outbox foundation

| Batch | Status |
|---|---|
| BC151 | Outbox SQL migration committed |
| BC152 | Tenant RLS enabled and forced |
| BC153 | Unique tenant/import event constraint |
| BC154 | Prisma outbox model committed |
| BC155 | Transaction-compatible outbox writer committed |
| BC156 | Tenant-scoped pending event dispatcher committed |
| BC157 | Idempotent job enqueue and delivered-state transition |
| BC158 | Four migration invariant tests written |
| BC159 | CI suite updated |
| BC160 | Actual import transaction wiring and hosted certification pending |

The outbox writer must be called inside the SAME database transaction as a verified bank-import completion; it is not yet wired to that transaction. The dispatcher is a server function, not a deployed scheduled process. There is no explicit claim/lease for concurrent dispatchers; duplicate delivery is mitigated by the unique job key but delivery counts may overstate acknowledgements. Tenant RLS, typecheck, migration, and E2E were not executed. Certification: NO-GO.

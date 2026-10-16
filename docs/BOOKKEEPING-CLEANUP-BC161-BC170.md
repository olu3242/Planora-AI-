# BC161–BC170 — transactional outbox delivery hardening

| Batch | Result |
|---|---|
| BC161 | Reviewed durable outbox dispatcher |
| BC162 | Removed separate transaction enqueue and acknowledgement |
| BC163 | Unified enqueue and acknowledgement in tenant transaction |
| BC164 | Retained unique import-event job key |
| BC165 | Retained tenant/entity/period ownership checks |
| BC166 | Rejects conflicting reuse of import event ID |
| BC167 | Conditional PENDING-to-DELIVERED acknowledgement |
| BC168 | Three static regression tests written |
| BC169 | CI test registration committed |
| BC170 | Runtime PostgreSQL, import hook, hosted worker pending |

The real bank-import completion transaction still does not invoke recordCleanupImportEventInTransaction. The tests inspect source structure, not database atomicity. Concurrent delivery may cause transaction contention and should be verified against PostgreSQL with two dispatchers. The dispatcher is not scheduled. No Prisma validation, runtime RLS, typecheck or E2E result was observed. Certification remains NO-GO.

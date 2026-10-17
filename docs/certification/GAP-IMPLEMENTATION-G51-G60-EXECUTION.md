# Planora gap execution G51–G60
Date: 2026-10-15
Status: PARTIAL / NO-GO

| Batch | Workstream | Status |
|---|---|---|
| G51 | Inspect persisted approval consumption | Completed |
| G52 | Recheck organization at consumption | Implemented |
| G53 | Recheck legal entity at consumption | Implemented |
| G54 | Recheck fiscal period at consumption | Implemented |
| G55 | Recheck source idempotency key at consumption | Implemented |
| G56 | Recheck expiry in conditional database update | Implemented |
| G57 | Retain consumedAt/journalId compare-and-set | Preserved |
| G58 | Add approval consumption regression fixtures | Two tests added; not executed |
| G59 | Verify isolated PostgreSQL rollback and concurrency | Pending |
| G60 | Exact SHA full certification | NO-GO |

## Implementation details
The existing Prisma posting adapter checks persisted approval and membership within a serializable transaction. This change strengthens the conditional approval update with organization, legal entity, fiscal period, source key and expiry constraints, reducing the window for stale approval consumption. It does not replace the trusted-session posting command.

Unit mocks inspect the conditional update and rejected consumption races; mocks do not prove database rollback or isolation. Actual PostgreSQL transaction and tenant RLS tests remain mandatory. No tests were executed in this GitHub connector session. No migration, production posting, or deployment performed.

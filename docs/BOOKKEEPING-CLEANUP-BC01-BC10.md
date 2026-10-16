# Bookkeeping Cleanup — BC01–BC10

| Batch | Scope | Result |
|---|---|---|
| BC01 | Deterministic cleanup case creation | Committed |
| BC02 | Investigation state | Committed |
| BC03 | Correction proposal state | Committed |
| BC04 | Controller-only approval | Committed |
| BC05 | Self-approval prevention | Committed |
| BC06 | Approval-gated execution queue state | Committed |
| BC07 | Independent verification state | Committed |
| BC08 | Evidence history and revision control | Committed |
| BC09 | Five workflow regression tests | Written, unexecuted |
| BC10 | Persisted end-to-end cleanup execution | Pending |

This wave provides a pure state machine, not a database-backed cleanup service. It does not mutate journal, bank or accounting records. APPROVED and EXECUTION_PENDING do not mean the correction was executed; verification currently depends on a caller-supplied evidence identifier and must later be linked to independently verified execution results.

Outstanding: tenant-scoped persistent cases, authenticated role enforcement, real executor adapters through existing accounting approvals, journal reversal controls, reconciliation verification, immutable audit events, Financial Readiness recalculation, runtime PostgreSQL RLS and E2E tests.

Release: NO-GO.

# BC121–BC130: worker fencing remediation and import integration boundary

| Batch | Outcome |
|---|---|
| BC121 | Audited prior worker completion logic |
| BC122 | Removed unsafe double-finalization on completion failure |
| BC123 | Added lost-lease completion regression |
| BC124 | Added database-failure completion regression |
| BC125 | Created trusted completed-import integration adapter |
| BC126 | Prevented enqueue on failed and pending imports |
| BC127 | Preserved enqueue failure propagation |
| BC128 | Added three import adapter tests |
| BC129 | Registered five new regression cases in CI |
| BC130 | Live bank-import wiring, lease heartbeat, hosted E2E pending |

IMPORTANT: The import adapter is not wired to the actual bank import service; its input must be constructed from a verified server-side import record, not request JSON. Durable outbox delivery is still required to avoid losing jobs if the process crashes between import completion and enqueue. The worker still has no periodic heartbeat, so scans longer than the lease may be reclaimed. No live tests were executed and CI success is not verified. NO-GO.

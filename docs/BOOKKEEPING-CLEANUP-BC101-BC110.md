# BC101–BC110 — event requeue, lease renewal and job health

| Batch | Capability | Status |
|---|---|---|
| BC101 | Import-event scoped deterministic job identity | Committed |
| BC102 | Stable deduplication on import retries | Committed |
| BC103 | New import creates new work without reopening old jobs | Committed |
| BC104 | Tenant and accounting scope verified on enqueue | Committed |
| BC105 | Active lease renewal by matching fencing token | Committed |
| BC106 | Reject expired and stolen lease renewal | Committed |
| BC107 | Tenant-isolated queue health counters | Committed |
| BC108 | Escalation and expired-lease visibility | Committed |
| BC109 | Four import key tests | Written, unexecuted |
| BC110 | CI registration | Configured, unverified |

Important: no bank-import event handler calls enqueueCleanupForImport yet. Lease renewal is available but the worker does not schedule heartbeat renewal while scanning. Health counters are internal functions, not an alert delivery system. Actual hosted scheduler, monitoring notifications, PostgreSQL migration and RLS tests, typecheck and browser E2E remain pending. NO-GO.

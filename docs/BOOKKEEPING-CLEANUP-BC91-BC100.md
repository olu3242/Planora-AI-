# BC91–BC100: leased advisory cleanup worker

| Batch | Result |
|---|---|
| BC91 | Injectable worker scan/finish boundary committed |
| BC92 | Tenant-scoped due-job polling committed |
| BC93 | Atomic claim retained |
| BC94 | Expired lease reclaim with fresh fencing token committed |
| BC95 | Worker scans and registers advisory cleanup cases |
| BC96 | Successful scan completes only under active lease |
| BC97 | Scan failure routed through bounded retry/escalation |
| BC98 | Four worker unit tests written, not executed |
| BC99 | CI suite registration configured |
| BC100 | Deployed scheduler and production E2E pending |

## Operational cautions
The runner is a trusted server-only function and is not scheduled or deployed. Call it only from an authenticated service process that establishes the organization ID independently. No public endpoint, webhook or scheduler is configured.

A reclaimed expired lease is fenced by a new token. The old worker can still finish its external read-only scan, but cannot finalize the reclaimed job. Advisory case registration is idempotent. The current job-key upsert does not requeue completed jobs after new imports; event generation/versioned job keys or explicit safe requeue is needed. No heartbeat exists for long scans, and a 60-second lease can expire during processing.

Do not expose this worker as a journal posting executor. Prisma/typecheck, PostgreSQL migration and restricted-role RLS, integration and browser E2E, hosted scheduling, and operational monitoring remain unverified. NO-GO.

# Planora accounting automation: current-state gap assessment and remediation

## Evidence boundary
Source reviewed on feature branch feat/ai-mapping-engine-m01-m10-20261016. GitHub combined commit status returned no statuses for the inspected commit. No test execution, PostgreSQL runtime role, browser E2E or deployment has been verified.

| Area | Observed code state | Missing gate |
|---|---|---|
| Bank ingestion | BankAccount/BankTransaction models and read-only bank workspace | Verified import completion writer and atomic outbox hook |
| Cleanup detection | Scoped reconciliation probe and case registration | Real data fixtures, multi-tenant isolation and truncation proof |
| Case approvals | Human workflow and approval endpoints | Runtime RBAC and immutable audit certification |
| Jobs | Durable queue, retries, leases and heartbeat | Concurrent worker / crash recovery integration test |
| Outbox | SQL/Prisma and transactional delivery code | Import completion transaction hookup and concurrent dispatch test |
| Automation | Trusted internal cycle function | Authenticated scheduler and operational deployment |
| Accounting corrections | Advisory cases and posted-journal verification helpers | Trusted posting/reversal execution and independent proof |
| Readiness | Cleanup controls in live preflight | Certified readiness recalculation on verified correction |
| Security | RLS migrations and limited CI checks | Restricted runtime-role cross-tenant tests |
| Certification | Workflow exists | Verified green Prisma, typecheck, migrations, RLS, unit, E2E and build |

## Changes in this wave
- Expanded push and pull-request triggers to include bookkeeping reconciliation files, tests and cleanup migrations.
- Extended PostgreSQL RLS flag check to CleanupCase, CleanupJob and CleanupOutbox.
- Added workflow coverage regression tests and registered them.

## Next implementation order
1. Locate or build the authoritative bank-import completion transaction. Write the outbox event in that same transaction, never from user-supplied scope.
2. Add restricted PostgreSQL role RLS tests and parallel outbox dispatcher/lease recovery tests.
3. Connect a service-authenticated scheduler with bounded tenant enumeration, heartbeat, alert delivery and runbook.
4. Implement authorized correction posting, independent reconciliation verification and readiness recalculation.
5. Execute the full certification pipeline, collect logs and preserve NO-GO until all gates pass.

This document does not certify the platform.

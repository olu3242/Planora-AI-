# G471–G480 — Exact tenant migration target and runtime identity

Date: 2026-10-17. Decision: **NO-GO / NOT CERTIFIED**.

| Batch | Action | Result |
|---|---|---|
| G471 | Inspect G461–G470 exact-SHA workflows | Preflight PASS |
| G472 | Inspect Accounting Integrity | In progress at inspection |
| G473 | Inspect full CI | In progress at inspection |
| G474 | Review canonical migration | Function is defined as RETURNS uuid |
| G475 | Review runtime role provisioning | Restricted role explicitly configured |
| G476 | Validate exact function return type | Added |
| G477 | Validate connected owner database identity | Added |
| G478 | Require public schema and matching Prisma schema query | Added |
| G479 | Verify runtime role identity, non-superuser and NOBYPASSRLS | Added |
| G480 | Execute Docker E2E and resolve root cause | Pending; no accessible Docker daemon |

This change narrows diagnosis of the previously reported missing function by rejecting wrong return types, wrong target databases, wrong schemas and unsafe runtime roles. The canonical migration is not rewritten; historical migration checksums remain authoritative. No passing Docker E2E or security audit is claimed. No production migration, merge or deployment.

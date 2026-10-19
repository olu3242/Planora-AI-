# G631–G640 — Repair RLS regression fixture typecheck

Date: 2026-10-17. Release: **NO-GO / NOT CERTIFIED**.

| Batch | Execution | Result |
|---|---|---|
| G631 | Inspect head c160bdf6 Actions | Merge Conflict Preflight PASS |
| G632 | Inspect full CI | In progress at inspection |
| G633 | Inspect Accounting Integrity | In progress at inspection |
| G634 | Inspect independent security audit | FAIL |
| G635 | Inspect prior completed CI 39092270826 | FAIL at TypeScript typecheck |
| G636 | Identify compiler error | TS2353: organizationId not a ForecastVersion field |
| G637 | Inspect Prisma schema | ForecastVersion belongs to Forecast via forecast relation |
| G638 | Repair test fixture query | Filter via forecast.organizationId |
| G639 | Preserve tenant-scoped audit regression and forbidden User access assertion | Unchanged |
| G640 | Exact-SHA certification and security remediation | Pending |

The RLS regression introduced in G611-G620 used a nonexistent direct ForecastVersion.organizationId field. It now selects a version through the owning Forecast relation, matching the Prisma schema. This fixes the identified type error but is not proof that the full regression passes. The new commit requires a fresh exact-SHA CI run. The dependency security audit continues to report high-severity findings. No production migration, merge or deployment.

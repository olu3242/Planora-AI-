# G611-G620 — Forecast audit RLS regression and release gates

Date: 2026-10-17. Release: **NO-GO / NOT CERTIFIED**.

| Batch | Execution | Result |
|---|---|---|
| G611 | Inspect G601-G610 exact-SHA workflows | Merge Conflict Preflight PASS |
| G612 | Inspect Accounting Integrity | In progress at inspection |
| G613 | Inspect full CI | In progress at inspection |
| G614 | Inspect independent security audit | FAIL |
| G615 | Review forecast audit query after User-join removal | Confirmed no include.actor |
| G616 | Review restricted role provisioning | User and Session SELECT explicitly revoked |
| G617 | Review tenant security test fixture | Two-tenant isolated PostgreSQL test role |
| G618 | Add forecast audit read regression using restricted runtime | Committed |
| G619 | Assert forbidden User access still fails | Committed |
| G620 | Complete new exact-SHA CI and vulnerability remediation | Pending |

The regression executes the forecast audit query with the non-owner tenant runtime role and requires tenant-owned results only. It explicitly asserts that the same role cannot query User. This prevents the original browser error from being fixed by broadening database grants. The browser E2E fix from G601-G610 and this regression are not yet certified on a completed exact-SHA run. The security audit still fails; dependency updates require compatible package resolution and a regenerated tested lockfile. No production migration, merge or deployment.

# G761-G770 — Symmetric database-enforced forecast isolation

Date: 2026-10-17. Decision: **NO-GO / NOT CERTIFIED**.

| Batch | Execution | Result |
|---|---|---|
| G761 | Inspect head 4902d871 | Confirmed |
| G762 | Inspect Accounting Integrity | PASS |
| G763 | Inspect Merge Conflict Preflight | PASS |
| G764 | Inspect CI certify | In progress at inspection |
| G765 | Inspect independent security audit | FAIL |
| G766 | Inspect package-lock dependency versions | braces 3.0.3; micromatch 4.0.8; fast-glob 3.3.1; @next/eslint-plugin-next 16.4.2 |
| G767 | Inspect RLS tenant A positive read | Application organization predicate still present |
| G768 | Remove app-level tenant predicate from positive read | Committed |
| G769 | Preserve negative tenant B and direct comment assertions | Preserved |
| G770 | Verify new exact-SHA CI, browser and security | Pending |

Both the tenant A positive forecast read and tenant B negative forecast read now query by version ID without organizationId filtering. Database RLS must allow the authorized tenant and deny the foreign tenant. This strengthens proof that isolation is enforced by PostgreSQL rather than by application predicates. The security audit continues to report five high findings; no dependency upgrade or forced downgrade was applied. No production migration, merge or deployment. A live CI job's log endpoint returned an unavailable blob during inspection, so its outcome was not inferred.

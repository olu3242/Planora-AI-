# G711-G720 — Forecast comment RLS hydration regression

Date: 2026-10-17. Decision: **NO-GO / NOT CERTIFIED**.

| Batch | Execution | Result |
|---|---|---|
| G711 | Inspect G701-G710 head 981862d3 | Confirmed |
| G712 | Inspect Merge Conflict Preflight | PASS |
| G713 | Inspect Accounting Integrity | PASS |
| G714 | Inspect CI certify job | In progress at inspection |
| G715 | Inspect independent security-audit | FAIL |
| G716 | Review protected User join regression | Confirmed prior failure and source fix |
| G717 | Review forecast repository query shape | Includes forecast, lines, comment records without author joins |
| G718 | Add tenant RLS forecast comment hydration test | Committed |
| G719 | Assert tenant forecast read and comment authorId availability | Implemented |
| G720 | Verify exact-SHA RLS/browser/build and security audit | Pending |

The new regression runs the forecast repository's tenant-scoped relation hydration shape under the restricted runtime role, verifying that comment data is available without querying User. The test executes when a tenant forecast version exists in the isolated fixture; otherwise it returns without assertion, which is a coverage limitation to resolve with a deterministic fixture. No production grants, migrations, merges or deployments. Exact-SHA certification and five high dependency findings remain blockers.

# G731-G740 — Seeded comment RLS hydration regression

Date: 2026-10-17. Release decision: **NO-GO / NOT CERTIFIED**.

| Batch | Execution | Result |
|---|---|---|
| G731 | Inspect head f2c257f | Confirmed |
| G732 | Inspect Merge Conflict Preflight | PASS |
| G733 | Inspect Accounting Integrity | In progress at inspection |
| G734 | Inspect full certify jobs | In progress at inspection |
| G735 | Inspect independent dependency security audit | FAIL |
| G736 | Inspect RLS comment fixture | Forecast exists but no comment guaranteed |
| G737 | Inspect ForecastComment schema | Required authorId, forecastVersionId, body, context |
| G738 | Seed real forecast comment using isolated test owner | Committed |
| G739 | Assert hydrated comment ID, author ID, and body under restricted runtime role | Implemented |
| G740 | Verify new exact-SHA CI and security certification | Pending |

The regression now creates an actual comment attached to the tenant forecast version. It verifies that the restricted tenant runtime reads the comment's ID, author ID and body without joining the protected User table. Owner access is used only for test setup; application runtime permissions are unchanged. This addresses the previously noted vacuous test. Exact-SHA RLS, browser and build verification remains pending, and the separate security audit continues to report high-severity vulnerabilities. No production migrations, merges or deployments.

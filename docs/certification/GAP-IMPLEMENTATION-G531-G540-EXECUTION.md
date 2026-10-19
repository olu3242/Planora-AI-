# G531–G540 — Agent recommendation rendering and browser E2E

Date: 2026-10-17. Decision: **NO-GO / NOT CERTIFIED**.

| Batch | Evidence or action | Result |
|---|---|---|
| G531 | Inspect exact-SHA CI 39084209582 | FAILED |
| G532 | Inspect Accounting Integrity | PASS |
| G533 | Inspect Merge Conflict Preflight | PASS |
| G534 | Inspect dependency security audit | FAIL, five high vulnerabilities |
| G535 | Inspect browser E2E | 38 passed, 1 failed |
| G536 | Verify walkthrough focus test | PASS |
| G537 | Inspect remaining Workflow Assistant E2E | Persisted run and recommendation assertions passed; page locator failed |
| G538 | Ensure redirected run recommendation is visible beyond bounded recent list | Implemented with tenant-scoped forecast/run query |
| G539 | Match actual persisted recommendation summary in E2E | Implemented |
| G540 | Verify new exact-SHA CI and Docker | Pending |

The forecast page keeps its bounded recent recommendations list, but when an authenticated user follows an agentRun redirect it also loads the corresponding persisted recommendation with organizationId and forecastVersionId restrictions. No cross-tenant lookup is introduced. The E2E test checks the persisted recommendation summary instead of a display-name string. The root cause of the missing presentation label is not proven; the rendering change is defensive and needs CI verification. The independent dependency security audit remains a blocker. No production migration, merge or deployment.

# G621-G630 — Preserve reviewed agent recommendation across feedback redirects

Date: 2026-10-17. Release decision: **NO-GO / NOT CERTIFIED**.

| Batch | Execution | Result |
|---|---|---|
| G621 | Inspect G611-G620 exact-SHA workflow 39092270826 | In progress at inspection |
| G622 | Inspect Merge Conflict Preflight | PASS |
| G623 | Inspect Accounting Integrity | In progress at inspection |
| G624 | Inspect independent security audit | FAIL |
| G625 | Inspect completed prior CI 39089012845 | FAIL: browser E2E |
| G626 | Identify browser failure | Accepted Commentary Assistant result not visible after feedback redirect |
| G627 | Inspect feedback route | Redirect returned agentDecision but omitted recommendation ID |
| G628 | Preserve reviewed recommendation ID in redirect | Committed |
| G629 | Tenant/forecast-scope reviewed recommendation lookup and deduplication | Committed |
| G630 | Add E2E redirect identity assertion | Committed; exact-SHA verification pending |

The feedback route now includes `agentRecommendation` in the post-decision redirect. The forecast page loads that exact recommendation only if it belongs to the authenticated organization and current forecast version, and merges it with the recent list without duplicates. The browser test requires the redirect to carry the recommendation ID and still requires the accepted result to be visible. This does not bypass human review or change ledger posting. Security audit findings remain unresolved. No production migration, merge, or deployment.

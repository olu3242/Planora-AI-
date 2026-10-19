# G521–G530 — Browser focus lifecycle and agent run provenance

Date: 2026-10-17. Release: **NO-GO / NOT CERTIFIED**.

| Batch | Execution | Result |
|---|---|---|
| G521 | Inspect exact-SHA run 39080080282 | CI in progress at inspection |
| G522 | Inspect Merge Conflict Preflight | PASS |
| G523 | Inspect Accounting Integrity | In progress at inspection |
| G524 | Inspect existing video dialog lifecycle | Parent attempted focus before animated modal unmount |
| G525 | Restore opener focus from modal unmount cleanup | Committed |
| G526 | Preserve focus of previously active element when connected | Committed |
| G527 | Inspect agent request and redirect | Successful POST redirects with agentRun query parameter |
| G528 | Inspect deterministic next-best-action logic | Output depends on role, status, errors, lines and commentary |
| G529 | Trace E2E agent run to persisted run, capability and recommendation | Committed |
| G530 | Exact-SHA browser E2E and audit certification | Pending; no passing result claimed |

The workflow E2E no longer assumes a fixed recommendation label for all valid forecast states. It requires a successful agentRun redirect, persisted SUCCEEDED run, matching capability, at least one persisted recommendation and exact rendering of the persisted recommendation summary. This strengthens end-to-end provenance without weakening human approval controls. The video dialog now restores focus on actual unmount after the exit animation. The prior audit reported five high-severity vulnerabilities; security audit remains a release gate. No production migration, merge or deployment.

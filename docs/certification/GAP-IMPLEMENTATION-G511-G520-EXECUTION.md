# G511–G520 — Repeated browser failures and stronger agent diagnosis

Date: 2026-10-17. Decision: **NO-GO / NOT CERTIFIED**.

| Batch | Action | Result |
|---|---|---|
| G511 | Inspect exact-SHA run 39078911356 | CI FAILED |
| G512 | Inspect Accounting Integrity | PASS |
| G513 | Inspect Merge Conflict Preflight | PASS |
| G514 | Inspect security audit | FAIL: 5 high vulnerabilities |
| G515 | Inspect certify job sequence | Generator, migration, unit, integration, financial, security and performance checks reached browser tests |
| G516 | Inspect browser results | 37 PASS, 2 FAIL |
| G517 | Inspect walkthrough focus failure | Opener remained inactive after Escape |
| G518 | Restore focus on lightbox state transition | Source fix committed |
| G519 | Inspect agent journey failure | Recommendation missing; no proven root cause |
| G520 | Require successful agentRun redirect in E2E | Diagnostic assertion committed |

The video fix focuses the opener when lightbox state transitions from open to closed, independent of the exit animation callback. The agent E2E now requires a successful redirect with agentRun before checking the recommendation; this does not bypass or weaken the agent output assertion. Both changes need exact-SHA CI verification. Do not claim browser certification, Docker certification, or dependency audit success. No production migration, merge, or deployment.

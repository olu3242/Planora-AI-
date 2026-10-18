# G541–G550 — Security advisory provenance and exact-SHA certification

Date: 2026-10-17. Decision: **NO-GO / NOT CERTIFIED**.

| Batch | Evidence / action | Result |
|---|---|---|
| G541 | Inspect G531–G540 exact-SHA CI run 39084769779 | Certify in progress at inspection |
| G542 | Inspect Accounting Integrity | PASS |
| G543 | Inspect Merge Conflict Preflight | PASS |
| G544 | Inspect security-audit job | FAIL: five high-severity findings |
| G545 | Read audit advisory and dependency chain | braces > micromatch > fast-glob > @next/eslint-plugin-next > eslint-config-next |
| G546 | Inspect package.json and package-lock.json | npm ci succeeds; braces 3.0.3 override already present |
| G547 | Reject npm audit fix --force | Would downgrade eslint-config-next to 14.2.35, breaking Next 16 alignment |
| G548 | Add production-only npm audit JSON evidence | Committed |
| G549 | Add npm explain braces/micromatch diagnostics | Committed |
| G550 | Exact-SHA CI and Docker certification | Pending; no successful run claimed |

The new diagnostics do not change dependencies, waive advisories, or weaken `npm audit --audit-level=moderate`. Follow up by inspecting the production-only audit and testing a compatible, lockfile-regenerated transitive dependency update in isolation. Full certification, browser E2E, and production release remain blocked until passing exact-SHA evidence is available. No production migration, PR merge or deployment.

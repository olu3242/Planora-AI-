# G931-G940 — Alternative ESLint audit clean; compatibility experiment

Date: 2026-10-18. Release decision: **NO-GO / NOT CERTIFIED**.

| Batch | Execution | Result |
|---|---|---|
| G931 | Inspect head ec366364 | Confirmed |
| G932 | Inspect Merge Conflict Preflight | PASS |
| G933 | Inspect Accounting Integrity | PASS |
| G934 | Inspect remediation run 39131365795 | Candidate workflow failed original security gate |
| G935 | Read alternate experiment exit statuses | lint=1, typecheck=0, audit=0 |
| G936 | Inspect alternate security audit | Zero vulnerabilities |
| G937 | Inspect lint failures | Legacy @next/next/no-img-element directive and accessibility rules |
| G938 | Add compatibility experiment for legacy directive and media rules | Committed |
| G939 | Preserve original full audit gate and evidence-only alternate | Preserved |
| G940 | Verify replacement lint, security, build, browser and apply to app | Pending |

The alternate candidate passed npm audit with zero vulnerabilities and TypeScript, but lint failed. This batch adjusts the isolated experiment by defining a no-op compatibility rule for the legacy Next inline directive and temporarily disabling no-autofocus and media-has-caption. These are exploratory relaxations, **not acceptable as a final security/accessibility policy without review**. A production-quality replacement must remove obsolete inline disables and resolve accessibility findings appropriately before application migration. No application dependencies changed, and no production merge or deployment occurred.

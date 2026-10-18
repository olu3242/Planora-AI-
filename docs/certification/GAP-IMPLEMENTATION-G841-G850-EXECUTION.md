# G841-G850 — PR-visible dependency candidate execution trigger

Date: 2026-10-18. Release decision: **NO-GO / NOT CERTIFIED**.

| Batch | Execution | Result |
|---|---|---|
| G841 | Inspect head 5a3bc796 | Confirmed |
| G842 | Inspect Merge Conflict Preflight | PASS |
| G843 | Inspect Accounting Integrity | PASS |
| G844 | Inspect CI certify job 117597277509 | PASS |
| G845 | Inspect independent security-audit 117597277363 | FAIL |
| G846 | Inspect audit/certification artifacts | Both uploaded |
| G847 | Inspect candidate workflow triggers | Manual and push on workflow file |
| G848 | Add PR workflow-file change trigger for candidate | Committed |
| G849 | Inspect immediate commit run lookup | No matching PR runs returned at inspection |
| G850 | Obtain candidate run, apply lockfile and certify | Pending |

The isolated candidate workflow now triggers on pull requests that change the workflow file, making runs observable through the connector's PR-filtered workflow lookup. This change does not remediate any vulnerability. The most recent full application certify passed while security audit failed. No candidate lockfile was retrieved or applied; no release authorization. No production migration, merge or deployment.

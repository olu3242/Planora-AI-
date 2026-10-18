# G871-G880 — Upstream versus installed ESLint dependency comparison

Date: 2026-10-18. Release decision: **NO-GO / NOT CERTIFIED**.

| Batch | Execution | Result |
|---|---|---|
| G871 | Inspect head 56a77a | Confirmed |
| G872 | Inspect Merge Conflict Preflight | PASS |
| G873 | Inspect Accounting Integrity | PASS |
| G874 | Inspect CI certify | PASS |
| G875 | Inspect independent security audit | FAIL |
| G876 | Inspect remediation candidate job | FAIL security gate |
| G877 | Inspect candidate artifact | Uploaded |
| G878 | Inspect npm audit output | Five high vulnerabilities remain |
| G879 | Add installed-version package dependency metadata alongside upstream metadata | Committed |
| G880 | Apply compatible remediation and recertify | Pending |

The current application certify job passed, but full CI failed on security audit. Candidate remediation again failed audit. The workflow now captures metadata for installed @next/eslint-plugin-next@16.4.2, fast-glob@3.3.1 and micromatch@4.0.8 to compare with upstream package versions. This is investigation, not remediation. No lockfile or dependency version changed. No production migration, merge or deployment.

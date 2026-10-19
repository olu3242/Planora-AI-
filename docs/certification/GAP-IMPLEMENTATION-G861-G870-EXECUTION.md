# G861-G870 — Investigate upstream fixes for vulnerable ESLint chain

Date: 2026-10-18. Release decision: **NO-GO / NOT CERTIFIED**.

| Batch | Execution | Result |
|---|---|---|
| G861 | Inspect head b0a3d80 | Confirmed |
| G862 | Inspect Merge Conflict Preflight | PASS |
| G863 | Inspect Accounting Integrity | PASS |
| G864 | Inspect CI certify | In progress |
| G865 | Inspect remediation candidate 39101599634 | FAIL |
| G866 | Inspect candidate artifact | Uploaded |
| G867 | Confirm npm update candidate still fails security gate | Confirmed |
| G868 | Add upstream package metadata checks for @next/eslint-plugin-next, braces, micromatch, fast-glob, eslint-config-next | Committed |
| G869 | Preserve no-force candidate installation and fail-closed audit | Preserved |
| G870 | Commit a compatible security remediation | Pending |

The candidate workflow now captures npm registry metadata for the latest upstream releases and their declared dependencies, enabling an evidence-based choice of compatible replacement rather than another blind npm update. The npm audit still fails with five high vulnerabilities. No package or lockfile was changed and no security pass is claimed. No production migration, merge or deployment.

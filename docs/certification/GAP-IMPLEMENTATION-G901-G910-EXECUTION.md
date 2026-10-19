# G901-G910 — Isolated ESLint dependency replacement experiment

Date: 2026-10-18. Release decision: **NO-GO / NOT CERTIFIED**.

| Batch | Execution | Result |
|---|---|---|
| G901 | Inspect head d5081dba | Confirmed |
| G902 | Inspect Merge Conflict Preflight | PASS |
| G903 | Inspect Accounting Integrity | PASS |
| G904 | Inspect candidate workflow | FAIL audit despite successful installation and lint/typecheck |
| G905 | Inspect original lint configuration | eslint-config-next core-web-vitals + typescript |
| G906 | Inspect package manifest | Next 16 and eslint-config-next 16.4 series |
| G907 | Design alternate ESLint stack experiment | typescript-eslint, React, React Hooks, jsx-a11y |
| G908 | Add evidence-only isolated alternate dependency installation and lint/typecheck/audit | Committed |
| G909 | Preserve original candidate security gate and original config evidence | Implemented |
| G910 | Verify experiment, apply validated replacement and recertify | Pending |

The alternate stack experiment uninstalls eslint-config-next in the temporary runner only, installs standalone ESLint plugins, writes a temporary flat ESLint config, and captures lint/typecheck/audit output plus candidate package files as artifacts. The experiment uses non-fatal checks for evidence and is not proof of compatibility or security. Existing security audit remains fail-closed. No actual dependency replacement has been committed to the application, and no production migration, merge or deployment occurred.

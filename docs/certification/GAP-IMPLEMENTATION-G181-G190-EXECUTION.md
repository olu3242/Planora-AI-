# Planora G181–G190 — CI remediation evidence

Date: 2026-10-15. Release: **NO-GO**.

| Batch | Scope | Result |
|---|---|---|
| G181 | Inspect CI run 38836963755 | FAILED: unresolved merge markers |
| G182 | Inspect accounting run 38836963792 | FAILED: npm ci cannot parse lockfile |
| G183 | Inspect CI run 38836963746 | FAILED: conflict preflight |
| G184 | Reconcile AGENTS.md | Committed |
| G185 | Reconcile PRD.md | Committed |
| G186 | Reconcile canonical financial model | Committed |
| G187 | Reconcile E2E acceptance and traceability | Committed |
| G188 | Reconcile foundation E2E tests | Committed; not executed |
| G189 | Diagnose dependency lockfile | 234 merge marker lines; needs clean regeneration |
| G190 | Exact-SHA certification | NO-GO |

## Lockfile policy
`package-lock.json` contains 234 conflict marker lines and mismatched historical dependency graphs (Next 16.3 vs 16.4, csv-parse 6 vs 7, and more). **Do not resolve the lockfile by taking one side of the merge.** On an isolated checkout, back up the original, regenerate using the committed `package.json` with the pinned Node/npm toolchain, run `npm ci`, then commit the resulting lockfile. Review dependency changes and integrity metadata before merge.

## CI evidence boundary
Source repairs remove conflict markers from five documentation files and one E2E test. No CI passing result, isolated PostgreSQL test, RLS proof, or deployment is claimed. Remaining lockfile repair and full certification are mandatory.

## Next gate
1. Regenerate and review lockfile safely on a runner with npm registry access.
2. Run merge-conflict and structural preflight, then npm ci.
3. Run targeted posting/approval regression tests and complete `npm run certify` against an isolated PostgreSQL database.
4. Record exact SHA, job logs, and failures. Keep PR #7 draft and production blocked until all gates pass.

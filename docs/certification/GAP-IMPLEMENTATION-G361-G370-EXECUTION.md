# Planora G361–G370 — Browser E2E runtime database wiring

Date: 2026-10-17. Release: **NO-GO / NOT CERTIFIED**.

| Batch | Execution | Result |
|---|---|---|
| G361 | Inspect exact-SHA run 39042923661 | CI FAILED |
| G362 | Inspect Accounting Integrity run 39042923667 | PASS |
| G363 | Inspect Merge Conflict Preflight run 39042923678 | PASS |
| G364 | Inspect security audit job | FAILED; mandatory gate remains red |
| G365 | Inspect full certification logs | reached browser E2E; 13 failed |
| G366 | Identify browser application error | repeated RUNTIME_DATABASE_URL_REQUIRED |
| G367 | Inspect playwright server configuration | local Next dev server inherits CI environment |
| G368 | Inspect tenant DB role safety | runtime role must be non-owner; no bypassrls |
| G369 | Configure RUNTIME_DATABASE_URL in isolated CI | committed, same dedicated restricted role as TEST_RUNTIME_DATABASE_URL |
| G370 | Re-run full exact-SHA browser and security certification | pending; NO-GO |

The CI job now supplies RUNTIME_DATABASE_URL to the browser application's Next.js process while preserving TEST_DATABASE_URL for owner-only isolated reset/seed and TEST_RUNTIME_DATABASE_URL for direct RLS tests. No production credential is used. This removes the missing-variable condition but does not prove that authentication bootstrap, session validation, or all browser workflows pass; inspect the next exact-SHA run.

Security audit still reports high-severity findings. Do not merge PR #7, run hosted migrations or deploy.

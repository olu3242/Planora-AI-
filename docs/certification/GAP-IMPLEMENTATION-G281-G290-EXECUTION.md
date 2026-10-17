# Planora G281–G290 — Accounting regression and audit diagnosis

Date: 2026-10-15. Release: NO-GO / NOT CERTIFIED.

| Batch | Workstream | Result |
|---|---|---|
| G281 | Inspect prior CI | failed, security-audit and certify jobs |
| G282 | Inspect preflight | PASS |
| G283 | Inspect Accounting Integrity | PASS |
| G284 | Inspect full unit suite | 211 passed, 1 failed (212 total) |
| G285 | Identify failing assertion | tests/unit/prisma-posting-adapter.test.ts expected obsolete approval updateMany predicate |
| G286 | Verify implementation | approval consumption now checks tenant, entity, period, source, expiry and one-time use |
| G287 | Repair mock assertion | updated to expect full fail-closed predicate, without weakening implementation |
| G288 | Inspect security audit | GHSA-vfj7-8cjw-p6xm, five high severity in braces/micromatch/fast-glob/Next lint chain |
| G289 | Keep independent security gate | security-audit remains required; no waiver |
| G290 | Re-run exact-SHA certification | Pending new GitHub Actions results |

Do not mistake a test assertion correction for a passing unit test: it must be rerun in CI. Do not claim the security override is effective: the last audit remained red. No merge, migration or deployment.

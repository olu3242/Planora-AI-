# G491–G500 — Fix RLS generator parity harness

Date: 2026-10-17. Release: **NO-GO / NOT CERTIFIED**.

| Batch | Execution | Result |
|---|---|---|
| G491 | Inspect G481–G490 exact-SHA workflow 39078245980 | CI failed |
| G492 | Inspect Accounting Integrity | PASS |
| G493 | Inspect Merge Conflict Preflight | PASS |
| G494 | Inspect security audit | FAIL: 5 high-severity vulnerabilities |
| G495 | Fetch failed certification job logs | Completed |
| G496 | Identify first failure | TENANT_RLS_GENERATOR_FAILED |
| G497 | Identify concrete cause | ENOENT writing docs/tenant-rls-manifest.json in temp workspace |
| G498 | Fix isolated generator workspace | Create docs directory before generator invocation |
| G499 | Preserve historical migration immutability | Checker still compares SHA-256, never overwrites committed migration |
| G500 | Re-run exact-SHA CI and Docker certification | Pending; no passing run verified |

**Evidence:** [CI run 39078245980](https://github.com/olu3242/Planora-AI-/actions/runs/39078245980) failed during `npm run test:rls-generator` because the temporary directory lacked `docs/`. This is a harness setup defect, not evidence of SQL drift. Commit f519d250bad16661b3ccb2ded19e7f7e20c9c945 adds the directory. Future runs may reveal further failures.

The separate audit identified five high-severity vulnerabilities through braces/micromatch/fast-glob and Next.js ESLint dependency chains. Do not use `npm audit fix --force` without reviewing breaking changes and regenerating a tested lockfile. Tenant migration semantics, full browser E2E and Docker certification remain unverified. No production migration, PR merge or deployment.

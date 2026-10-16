# Planora G231–G240 — Lockfile closure and certification restart

Date: 2026-10-15. Release: **NO-GO / NOT CERTIFIED**.

| Batch | Scope | Evidence |
|---|---|---|
| G231 | Inspect recovery run 38844413282 | lockfile-recovery SUCCESS |
| G232 | Inspect recovery artifact 12022872335 | generated lockfile candidate present |
| G233 | Confirm branch lockfile replacement | committed by github-actions bot at `171d1460cc0f399a6ff04653cfdcdb0858df2833` |
| G234 | Verify merge-marker removal | no merge markers in current package-lock.json |
| G235 | Verify dependency structure | lockfileVersion 3 and root dependency list present |
| G236 | Inspect commit-trigger behavior | recovery bot used [skip ci], so no CI result at that commit |
| G237 | Review active preflight workflow | preflight, structural and recovery jobs configured |
| G238 | Review full CI workflow | standard npm ci, npm audit, Prisma, tests and full certification required |
| G239 | Review accounting integrity workflow | standard npm ci, isolated PostgreSQL and accounting tests required |
| G240 | Trigger exact-SHA verification | this documentation commit triggers CI and preflight; results pending |

## Caveats
Recovery verified `npm ci --ignore-scripts --legacy-peer-deps` on a GitHub runner. This is **not** equivalent to the standard `npm ci` in CI, and it is not proof of Prisma generation, typechecking, test execution, or financial correctness. Review npm peer resolution if standard install fails; do not silently weaken production dependency checks.

## Exit criteria
Require a green exact-SHA conflict preflight, standard npm ci, npm audit, Prisma validation, accounting integrity, tenant RLS/concurrency/idempotency tests, full `npm run certify`, and browser E2E evidence. PR #7 stays draft. No merge, hosted migration or production deployment is authorized.

# Planora G241–G250 — Strict dependency recovery

Date: 2026-10-15. Release: NO-GO.

| Batch | Execution | Result |
|---|---|---|
| G241 | Inspect exact-SHA run 38844935567 | Merge Conflict Preflight SUCCESS |
| G242 | Inspect CI run 38844935581 | FAILED at npm ci |
| G243 | Inspect Accounting Integrity run 38844935548 | FAILED at npm ci |
| G244 | Diagnose npm ERESOLVE | @vitest/coverage-v8@4.1.12 peer requires vitest@4.1.12; root has 4.1.11 |
| G245 | Pin @vitest/coverage-v8 to 4.1.11 | Committed to package.json |
| G246 | Remove legacy peer bypass from recovery generation | Committed |
| G247 | Require strict npm ci in recovery job | Committed |
| G248 | Retain exact-source-SHA guarded lockfile commit | Configured |
| G249 | Retain SHA and artifact evidence | Configured |
| G250 | Full CI, accounting, database, E2E certification | PENDING; NO-GO |

The recovery workflow is expected to regenerate the lockfile from the corrected manifest and perform strict peer resolution, then commit the validated candidate only if the remote branch still equals the exact checked-out SHA. No claim is made that strict npm ci has passed until the new job completes. Prior legacy-peer success does not certify standard installation.

Next: inspect workflow run and regenerated lockfile, require strict npm ci and full CI, resolve any remaining errors by evidence, and maintain draft PR #7. No production deployment or migration.

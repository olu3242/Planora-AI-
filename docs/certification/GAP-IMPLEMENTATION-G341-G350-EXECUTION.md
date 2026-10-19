# Planora G341–G350 — CI execution control and RLS verification

Date: 2026-10-17. Release decision: **NO-GO / NOT CERTIFIED**.

| Batch | Execution | Evidence |
|---|---|---|
| G341 | Inspect exact-SHA run 39042591852 | certify in progress at inspection |
| G342 | Inspect independent security audit | FAILED, five high-severity findings |
| G343 | Inspect accounting run 39042591784 | in progress at inspection |
| G344 | Inspect preflight run 39042591639 | conflict-preflight SUCCESS |
| G345 | Review lockfile-recovery trigger | automatic recovery on every push/PR |
| G346 | Prevent redundant dependency regeneration | lockfile-recovery changed to explicit workflow_dispatch only |
| G347 | Preserve branch/SHA guarded lockfile write | existing guard retained |
| G348 | Preserve automatic conflict preflight | push/PR conflict-preflight remains active |
| G349 | Normalize RLS provisioning output | source repair committed |
| G350 | Full RLS/security/E2E certification | pending; not certified |

The normal CI and accounting workflows remain active on pushes and PRs. The isolated lockfile recovery job now requires an explicit workflow dispatch, avoiding repeated npm registry work and potential branch mutations on unrelated source commits. No passing RLS, browser E2E or security-audit result is claimed. Do not weaken audit severity, use owner credentials for tenant RLS tests, merge PR #7, or deploy.

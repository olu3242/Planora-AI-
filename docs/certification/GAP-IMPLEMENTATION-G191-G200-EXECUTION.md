# Planora G191–G200 — Lockfile recovery execution

Date: 2026-10-15
Release: NO-GO / NOT CERTIFIED

| Batch | Workstream | Evidence/status |
|---|---|---|
| G191 | Check last exact-SHA GitHub Actions | Three workflows failed |
| G192 | Confirm execution environment access | Direct clone blocked by DNS |
| G193 | Identify blocking dependency state | package-lock.json contains unresolved conflict markers |
| G194 | Create isolated recovery workflow | Committed .github/workflows/lockfile-recovery.yml |
| G195 | Pin Node runtime | Node 24 in recovery job |
| G196 | Regenerate lockfile from package.json | Workflow step authored, not run |
| G197 | Validate manifest/lockfile consistency | Workflow step authored, not run |
| G198 | Verify npm ci reproducibility | Workflow step authored, not run |
| G199 | Produce SHA/checksum and lockfile artifact | Workflow step authored, not run |
| G200 | Review artifact, commit repaired lockfile, rerun full CI | Pending / NO-GO |

## Execution and security notes
Recovery runs on an isolated GitHub-hosted Ubuntu runner with read-only repository permissions. The conflicted lockfile is removed only inside that ephemeral runner, not from the source branch. The workflow regenerates the lockfile with npm registry access, validates root dependencies, then runs npm ci --ignore-scripts and uploads a reviewed artifact. Ignoring scripts verifies dependency resolution but **does not** certify Prisma generation, application builds, or postinstall behavior.

No workflow run was returned for the new workflow commit at inspection time. A GitHub Actions operator may need to invoke workflow_dispatch manually or check repository Actions permissions. Do not claim a generated lockfile exists until its artifact is available. The current source branch retains the conflicted package-lock.json.

## Release gate
After downloading the artifact, review dependency and integrity changes, commit the regenerated lockfile to the harmonization branch, then require a fresh exact-SHA pass of merge preflight, npm ci (normal scripts), Prisma, typecheck, accounting unit/integration/security tests, isolated PostgreSQL RLS, concurrency/rollback and full E2E. PR #7 stays draft until evidence passes. No hosted migrations, customer financial postings, merge or production deployment.

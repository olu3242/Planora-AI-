# PR #9 certification — 2026-10-18

Target: `feat/public-experience-showcase-20261018`. Baseline: `8a3ca83`.

## Changes

Resolved committed conflict markers while retaining tenant-scoped API/page wrappers, separate authentication access, isolated test-database checks, and accounting/orchestration behavior. Removed unused video state from the public experience and corrected Next.js navigation. Generate route types before TypeScript checks and stop tracking generated `next-env.d.ts`.

Playwright now discovers both `.e2e.ts` and `.spec.ts` suites and can test a production build. Public CI has explicit non-production settings and checks readiness at the public route. Vitest and Node-native security tests run with their respective runners. Full certification provisions a non-owner runtime role with tenant-policy enforcement and read-only shared catalogs. Lockfile CI verifies committed dependencies without rewriting the feature branch. Added a repository-wide conflict-marker preflight.

## Local evidence

All database operations used a newly provisioned, password-protected loopback PostgreSQL cluster on port 55449, database `planora_pr9_test`. Existing staged work remains in the original worktree. Hosted databases were not used.

| Gate | Result |
|---|---|
| Clean npm install | Passed; manifest and lockfile synchronized |
| Prisma validation and migrations | Passed; 20 migrations |
| TypeScript / ESLint | Passed |
| Production build | Passed; `/` and `/experience` prerendered |
| Unit tests | 39 files, 167 tests passed |
| Isolated integration tests | 11 files passed, 0 failed |
| Security, financial, Excel, performance | 6 files, 33 tests passed |
| Node-native public privacy guard | 5 tests passed |
| Public source scan / merge-marker scan | Passed |
| Landing, foundation, public experience browser tests | 22 passed against production build |
| Financial statement browser tests | 6 passed |
| Canonical workflow / admin / security browser tests | 15 passed after correcting test runtime catalog grants |
| Responsive checks | Passed at 375, 430, 768, 1024, 1440 px |
| Dependency audit | BLOCKED: five high findings from one transitive `braces` advisory |

The browser workflow exercised import, mapping, commentary, revision, approval, locking, export reconciliation, and direct-object authorization checks. Initial failures and causes: committed merge markers; stale unused video hooks; missing CI environment; `.spec.ts` discovery exclusion; Node tests discovered by Vitest; missing shared catalog reads in the test runtime role. These were corrected without bypassing approval gates or tenant controls.

## Release decision

**NO-GO pending dependency audit and remote CI results.** `GHSA-vfj7-8cjw-p6xm` affects `braces <=3.0.3` through Next.js ESLint tooling. The registry's latest braces version is 3.0.3. npm suggests downgrading `eslint-config-next` to 14.2.35, which is incompatible with this project's Next.js 16 baseline. No forced downgrade, audit suppression, or security-threshold reduction was applied. Functional test success is not full release certification.

Remote CI results and final commit are reported in the execution response. No main/integration branch push, rebase, merge, or production deployment was performed.

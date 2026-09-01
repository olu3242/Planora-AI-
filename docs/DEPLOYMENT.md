# Planora Deployment

## Environments

`local`, `preview`, and `production` use separate databases, object storage, secrets, session keys, and telemetry. Preview is required for hosted runtime certification. Production promotion always requires explicit human authorization.

## Build and release

1. Install from lockfile and validate Node/runtime versions.
2. Validate environment without printing secrets.
3. Generate Prisma client and run lint, typecheck, all test layers, and production build.
4. Apply migrations with a pre-reviewed forward/rollback plan.
5. Deploy immutable artifact; run smoke/login/tenant checks.
6. Record commit, migration, preview URL, checks, approver, and promotion status.

The repository and CI use the same canonical gate: `npm run certify`. It recreates only a loopback development/test database, applies migrations, seeds, verifies migration status, and then runs lint, typecheck, unit, integration, financial, Excel, security, performance, zero-retry E2E, and the production build.

## Preview environment contract

Preview requires `DATABASE_URL`, `APP_ENV=preview`, `APP_URL`, `SESSION_COOKIE_NAME`, and `SESSION_TTL_HOURS`. Agent operations are controlled independently with `AGENTIC_OS_ENABLED`, `AGENT_EXECUTION_ENABLED`, and `AI_COMMENTARY_ENABLED`. All three accept only `true` or `false`. No external AI credential is required; the current assistants are deterministic and the manual forecast/commentary workflow remains available when they are disabled.

Never run `db:reset:test` against Preview: the script refuses non-loopback hosts and `preview`/`production` environments. Hosted setup uses forward migrations plus the repeatable seed only.

## Required services

- Next.js application runtime.
- PostgreSQL with encrypted connections, backups, point-in-time recovery where available.
- Private object storage for workbooks/exports with short-lived access.
- Secret manager, structured log/trace sink, error monitoring, and malware scan integration.

## Migration policy

Schema changes are backward compatible across a rolling deploy where possible. Destructive changes use expand/migrate/contract releases. Every migration is tested from an empty database and from the prior release snapshot. Rollback may be application rollback plus a compensating migration; irreversible migrations require explicit authorization.

## Current state

Preview: configured for the linked Vercel project `eduradiusllc/planora-pilot` with an isolated Neon PostgreSQL database. The pre-convergence CLI deployment `dpl_AbAmBHF7WNXrrZpHV1L1snaJqD7M` is `READY`, but it was built from an uncommitted working tree and is not a certification candidate.
Production: no successful deployment is configured. A prior Production-target build failed; no promotion occurred.
Promotion: not authorized.
Hosted certification: `PARTIAL`. The landing page, login route, database-backed health endpoint, and unauthenticated application redirect passed hosted smoke checks. Full authenticated hosted workflow certification, object storage, malware scanning, backup/PITR evidence, monitoring, and rollback rehearsal remain outstanding.
Local: PostgreSQL 18 via `compose.yaml`; Next.js standalone build PASS; health route `/api/health` PASS during browser tests.

MVP certification: all nine migrations through `20260831203000_dashboard_admin_closure` are verified from an empty local database. The deterministic seed includes isolated organizations and Analyst, FP&A Director, CFO, and Platform Admin identities. Valid XLSX/CSV, compatible-revision, invalid CSV, and a synthetic monthly pilot fixture cover the controlled pilot workflow. The standalone production build and `/api/health` pass locally. See `MVP-CERTIFICATION.md` and `USER-VALIDATION-KIT.md`.

The Preview database has all nine migrations applied and the repeatable synthetic seed. Hosted object storage, malware scanning, backup/PITR evidence, monitoring, and rollback rehearsal remain production gates unless the pilot risk assessment identifies a concrete blocker. No production promotion is authorized.

### 2026-09-01 Preview evidence

- Local `npm run certify`: PASS, including 34 zero-retry Playwright tests and the production build.
- Vercel deployment status: `READY`, target `preview`.
- `/`: HTTP 200 and contains the Planora landing hero plus `/login` entry points.
- `/login`: HTTP 200.
- `/api/health`: HTTP 200 with `{"status":"healthy"}`.
- `/command-center` without a session: HTTP 307 to the authentication boundary.
- Preview runtime error scan immediately after smoke checks: no error logs found.

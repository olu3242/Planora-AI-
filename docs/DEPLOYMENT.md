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

Preview: configured for `eduradiusllc/planora-pilot` with available Neon resource `planora-pilot-preview-db`. Git deployment `dpl_GukiqTLY4S1RFuzgRUu82U9wrc3B` is `READY` at exact SHA `fdb419ee28fba0025a4f081b295e011393cc920f` and immutable URL `https://planora-pilot-45a9noqzz-eduradiusllc.vercel.app`.
Production: no successful deployment is configured. A prior Production-target build failed; no promotion occurred.
Promotion: not authorized.
Hosted certification: `PASS`. The authorized synthetic-only 35-test workflow/security suite passed with zero retries against the exact immutable Preview; all nine migrations are current and the post-run error-level log query returned no entries. Preview-only alias recovery passed. Object storage, malware scanning, alert delivery, and backup/PITR/RPO/RTO evidence remain real-data/Production gates.
Local: PostgreSQL 18 via `compose.yaml`; Next.js standalone build PASS; health route `/api/health` PASS during browser tests.

MVP certification: all nine migrations through `20260831203000_dashboard_admin_closure` are verified from an empty local database. The deterministic seed includes isolated organizations and Analyst, FP&A Director, CFO, and Platform Admin identities. Valid XLSX/CSV, compatible-revision, invalid CSV, and a synthetic monthly pilot fixture cover the controlled pilot workflow. The standalone production build and `/api/health` pass locally. See `MVP-CERTIFICATION.md` and `USER-VALIDATION-KIT.md`.

The Preview database has all nine migrations applied and the repeatable synthetic seed. Object storage, malware scanning, verified backup/PITR retention, alert delivery, and exact RPO/RTO remain real-data and Production gates. No Production promotion is authorized.

### 2026-09-01 Preview evidence

- Local `npm run certify`: PASS at `fdb419e`, including 35 zero-retry Playwright tests and the production build.
- GitHub CI: PASS at the same SHA, run `33517197099`.
- Vercel deployment status: `READY`, target `preview`.
- `/`: HTTP 200 and contains the Planora landing hero plus `/login` entry points.
- `/login`: HTTP 200.
- `/api/health`: HTTP 200 with `{"status":"healthy"}`.
- `/command-center` without a session: HTTP 307 to the authentication boundary.
- Preview runtime error scan immediately after smoke checks: no error logs found.
- Preview-only routing rehearsal: PASS; disposable alias moved prior known-good → current candidate with healthy database checks; Production unchanged.
- Authorized hosted certification: PASS; 35/35 browser tests, exact five-way reconciliation, role/tenant security probes, one worker, zero retries.
- Preview database preparation preserved users, organizations, canonical seed facts, migrations/schema, and audit history while removing only authorized prior `NORTHSTAR` synthetic workflow records before deterministic reseed.

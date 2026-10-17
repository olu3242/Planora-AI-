# Docker-backed Planora certification (development only)

This workflow runs **PostgreSQL 18 in Docker** and Planora, Prisma, Vitest and Playwright on the **host**. It does not deploy Planora or connect to hosted databases.

## Prerequisites
Docker Engine/Desktop with Compose v2; Node.js 24; npm; Chromium dependencies for Playwright. Clone the branch `work/bookkeeping-harmonization-b1-20261015`.

## Start
```bash
export APP_ENV=test
bash scripts/docker-certify.sh
```
The script starts `compose.certification.yaml`, binding PostgreSQL **only** to `127.0.0.1:55433`. It sets owner and restricted runtime credentials to the dedicated `planora_test` database, then runs strict `npm ci`, installs Chromium, executes the canonical `npm run certify` pipeline (including Prisma reset/seed/status, migration checks, lint, typecheck, unit, integration, financial, Excel, RLS/security, performance, browser E2E and build), and finally enforces `npm audit --audit-level=moderate`.

**Destructive warning:** `db:reset:test` destroys and recreates the isolated `planora_test` database. Never use this script with a production or hosted database. Existing `requireIsolatedTestDatabaseUrl` guards require loopback and a `_test` suffix. Do not remove those guards.

## Diagnose missing tenant function
The canonical certification pipeline checks after both initial and pre-browser reset/seed, querying PostgreSQL `pg_proc` and `pg_namespace` for the exact zero-argument `public.planora_session_tenant()` signature and stops if absent. It reports discovered matching signatures to distinguish an absent migration from a wrong schema or argument list. This is a diagnostic, not a replacement for a migration. Correct the canonical Prisma migration, ensure it creates the session-validation function and all required RLS policies, then rerun. Do not stub the function, bypass tenant checks or use the owner role for browser requests.

## Captured evidence
The runner writes `dist/certification-ci/docker-start.txt`, `docker-run.txt`, `docker-ps.txt`, and `docker-postgres.log` on exit, including failures. Review these locally before retrying. The runner rejects non-default Docker contexts; confirm `docker context show` reports `default` and that the default context targets your local Docker Engine. These files are local diagnostic evidence, not proof of a passing certification.

## Troubleshooting
Run `docker compose -f compose.certification.yaml ps` to inspect container health and `docker compose -f compose.certification.yaml logs postgres-cert` to inspect PostgreSQL startup. The runner validates Compose configuration and the Prisma schema before resetting the isolated database, and installs Chromium before browser E2E. A missing `planora_session_tenant()` function is a migration blocker, not a reason to bypass tenant security. If npm audit fails, certification remains NO-GO.

## Shutdown
```bash
docker compose -f compose.certification.yaml down
```
Do **not** add `-v` unless intentionally destroying the isolated certification database volume.

## Release gates
Both full Docker-backed certification and the separate GitHub Actions security-audit job must pass on the same exact commit. The current security audit reports five high-severity vulnerabilities; this Docker setup does not waive that blocker. PR #7 remains draft; release decision NO-GO until verified.

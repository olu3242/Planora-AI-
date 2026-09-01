# Planora Operations

## Service objectives

Initial targets require product validation: 99.9% monthly availability for authenticated application requests; p95 interactive read under 750 ms excluding large imports; durable audit/financial writes; import progress and failure visibility.

## Observability

Every request/run carries a correlation ID and structured fields for environment, organization ID, actor ID, operation, result, duration, and error class. Financial values, workbook contents, credentials, session tokens, and prompts are redacted by default. Metrics cover authentication failure, authorization denial, import throughput/failure, reconciliation difference, DQ blockers, workflow transitions, agent failures, and report/export jobs.

## Runbooks

- Authentication incident: revoke/rotate sessions and secrets, preserve audit evidence.
- Cross-tenant suspicion: disable affected path, preserve logs, assess exposure, notify under incident policy.
- Failed migration: stop promotion, restore application compatibility, execute reviewed recovery.
- Import failure: preserve immutable batch/file hash, mark failed, do not partially commit facts, expose actionable error.
- Reconciliation/DQ failure: block certification; never force trust automatically.
- Agent/tool failure: log `AgentRun.status=error`, apply cooldown, escalate repeated failures; no retry storm.

## Backup and recovery

Production requires automated database backups, tested restore, object versioning/retention, documented RPO/RTO, and periodic recovery exercise. Audit and source hashes are included in recovery verification.

## Operational readiness gate

Health/readiness endpoints, alert routing, support ownership, backup restore evidence, migration recovery, rate/resource controls, security review, dependency audit, browser compatibility and large-workbook tests must pass before production authorization is requested.

## Phase 2 local runbook evidence

The financial-core migration and idempotent fixture seed were exercised from empty PostgreSQL. Operational verification includes exact metric reproduction, database duplicate-grain rejection, protected-version mutation rejection, tenant isolation, health checks, production build, and browser tests. Hosted backup, alerting, and recovery gates remain `HOSTED_BLOCKED` until infrastructure is selected.

## Canonical local certification

Run `npm run certify` against the repository's loopback PostgreSQL service. This is the single developer/CI gate and includes fresh migrations, deterministic seed, migration status, static checks, all Vitest layers, zero-retry Playwright E2E, reconciliation, and production build. The reset guard rejects Preview, Production, and non-loopback database targets.

For a non-destructive hosted pilot setup, run `npm run db:migrate` and `npm run db:seed`; verify `npm run db:status` before deployment. Do not use the local reset command against hosted data.

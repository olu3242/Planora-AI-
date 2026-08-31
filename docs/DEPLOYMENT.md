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

## Required services

- Next.js application runtime.
- PostgreSQL with encrypted connections, backups, point-in-time recovery where available.
- Private object storage for workbooks/exports with short-lived access.
- Secret manager, structured log/trace sink, error monitoring, and malware scan integration.

## Migration policy

Schema changes are backward compatible across a rolling deploy where possible. Destructive changes use expand/migrate/contract releases. Every migration is tested from an empty database and from the prior release snapshot. Rollback may be application rollback plus a compensating migration; irreversible migrations require explicit authorization.

## Current state

Preview: not configured.
Production: not configured.
Promotion: not authorized.
Hosted certification: `HOSTED_BLOCKED` pending infrastructure and credentials; local work can continue.

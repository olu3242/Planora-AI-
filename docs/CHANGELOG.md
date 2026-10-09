# Changelog

## Unreleased

- Added final MVP gap, certification, hosted security, data-protection, validation, metrics, and rollback records.
- Extended canonical E2E to reconcile database, dashboard/workspace, XLSX, and CSV exactly and added EBITDA/record-count assertions.
- Added hosted-capable unauthenticated, role-escalation, and cross-tenant direct-object probes with mutation non-occurrence checks.
- Removed the Excel streaming fallback so a cross-tenant workbook URL returns a real HTTP 404 under Next.js 16.
- Certified `fdb419ee28fba0025a4f081b295e011393cc920f` locally and in CI; created Git Preview `dpl_GukiqTLY4S1RFuzgRUu82U9wrc3B`.
- Rehearsed Preview-only alias recovery from the prior known-good deployment to the current candidate; Production was unchanged.
- Completed the authorized `NORTHSTAR`-only synthetic cleanup/reseed and exact-Preview hosted certification: 35/35 browser tests, zero retries, exact reconciliation, current migrations, and no error-level deployment logs.
- Hardened the audit-history E2E assertion so preserved repeated transition events remain valid certification evidence.
- Rendered the `index.html` landing experience through the Next.js root route, connected its authentication entry points, and isolated its responsive styles from the authenticated application.
- Connected the Command Center to existing Actuals, Excel, Forecast, Dashboard, and Platform Admin surfaces; corrected CFO and Platform Admin navigation targets.
- Excluded generated `.vercel` snapshots from Vitest discovery, restoring deterministic certification without changing financial expectations.
- Added Vercel-safe build output selection and deployment exclusions and applied Preview migrations/seed; earlier CLI deployments are not certification candidates.
- Added an exact-hosted-target Playwright mode plus landing and five-width responsive certification; canonical certification now covers 35 browser tests.
- Implemented and locally certified Phase 2: tenant-scoped canonical finance, exact Decimal metrics, source lineage, immutable plan/forecast versions, and responsive Actuals workflows.
- Established Phase 0 current-state audit, gap matrix, target architecture, domain model, dependency plan, security/RBAC, data governance, testing, deployment, operations, decisions, known gaps and live status.
- Added supporting Excel mapping, agent architecture, decision intelligence, E2E workflow and pain-point contracts.
- Attached local work to a dependent implementation branch based on PR #1 without merging or promoting.
- Implemented and locally certified the Phase 1 Next.js/PostgreSQL foundation: login/session, organizations/memberships, permission RBAC, tenant isolation, append-only audit, login throttling, application shell, CI and responsive browser tests.

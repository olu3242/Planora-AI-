# G381–G390 — Docker certification readiness

Date: 2026-10-17. Decision: NO-GO / NOT CERTIFIED.

| Batch | Execution | Status |
|---|---|---|
| G381 | Inspect existing Docker certification Compose | Completed |
| G382 | Inspect host-based certification runner | Completed |
| G383 | Verify loopback PostgreSQL test database and restricted role separation | Configuration reviewed |
| G384 | Add Prisma schema validation before reset | Committed |
| G385 | Validate Docker Compose config before startup | Committed |
| G386 | Install Chromium before Playwright E2E | Committed |
| G387 | Retain missing tenant-session function check | Preserved |
| G388 | Preserve strict npm audit and RLS tests | Preserved |
| G389 | Document Docker troubleshooting commands | Committed |
| G390 | Run end-to-end Docker certification | NOT EXECUTED; requires local Docker environment |

Run from branch checkout: `APP_ENV=test bash scripts/docker-certify.sh`. It resets only the isolated loopback `planora_test` database. The runner stops if the tenant-session function is missing; do not stub it or bypass RLS. Browser E2E, PostgreSQL RLS and npm audit remain release gates. No production deployment, migration or merge.

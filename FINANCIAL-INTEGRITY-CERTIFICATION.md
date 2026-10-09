# Wave 1 financial/security evidence

Status: **NO-GO**, despite passing supported test suites.

- Database: `planora_wave1_test`, loopback 55440, dedicated `planora_wave1_test` role; verified non-superuser and no BYPASSRLS. This migration/test role owns its database; it is not proof of a least-privilege production runtime role.
- 18 existing migrations applied only to the new isolated database and fresh certification schemas. All applied checksums match local files. No existing database reset, drop, or hosted migration. Existing modified historical migration still requires hosted-history reconciliation before any deployment.
- Seven historically blocked database security cases now PASS: organization ID denial; account/fact/metric denial; workbook denial; manipulated mapping/import denial; forecast/comment denial; agent elevation denial; recommendation/feedback/execution/reference denial. Full authorization suite 10/10.
- Accounting database integrity: 7/7, including unauthorized posting, missing/expired approval, self-approval, tenant scope, immutable journal/line/audit/approval evidence, and unbalanced posting denial.
- Reporting: lifecycle 1/1 plus governance 8/8; independent approvals and locked evidence exercised using persisted ledger figures.
- All 10 existing integration files pass (43 tests); new bank safety integration 1/1. New fail-closed service has 100% S/B/F/L for its narrow code boundary, not banking feature completion.
- Database RLS: 0 enabled/forced application tables, 0 policies; NOT CERTIFIED. See `evidence/wave1/database-evidence.json`.
- Financial/Excel/unit/security combined 191/191; performance 2/2. Synthetic fixtures validate behavior, not external production connectivity.

Reproduce with `npx tsx scripts/wave1-command.ts node_modules/vitest/vitest.mjs run tests/security`. Integration runner creates unique schemas and applies migrations/seeds without resetting existing data. Credentials remain in ignored local files and are not included in evidence.

# Planora Project Synchronization Baseline — S01/S02
Date: 2026-10-09
Status: INVENTORIED / NOT CERTIFIED
Source: GitHub live branch, pull request, and recursive tree inspection; historical project discussions and repository registers.

## Ground rules
- Distinguish DESIGNED, CODE PRESENT, VERIFIED AT SHA, INTEGRATED, HOSTED CERTIFIED, and PRODUCTION APPROVED.
- No feature is production-ready merely because code, a page, a migration, or a test exists.
- Do not merge, migrate, deploy, or replace production data without explicit authorization.
- Preserve forecast MVP evidence at its historical SHA; it does not certify later accounting changes.

## Branch inventory (blob files, not all tree entries)
| Branch | HEAD | Files | Accounting application files | Agent application files | SQL migrations | Test files |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| main | c39bbfcf8b0e95f74b3d16d4968acba09f80c08b | 1 | 0 | 0 | 0 | 0 |
| feat/forecast-mvp-certification | 4229e320de9dc8896114518f5155db8341da4346 | 196 | 0 | 0 | 9 | 33 |
| feat/accounting-ledger-foundation | 35d4fa9ba6a5bc4c9e0cd50c3fe87743a2939b2b | 291 | 14 | 7 | 12 | 48 |
| feat/global-reporting-foundation | debca453d3ca3df6e63472f6bc7f2c199a532fa6 | 18 | 0 | 0 | 0 | 0 |
| feat/reporting-governance-convergence | e21aed45d32b2345b1b7090d0b44d8df4c9a998c | 295 | 15 | 8 | 13 | 49 |
| feat/ai-native-accounting-execution | 221b214de91d24ad93883ca018daefc31b292b3e | 320 | 15 | 8 | 13 | 58 |
| fix/vercel-session-prerender-env | 1a05c52f97aabd3bd9e64d03ba29f21ec3646649 | 318 | 15 | 8 | 13 | 58 |
| fix/accounting-fpa-schema-harmonization | 100dbb8ea1e278d16c3529cef43f90580e373d8e | 321 | 15 | 8 | 13 | 58 |

Other branch: chore/planora-project-bootstrap (faead923bd098bae06f342c38c64fddb9f985f9a); detailed file inventory not yet recorded.

## Pull request state
- PR #1: bootstrap -> main; OPEN.
- PR #2: forecast MVP certification -> main; OPEN.
- PR #3: reporting governance convergence -> accounting ledger foundation; OPEN.
- PR #4: accounting execution and Vercel remediation -> main; OPEN.
- None of the four PRs is merged as of inspection.

## Capability evidence
- Forecast MVP: code, 9 migrations, and 33 test files on its branch; historical certification reported in docs/IMPLEMENTATION-STATUS.md. Not current-HEAD recertification.
- Accounting ledger foundation: posting, reversal, close, trial balance, statements, bank/AP/AR services present. Accounting release decision remains HOLD.
- Reporting governance: added reporting service and agent; standards compliance not established.
- AI-native accounting execution: expanded application and test surface. Existence does not prove E2E connectivity.
- Harmonization branch: Prisma inverse relation repair, ledger actuals tenant checks and canonical per-journal validation committed; no current CI or database-backed test proof recorded.

## Critical reconciliation gaps
1. Decide the canonical integration baseline using ancestry/diff comparisons, not file counts alone.
2. Determine whether PR #4 includes every PR #2/#3 change; identify unique commits and conflicting files.
3. Verify schema/migration consistency with a disposable database; manual immutability SQL remains unapplied.
4. Trace actual API -> authenticated service -> persisted approval -> journal -> trial balance -> actuals -> forecast -> reporting.
5. Certify repeated synchronization, source lineage, idempotency, reconciliation, tenant boundaries, and stale fact handling.
6. Validate strict sector/framework reporting controls against executable policies, not UI selectors.
7. Record one exact commit's install, Prisma validation, typecheck, lint, unit/integration, browser E2E, and hosted evidence.

## Execution decisions
- Candidate audit branch: fix/accounting-fpa-schema-harmonization. This is not an authorized merge target or certified release.
- No further unrelated feature expansion before S03–S10 integration checks.
- Production and real financial data remain blocked.

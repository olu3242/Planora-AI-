# Planora Current State and Gap Implementation Plan
Date: 2026-10-15
Branch: work/bookkeeping-harmonization-b1-20261015
Decision: NO-GO until exact-SHA certification

## Evidence hierarchy
1. Inspected source: package.json, src/lib/prisma.ts, src/application/accounting/chart-of-accounts-service.ts, src/application/accounting/reconciliation-service.ts, prisma/schema.prisma.
2. Historical evidence: IMPLEMENTATION-BATCH-REGISTER.md (2026-10-09, different branch).
3. Target only: docs/AI-NATIVE-ACCOUNTING-EXECUTION-CONTRACT.md.
4. Current branch B1-B80 registers: source fixes and test fixtures committed; runtime certification not performed.

## Current state and gaps
| Domain | Evidence | State | Gap |
|---|---|---|---|
| Build | package.json repaired; preflight checks and tests committed | Unverified | npm ci, Prisma validate, typecheck, build, lockfile parity |
| Tenant security | transaction-scoped Prisma client in src/lib/prisma.ts | Partial | non-bypass DB role, complete RLS policies and negative tests |
| COA | chart-of-accounts-service.ts queries scoped accounts | Partial | approved effective-dated remapping and posting safety |
| GL/journals | accounting models retained in Prisma | Partial | exact-SHA posting, approval, immutability, reversal tests |
| Bank reconciliation | reconciliation-service.ts fails closed without approved mapping | Blocked | persistent mapping and end-to-end bank-to-ledger reconciliation |
| AP/AR | historical register has unit tests | Partial | payment, settlement and subledger write journeys |
| Reporting | historical reporting governance tests | Partial | full statements and audited ledger-to-actuals lineage |
| FP&A | historical forecast and financial tests | Partial | treasury and governed complete lifecycle |
| AI agents | historical runtime tests | Partial | governed agent proposal-to-approval-to-outcome E2E |
| Hosted release | no current hosted evidence | NO-GO | security, recovery, monitoring, migration approvals |

## Dependency-ordered implementation: G01–G10
G01 Baseline: verify HEAD, compare branch deltas, run conflict/structural preflight; reconcile any remaining conflicts.
G02 Build: npm ci, lockfile parity, Prisma validate/generate, lint, typecheck, build; repair failures minimally.
G03 Schema: inspect migration history and entity relations; use disposable DB for drift detection.
G04 Security: tenant-owned table matrix, runtime DB role, RLS USING/WITH CHECK, cross-tenant negative tests.
G05 Posting: single deterministic balanced journal command with idempotency, period lock, maker-checker and audit.
G06 Bank: approved persisted bank-account-to-cash-GL mapping, exact matches, unreconciled exceptions, retries.
G07 Cleanup: COA remapping, duplicate detection, categorization confidence, review and historical balance-sheet tie-outs.
G08 Subledgers: AP/AR/processor gross-to-net fees, refunds, chargebacks, reversals, cash settlement.
G09 Agents: governed intake, reconciliation, close and reporting agent workflows; no unilateral financial posting.
G10 Certification: exact-SHA isolated PostgreSQL, security, ledger-to-statements-to-FP&A, browser E2E, recovery, deployment readiness evidence.

## Exit criteria
Each batch requires code paths, positive and negative tests, persisted evidence, actual command output, and explicit PASS/FAIL/BLOCKED. No claims of 100% implementation from scaffolding, registers, or historical test counts. No production migration, posting, or deployment without authorization.

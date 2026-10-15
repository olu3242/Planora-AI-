# Bookkeeping Harmonization — B1 Baseline (2026-10-15)

Status: AUDIT IN PROGRESS / NO-GO FOR RELEASE
Branch: work/bookkeeping-harmonization-b1-20261015
Scope: Integrate cleanup into existing accounting and FP&A; no duplicate ledger.

## Confirmed existing paths (default branch inventory)
- src/application/accounting/chart-of-accounts-service.ts
- src/app/(app)/accounting/chart-of-accounts/page.tsx
- src/application/accounting/reconciliation-service.ts
- src/domain/accounting/reconciliation.ts
- src/domain/accounting/actuals-reconciliation.ts
- docs/AI-NATIVE-ACCOUNTING-EXECUTION-CONTRACT.md
- IMPLEMENTATION-BATCH-REGISTER.md

## Baseline blockers
- Existing batch register reports security/tenant isolation BLOCKED; no certified RLS policies.
- Persisted bank-to-cash-ledger mapping and real settlement commands not certified.
- Full agent-to-outcome E2E and cross-feature certification not passed.
- README.md and docs/ACCOUNTING.md on main contain merge-conflict markers; resolve semantically, not by blind deletion.
- Live Stripe/provider integration not established.

## Reuse-first decisions
1. Existing COA service owns account mapping and effective-dated restructuring.
2. Existing reconciliation service owns match lifecycle; processor settlement becomes a provider-neutral adapter.
3. Only authenticated accounting commands can post balanced journals; agents propose, never bypass approval.
4. Existing canonical financial model remains source of truth for reporting and FP&A.
5. Cross-tenant authorization, immutable evidence, idempotency, and period locks are mandatory.

## B1 acceptance gates
- Inventory schema, migrations, routes, services, policies, and tests with precise file references.
- Establish one posting and reconciliation path; document competing implementations before changing them.
- Resolve merge-conflict markers with semantic review and verify typecheck, lint, and build.
- Produce dependency-linked B2 security remediation and B3-B10 implementation map.
- Do not merge or deploy until certification passes.

## Execution evidence
This file is a tracked baseline only. No test execution, hosted validation, or financial posting is claimed. Next execution must inspect the checked-out code and run local gates before marking B1 complete.

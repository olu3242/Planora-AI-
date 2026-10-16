# Planora Financial Readiness OS — Harmonization Wave FR01–FR10

## Product invariant
Readiness answers whether financial data is supported and eligible for governed decisions. A score is not audit assurance, an approval, a journal-posting permission or permission to hard-close.

| Batch | Existing Planora subsystem | Integration and actual state |
|---|---|---|
| FR01 | Financial data ingestion | Readiness evidence contract committed; source adapters pending |
| FR02 | AI bookkeeping mapping | AI proposals treated as UNKNOWN until independently verified |
| FR03 | Reconciliation | Readiness dimension and material blockers committed; bank/GL adapter pending |
| FR04 | Accounting policy and GL | Accounting controls dimension committed; posting gate remains authoritative |
| FR05 | Financial close OS | Uses closeBlockers; does not bypass controller approval |
| FR06 | Financial statements | Reporting readiness dimension committed; statements adapter pending |
| FR07 | FP&A convergence | Propagates convergence blockers |
| FR08 | Finance Command Center | Typed readiness result with actions/owners; UI/API pending |
| FR09 | Deterministic scoring | Six dimensions, evidence freshness, material blockers, scope isolation |
| FR10 | Verification | Nine unit tests written; no test execution or hosted certification |

## Readiness decision model
- Six dimensions weighted 15/20/25/20/15/5 (illustrative until governance approves).
- No dimension evidence => null score and BLOCKED.
- A material failed, unknown or stale control => BLOCKED regardless of score.
- Nonmaterial unresolved checks => INCOMPLETE, never ready.
- All evidenced checks PASS => CANDIDATE_FOR_APPROVAL, **not** financial close approval.
- Scope must match organization, legal entity and period; verified evidence must be current.

## Next execution requirements
1. Run `npx prisma validate`, `npx prisma generate`, `npm run typecheck`, `npx vitest run tests/unit/financial-readiness.test.ts` and existing accounting regression suites.
2. Build authenticated, tenant-filtered adapters for reconciliation, journals, close, statements and FP&A evidence; ensure the source records and accounting periods are immutable or versioned.
3. Add durable readiness assessments, source snapshots, control versions, evaluation timestamps, remediation tasks and audit events; never mutate prior certified assessments.
4. Require critical controls to pass independently of weighted scoring. Incorporate materiality thresholds by entity, currency, accounting framework and reporting period.
5. Add a role-scoped Command Center view with actionable blockers and drill-through evidence.
6. Test tenant isolation, stale source revisions, missing evidence, unauthorized approval, closed periods, duplicate events, concurrent reassessment and failed recovery.
7. Preserve existing `assertPostingGate` and `approveAndHardClose` as sole authorized control gates.
8. Reconcile feature branch with open accounting certification work before merging. No force-push or overwrite of uncommitted work.

## Certification
PARTIAL / NO-GO. Committed engine and unit tests have not been executed; no database-backed E2E or production deployment is claimed.

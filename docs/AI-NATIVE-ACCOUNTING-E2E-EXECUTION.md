# AI-native accounting E2E execution contract

Status: IMPLEMENTATION PLANNED — NOT CERTIFIED
Base: feat/reporting-governance-convergence
Scope: Non-production development only. No hosted migrations, deployment, merge, posting activation or publication authorized.

## Invariants
1. Read CLAUDE.md, AGENTS.md and accounting/reporting domain documents before edits. Preserve their approval gates.
2. AI proposes; deterministic services validate and post only through authorized policy. No agent direct ledger writes.
3. Journal debit and credit totals balance exactly in transaction currency; use decimal arithmetic, not binary floats.
4. Every journal has tenant, legal entity, period, account, source evidence, actor, idempotency key and immutable event history.
5. Enforce active accounting framework by entity, jurisdiction, sector, version and effective date. Never infer GASB merely from public-sector selection.
6. Posted entries are never edited/deleted; corrections require linked reversing and replacement journals. Locked periods fail closed.
7. Tenant scoping, RBAC, segregation of duties, immutable audit and policy-driven human approval apply to all mutations.
8. Auto-post is disabled by default. Confidence cannot bypass materiality, evidence, authorization or segregation controls.
9. No claimed accuracy percentage without held-out evaluation with denominators, false-post rate and drift evidence.
10. External bank/ERP events must be idempotent; failed processing goes to a visible exception queue, not silent retries.

## Ten vertical slices and gates
| Batch | Working deliverable | Required certification |
|---|---|---|
| 1 | File-evidenced branch audit and baseline gap matrix | Paths, schema, routes, tests, migrations and exact SHA |
| 2 | Versioned sector/jurisdiction/framework configuration | Invalid combinations rejected; effective dates tested |
| 3 | Deterministic ledger posting, reversals and period locks | Balanced/unbalanced, concurrency, idempotency and lock tests |
| 4 | Agent run and workflow orchestration | Persisted state, retries, dead letters, kill switch, audit |
| 5 | Evidence-grounded classification proposals | Threshold, drift, tenant isolation and abstention tests |
| 6 | Bank/subledger reconciliation and exception inbox | One-to-one matching, duplicates, partial matches and reversals |
| 7 | Continuous close readiness | Missing evidence, open exceptions, cutoff and period close tests |
| 8 | Dimensions, funds and consolidation boundaries | Valid dimensions, cross-entity isolation, elimination traceability |
| 9 | Reporting and FP&A integration | Trial balance ties to statements and actuals; approvals maintained |
| 10 | End-to-end certification | Typecheck, lint, unit, integration, financial, security, E2E, build |

## Mandatory scenario
Receive an evidenced payable and bank payment; classify to policy-appropriate account/dimensions; abstain if ambiguous; require authorized approval where policy demands; post balanced immutable journal exactly once; reconcile to bank/subledger; update trial balance, standards-specific statements and FP&A actuals; record all decisions; prove reversal, lock, cross-tenant denial and kill-switch behavior.

## Status semantics
COMPLETE requires committed code, passing automated tests and cited run evidence at an exact SHA. PARTIAL means working slice with outstanding criteria. BLOCKED means an external dependency or authorization is missing. PENDING means not implemented. Never describe planned features as implemented.

## Release gate
Do not modify production data or activate autonomous posting. Create PR against the accounting/reporting integration base after local certification. Hosted migrations, deployment, merge and publication each require separate approval.

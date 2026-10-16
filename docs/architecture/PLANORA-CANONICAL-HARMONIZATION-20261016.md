# Planora Canonical Harmonization and Future-State Contract
Date: 2026-10-16
Status: PROPOSED TARGET / IMPLEMENTATION NOT CERTIFIED
Branch: work/planora-canonical-harmonization-20261016

## Scope and segmentation
One finance platform with Business and Enterprise workspaces, one deterministic financial ledger and one governed financial-facts model. Enterprise qualifies if annual recognized revenue >= USD 200,000,000 OR annual nonduplicated financial transaction value >= USD 200,000,000. Complexity-based opt-in is permitted below thresholds. Transaction value is not revenue; document exclusions for reversals, internal transfers and duplicated legs. Capacity depends on transaction count, peak load, entity count and integrations.

## Evidence and safety baseline
- Previously certified FP&A forecast MVP at fdb419ee28fba0025a4f081b295e011393cc920f; synthetic-only controlled validation, not production authorization.
- Accounting/bookkeeping harmonization branch has PARTIAL/NO-GO documentation; added fixtures are not executed certification evidence.
- Main README was observed with unresolved merge markers. Do not merge, migrate hosted databases, post live journals or deploy without explicit approval and exact-SHA gates.
- Preserve AGENTS.md restriction: no AI agent directly mutates approved plans, locked forecasts or certified metrics; extend accounting via proposals and controlled deterministic services.

## Canonical bounded contexts and ownership
| Context | Owns write authority | Consumes |
|---|---|---|
| Tenant/Identity/Policy | tenant, legal entity, RBAC, SoD, policy versions | all |
| Intake/Document | source records, attachments, ingestion provenance | bank, ERP, POS, payroll, Excel |
| Bookkeeping | proposed categorization, dedupe, exceptions | intake, COA |
| Accounting Ledger | journal, balanced journal lines, period locks, reversals | approved source events, subledgers |
| Subledgers | AP, AR, payments, assets, inventory, payroll interfaces, revenue schedules | ledger posting service |
| Reconciliation | bank/subledger/GL matching and evidence | ledger, bank feeds |
| Close/Consolidation | close tasks, attestations, eliminations, reporting books | ledger, subledgers |
| Reporting | financial statements, disclosure mappings, certified financial facts | close, ledger |
| FP&A | plans, forecast versions, drivers, variances, scenarios | certified actuals |
| Agent Control Plane | runs, proposals, evidence, approvals, outcomes | scoped read models |
| Audit/Governance | append-only audit events, control tests, exceptions | all |

No other context may post directly to the ledger. Journal posting requires idempotency, balancing, authorization, fiscal period eligibility, maker-checker rules where applicable, and atomic commit with audit evidence. Posted journals are reversed, not edited.

## Six end-to-end lifecycles
1. Record-to-Report: source -> journal -> reconcile -> close -> financial statements -> certified actuals.
2. Procure-to-Pay: vendor -> bill -> match -> approval -> settlement -> bank reconciliation -> GL.
3. Order-to-Cash: customer -> invoice -> revenue schedule -> receipt -> cash application -> GL.
4. Treasury-to-Cash: bank/processor -> cash position -> liquidity -> settlement -> reconciliation.
5. Plan-to-Perform: certified actuals -> budget -> rolling forecast -> variance -> scenario -> decision outcome.
6. Control-to-Audit: policy -> control evidence -> exception -> remediation -> certification.

## Feature traceability and disposition
| Capability | Existing evidence | Target | Disposition | Required gate |
|---|---|---|---|---|
| FP&A forecast MVP | Historical exact-SHA local/CI/preview certification | integrated governed FP&A | PRESERVE | regression and real-data safety review |
| Excel mapping/import | UI/API and historical test journey | governed provenance and mapping | PRESERVE/EXTEND | source-total tie-out |
| Tenant isolation | scoped Prisma client; RLS incomplete | cross-tenant DB enforcement | EXTEND | negative RLS tests using non-bypass role |
| COA | scoped account service | effective-dated COA | EXTEND | remap and period tests |
| GL/journals | Prisma models and posting guards | canonical posting command | HARMONIZE | balanced, atomic, idempotent, immutable, reversible |
| Bank reconciliation | fail-closed mapping behavior | persisted mapping and matching | COMPLETE | bank-to-ledger E2E |
| Bookkeeping cleaning | development work and fixtures | confidence-based review pipeline | COMPLETE | duplicates, corrections, evidence |
| AP/AR | partial historical unit tests | complete invoice-to-settlement | COMPLETE | subledger-to-GL E2E |
| Financial reporting | statement API, partial governance | ledger-driven statements | HARMONIZE | statements-to-trial-balance tie-out |
| Financial close | partial workflow evidence | close certification and locks | COMPLETE | reopen and SoD negative tests |
| AI agents | recommendation-only FP&A contract | governed finance agents | EXTEND | proposal-approval-action-outcome E2E |
| Enterprise consolidation | no certification evidence | multi-entity books, elimination, FX | NEW | consolidation and currency tests |
| Treasury and complex tax | incomplete | staged governed modules | NEW | scoped compliance and integration tests |
| Hosted production | no current certification | monitored and recoverable deployment | BLOCK | security, recovery, UAT, approvals |

## Business and Enterprise mode boundaries
Business: simplified bookkeeping, AP/AR, bank, standard financial reports, cash forecasting, owner/accountant approvals.
Enterprise: multi-entity, reporting books, intercompany, consolidation, advanced revenue, treasury, dimensions, complex approvals, high-volume processing.
Shared: canonical ledger, accounting standards policies, audit, data quality, agent control plane, identity and APIs.
Accounting framework is selected per reporting book/legal entity (US GAAP, IFRS, applicable nonprofit or public sector frameworks). Never infer recognition treatment from industry label alone.

## Execution sequence: first ten batches
H01 exact baseline and conflict preflight; H02 dependency/build/Prisma integrity; H03 canonical ownership/schema diff; H04 tenant RLS and SoD; H05 ledger posting safety; H06 bank mapping/reconciliation; H07 bookkeeping classification and cleanup; H08 AP/AR settlement; H09 ledger -> reporting -> FP&A with agent approval; H10 full exact-SHA certification and go/no-go.
Every batch: touched paths, source evidence, positive/negative tests, actual commands/results, remaining gaps, explicit PASS/FAIL/BLOCKED. No percentages or PASS without measured evidence.

## Acceptance
- One transaction enters once and reconciles to ledger, statement and governed actuals.
- Zero cross-tenant access in negative tests; journal imbalance and duplicate posting rejected.
- Approved reports and forecasts cannot be mutated by agents.
- Enterprise performance targets are set from observed throughput and peak-load scenarios, not dollar thresholds alone.
- No production GO until isolated PostgreSQL migrations, complete test suite, security, recovery, monitoring and authorized hosted certification pass.

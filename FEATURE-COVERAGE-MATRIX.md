# Wave 1 functional acceptance inventory

Functional baseline and achieved percentages: **N/M for all modules**. There is no complete acceptance denominator or retrospective baseline run for the broad 15-module scope. Do not substitute the narrower Forecast MVP's historical PASS status. Instrumented coverage is independently measured in TEST-COVERAGE-REPORT.md.

For each outcome below, acceptance requires the applicable CLAUDE.md definition of done: domain, persistence, authorized operation, validation, tenant isolation, immutable audit/evidence, UI loading/empty/error states, responsive behavior, executable tests and a continuous E2E journey. An engine calculation alone does not pass its business workflow. These outcomes must be decomposed into individually testable cases before assigning full-feature functional percentages.

| Module | Measurable business outcomes | Current evidence / residual gap |
|---|---|---|
| GL/CoA | Create/update governed account mapping; post balanced scoped journals; reconcile trial balance; drill to source | Canonical engines and database posting controls exist and pass tests; full CoA browser workflow unverified |
| Journals | Prepare → independent approval → post → immutable evidence → authorized reversal; idempotent repeat and closed-period denial | 7 accounting database cases plus domain units pass; complete reversal UI journey unverified |
| AP | Create bill → approve → post → allocate payment → exact outstanding and aging; reject over-allocation | Models, read workspace, aging and close checks exist; complete write/settlement journey not certified |
| AR | Create invoice → approve → post → allocate receipt → exact outstanding and aging | Models/read workspace exist; complete write/collection journey not certified |
| Banking | Import statement → mapped cash-ledger movement → exact preview → authorized match → close evidence | Pure matcher tested; persisted mapping absent. Preview now fails closed instead of summing balanced journals to zero |
| Budgets/forecasts | Budget versions and drivers; override provenance; submit/review/approve/lock; export and round-trip reconciliation | Forecast integration/E2E pass; full budgeting and driver workflow not certified |
| FP&A/variance | Exact actuals/variance; decomposition sums; source drilldown; scenario → decision → action → outcome → reforecast | Financial engine/lineage pass; full decision/outcome chain not implemented/certified |
| Statements/reporting | Canonical statements; sourced external close reconciliation; independent review/approval; locked publication evidence | 9 reporting integration tests pass; report UI/E2E not certified |
| Standards/sector | Versioned/effective framework routing; jurisdiction validation; required disclosures; actual framework-specific statement rules | Routing/configuration tests pass; no claim of full IFRS/GAAP statutory compliance |
| Treasury/cash | Cash position → driver forecast → liquidity scenarios → governed action, with currency-aware reconciliation | No dedicated treasury engine in source inventory; missing coverage cannot count as 100% |
| AI agents | All nine roster agents log every run; evidence-backed proposals; human approval; no protected writes; outcome linkage | Bounded deterministic agents/runtime exist; nine-agent and full outcome breadth incomplete |
| Orchestration | Persisted DAG transitions; tenant context; stop at approval; idempotent resume; failure/recovery audit | Unit/runtime tests pass; full accounting browser orchestration journey not certified |
| Imports/integrations | Secure XLSX/CSV import, reviewed mapping, drift/reconciliation/lineage; real external integration lifecycle | Excel/CSV tested including E2E; no external production integration claim |
| Persona dashboards | Role-specific sourced metrics, actionable permitted workflows, empty/error/loading states, responsive navigation | Existing dashboard/browser tests pass; all personas' business journeys not certified |
| Administration | Tenant membership/permissions, operational configuration, audit, strict env validation, no financial role elevation | Admin integration and E2E pass; full organization/sector administration scope not certified |

Classification: all are PARTIAL, MISSING, or BLOCKED at the broader Wave 1 scope; none is declared 80%-functionally-complete. Actual file boundaries and per-file code metrics are in `evidence/wave1/module-coverage.json`.

# Planora Gap Matrix

Status terms: `SPECIFIED`, `NOT_STARTED`, `SCAFFOLDED`, `PARTIAL`, `FUNCTIONAL`, `CERTIFIED`, `BLOCKED`.

| ID | Capability | Current State | Target State | Gap | Dependency | Phase | Verification |
|---|---|---|---|---|---|---:|---|
| G-001 | Repository baseline | SCAFFOLDED | CERTIFIED | Missing implementation history, CI and release evidence | None | 0 | Git/PR audit and Phase 0 docs |
| G-002 | Target architecture | SPECIFIED | CERTIFIED | Boundaries not previously consolidated | Audit | 0 | Architecture review |
| G-003 | Login/session | CERTIFIED | CERTIFIED | None for local Phase 1 | Phase 0 | 1 | `foundation.e2e.ts`; 8/8 E2E |
| G-004 | Organizations/memberships | CERTIFIED | CERTIFIED | None for local Phase 1 | Login, database | 1 | 4/4 integration; clean seed |
| G-005 | RBAC | CERTIFIED | CERTIFIED | Tenant-configurable custom roles deferred | Session, memberships | 1 | 2/2 security plus unit tests |
| G-006 | Audit | CERTIFIED | CERTIFIED | None for local Phase 1 | Auth, database | 1 | Append/write and DB mutation-denial test |
| G-007 | App shell | FUNCTIONAL | FUNCTIONAL | Later modules intentionally unavailable | Auth | 1 | 5-view responsive browser test |
| G-008 | Canonical dimensions/facts | SPECIFIED | CERTIFIED | No schema, repositories, or constraints | Foundation | 2 | Clean migration and domain tests |
| G-009 | Decimal calculations | SPECIFIED | CERTIFIED | No deterministic engine | Canonical model | 2 | Exact $87M EBITDA test |
| G-010 | Lineage | SPECIFIED | CERTIFIED | No source reference implementation | Facts | 2 | Metric-to-source traversal test |
| G-011 | Version immutability | SPECIFIED | CERTIFIED | No state or write guard | Canonical versions, RBAC | 2 | Mutation-denied tests |
| G-012 | Workbook parse/profile | SPECIFIED | CERTIFIED | No safe parser or upload controls | Canonical model | 3 | Workbook security/profile tests |
| G-013 | Mapping and review | SPECIFIED | CERTIFIED | No template/version/rule workflow | Profiling, dimensions | 3 | Wide/long mapping E2E |
| G-014 | Excel import | SPECIFIED | CERTIFIED | No batch persistence, validation or lineage | Approved mapping | 3 | Fixture import and fact checks |
| G-015 | Reconciliation | SPECIFIED | CERTIFIED | No controls, exceptions or rerun | Imported facts | 4 | $0 exact reconciliation journey |
| G-016 | Data quality | SPECIFIED | CERTIFIED | No rules/issues/resolution workflow | Canonical facts | 4 | Blocking-rule tests |
| G-017 | Certification | SPECIFIED | CERTIFIED | No human certification gate | Reconciliation, DQ | 4 | Unresolved issue denial |
| G-018 | Planning | SPECIFIED | CERTIFIED | No versions, lines, drivers or workflow | Certified actuals | 5 | Submission/approval E2E |
| G-019 | Forecasting | SPECIFIED | CERTIFIED | No deterministic forecast graph | Drivers, planning | 5 | Price x volume tests |
| G-020 | Command Center | SPECIFIED | CERTIFIED | Static marketing mock only | Published forecast, actuals | 6 | Exception prioritization E2E |
| G-021 | Variance/root cause | SPECIFIED | CERTIFIED | No calculation/decomposition/drill | Actual and comparison version | 6 | -$7M and child-sum invariant |
| G-022 | Scenario | SPECIFIED | CERTIFIED | No calculation reuse or isolation | Financial graph, variance | 7 | +$4.7M scenario test |
| G-023 | Recommendation/decision | SPECIFIED | CERTIFIED | No human selection/audit workflow | Scenario | 7 | Agent cannot create Decision |
| G-024 | Action/outcome | SPECIFIED | CERTIFIED | No ownership or measurement flow | Decision | 8 | $4.1M outcome journey |
| G-025 | Realization/reforecast | SPECIFIED | CERTIFIED | No 87.2% calculation or feedback | Outcome, forecast versioning | 8 | Exact fixed-point test |
| G-026 | Copilot | SPECIFIED | CERTIFIED | No authorized grounded query flow | Trusted deterministic engines | 9 | Evidence equality and denial tests |
| G-027 | Governed agents | CERTIFIED | CERTIFIED | None for bounded Forecast MVP assistants | Tenant-scoped deterministic tools, evidence, feedback and audit | 31 | Unit/integration/security/browser approval-gate and evidence tests |
| G-028 | Reporting | SPECIFIED | CERTIFIED | No draft/approval/publish workflow | Certified metrics, decisions | 10 | Publish denial and pack E2E |
| G-029 | Excel export/re-import | SPECIFIED | CERTIFIED | No metadata, diff, approval/version flow | Mapping and versioning | 10 | Round-trip change-review E2E |
| G-030 | Production controls | NOT_STARTED | CERTIFIED | No observability, performance, backup or runbooks | Runtime complete | 10 | Security/perf/ops certification |
| G-031 | Full E2E | CERTIFIED | CERTIFIED | External pilot remains | Phases 1-10 and 31 | 31 | Unmocked deterministic and agent-assisted browser journey |

# Wave 1 batch register — 2026-10-09

Branch: `work/wave1-certification-20261009`. Starting SHA: `12053928b66c53484c2e0b28e542b4052b5f9016`, verified against local and live remote integration refs. Existing dirty work was carried intact onto the new branch, never stashed or reset. The prompt gives priorities but no numbered batch contents; the dependency mapping below makes that sequencing explicit.

N/M means not measured, not zero. Functional percentages are not inferred from unit tests, page existence, or line coverage. A complete, reviewed decomposition of the broad functional acceptance criteria is still required; the measurable outcomes in FEATURE-COVERAGE-MATRIX.md are the starting checklist, not an artificially narrow denominator that can certify the entire PRD. Baseline and achieved full-feature percentages therefore remain N/M.

| Batch | Scope | Baseline % | Achieved % | Test coverage % | Tests passed / evidence | Blockers | Certification |
|---|---|---|---|---|---|---|---|
| 01 | Repository/environment recovery | N/M | N/M | N/A, operational preflight | Identity, 18 migration checksums, seven prior failures rerun | Reconciliation remains dirty | Recovery PASS; batch PARTIAL |
| 02 | Security and reconciliation | N/M | N/M | Per-feature report | 10 authorization + 7 accounting database control scenarios | 0 RLS policies; 5 high dev-dependency findings; branch semantic reconciliation incomplete | BLOCKED |
| 03 | GL, CoA, journal lifecycle | N/M | N/M | Below 80% | Existing ledger/immutability tests pass | P0 gate; accounting UI journey coverage incomplete | BLOCKED; existing paths tested |
| 04 | AP, AR, banking/reconciliation | N/M | N/M | Below 80% | Aging/exact-match unit tests; 1 new database safety regression | No persisted bank-to-cash-ledger mapping; write/settlement journeys incomplete | BLOCKED; fail-closed fix verified |
| 05 | Budgeting/forecasting | N/M | N/M | Below 80% | Forecast integration and full forecast E2E cycle pass | Budgeting and driver publication breadth not certified | BLOCKED; existing paths tested |
| 06 | FP&A, variance, treasury | N/M | N/M | Below 80%; treasury N/A | Exact financial calculation and lineage tests pass | Missing treasury engine and full root-cause/scenario/outcome chain | BLOCKED |
| 07 | Reporting and framework configuration | N/M | N/M | Reporting below 80%; configuration passes code gate | 1 reporting lifecycle + 8 reporting governance integration tests | UI journey absent; framework routing is not standards compliance | BLOCKED; existing paths tested |
| 08 | AI agents and orchestration | N/M | N/M | Below 80% | 11 agentic-runtime integration tests; approval scheduler units pass | Nine-agent scope and full agent-to-outcome E2E incomplete | BLOCKED |
| 09 | Imports, dashboards, administration | N/M | N/M | Below 80% | 3 import + 2 admin integration tests; browser journeys pass | Production integrations, full persona and configuration acceptance incomplete | BLOCKED; existing paths tested |
| 10 | Cross-feature certification | N/M | N/M | 1/15 code boundaries passes all four thresholds | 191 combined tests + 43 integration + 1 safety + 2 performance + 39 E2E | P0 and feature/coverage gates unresolved | NO-GO |

The 191 count includes the 10 authorization tests; counts above are not additive per batch because shared tests support multiple controls. No downstream batch is marked implemented or complete simply because existing tests pass. Independent diagnostics/certification ran while implementation promotion remained blocked at Batch 02.

Next dependency-ready work: Batch 02, implement and certify transaction-scoped database tenant policies with a runtime role that cannot bypass them; resolve or formally remediate the unpatched lint-tool dependency chain; finish semantic branch reconciliation. Then Batch 04 requires an approved persistent bank-ledger mapping and real settlement/reconciliation commands. No push, merge, deployment, existing-schema reset, or hosted migration occurred.

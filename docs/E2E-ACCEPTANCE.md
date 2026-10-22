# Planora — E2E Acceptance Criteria

Status: Living document. This is the test Planora must pass before any capability set can be called "E2E complete." No batch of work is classified COMPLETE in delivery reporting (CLAUDE.md §7) merely because its own unit/integration tests pass — it must participate in this chain or be explicitly out of scope for the current milestone.

Related: `docs/TEST-STRATEGY.md`, `docs/IMPLEMENTATION-STATUS.md`, `docs/TRACEABILITY-MATRIX.md`

---

## 1. The Acceptance Question

> Can Planora take financial information from an organization's existing Excel environment, establish trusted and governed financial truth, explain a material business deviation, model alternative futures, support a management decision, assign resulting actions, measure the realized financial impact, update the forecast, and export the result back to Excel — with lineage and auditability throughout?

If **yes**, it must be demonstrated with executable tests and evidence (screenshots, test output, reconciliation records — see `docs/IMPLEMENTATION-STATUS.md` and the `evidence/` directory), not asserted in prose.

If **no**, `docs/KNOWN-GAPS.md` must state exactly where the chain breaks, and implementation continues from that exact point — do not round up to "done" and do not skip ahead to a later stage while an earlier one is broken.

---

## 2. The Critical Browser Journey

This is the literal test path that must pass in an E2E browser test suite before Planora is classified E2E complete:

```
LOGIN
  → COMMAND CENTER
  → EXCEL IMPORT
  → MAPPING
  → RECONCILIATION
  → FORECAST
  → VARIANCE
  → ROOT CAUSE
  → SCENARIO
  → RECOMMENDATION
  → DECISION
  → ACTION
  → OUTCOME
  → EXPORT
```

Corresponding test file (or equivalent for the chosen E2E framework): `tests/e2e/full-planora-journey.e2e.*`.

---

## 3. Reference Demonstration Scenario

This is the specific, worked example the journey must satisfy — used for building realistic test fixtures (see §6) and for evaluating whether a given implementation is genuinely E2E or only superficially so.

1. User uploads `FY26_Forecast.xlsx` containing P&L, Revenue, Headcount, Opex, and Assumptions sheets.
2. Planora profiles the workbook (Discovery → Profiling → Structure Inference per `docs/EXCEL-INTEROPERABILITY.md`).
3. AI recommends mappings; user reviews and approves them.
4. Planora validates the workbook; one account is found unmapped.
5. User resolves the unmapped account.
6. Planora imports the workbook into the canonical financial model.
7. Reconciliation confirms: Excel EBITDA $87M = Planora EBITDA $87M, difference $0, status RECONCILED.
8. Command Center surfaces the exception: Forecast EBITDA $94M vs. Latest $87M, variance -$7M.
9. Variance Intelligence decomposes the -$7M: Volume -$3.1M, Labor -$1.8M, Pricing -$1.2M, Logistics -$0.6M, FX -$0.3M.
10. User drills into Volume and reaches root cause: North America → Industrial → a specific customer/product driver.
11. Revenue Agent independently identifies a $18.4M revenue exposure related to this root cause.
12. User asks Copilot: "Why is EBITDA $7M below forecast?" — Copilot returns a governed, evidence-backed explanation traceable to the same variance decomposition.
13. User opens Scenario Lab and creates four options: A — Pricing intervention, B — Opex reduction, C — Hiring delay, D — CapEx deferral.
14. Management selects A + B. Expected EBITDA recovery: +$4.7M. A Decision record is created; Actions are assigned to owners.
15. Time passes; actual realized outcome is recorded: +$4.1M.
16. Planora computes realization: 87.2% (4.1 / 4.7).
17. The outcome updates the next forecast cycle (reforecast).
18. User exports scenario/decision results back to Excel; the exported workbook reconciles against Planora with $0 difference.

**This entire journey must work end-to-end** — not as 18 disconnected features that each individually function, but as one continuous, evidenced chain where each step's output is the next step's input.

---

## 4. Acceptance Conditions Per Stage

| Stage | Passes only if |
|---|---|
| Excel Import | File accepted, profiled without executing macros/VBA, discovery evidence recorded |
| Mapping | AI suggestions shown with confidence; human approval required to commit; unmapped items block progression |
| Validation | Invalid/unmapped data blocks import with a clear, resolvable error, not a silent skip |
| Reconciliation | Computed difference is exactly reconciled or the discrepancy cause is identified and either resolved or explicitly accepted with a recorded reason |
| Command Center | Exception (variance) is surfaced automatically, not only reachable by manual navigation |
| Variance / Root Cause | Decomposition sums to the total variance; drivers are drillable to the underlying source record |
| Scenario | Recalculation is dynamic (driven by the same formula graph as planning), and does not mutate the underlying approved plan/forecast |
| Recommendation / Decision | Decision references the scenario(s) it was based on; approval is attributed to a specific authorized user |
| Action / Outcome | Actions have an owner and due state; Outcome records both expected and realized value and computes realization rate |
| Export | Exported XLSX and CSV both reconcile against database, dashboard and workspace with $0 unexplained difference |
| Lineage/Audit | Every stage above produces an audit record and/or lineage reference sufficient to answer "where did this come from" without guessing |

---

## 5. Nine Questions Test (Design-Time Check)

Before implementing any feature intended to participate in this chain, confirm (per CLAUDE.md §4 and PRD §3):

1. Which FP&A pain point does this solve?
2. Can the number be traced to trusted evidence?
3. Can Planora explain why it changed?
4. Can the user model what happens next?
5. Can management make a governed decision?
6. Can actions be assigned?
7. Can Planora measure whether the decision worked?
8. Can the result flow into the next forecast?
9. Can existing Excel environments participate without requiring a rebuild?

A "no" to any of these for a component in the critical journey means that component is not yet ready to be marked COMPLETE against this acceptance contract, even if its own local tests pass.

---

## 6. Test Fixture Requirement

The reference scenario in §3 requires a realistic `FY26_Forecast.xlsx`-equivalent fixture (P&L, Revenue, Headcount, Opex, Assumptions sheets, with values matching or closely approximating the figures in §3) to exist under `tests/fixtures/` before the E2E journey test can be written meaningfully. If no such fixture exists, generating it is in scope for the iteration that first implements Excel import (see `docs/IMPLEMENTATION-PLAN.md`) — do not write the E2E test against a trivial or unrealistic workbook and call the journey validated.

---

## 7. Classification Rules

- **COMPLETE** — full journey in §2 passes as an automated E2E test, with evidence archived per `docs/IMPLEMENTATION-STATUS.md`.
- **PARTIAL** — some stages pass; the exact break point is documented in `docs/KNOWN-GAPS.md` with reference to which stage and why.
- **BLOCKED** — an external dependency (credentials, data access, environment) prevents progress; documented with the specific blocker.
- **NOT STARTED** — no implementation exists for the stage yet.

Never report PARTIAL as COMPLETE. A capability that works in isolation but hasn't been proven inside this chain is PARTIAL, not COMPLETE, for purposes of this document (it may still be COMPLETE for its own local Definition of Done per CLAUDE.md §6 — the two classifications are related but not identical; this document governs the chain-level claim specifically).

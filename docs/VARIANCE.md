# VARIANCE.md — Planora Variance Intelligence Spec

Status: Living document. Implementation-focused companion to `docs/CANONICAL-FINANCIAL-MODEL.md` §7 and PRD §4.7 — this file is the spec an engineer implements against; the PRD entry is the product summary.
Related: `docs/ACCOUNTING.md`, `AGENTS.md` (Variance Agent), `docs/E2E-ACCEPTANCE.md`

---

## 1. Purpose

Variance Intelligence is Planora's signature capability: it turns "the number moved" into "here is exactly why, with evidence, down to the driver." It must never present a variance without a decomposition, and it must never present a decomposition that doesn't sum to the total.

---

## 2. Comparison Types

| Comparison | Meaning |
|---|---|
| Actual vs. Budget | Performance against the originally approved plan |
| Actual vs. Forecast | Performance against the most recent forecast version |
| Actual vs. Prior Year | Year-over-year performance |
| Forecast vs. Previous Forecast | Forecast movement between cycles |
| Actual vs. Target | Performance against a management-set target distinct from the formal budget |

Each comparison type is a distinct `Variance` record type — do not conflate "vs. Budget" and "vs. Forecast" into one generic comparison, since their approval workflows and materiality thresholds typically differ.

---

## 3. Calculation Model

A `Variance` record is always derived from two existing facts (never independently entered):

```
Variance = ComparisonBasisValue − ActualValue   (sign convention: negative = unfavorable for expense-reducing metrics; tenant-configurable per metric type)
```

The `Variance` is decomposed into `VarianceDriver` rows. Drivers must sum exactly to the total variance — a decomposition that doesn't reconcile to the total is a defect, not an acceptable approximation, and should fail validation rather than display.

### Standard driver categories (P&L variance)

| Driver | Typical calculation approach |
|---|---|
| Volume | (Actual Units − Plan Units) × Plan Price |
| Price | (Actual Price − Plan Price) × Actual Units |
| Labor | Actual Labor Cost − Plan Labor Cost, isolating rate vs. headcount sub-drivers where data supports it |
| Logistics | Actual Logistics Cost − Plan Logistics Cost |
| FX | Impact of exchange-rate movement holding local-currency amounts constant |

Tenants may define additional/alternative driver categories via `MetricDefinition`-style configuration — the categories above are the baseline, not an exhaustive or hardcoded list.

---

## 4. Drill Path

Variance must be drillable along the dimension hierarchy:

```
Enterprise → Business Unit → Geography → Product → Customer → Cost Center → Account → underlying driver
```

At each drill level, the same reconciliation rule applies: child-level variances sum to the parent-level variance. A drill that doesn't reconcile indicates a dimension-mapping problem upstream (likely in Excel/ERP mapping, not in the variance engine itself) and should surface as a data quality issue, not a silent discrepancy.

---

## 5. Materiality Thresholds

Every tenant configures materiality thresholds (absolute amount and/or percentage) per metric and optionally per dimension level. Thresholds control:

- Whether a variance surfaces automatically on the Command Center as "Needs Attention" (PRD §4.1).
- Whether Variance Agent's decomposition requires human review before being attached to a Decision (`AGENTS.md`, Variance Agent).
- Default drill-down depth shown before the user requests more detail.

A variance below threshold is still fully computed and available — thresholds control surfacing and workflow gating, never suppress the underlying calculation.

---

## 6. Presentation Formats

- **Waterfall** — total variance decomposed into sequential driver bars from prior value to current value.
- **Bridge** — comparison-basis value to actual value, showing each driver's contribution as a step.
- **Driver tree** — hierarchical breakdown allowing drill from total variance down through dimension levels to individual drivers.

All three are presentation layers over the same underlying `Variance`/`VarianceDriver` data — they must never diverge in total from one another.

---

## 7. AI Explanation Requirements

Per CLAUDE.md §2 and PRD §4.7, AI-generated variance commentary must be evidence-grounded:

- Every claim in an AI explanation must reference a specific `VarianceDriver` or underlying fact — no narrative commentary invented without a traceable number behind it.
- The AI explanation is a *summary* of the decomposition already computed by the deterministic variance engine (§3) — the AI does not compute the decomposition itself; it explains a decomposition that already reconciles.
- If the AI cannot ground a claim (e.g., speculating about an external market cause not present in any connected data source), it must say so explicitly rather than presenting speculation as a driver.

This is what Variance Agent (`AGENTS.md`) and Copilot (PRD §4.12) both rely on when asked "why is EBITDA below forecast" — the answer must always be traceable to §3's decomposition, not generated independently by each surface.

---

## 8. Root Cause vs. Variance Decomposition

Variance decomposition (§3) answers "which drivers explain the number." Root cause (drill, §4) answers "which specific dimension combination is responsible within that driver" — e.g., decomposition says "Volume: -$3.1M," drill says "North America → Industrial → [specific customer/product]."

Root cause investigation is a manual or agent-assisted drill through §4's path; it is not a separately computed figure independent of the decomposition — the root-cause dimension combination's own variance contribution must equal its share of the parent driver's total.

---

## 9. Testing Requirements

Per `docs/TEST-STRATEGY.md`:

- `variance-calculation.test` — decomposition sums to total, across comparison types and at least one multi-level drill.
- `variance-api.test` — API returns decomposition with source references sufficient for lineage display.
- `variance-investigation.e2e` — full user journey: Command Center exception → Variance Intelligence → drill to root cause, matching `docs/E2E-ACCEPTANCE.md` §3 steps 8–10.
- Materiality threshold behavior — variances above/below threshold surface correctly on Command Center.

---

## 10. Relationship to Other Documents

`docs/ACCOUNTING.md` defines the accounts and metrics being compared. `docs/CANONICAL-FINANCIAL-MODEL.md` §7 defines the `Variance`/`VarianceDriver` schema this document specifies calculation behavior for. `docs/E2E-ACCEPTANCE.md` §3 uses the exact worked EBITDA example this document's §3 driver table is built around — keep the example numbers consistent across both files if either changes.

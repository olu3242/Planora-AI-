# Planora — Canonical Financial Model

Status: Living document — this is the contract every data source (Excel, ERP, CRM, HRIS, etc.) maps into. Changes here are structural and require a `docs/DECISIONS.md` entry.
Related: `docs/EXCEL-INTEROPERABILITY.md`, `docs/DOMAIN-MODEL.md`, `docs/DATA-GOVERNANCE.md`

---

## 1. Purpose

The canonical financial model is the single governed representation of financial and operational truth inside Planora. Every source system — Excel, ERP, CRM, HRIS, payroll, procurement, treasury, or a manual API — is an *input* to this model via an adapter. Nothing downstream (planning, forecasting, variance, scenarios, decisions, reporting, Copilot, agents) reads from a source system directly; everything reads from the canonical model.

If a capability needs a value that isn't in the canonical model yet, the fix is to extend the model (with a `docs/DECISIONS.md` entry), not to bypass it.

---

## 2. Canonical Dimensions

| Dimension | Notes |
|---|---|
| Organization | Root tenant-level container |
| Legal Entity | Statutory entity within an Organization |
| Business Unit | Operating segment |
| Department | Functional grouping |
| Cost Center | Cost-accountability unit, may roll up to Department |
| Account | Chart-of-accounts entry (GL) |
| Product | Product/SKU/service line |
| Customer | Revenue-side counterparty |
| Vendor | Cost-side counterparty |
| Project | Time-bound initiative, may span cost centers |
| Channel | Distribution/sales channel |
| Geography | Country/region/market |
| Currency | ISO currency code; supports multi-currency and reporting-currency translation |
| Fiscal Year / Quarter / Month / Period | Derived from tenant's Fiscal Calendar; periods need not equal calendar months |
| Scenario | Base, Upside, Downside, Management, Stress, or tenant-defined |
| Version | Plan/forecast version identity (e.g., FY26 Budget v1, FY26 Latest Estimate) |

**Custom dimensions:** tenants may define additional dimensions. The model must not hard-code any customer-specific hierarchy (e.g., a specific company's regional rollup) — hierarchies are configuration, not schema.

Every dimension member carries: code, display name, parent (for hierarchical dimensions), effective date range, and active/inactive status. Dimension members are versioned — a hierarchy change does not rewrite history, it creates a new effective-dated state.

---

## 3. Core Facts

| Fact | Grain | Notes |
|---|---|---|
| Actual | Account × Dimension combination × Period × Currency | Sourced from ERP/GL or reconciled Excel import |
| PlanLine | Account × Dimension combination × Period × PlanVersion | Belongs to a Plan/PlanVersion in a workflow state (see §5) |
| ForecastLine | Account × Dimension combination × Period × ForecastVersion | Belongs to a ForecastVersion; may carry a ForecastOverride |
| ScenarioResult | Account × Dimension combination × Period × Scenario | Computed, not manually entered, except for scenario driver inputs |
| MetricValue | MetricDefinition × Dimension combination × Period × Scenario/Version | Computed/derived metrics (EBITDA, Gross Margin, etc.) — see §6 |

All facts carry: source reference (see `docs/EXCEL-INTEROPERABILITY.md` §Lineage for the Excel case; equivalent source references apply for ERP/API sources), import/entry timestamp, and entering user or system identity.

---

## 4. Driver-Based Modeling

Planning and forecasting facts may be entered directly or computed from a driver formula. Driver formulas are explicit and inspectable, not opaque:

```
Headcount × Average Compensation × Benefits Rate → Personnel Expense
Units × Price → Revenue
```

A PlanLine or ForecastLine computed from a driver formula stores: the formula reference, the driver inputs used, and the computed result. Changing a driver input must propagate to every dependent calculated line — propagation is synchronous and traceable, not a background job that can silently leave stale computed values.

---

## 5. Workflow States

Plans move through: `DRAFT → SUBMITTED → IN_REVIEW → CHANGES_REQUESTED → RESUBMITTED → APPROVED → LOCKED`.

A `LOCKED` PlanVersion is immutable. Any subsequent change requires a new version, not a mutation of the locked version. This preserves the ability to compare "what we approved" against "what happened" without ambiguity.

ForecastVersions follow a lighter-weight lifecycle (draft → published → superseded) since forecasts are expected to recur continuously (see PRD §4.6), but a published ForecastVersion is still immutable — corrections create a new version with a documented override, never an in-place edit.

---

## 6. Metrics Layer

Metrics (EBITDA, Gross Margin, Revenue, etc.) are not raw facts — they are computed from facts via a registered `MetricDefinition` that specifies:

- Formula (in terms of Accounts/other Metrics)
- Owner and data steward
- Source facts and transformations
- Refresh cadence
- Quality score computation
- Certification status
- Downstream usage (which reports, dashboards, or agents consume it)

A `MetricValue` is a cached/materialized computation of a `MetricDefinition` at a specific dimension × period × scenario/version combination, always re-derivable from the underlying facts. Never hand-enter a MetricValue that bypasses its MetricDefinition's formula — if the formula is wrong, fix the formula.

This layer is what makes "Explain this number" (PRD §4.10) possible: given any MetricValue, Planora can walk back to MetricDefinition → source facts → source system → import batch → mapping rule.

---

## 7. Variance and Scenario Derivation

- **Variance** (Actual vs Budget, vs Forecast, vs Prior Year, vs Target; Forecast vs Previous Forecast) is always computed, never stored as an independently-entered fact. A `Variance` record references the two facts being compared and stores the decomposition into `VarianceDriver` rows (e.g., Volume, Labor, Pricing, Logistics, FX) with their individual contributions summing to the total variance.
- **ScenarioResult** is computed by taking a base Plan or Forecast version, applying `ScenarioVariable` overrides (e.g., Volume -8%), and recalculating every dependent MetricValue through the same driver-formula graph used in normal planning (§4). A scenario never mutates the Plan or Forecast it's based on.

---

## 8. Multi-Currency

Every fact carries its transaction currency. Reporting currency translation is a computed presentation layer, not a mutation of the underlying fact — the model must be able to show both transaction-currency and reporting-currency views of the same fact, with the FX rate and rate date used for translation recorded alongside the translated value.

---

## 9. What the Canonical Model Is Not

- It is not an Excel-shaped table. Excel workbooks are profiled and mapped *into* this model (see `docs/EXCEL-INTEROPERABILITY.md`); the model's shape is never dictated by a specific customer's workbook layout.
- It is not a single flat fact table. Facts, dimensions, metrics, variance, and scenario results are distinct concerns with distinct lifecycles (raw entry vs. computed vs. workflow-gated).
- It is not mutable history. Locked plans, published forecasts, and reconciled actuals are immutable; corrections are new versions with recorded provenance, never silent overwrites (see CLAUDE.md §2).

---

## 10. Relationship to Domain Model

This document describes the conceptual model. The concrete entity list and relationships (tables/collections, foreign keys, required fields) live in `docs/DOMAIN-MODEL.md` and must stay consistent with the concepts here. If they diverge, this document wins for concept and intent; `docs/DOMAIN-MODEL.md` wins for implementation detail — but a divergence should be resolved, not left standing.

## 11. Phase 2 executable mapping

The canonical core is implemented in `prisma/schema.prisma`. Sparse `FinancialFact` dimension combinations use the normalized deterministic grain policy in ADR-010 and are unique within an Organization. Source facts store exact `Decimal(24,6)` amounts and structured `LineageReference` records. `MetricValue` is derived only by `src/domain/financial/calculation-engine.ts`, cached at `Decimal(28,10)`, and carries calculation provenance.

The first registered graph contains Revenue, COGS, Gross Profit, Operating Expense, EBITDA, Gross Margin %, and EBITDA Margin %. Statement aggregation is executed in PostgreSQL by account class before the pure calculation graph runs; the UI never calculates a financial result.

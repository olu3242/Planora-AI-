# Planora — Product Requirements Document (PRD)

Status: Living document — update as scope is implemented or revised.
Owner: Product Architecture
Related: `docs/BRD.md`, `docs/PAIN-POINT-MATRIX.md`, `docs/CANONICAL-FINANCIAL-MODEL.md`, `docs/EXCEL-INTEROPERABILITY.md`, `docs/E2E-ACCEPTANCE.md`

---

## 1. Product Vision

Planora is a financial planning, analysis, governance, and decision-intelligence operating system. Its core promise: turn fragmented financial data into governed, explainable, actionable business decisions.

Planora must continuously answer seven questions: what happened, why did it happen, what's likely next, what can we do, what decision should be made, who owns the resulting action, and did the decision produce the expected financial result.

It is explicitly not: a BI dashboard, a static reporting tool, or a project whose goal is to eliminate Excel.

---

## 2. Personas

| Persona | Primary needs |
|---|---|
| CFO | Financial health, risk, cash, forecast, scenario, decisions |
| FP&A Director | Planning, forecast, variance, approvals, performance |
| FP&A Analyst | Data, models, drivers, variance, forecast, scenarios |
| Business Leader | My budget, my forecast, my KPIs, my actions |
| Data Steward | Definitions, mappings, quality, lineage, certification |
| Executive | What changed, why, what's next, what are my options, what needs my decision |

Access to each surface is enforced by server-side RBAC (see `docs/SECURITY-RBAC.md`), not by persona-based UI hiding alone.

---

## 3. Pain Points Addressed

Full detail in `docs/PAIN-POINT-MATRIX.md`. Summary:

| Pain point | Capability |
|---|---|
| Fragmented systems/data | Financial Data Hub |
| Spreadsheet dependency | Planning Engine + Excel Integration |
| Slow budgeting | Collaborative Planning |
| Static forecasts | Continuous Forecast Engine |
| Difficult variance investigation | Variance Intelligence |
| Slow what-if analysis | Scenario Lab |
| Reports don't create accountability | Decision Hub |
| Numbers aren't trusted | Governance Engine |
| Manual repetitive analysis | Planora Copilot |
| Reactive finance teams | Agentic Intelligence |
| Lost management actions | Action & Outcome Tracking |
| Excel migration complexity | Universal Excel Mapper |

No capability is in scope unless it maps to a row in this table.

---

## 4. Capability Areas

### 4.1 FP&A Command Center
Homepage. Not a generic BI dashboard — answers "what requires my attention today." Shows core financial health (revenue, EBITDA, gross margin, cash, working capital, forecast accuracy), then prioritizes exceptions (variance alerts, revenue risk, data quality issues, overdue submissions) over decorative charts. Every exception card has a CTA that deep-links to the relevant investigation surface.

### 4.2 Financial Data Hub
Integrates ERP, CRM, HRIS, payroll, procurement, treasury, data warehouses, operational systems, APIs, CSV, Excel, and cloud storage into a governed financial semantic layer. Canonical dimensions: Organization, Legal Entity, Business Unit, Department, Cost Center, Account, Product, Customer, Vendor, Project, Channel, Geography, Currency, Fiscal Year/Quarter/Month/Period, Scenario, Version — plus tenant-defined custom dimensions. No hard-coded customer-specific hierarchies.

### 4.3 Excel Interoperability
Excel is a first-class, permanent interoperability layer — not a migration target to be eliminated. Full architecture in `docs/EXCEL-INTEROPERABILITY.md`. Summary of the pipeline: Workbook → Discovery → Profiling → Structure Inference → Mapping → Validation → User Review → Import → Reconciliation → Certification → Canonical Financial Model. Supports wide format, long format, sheet-based periods/departments, and workbook-based business units. Alias engine resolves organization-specific terminology (Dept/CC/GL/Acct/ACT/FCST/LE/Plan variants) with AI-assisted suggestion but human-approval authority. Formula awareness classifies formulas as translatable, referenced, complex, or unsupported — never auto-converts arbitrary formulas into application logic. Round-trip export back to Excel with reconciliation on re-import.

### 4.4 Planning Engine
Annual budget, rolling forecast, long-range plan, revenue plan, workforce plan, opex, capex, cash, working capital, balance sheet, P&L, cash flow — all driver-based (e.g., Headcount × Avg Compensation × Benefits Rate → Personnel Expense). Changes propagate through dependent calculations.

### 4.5 Collaborative Planning
Workflow: Corporate Target → Business Unit → Department → Cost Center → Submission → Review → Challenge → Approval → Lock. States: DRAFT, SUBMITTED, IN_REVIEW, CHANGES_REQUESTED, RESUBMITTED, APPROVED, LOCKED. Full audit trail of owner, approver, timestamps, comments, assumptions, attachments, versions.

### 4.6 Continuous Forecast Engine
Inputs: actuals, operational drivers, pipeline, orders, volume, pricing, headcount, FX, historical trends, business inputs, statistical forecasts, approved AI signals. Supports monthly, quarterly, rolling-12, rolling-18, latest-estimate cycles. Tracks forecast accuracy, bias, and movement across previous/current/system/management forecast versions. Human overrides require user, timestamp, reason, previous value, new value, and commentary — never silently replaced.

### 4.7 Variance Intelligence
Signature capability. Actual vs Budget, vs Forecast, vs Prior Year, vs Target; Forecast vs Previous Forecast. Decomposes variance into driver-level contributions (e.g., Volume, Labor, Pricing, Logistics, FX). Drillable Enterprise → Business Unit → Geography → Product → Customer → Cost Center → Account → underlying driver. Provides waterfalls, bridges, driver trees, materiality thresholds, and AI explanation — AI explanations must be evidence-grounded, never fabricated.

### 4.8 Scenario Lab
Scenario types: Base, Upside, Downside, Management, Stress. User-adjustable drivers: volume, price, headcount, compensation, opex, capex, FX, DSO, DPO, interest, others. Dynamic recalculation of revenue, gross margin, EBITDA, operating income, cash, working capital. Scenarios can be created, cloned, compared, shared, commented, approved, archived — never modifies approved plans directly.

### 4.9 Decision Hub
Lifecycle: Signal → Insight → Financial Impact → Scenarios → Recommendation → Decision → Action → Owner → Outcome → Realized Financial Impact. Tracks expected vs. realized impact and computes realization rate. Outcomes feed back into subsequent forecasts and organizational learning.

### 4.10 Governance Engine
Every material metric answers: what is it, how is it calculated, where did it come from, who owns it, can we trust it, where is it used. Metric registry includes definition, formula, owner, data steward, sources, transformations, lineage, refresh timestamp, quality score, certification status, downstream usage, access policy. "Explain this number" surfaces this in-context.

### 4.11 Data Quality Engine
Rules covering balance sheet integrity, intercompany reconciliation, missing cost centers, invalid accounts, duplicates, missing FX, stale data, period anomalies, invalid mappings, unexpected movements. Each issue carries severity, owner, status, source, affected metrics, financial exposure, resolution, and evidence.

### 4.12 Planora Copilot
Governed conversational interface. Architecture: Question → Authorization → Governed Metrics → Semantic Model → Financial Model → Calculation → Evidence → Response. Every answer exposes sources, calculations, assumptions, freshness, confidence, definitions, and lineage where applicable. Never fabricates financial information.

### 4.13 Agentic FP&A
Initial agents: Forecast, Variance, Revenue, Cost, Cash, Scenario, Governance, Reporting, Decision. Architecture: Observe → Analyze → Recommend → Request Approval → Human Decision → Authorized Action → Outcome. Agents cannot unilaterally alter approved financial data. Full detail in `docs/AI-AGENT-ARCHITECTURE.md` and `AGENTS.md`.

### 4.14 Management Reporting
Generates governed management packs (executive summary, P&L, revenue, margin, opex, cash, forecast, variances, risks, scenarios, decisions, actions, outcomes). AI may draft commentary; human approval required before publication. Structured Excel export supported.

### 4.15 Notifications
Actionable-event notifications (budget overdue, forecast movement, material variance, cash risk, data quality failure, mapping/schema change, scenario/decision approval, action overdue, certification expiry), deep-linked to the affected object.

---

## 5. Navigation Structure

```
COMMAND CENTER
PLAN        — Budget, Forecast, Revenue, Workforce, Expenses, CapEx, Cash
ANALYZE     — Performance, Variances, Drivers, KPIs
SIMULATE    — Scenarios, Sensitivities, Stress Tests
DECIDE      — Insights, Recommendations, Decisions, Actions, Outcomes
GOVERN      — Metrics, Data Quality, Lineage, Controls, Certifications
DATA        — Sources, Imports, Excel Mapper, Reconciliation, Mapping Templates
AI          — Copilot, Agents, Investigations, Alerts
ADMIN       — Organization, Users, Roles, Dimensions, Fiscal Calendar, Integrations, Workflows, AI Policies
```

Public-facing surface (marketing/product site) is a separate concern — see `docs/PLANORA-PRD.md` §8 and the site sitemap maintained alongside `README.md`.

---

## 6. Functional Requirements

- Ingest financial and operational data from Excel and connected systems into a governed canonical model (§4.2–4.3).
- Support driver-based planning and rolling forecasting with full override history (§4.4, §4.6).
- Decompose variance into evidenced, drillable drivers (§4.7).
- Support scenario modeling that never mutates approved plans (§4.8).
- Convert insight into an accountable decision-action-outcome chain with realized-impact measurement (§4.9).
- Make every material metric self-explaining: definition, formula, source, owner, freshness, quality, lineage (§4.10).
- Detect and surface data quality issues with financial exposure estimates (§4.11).
- Provide a grounded conversational interface that never fabricates figures (§4.12).
- Run controlled agents that recommend but do not unilaterally act on approved data (§4.13).
- Produce governed, human-approved management reporting packs with Excel export (§4.14).
- Notify users of actionable events with deep links (§4.15).

## 7. Non-Functional Requirements

- Multi-tenant SaaS-ready: tenant isolation enforced server-side, verified by tenant-isolation tests.
- RBAC enforced server-side; UI hiding is not sufficient authorization.
- Immutable audit trail for all material events (see `docs/SECURITY-RBAC.md` and CLAUDE.md §2).
- Uploaded Excel files are untrusted input; no VBA/macro/embedded-code execution.
- Scalable lineage — no cell-per-row database expansion for large datasets.
- Responsive certification at 375px, 430px, 768px, 1024px, 1440px with real mobile drill-down patterns, not shrunk desktop tables.
- Accessibility considered in the design system (see `docs/TEST-STRATEGY.md`).
- Rate limiting where appropriate; secure session handling; secret isolation; secure file storage.

## 8. Success Metrics

Budget cycle time, forecast cycle time, forecast accuracy, forecast bias, manual adjustment rate, variance investigation time, data reconciliation rate, data quality score, metric certification rate, scenario-to-decision conversion, decision cycle time, action completion rate, expected vs. realized impact, reporting preparation time, Copilot adoption, agent recommendation acceptance rate, Excel mapping success rate, Excel reconciliation rate, mapping reuse rate.

## 9. MVP Scope vs. Future-State Scope

**MVP (first certified vertical slice):** Excel → Mapping → Validation → Reconciliation → Canonical Financial Model → Command Center → Variance Intelligence → Scenario Lab → Decision Hub → Action → Outcome, for a single tenant, single currency, single fiscal calendar, with core RBAC roles (CFO, FP&A Director, Analyst) and audit logging on all material events.

**Explicitly deferred past MVP unless stated otherwise in `docs/IMPLEMENTATION-PLAN.md`:** multi-currency consolidation edge cases, full agent roster (start with Variance and Scenario agents, expand per `docs/AI-AGENT-ARCHITECTURE.md`), full management-reporting pack automation, advanced statistical forecasting models, complete Excel round-trip for every workbook shape (start with wide + long format; hybrid/sheet-based structures follow).

Deferral does not mean the architecture forecloses these — the canonical model and Excel adapter boundary must be designed so they can be added without rework (see `docs/TARGET-ARCHITECTURE.md`).

## 10. E2E Acceptance Criteria

A capability is not "shippable" in the Planora sense until it participates in the acceptance chain defined in `docs/E2E-ACCEPTANCE.md`:

> Can Planora take financial information from an organization's existing Excel environment, establish trusted and governed financial truth, explain a material business deviation, model alternative futures, support a management decision, assign resulting actions, measure the realized financial impact, update the forecast, and export the result back to Excel — with lineage and auditability throughout?

If yes, it must be demonstrated with tests and evidence (see `docs/TEST-STRATEGY.md`, `docs/IMPLEMENTATION-STATUS.md`). If no, `docs/KNOWN-GAPS.md` must state exactly where the chain breaks.

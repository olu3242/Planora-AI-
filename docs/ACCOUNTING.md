# ACCOUNTING.md — Planora Accounting Reference

Status: Living document. A practitioner-facing companion to `docs/CANONICAL-FINANCIAL-MODEL.md` — this file focuses specifically on accounting correctness (chart of accounts, statement structure, period handling) rather than the full data-model contract. If the two documents disagree, `docs/CANONICAL-FINANCIAL-MODEL.md` is authoritative for schema; this document is authoritative for accounting treatment.

---

## Phase 2 P&L convention

Revenue accounts carry a credit normal balance; COGS and operating expense accounts carry debit normal balances. Canonical P&L facts are stored as positive presentation amounts in the certified Phase 2 fixture. The calculation graph applies statement semantics explicitly: `Gross Profit = Revenue - COGS`, `EBITDA = Gross Profit - Operating Expense`, and margins divide the related profit measure by Revenue. A zero Revenue denominator yields 0%, never NaN or infinity. Sign normalization for external source ledgers remains an adapter responsibility in Phase 3.

## 1. Chart of Accounts

Planora does not impose a fixed chart of accounts — it imports and governs the tenant's own. Every `Account` record carries:

- **Code** — the tenant's own GL account code (not reassigned by Planora).
- **Name** — display name.
- **Type** — one of: Asset, Liability, Equity, Revenue, Cost of Goods Sold, Operating Expense, Other Income, Other Expense.
- **Statement placement** — which financial statement(s) the account feeds (Balance Sheet, P&L, Cash Flow) and where within it.
- **Normal balance** — debit or credit, used to validate that imported/entered values carry the expected sign.
- **Parent account** (optional) — for roll-up reporting within the chart itself, distinct from the Cost Center/Department dimension hierarchy.
- **Active/inactive status** with effective dating, matching the dimension-versioning rule in the canonical model (§2).

Account mapping from a source system (Excel or ERP) never silently renames or recategorizes an account — a proposed mapping (e.g., tenant's "6100 - Salaries" → canonical Personnel Expense) requires the same human-approval gate as any other Excel mapping (`docs/EXCEL-MAPPING-SPEC.md`).

---

## 2. Financial Statements

Planora must be able to assemble, from canonical facts, the three core statements without requiring a separate hand-maintained model for each:

- **P&L (Income Statement):** Revenue, COGS, Gross Margin, Operating Expenses, EBITDA, Depreciation & Amortization, Operating Income, Other Income/Expense, Net Income.
- **Balance Sheet:** Assets (current, non-current), Liabilities (current, non-current), Equity. Must balance — Assets = Liabilities + Equity — as a standing data-quality rule (§4).
- **Cash Flow Statement:** Operating, Investing, Financing activities, reconciling to the period's cash balance change.

Statements are computed views over Account-typed facts plus the Metrics layer (canonical model §6) for derived lines like EBITDA and Gross Margin — never separately hand-entered totals that could drift from the underlying accounts.

---

## 3. Standard Metric Definitions

These are the baseline `MetricDefinition` entries Planora ships with. Tenants may add custom metrics, but should not redefine these baseline formulas without a recorded reason (accounting definitions of EBITDA, in particular, vary by company — the tenant's variant must be explicit, not silently assumed).

| Metric | Standard formula |
|---|---|
| Gross Margin | (Revenue − COGS) / Revenue |
| EBITDA | Operating Income + Depreciation + Amortization |
| Operating Income | Gross Profit − Operating Expenses |
| Net Income | Operating Income + Other Income − Other Expense − Tax |
| Working Capital | Current Assets − Current Liabilities |
| DSO (Days Sales Outstanding) | (Accounts Receivable / Revenue) × Days in Period |
| DPO (Days Payable Outstanding) | (Accounts Payable / COGS) × Days in Period |

Every one of these is a `MetricDefinition` per canonical model §6 — inspectable, owned, and versioned, not hardcoded application logic invisible to the Data Steward.

---

## 4. Balance Sheet Integrity Rules

Standing data-quality checks (feed into `docs/DATA-GOVERNANCE.md`):

- Assets = Liabilities + Equity, at every period close, per Legal Entity.
- Intercompany balances between Legal Entities within an Organization net to zero at the consolidated level, or are flagged as an unresolved elimination.
- Retained Earnings roll-forward: prior period Retained Earnings + Net Income − Dividends = current period Retained Earnings.

A failing check produces a `DataQualityIssue` with severity, the affected Legal Entity/period, and estimated exposure — it does not silently block the import; it blocks *certification* of the affected metrics (canonical model §6) until resolved or explicitly accepted with a reason.

---

## 5. Multi-Entity and Consolidation

- Facts are recorded at the Legal Entity level in transaction currency.
- Consolidation to Organization level applies FX translation (canonical model §8) and intercompany elimination.
- A consolidated MetricValue must be able to show its constituent per-entity values on drill-down — consolidation is a computed rollup, never a separately-entered figure.

---

## 6. Period and Fiscal Calendar Handling

- Tenants define their own Fiscal Calendar (fiscal year start month, 4-4-5 vs. calendar-month periods, etc.) — Planora does not assume calendar-year alignment.
- Every `FiscalPeriod` is derived from the tenant's calendar configuration, not hardcoded to Jan–Dec.
- Period close is a workflow state (open → soft-close → hard-close), not just a date passing — actuals for a hard-closed period are immutable except through a documented restatement, which creates a new version rather than editing history (consistent with canonical model §5).

---

## 7. Accrual vs. Cash Basis

Planora's canonical model assumes accrual-basis accounting as the default for Actuals imported from a GL/ERP source. Where a tenant's Excel model is maintained on a cash basis (common in smaller-entity FP&A workbooks), the Excel Mapper must flag this during Structure Inference (`docs/EXCEL-INTEROPERABILITY.md` §3) rather than silently treating cash-basis figures as accrual — the two are not directly comparable without an explicit reconciliation, and blending them without flagging it produces a balance sheet that doesn't tie out.

---

## 8. Relationship to Other Documents

This document governs accounting *treatment*. `docs/CANONICAL-FINANCIAL-MODEL.md` governs the *schema* that treatment is implemented in. `docs/VARIANCE.md` governs how the accounts and metrics defined here get decomposed and explained when they move. `docs/EXCEL-MAPPING-SPEC.md` governs how a tenant's own chart of accounts and statement structure gets resolved into the accounts described in §1 above.

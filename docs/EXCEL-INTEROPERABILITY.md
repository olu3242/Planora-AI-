# Planora — Excel Interoperability Architecture

Status: Living document.
Related: `docs/EXCEL-MAPPING-SPEC.md`, `docs/CANONICAL-FINANCIAL-MODEL.md`, `docs/TEST-STRATEGY.md`

---

## 1. Principle

Planora does not attempt to eliminate Excel. Excel may permanently remain a data source, a planning input, a template, an offline working environment, a reporting output, a reconciliation mechanism, a migration path, or a controlled edge interface.

**The objective:** any reasonably structured FP&A Excel model should be mappable into Planora without requiring the customer to rebuild the workbook from scratch.

Excel-specific logic lives entirely in an isolated adapter boundary and never becomes — or leaks into — the canonical financial model (`docs/CANONICAL-FINANCIAL-MODEL.md`).

```
Excel / ERP / CRM / HRIS / Operational Data
        ↓
   Spreadsheet Adapter (this document)
        ↓
   Mapping → Validation → Reconciliation
        ↓
   Canonical Financial Model
        ↓
   Planning / Forecasting / Analysis / Governance / Decision Intelligence
```

---

## 2. Supported Formats and Sources

- `.xlsx` (full support)
- `.xlsm` — data extraction only, **never** macro execution
- `.csv`
- legacy `.xls` — conversion/import where technically feasible

Sources: manual upload, Microsoft 365, OneDrive, SharePoint, controlled file drops, storage connectors, APIs.

**Hard rule:** Planora never executes VBA, macros, or any arbitrary embedded workbook code. Uploaded workbooks are untrusted input regardless of source.

---

## 3. Pipeline

```
WORKBOOK → DISCOVERY → PROFILING → STRUCTURE INFERENCE → MAPPING →
VALIDATION → USER REVIEW → IMPORT → RECONCILIATION → CERTIFICATION →
CANONICAL FINANCIAL MODEL
```

**Discovery:** identify the workbook, its worksheets, and basic metadata (file hash, sheet count, size) without yet interpreting content.

**Profiling:** inventory worksheets, tables, named ranges, headers, formulas, constants, dates, currencies, percentages, hidden sheets, merged cells, cross-sheet references, external links, and candidate dimensions/periods/scenarios/financial-statement structures/drivers/assumptions/inputs/outputs. Never assume a single layout — profiling must handle the structural variety in §4 within one engine.

**Structure Inference:** classify the workbook's shape (wide, long, sheet-based, workbook-based, or hybrid — see §4) and propose which regions correspond to which canonical concepts.

**Mapping:** resolve worksheet/column/row labels to canonical dimensions and accounts using the Alias Engine (`docs/EXCEL-MAPPING-SPEC.md`). AI may suggest mappings; only a human approval commits them.

**Validation:** check mapped data against canonical model constraints (valid account codes, valid dimension members, period alignment, currency presence, no unmapped required fields) before allowing import.

**User Review:** surface unmapped items, validation failures, and low-confidence AI suggestions for explicit resolution. Nothing proceeds to import silently.

**Import:** commit validated, mapped data into the canonical model as a new `ExcelImportBatch`, preserving lineage (§7).

**Reconciliation:** verify imported totals against source-workbook totals for key metrics (§8). Import is not "done" until reconciled or until discrepancies are explained and accepted.

**Certification:** once reconciled, the import batch (and the metrics it feeds) can be marked certified per `docs/DATA-GOVERNANCE.md`.

---

## 4. Supported Workbook Structures

Must handle, within one mapping engine, not one engine per shape:

- **Wide format:** `Account | Jan | Feb | Mar | ...`
- **Long format:** `Account | Period | Amount`
- **Sheet-based periods:** one sheet per month (Jan, Feb, Mar…)
- **Sheet-based departments:** one sheet per department (Operations, Sales, Technology…)
- **Workbook-based business units:** one file per BU (`NA_Forecast.xlsx`, `EMEA_Forecast.xlsx`, `APAC_Forecast.xlsx`)
- **Hybrid combinations** of the above

The mapper infers financial meaning from content and context (headers, adjacent cells, named ranges, sheet names) rather than depending exclusively on positional layout.

---

## 5. Alias Engine

Organizations use inconsistent terminology for the same canonical concept (Dept/Department, CC/Cost Centre/Cost Center, GL/Acct/Account, ACT/Actual, FCST/Forecast, LE/Latest Estimate, Plan/Budget, etc.).

Resolution sources, in order of authority:

1. **Manual approval** — always authoritative; overrides everything else.
2. **Tenant aliases** — previously approved mappings specific to this tenant.
3. **Historical approved mappings** — prior imports for this workbook/template.
4. **System aliases** — built-in common-term dictionary.
5. **AI-assisted suggestion / fuzzy matching** — proposed only, never auto-committed.

**Hard rule:** AI never silently changes a financial mapping. Every AI suggestion is presented for approval; only human (or an explicitly pre-approved template match, §9) approval commits a mapping.

Full alias spec and matching rules: `docs/EXCEL-MAPPING-SPEC.md`.

---

## 6. Formula Awareness

The engine differentiates INPUT, FORMULA, and CALCULATED RESULT cells, and classifies formulas as:

| Classification | Meaning |
|---|---|
| TRANSLATABLE | Simple driver relationship (e.g., `Units × Price = Revenue`) that can become a Planora driver model |
| REFERENCED | Formula references other mapped cells/ranges but isn't itself translated into application logic |
| COMPLEX | Formula is understood structurally but too intricate to safely auto-translate |
| UNSUPPORTED | Formula cannot be reliably interpreted |

**Hard rule:** Planora never automatically converts arbitrary Excel formulas into application logic. TRANSLATABLE formulas may be *proposed* as driver models for human confirmation. UNSUPPORTED and COMPLEX formulas remain traceable to their source cell but do not become live application logic.

---

## 7. Lineage

Every value imported from Excel must remain traceable back to its source, using scalable references — not a row-per-cell database expansion for large workbooks.

Recorded where practical: workbook, workbook version/hash, worksheet, table/range, row, column, cell, mapping rule applied, import batch, timestamp, importing user, and any transformation applied.

Example presentation:

```
Planora EBITDA: $87M
Source: FY26_Forecast.xlsx → P&L → N42
   or: FY26_Forecast.xlsx → tblForecast → EBITDA → FY26
```

This lineage is what powers "Explain this number" (`docs/CANONICAL-FINANCIAL-MODEL.md` §6) for Excel-sourced data.

---

## 8. Reconciliation

Every financial import must reconcile against the source workbook before being trusted downstream.

```
Excel:    $428,612,934
Planora:  $428,612,934
Difference: $0
Status: RECONCILED
```

When not reconciled, the engine identifies probable cause: unmapped accounts, missing cost centers, duplicates, period mismatch, currency mismatch, excluded entities, invalid mappings, or unresolved formula issues. Reconciliation evidence (the comparison, the cause analysis, and its resolution) is persisted, not just displayed transiently.

---

## 9. Mapping Templates and Schema Drift

An approved mapping becomes a reusable `ExcelMappingTemplate` (e.g., "North America Monthly Forecast"). A subsequent workbook matching the template's structure can auto-apply it without re-review.

When a new workbook's structure differs from its template, the engine detects and reports schema drift:

```
SCHEMA CHANGE DETECTED
Added: Product
Renamed: Department → Function
Removed: (none)
```

Changes that affect financial meaning (new/removed/renamed dimensions or accounts) require human review before the template is reused. Cosmetic changes (e.g., formatting-only) do not block reuse.

---

## 10. Round-Trip (Planora → Excel → Planora)

```
PLANORA → EXCEL TEMPLATE → USER INPUT → UPLOAD → VALIDATION →
CHANGE PREVIEW → APPROVAL → PLANORA
```

Before commit, show previous value, new value, difference, % difference, source, mapping, and user for every changed line. User may accept, reject, or flag for investigation per line or in bulk. **Hard rule:** never silently overwrite approved financial information — this applies as strongly to round-trip re-imports as to first-time imports.

---

## 11. Excel Migration Strategy (Progressive Adoption)

Planora does not require a big-bang migration.

| Stage | State |
|---|---|
| 1 | Excel remains system of planning; Planora provides analysis/governance on top |
| 2 | Planora becomes the governed financial repository; Excel remains a planning input |
| 3 | Planning models progressively migrate into Planora natively |
| 4 | Planora is the primary FP&A operating system; Excel remains an interoperable edge interface (still supported — never removed) |

---

## 12. Service Boundary (Implementation Note)

Excel-specific logic is isolated behind:

```
SpreadsheetConnector → WorkbookParser → WorkbookProfiler → MappingEngine →
ValidationEngine → SchemaDriftDetector → ReconciliationEngine →
ImportService / ExportService
        ↓
PLANORA CANONICAL FINANCIAL MODEL
```

No component outside this boundary (planning, forecasting, variance, scenario, decision, governance, Copilot, agents) should import from or depend on Excel-specific types. If a downstream feature needs something from a workbook, it asks the canonical model — the model already has it, because the adapter put it there during import.

---

## 13. Definition of Done for Excel Features

Per CLAUDE.md §6, an Excel-touching feature additionally requires: mapping, validation, schema-drift handling, reconciliation, versioning, lineage, auditability, and round-trip behavior where applicable — on top of the standard UI/domain/persistence/API/auth/tenant/test requirements.

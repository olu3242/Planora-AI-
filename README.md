# Planora

Governed financial planning, analysis, and decision intelligence — built so Excel and enterprise trust can coexist.

Planora turns fragmented financial data into governed, explainable, actionable business decisions. It continuously answers: what happened, why did it happen, what's likely next, what can we do, what decision should be made, who owns the resulting action, and did the decision produce the expected result.

---

## Start here

If you're a Claude instance (Claude Code or otherwise) working in this repository, **read `CLAUDE.md` first.** It is the binding execution contract — architecture rules, implementation order, Definition of Done, and delivery reporting format. This README is the human-facing overview; `CLAUDE.md` is the enforced contract.

## Documentation map

| File | Purpose |
|---|---|
| `CLAUDE.md` | Execution contract for AI-assisted implementation |
| `AGENTS.md` | Agentic operating model — agent roster, approval gates, evidence rules |
| `PRD.md` | Product requirements — capabilities, personas, scope |
| `BRD.md` | Business case — problem, stakeholders, KPIs, adoption strategy |
| `docs/CANONICAL-FINANCIAL-MODEL.md` | The data model every source maps into |
| `docs/ACCOUNTING.md` | Chart of accounts, statements, accounting treatment |
| `docs/VARIANCE.md` | Variance Intelligence calculation and drill spec |
| `docs/EXCEL-INTEROPERABILITY.md` | Excel adapter architecture — mapping, reconciliation, round-trip |
| `docs/EXCEL-MAPPING-SPEC.md` | Alias resolution and mapping-template rules |
| `docs/DATA-GOVERNANCE.md` | Metric governance, data quality, certification |
| `docs/SECURITY-RBAC.md` | Roles, permissions, tenant isolation |
| `docs/E2E-ACCEPTANCE.md` | The acceptance test Planora must pass to be called E2E complete |
| `docs/TRACEABILITY-MATRIX.md` | Pain point → requirement → feature → evidence, per capability |
| `docs/IMPLEMENTATION-PLAN.md` | Iteration sequencing |
| `docs/IMPLEMENTATION-STATUS.md` | Current COMPLETE/PARTIAL/BLOCKED status per capability |

Files not yet created (`docs/CURRENT-STATE-AUDIT.md`, `docs/GAP-MATRIX.md`, etc.) are generated during Iteration 0 per `CLAUDE.md` §3 — they depend on the actual state of a real codebase and shouldn't be pre-written from assumption.

---

## Architecture summary

```
Excel / ERP / CRM / HRIS / Operational Data
        ↓
   Spreadsheet Adapter / Connectors
        ↓
   Mapping → Validation → Reconciliation
        ↓
   Canonical Financial Model
        ↓
   Planning / Forecasting / Variance / Scenario / Decision / Governance / Copilot / Agents
```

Excel is a first-class, permanent interoperability layer — never a migration target to be eliminated. See `docs/EXCEL-INTEROPERABILITY.md`.

## Reference technology stack

The stack below is the proposed baseline for a new implementation. If this repository already has an established framework, **that framework wins** — `CLAUDE.md` §3 requires a repository audit before any scaffolding decision, and existing stable code is never rewritten just to match this reference stack.

- **Frontend:** Next.js (React, TypeScript)
- **Backend:** Next.js API routes / a dedicated Node.js service layer, TypeScript
- **Database:** PostgreSQL via Prisma ORM
- **Auth:** session-based auth with server-side RBAC middleware
- **Excel parsing:** a library capable of `.xlsx`/`.xlsm` data extraction without macro execution (no VBA/macro execution under any circumstance)
- **Testing:** Vitest/Jest (unit, integration), Playwright (E2E, responsive, accessibility)
- **CI/CD:** GitHub Actions running lint → typecheck → build → unit → integration → E2E → security before any merge

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL and other required values
npm run db:migrate
npm run db:seed
npm run dev
```

## Common commands

```bash
npm run dev             # start local dev server
npm run build            # production build
npm run lint              # lint
npm run typecheck         # type checking
npm run test               # full test suite
npm run test:unit          # unit tests only
npm run test:integration   # integration tests only
npm run test:e2e            # Playwright E2E suite
npm run test:financial      # financial calculation correctness tests
npm run test:excel           # Excel mapping/reconciliation tests
npm run test:security         # security/tenant-isolation tests
npm run db:migrate             # run database migrations
npm run db:seed                 # seed reference/demo data
npm run certify                  # run the full certification suite (CLAUDE.md §9)
```

## The Excel import journey (what a first-time user does)

1. Upload an `.xlsx` workbook (e.g., `FY26_Forecast.xlsx`).
2. Planora profiles the workbook and proposes dimension/account mappings.
3. Review and approve (or correct) the proposed mappings.
4. Resolve any unmapped items flagged during validation.
5. Import. Planora reconciles the imported totals against the source workbook — a $0 difference is required (or an explicitly accepted, documented exception) before the data is trusted downstream.

Full spec: `docs/EXCEL-INTEROPERABILITY.md`.

## The full E2E demonstration journey

```
LOGIN → COMMAND CENTER → EXCEL IMPORT → MAPPING → RECONCILIATION →
FORECAST → VARIANCE → ROOT CAUSE → SCENARIO → RECOMMENDATION →
DECISION → ACTION → OUTCOME → EXPORT
```

This is the literal automated test path Planora must pass to be classified E2E complete. Full detail and a worked example: `docs/E2E-ACCEPTANCE.md`.

## Deployment

See `docs/DEPLOYMENT.md` (created during the iteration that first needs a real deployment target — do not assume infrastructure choices before they're made).

## Project structure (reference)

```
Planora/
├── CLAUDE.md
├── AGENTS.md
├── README.md
├── package.json
├── PRD.md
├── BRD.md
├── .env.example
├── .gitignore
├── docs/
├── src/
│   ├── app/            (or pages/, per framework)
│   ├── components/
│   ├── features/       (command-center, excel-mapper, planning, variance, scenarios, decisions, governance, copilot, agents, ...)
│   ├── domain/
│   ├── services/
│   ├── repositories/
│   ├── integrations/
│   │   └── spreadsheets/   (Excel adapter — isolated per docs/EXCEL-INTEROPERABILITY.md §12)
│   ├── auth/
│   ├── permissions/
│   └── lib/
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── financial-calculations/
│   ├── excel/
│   ├── e2e/
│   └── fixtures/
├── database/
│   ├── migrations/
│   └── seeds/
├── public/
└── evidence/
```

## Current implementation status

See `docs/IMPLEMENTATION-STATUS.md` for the live phase breakdown and `docs/TRACEABILITY-MATRIX.md` for the pain-point-to-evidence chain. Phase 0 is certified as an architecture baseline; Phase 1 runtime implementation is in progress.

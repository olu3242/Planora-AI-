# CLAUDE.md — Planora Execution Contract

This file is the authoritative execution contract for any Claude instance (Claude Code, agentic sessions, or human-directed sessions) working on the Planora repository. It supersedes ad-hoc instructions given in chat unless the user explicitly overrides a specific clause for a specific task. If a conflict exists between this file and a prompt, flag the conflict before proceeding.

Read this file in full before writing code. Re-read it at the start of every new session — do not rely on memory of a prior session's summary.

---

## 1. What Planora Is

Planora is a financial planning, analysis, governance, and decision-intelligence operating system. It is not a dashboard, not a reporting tool, and not an Excel replacement. It exists to turn fragmented financial data into governed, explainable, actionable business decisions.

Planora must be able to continuously answer:

1. What happened?
2. Why did it happen?
3. What is likely to happen next?
4. What can we do?
5. What decision should be made?
6. Who owns the resulting action?
7. Did the decision produce the expected financial result?

**Lifecycle:** DATA → PLAN → FORECAST → ACTUAL → VARIANCE → ROOT CAUSE → SCENARIO → RECOMMENDATION → DECISION → ACTION → OUTCOME → LEARNING → REFORECAST.

Governance surrounds the lifecycle. AI accelerates the lifecycle. Humans remain accountable for material financial decisions. Excel remains interoperable with the lifecycle rather than being displaced by it.

See `PRD.md` for full product scope, `docs/CANONICAL-FINANCIAL-MODEL.md` for the data model, `docs/EXCEL-INTEROPERABILITY.md` for the Excel adapter architecture, `docs/E2E-ACCEPTANCE.md` for the acceptance test, and `docs/TRACEABILITY-MATRIX.md` for pain-point-to-evidence traceability. These five documents are load-bearing — do not implement a capability that isn't traceable to at least one of them.

---

## 2. Non-Negotiable Architectural Rules

- **Excel is an adapter, not the data model.** All spreadsheet-specific logic (parsing, profiling, alias resolution, formula classification) lives in an isolated integration boundary (`src/integrations/spreadsheets/` or repo equivalent) and never leaks into the canonical financial domain.
- **Never execute VBA, macros, or arbitrary embedded workbook code.** Extract data only. Uploaded workbooks are untrusted input.
- **Never silently overwrite approved financial information.** Every import, override, or reconciliation event must show previous value, new value, source, and require explicit user action (accept/reject/investigate) before commit.
- **AI never silently changes a financial mapping, forecast, or approved plan.** AI proposes; a human or an explicitly authorized workflow approves. Every AI-influenced financial change must be attributable, evidenced, and reversible.
- **Every material metric must be traceable to source** — workbook/system, transformation, mapping rule, and timestamp — using scalable lineage references, not a row-per-cell audit table for large datasets.
- **Multi-tenant isolation is enforced server-side**, never trusted from the client. Every query and mutation must be scoped to tenant context derived from the authenticated session, not from client-supplied parameters.
- **RBAC is enforced server-side.** UI-level hiding of controls is not authorization.
- **Agents cannot unilaterally alter approved financial data.** Agent architecture is OBSERVE → ANALYZE → RECOMMEND → REQUEST APPROVAL → HUMAN DECISION → AUTHORIZED ACTION → OUTCOME. Persist agent runs and the evidence behind every recommendation.
- **A page existing is not a feature existing.** See Definition of Done (§6) before marking anything complete.

---

## 3. Implementation Approach — Do Not Skip This Order

1. **Inspect the repository before writing any code.** Determine actual architecture, framework, database, auth mechanism, existing domain models, routes, APIs, components, tests, CI/CD, deployment, environment variables, and technical debt. Do not assume a stack.
2. Produce `docs/CURRENT-STATE-AUDIT.md` — what actually exists, evidenced by file paths and code, not assumption.
3. Produce `docs/GAP-MATRIX.md` — classify every Planora capability as COMPLETE / PARTIAL / MISSING / BLOCKED against what was found in step 2.
4. Produce or update `docs/TARGET-ARCHITECTURE.md` and `docs/DOMAIN-MODEL.md`.
5. Produce `docs/IMPLEMENTATION-PLAN.md` with vertical-slice iterations (see suggested sequencing in `PRD.md`).
6. Select the highest-leverage first vertical slice. The recommended first proof chain is: **Excel → Mapping → Validation → Reconciliation → Canonical Financial Model → Command Center → Variance → Scenario → Decision → Action → Outcome.**
7. Implement in vertical slices, not horizontal scaffolding. A slice is not done until it satisfies §6.
8. Do not unnecessarily rewrite stable existing functionality discovered in step 1.

Do not generate pages, components, or scaffolding before completing steps 1–5. If asked to "just start building," complete the audit and gap matrix first and say so.

---

## 4. Pain-Point Discipline

Every capability must map to an identifiable FP&A pain point. Before implementing anything, be able to answer:

1. Which FP&A pain point does this solve?
2. Can the resulting number be traced to trusted evidence?
3. Can Planora explain why it changed?
4. Can the user model what happens next?
5. Can management make a governed decision from it?
6. Can actions be assigned from it?
7. Can Planora measure whether the decision worked?
8. Can the result flow into the next forecast?
9. Can existing Excel environments participate without being rebuilt?

If you cannot answer these for a proposed feature, do not build it — flag it in `docs/DECISIONS.md` instead and ask.

Full pain-point → capability mapping lives in `docs/PAIN-POINT-MATRIX.md`; keep it in sync with what's actually implemented.

---

## 5. Coding Standards

- Match the language, framework, and idioms already present in the repository. Do not introduce a second framework, ORM, or state-management pattern without an explicit decision recorded in `docs/DECISIONS.md`.
- Domain logic (financial calculations, variance decomposition, scenario recalculation, reconciliation) must be pure, testable, and independent of transport/UI layers.
- All monetary values carry currency and precision explicitly — never implicit floats for financial totals where the stack offers a decimal/fixed-point type.
- All financial calculations require unit tests with known-good expected outputs before being wired into UI.
- No dead buttons. No mocked behavior presented as production capability. If a control isn't wired end-to-end, either wire it or don't ship it, and note it in `docs/KNOWN-GAPS.md`.
- Every workflow-driving state change (plan submission, forecast override, mapping approval, decision approval, agent recommendation approval) produces an immutable audit record per §29 of the PRD.

---

## 6. Definition of Done

A feature is complete only when **all** of the following are true:

- UI implemented
- Domain model implemented
- Persistence implemented
- API / server operation implemented
- Input validation implemented
- Authorization (server-side) implemented
- Tenant isolation verified
- Auditability implemented where the action is material
- Loading, empty, and error states implemented
- Responsive behavior verified at the breakpoints in §9
- Unit and/or integration tests written and passing
- E2E workflow evidence exists (not just component-level tests)

For any Excel-touching feature, additionally require: mapping, validation, schema-drift handling, reconciliation, versioning, lineage, auditability, and round-trip behavior where applicable.

Never classify PARTIAL functionality as COMPLETE in any status report, commit message, or PR description.

---

## 7. Delivery Reporting Format

For every implementation batch, report using this structure:

```
STATUS
  Branch / Commit / PR / Deployment

DELIVERED
  Exact functionality delivered this batch.

CERTIFICATION
  Lint / Typecheck / Build / Unit / Integration / E2E / Responsive / Security — pass/fail for each run.

EVIDENCE
  Routes, migrations, APIs, screens, authorization checks, financial calculations, Excel reconciliation results.

REMAINING
  Known gaps, technical debt introduced, blocked dependencies, incomplete workflows.

CLASSIFICATION
  COMPLETE | PARTIAL | BLOCKED | NOT STARTED
```

Do not merge or promote to production without explicit authorization from the user, regardless of certification status.

---

## 8. Required Documentation Set

Maintain these files as living documents, updated as implementation progresses — not written once and abandoned:

`README.md`, `docs/PAIN-POINT-MATRIX.md`, `docs/CURRENT-STATE-AUDIT.md`, `docs/GAP-MATRIX.md`, `docs/TARGET-ARCHITECTURE.md`, `docs/E2E-WORKFLOW.md`, `docs/DOMAIN-MODEL.md`, `docs/CANONICAL-FINANCIAL-MODEL.md`, `docs/EXCEL-INTEROPERABILITY.md`, `docs/EXCEL-MAPPING-SPEC.md`, `docs/DATA-GOVERNANCE.md`, `docs/SECURITY-RBAC.md`, `docs/AI-AGENT-ARCHITECTURE.md`, `docs/DECISION-INTELLIGENCE.md`, `docs/IMPLEMENTATION-PLAN.md`, `docs/TEST-STRATEGY.md`, `docs/E2E-ACCEPTANCE.md`, `docs/DEPLOYMENT.md`, `docs/OPERATIONS.md`, `docs/KNOWN-GAPS.md`, `docs/DECISIONS.md`, `docs/CHANGELOG.md`, `docs/IMPLEMENTATION-STATUS.md`, `docs/TRACEABILITY-MATRIX.md`, `AGENTS.md`, `PRD.md`, `BRD.md`.

If a required doc doesn't exist yet, create it before or during the iteration that first needs it — don't backfill documentation after the fact from memory.

---

## 9. Certification Requirements

Before any batch can be classified COMPLETE, run and report:

Lint, typecheck, build, unit tests, integration tests, financial-calculation tests, RBAC tests, tenant-isolation tests, import/reconciliation tests, Excel-mapping tests, workflow tests, E2E browser tests, responsive tests (375px, 430px, 768px, 1024px, 1440px), security tests.

The critical browser journey that must pass before Planora is classified E2E complete:

```
LOGIN → COMMAND CENTER → EXCEL IMPORT → MAPPING → RECONCILIATION →
FORECAST → VARIANCE → ROOT CAUSE → SCENARIO → RECOMMENDATION →
DECISION → ACTION → OUTCOME → EXPORT
```

Full detail in `docs/E2E-ACCEPTANCE.md`.

---

## 10. Delivery Artifacts (Final Package)

At completion of a delivery milestone, ensure the repository root contains: `CLAUDE.md`, `AGENTS.md`, `README.md`, `package.json`, `PRD.md`, `BRD.md`, `.env.example`, `.gitignore`, `docs/`, `src/`, `tests/`, `database/`, `public/`, `evidence/`.

`package.json` scripts must be real and match the actual framework — no placeholder scripts. At minimum: `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:unit`, `test:integration`, `test:e2e`, `test:financial`, `test:security`, `test:excel`, `db:migrate`, `db:seed`, `certify`.

Do not generate `planora-e2e.zip` until lint, typecheck, build, tests, and E2E certification have all run and are reported. The zip excludes `node_modules/`, `.next/` (or framework build output), `dist/`, `coverage/`, `playwright-report/`, `.env`, `.env.local`, `.git/`, and includes source, docs, migrations, tests, public assets, `.env.example`, `package.json`, lockfile, and the four contract docs (`CLAUDE.md`, `AGENTS.md`, `PRD.md`, `BRD.md`). Include `docs/IMPLEMENTATION-STATUS.md` and `docs/TRACEABILITY-MATRIX.md` inside the zip.

---

## 11. When Uncertain

If a repository convention conflicts with a rule in this file, prefer the repository convention for style/tooling but never for the non-negotiables in §2. If the correct behavior for an ambiguous case isn't covered here or in the linked docs, stop and ask rather than guessing — record the question and the eventual answer in `docs/DECISIONS.md`.

Do not claim E2E completion without executable evidence. If the acceptance chain in `docs/E2E-ACCEPTANCE.md` breaks somewhere, say exactly where it breaks and continue implementation from that point — do not round up to "done."

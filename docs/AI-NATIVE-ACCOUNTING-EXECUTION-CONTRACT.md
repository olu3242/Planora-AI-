# Planora AI-Native Accounting Execution Contract
Date: 2026-10-09
State: TARGET ARCHITECTURE / IMPLEMENTATION AND CERTIFICATION REQUIRED

## Product mandate
Planora is a single AI-native accounting and FP&A application. AI agents are first-class workflow participants, not a chatbot overlay. Existing ledger, forecast, reporting, and governance services must be reused and harmonized before creating duplicates. "100% AI-native" describes the intended product architecture, not a claim that all functions are currently complete or certified.

## Separation of authority
- Deterministic accounting code and database constraints alone establish posted financial truth.
- Agents may classify, explain, propose, detect exceptions, recommend matches, draft journals, prepare reconciliations, and assemble close/reporting packages.
- Agents may not directly bypass authenticated service commands, change immutable posted records, grant their own permissions, silently override standards, or authorize their own material financial actions.
- Human-in-the-loop approval is required wherever the organization's governed policy demands it. Separation of duties must be enforced server-side.
- Every recommendation and action must carry tenant/entity/period scope, source lineage, agent identity/version, confidence or rationale where applicable, policy decision, actor, timestamp, and audit correlation.

## Canonical end-to-end workflow
1. Capture source evidence (bank transaction, invoice, receipt, expense, payroll, import) with provenance and tenant scope.
2. Agent proposes classification, account/dimension mapping, duplicates and exceptions.
3. Deterministic validator checks schema, chart of accounts, entity, currency minor units, tax treatment, period status, and debit/credit balance.
4. Policy engine routes exceptions and required approvals to authorized humans; no self-approval.
5. Authenticated posting command commits one idempotent journal and immutable audit evidence in one transaction.
6. Reconciliation engine checks subledgers, bank evidence, and trial balance; exceptions are visible and assigned.
7. Close agent prepares readiness evidence; controlled close command locks the period.
8. Actuals synchronization projects only authorized, reconciled, posted, appropriately closed journal data to canonical FP&A facts with stable lineage and idempotent upsert; detects stale facts.
9. Forecast agent uses actuals and governed assumptions to propose scenarios; human decisions are persisted.
10. Reporting agent generates framework-specific statements and management explanations from the same certified ledger and FP&A data, with policy version and source evidence.

## Agent contracts
| Agent | Proposes / assists | Must not independently do |
| --- | --- | --- |
| Intake & Bookkeeping | Extract, categorize, map and draft journals | Post outside approved policy |
| AP | Match invoice, purchase order, receipt; flag exceptions | Pay suppliers or approve its own invoice |
| AR | Draft invoices, matching and collection recommendations | Misapply receipts or silently write off balances |
| Reconciliation | Suggest bank and subledger matches | Fabricate evidence or suppress exceptions |
| Close | Assemble close checklist and variance exceptions | Bypass period locks or SoD |
| Reporting & Standards | Select governed format, draft statements, explain variances | Claim IFRS/GAAP/IPSAS compliance without validated policy |
| FP&A | Forecast, scenario, variance and recommendations | Modify posted ledger actuals |
| Controls & Audit | Detect anomalies and report policy breaches | Grant permissions or delete audit history |

## Sector/framework configuration
- Organization sector: PRIVATE, PUBLIC, NONPROFIT, with jurisdiction and effective-dated reporting framework selection.
- Examples: IFRS, US GAAP, IPSAS, GASB, and jurisdiction-specific nonprofit rules, only where applicable and actually implemented.
- Strict enforcement requires versioned chart mappings, recognition/presentation rules, required statements/disclosures, approvals, validation and rejection tests. A selector or template alone is not standards compliance.
- Unsupported jurisdiction/framework combinations fail closed or clearly declare a limited/noncompliant preview.

## Acceptance gates
A capability is COMPLETE only if:
1. Reuses or deliberately replaces canonical code with documented migration and no silent duplication.
2. Has a working UI/API -> authorization -> domain policy -> persistence -> audit chain.
3. Has positive, negative, cross-tenant, role, replay, and exception tests as appropriate.
4. Uses disposable PostgreSQL to prove transactionality, posting/reversal, immutability, concurrency and close rules.
5. Reconciles ledger -> trial balance -> statements -> FP&A actuals -> variance/reporting at exact precision.
6. Has agent proposal, human decision, audit evidence, safe retry, and failure isolation where applicable.
7. Has current exact-SHA typecheck, lint, unit/integration, build, browser E2E and deployment evidence before release.
8. Does not claim production readiness without hosted security, recovery, monitoring and real-data controls.

## Workstream synchronization
S01–S02 inventory: documented in PROJECT-SYNCHRONIZATION-BASELINE.md.
S03: reconcile schema/migrations/branch deltas.
S04: trace API/UI to services and persistent policies.
S05: certify ledger-to-FP&A reconciled lineage and stale-fact handling.
S06: certify agent orchestration and human approval.
S07: certify sector/framework rules.
S08: run exact-SHA quality and database gates.
S09: remediate evidence-backed gaps without duplicating features.
S10: certify complete E2E journeys.

## Current release state
HOLD / NOT CERTIFIED for expanded AI-native accounting. No merge, hosted migration, financial posting, production deploy, or real customer data processing authorized by this contract.

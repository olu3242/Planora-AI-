# Suspense Account Tooling

## Purpose
Suspense is a governed temporary classification for transactions that cannot yet be posted to their final account. It is not a write-off, balancing shortcut, or permanent account.

## Process map
Source transaction
→ **CAPTURED** — preserve source evidence and amount
→ **IDENTIFIED** — assign deterministic suspense identifier
→ **CLASSIFIED** — record reason/category and suspense account
→ **ASSIGNED** — establish accountable owner and due date
→ **INVESTIGATING** — collect evidence; no silent mutation
→ **PROPOSED** — prepare final-account clearing journal
→ **APPROVED** — independent human approval where required
→ **CLEARED** — post governed clearing journal and retain lineage

A rejected proposal returns through a new investigation/proposal cycle; posted journals are never overwritten.

## Identifier
Canonical form:

`SUS:<ORG>:<ENTITY>:<PERIOD>:<SOURCE_TYPE>:<SOURCE_ID>`

Identifiers are deterministic from tenant, legal entity, fiscal period, source type, and immutable source identifier. They must be unique within the organization and carried into audit evidence, journal source keys, reconciliation evidence, and clearing lineage.

## Required case data
- suspense identifier
- organization, legal entity, fiscal period, currency
- source type and immutable source ID
- source date/reference
- amount in exact minor units
- suspense GL account
- reason code and narrative
- process stage
- owner and due date
- proposed final account
- approval evidence
- originating and clearing journal IDs
- created/updated/cleared timestamps

## Control rules
1. Suspense accounts must be explicitly configured; the system must never choose one merely to force debit=credit.
2. A case cannot clear without a balanced governed journal.
3. Clearing cannot mutate the originating posted journal.
4. Tenant/entity/currency/period/account validity are server-side controls.
5. Closed-period rules apply to clearing.
6. Requester/approver segregation applies to governed clearing.
7. Every transition is auditable.
8. Close Center blocks or explicitly escalates unresolved material suspense cases according to policy.
9. Aging is measured from capture date and exposed by owner/reason/age bucket.
10. Automated classification may propose; it may not silently clear financial suspense.

## E2E target
Bank/import/AP/AR/manual exception → suspense case → owner investigation → proposed classification → approval → clearing journal → reconciliation update → suspense aging/reporting → Close Center evidence → FP&A actuals lineage.

## Implementation status
Process map and deterministic identifier domain primitive: **IMPLEMENTED**.
Persistence model, APIs, configured suspense-account policy, workspace, clearing workflow, aging, Close Center integration, and certification: **PENDING**.

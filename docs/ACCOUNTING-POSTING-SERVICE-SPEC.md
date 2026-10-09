# Accounting posting service — implementation contract

Status: DESIGN ONLY. No database migration, posting endpoint, or production operation is authorized by this document.

## Preconditions
1. Derive actor and organization from the server session; require explicit accounting-post permission.
2. Validate legal entity belongs to the organization and fiscal period belongs to that entity's fiscal calendar.
3. Confirm every account belongs to the organization, is active on the posting date, and is postable.
4. Confirm one currency for all journal lines and a valid minor-unit precision policy.
5. Reject closed accounting periods and verify balanced debit/credit totals.
6. Require a tenant-scoped idempotency source key and immutable source provenance.

## Atomic transaction
Acquire a lock that serializes posting against period close; recheck period state while locked. Check source-key uniqueness and replay semantics. Insert journal header, lines, and audit event in one transaction. Commit only if all checks pass; otherwise roll back. Do not modify posted journals; corrections are new reversing journals with one-to-one reversal linkage. Never overwrite approved FinancialFact rows.

## Certification
Test cross-tenant and cross-entity rejection, inactive accounts, currency mismatches, duplicate retries, concurrent posting, close/post races, audit rollback, reversal-once semantics, and trial-balance reconciliation. Require a synthetic-data browser journey and existing Forecast MVP regression gates before enabling a posting API.

## Current blocker
The Prisma schema change has not been validated or migrated. No posting service should be presented as operational until migration, authorization, audit, and E2E evidence are available.

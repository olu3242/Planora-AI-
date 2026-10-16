# BC61–BC70: automation of bank reconciliation cleanup

| Batch | Implementation | Status |
|---|---|---|
| BC61 | Matched bank-to-ledger integrity probe | Committed |
| BC62 | Organization/entity/period journal verification | Committed |
| BC63 | Detect unmatched, draft, missing and foreign-scope links | Committed |
| BC64 | Read-only tenant-scoped scan service | Committed |
| BC65 | Deterministic idempotent case registration | Committed |
| BC66 | Existing case history preserved by no-op upsert | Committed |
| BC67 | Fail closed on truncated scans | Committed |
| BC68 | Five reconciliation probe unit tests | Written, unexecuted |
| BC69 | CI registration | Configured, unverified |
| BC70 | Production E2E and automatic scheduled operation | Pending / NO-GO |

## End-to-end automation design
1. Receive bank import or scheduled bank sync with an authenticated organization context.
2. Normalize and deduplicate by bank account/external transaction ID.
3. Execute scope-checked reconciliation scans with bounded result sets.
4. Create deterministic cases for unmatched and invalid journal links; never overwrite human reviews.
5. Investigate and propose corrections using existing AI mapping and evidence services.
6. Route material corrections to the controller for approval; enforce segregation of duties.
7. Execute through trusted posting/reconciliation services, never through the scan endpoint.
8. Independently verify actual ledger and bank results.
9. Recalculate Financial Readiness and surface unresolved exceptions.
10. Retain immutable audit history, retry with idempotency, and monitor stuck cases.

The scan is a server-only advisory function and is NOT wired to a scheduler, API, or bank webhook. Its separate registration transactions do not guarantee atomic all-or-nothing synchronization; partial failures require idempotent retries. It does not close resolved cases automatically because absence from a partial scan is not sufficient evidence. Validate Prisma generation, typecheck, RLS, migration, runtime API and E2E before production. NO-GO.

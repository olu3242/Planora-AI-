# Planora G11–G20 accounting integrity execution
Date: 2026-10-15
Status: PARTIAL / NO-GO

| Batch | Scope | Evidence |
|---|---|---|
| G11 | Inspect existing Prisma accounting posting model | Done: AccountingJournal, AccountingJournalLine, AccountingPostingApproval, FiscalPeriod inspected |
| G12 | Confirm journal uniqueness/idempotency schema | Observed @@unique([organizationId,sourceKey]); not runtime tested |
| G13 | Confirm approval schema fields | Observed decision, preparedById, decidedById, expiresAt, consumedAt |
| G14 | Confirm period state | Observed OPEN/SOFT_CLOSED/HARD_CLOSED |
| G15 | Implement scoped posting approval precondition | Committed pure guard |
| G16 | Implement maker-checker rejection | Committed pure guard |
| G17 | Implement expired/consumed approval rejection | Committed pure guard |
| G18 | Add unit tests | Eleven cases committed; not executed |
| G19 | Integrate guard into canonical posting service | Pending service-level audit and transactional wiring |
| G20 | Certify security, posting, and E2E | NO-GO |

## Architectural boundaries
The pure guard is a precondition only. It does not validate actor authorization, row-level security, account eligibility, source evidence, journal balance, currency, or transactional concurrency. These checks must be performed in the canonical posting service and PostgreSQL transaction, with consumedAt and journal posting committed atomically. It must not be wired to an alternate posting endpoint.

## Next execution gates
1. Identify existing canonical posting command and tenant transaction wrapper; preserve implementation.
2. Run unit tests and exact-SHA typecheck.
3. Wire guards inside transaction after authenticated tenant and actor authorization.
4. Add concurrent replay, cross-tenant, rollback, self-approval, period-lock, and immutable-audit PostgreSQL tests.
5. Run full certification before merge or deployment.

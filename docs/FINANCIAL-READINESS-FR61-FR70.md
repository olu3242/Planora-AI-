# Planora Financial Readiness FR61–FR70: verification hardening

| Batch | Objective | Outcome |
|---|---|---|
| FR61 | Isolate journal diagnostics | Committed |
| FR62 | Validate posted journal balance | Committed |
| FR63 | Detect invalid journal line sides | Committed |
| FR64 | Detect missing posted timestamps | Committed |
| FR65 | Preserve UNKNOWN for unverified clean journals | Committed |
| FR66 | Isolate bank diagnostics | Committed |
| FR67 | Detect unmatched bank transactions | Committed |
| FR68 | Detect broken matched-journal links | Committed |
| FR69 | Add eight regression test cases | Written, not run |
| FR70 | Execute Prisma/PostgreSQL/browser certification | Not executed; NO-GO |

## Certification requirements
Run:
```sh
npx prisma validate
npx prisma generate
npm run typecheck
npx vitest run tests/unit/financial-readiness*.test.ts
```
Then apply migrations to disposable PostgreSQL, verify runtime-role RLS across tenants, test the authenticated preflight endpoint and readiness page, and run full accounting regression. Check `FinancialReadinessAssessment.legalEntityId` FK and `periodId` relation against actual legal entity and fiscal period models before migration. Do not treat test source code as executed evidence.

## Known security and accounting limitations
- Current live preflight is deliberately uncertified and cannot produce PASS from raw record presence.
- RLS policies require a non-BYPASSRLS runtime role and proper grants; tenant GUC alone is insufficient authorization.
- Current preflight period lookup is global; validate legal entity/period association before certification.
- Snapshot uniqueness is not yet idempotent response handling.
- Source-revision freshness, control-version governance, and live close/FP&A certification are pending.

Decision: PARTIAL / NO-GO. No hosted changes.

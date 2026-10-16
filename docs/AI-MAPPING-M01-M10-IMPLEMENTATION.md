# Planora AI Mapping Engine — M01–M10 implementation register

Branch: `feat/ai-mapping-engine-m01-m10-20261016`

## Scope and progress
| Batch | Scope | State |
| --- | --- | --- |
| M01 | Normalized input with tenant, evidence, currency, minor-unit amounts | Implemented (proposal boundary) |
| M02 | Tenant-scoped active account eligibility | Implemented (injected candidates) |
| M03 | Structured AI proposals and response validation | Implemented (injected provider interface) |
| M04 | Sector/framework policy selection and effective dates | Implemented (existing accounting controls) |
| M05 | Confidence routing, fail-closed exceptions | Implemented (uncalibrated thresholds) |
| M06 | Agent-type mapping | Implemented (deterministic assignment) |
| M07 | Durable orchestrated work queue and approvals | Pending |
| M08 | Account-to-statement mapping | Pending |
| M09 | Correction feedback, model evaluation and versioned decisions | Pending |
| M10 | PostgreSQL, security, E2E and hosted certification | Pending |

## Safety contract
The mapper is a pure proposal boundary: it cannot mutate journals, authorize posting, or approve close.
The caller must obtain eligible accounts from the authenticated tenant, not client-provided data.
Never treat AUTO_PREPARE as permission to post. Persist decisions and source evidence in a transaction,
deduplicate with a database unique key, and revalidate eligibility, permissions, and period locks
at every governed posting boundary. The model must not receive credentials or unrestricted tenant data.

## Next certification gates
1. Run `npx vitest run tests/unit/ai-mapping-engine.test.ts` and `npm run typecheck`.
2. Resolve any type or test failures and attach raw outputs.
3. Implement Prisma decision, evidence and correction tables with tenant-scoped authorization and uniqueness.
4. Connect trusted account lookup, provider adapter, and orchestration queue; verify negative authorization tests.
5. Add accounting-policy scenarios for revenue recognition, capitalization, prepaid expense and tax mapping.
6. Verify integration with `assertPostingGate` and enforce agent posting prohibition.
7. Run database-backed E2E, tenant-isolation, concurrency, replay and recovery tests.
8. Do not merge or deploy until the existing accounting certification suite is green.

Status: PARTIAL / NO-GO. No test execution or hosted certification is claimed.

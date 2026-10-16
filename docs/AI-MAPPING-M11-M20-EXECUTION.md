# AI Mapping Execution Wave 2 — M11–M20

This wave extends the earlier M01–M10 pure proposal boundary. It is NOT an end-to-end certified release.

| Batch | Objective | Evidence / State |
|---|---|---|
| M11 | Human mapping review contract | `ai-mapping-review.ts` committed |
| M12 | Tenant-scoped reviewer authorization | Review guard committed; authentication adapter pending |
| M13 | Exception and validation work-item routing | `ai-mapping-routing.ts` committed |
| M14 | Accounting agent ownership | Routing based on agent type; operational queue pending |
| M15 | Statement classification proposal | `ai-mapping-reporting.ts` committed |
| M16 | Fail closed on unmapped reporting lines | Pure validation implemented |
| M17 | Persistence abstraction | `ai-mapping-repository.ts` committed; Prisma adapter pending |
| M18 | Review audit and replay design | Review contract implemented; durable evidence pending |
| M19 | Unit regression coverage | 11 additional tests written; not executed |
| M20 | E2E certification | BLOCKED pending DB migration, integration and executed tests |

## Implementation requirements for next wave
- Use distinct Prisma model names such as `AiTransactionMappingProposal` and `AiTransactionMappingReview`; `MappingDecision` already exists for workbook imports.
- Add tenant and source idempotency uniqueness constraints, immutable decision history, and authenticated tenant-bound read/write services.
- Treat `AUTO_PREPARE` as a queue state only. Never invoke ledger posting or close approval from the AI mapper.
- Verify account ownership from database queries; do not trust candidates or `authenticatedTenantId` from HTTP request bodies.
- Validate journal posting through the existing `assertPostingGate` authorization boundary.
- Add transaction-backed concurrency, replay, tenant isolation, approval, evidence and reporting E2E tests.
- Run `npx vitest run tests/unit/ai-mapping-engine.test.ts tests/unit/ai-mapping-workflow.test.ts`, `npm run typecheck`, `npx prisma validate`, and the full accounting certification pipeline.
- Stop on any failure. Do not merge, deploy, or mark production GO until all gates pass.

## Certification decision
PARTIAL / NO-GO. Files are committed to a feature branch, but no test, migration, hosted, or deployment success is claimed.

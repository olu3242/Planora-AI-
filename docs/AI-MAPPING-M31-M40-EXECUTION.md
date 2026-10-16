# AI Mapping M31–M40: authenticated integration and certification register

The current branch contains application-service logic, but **no authenticated HTTP routes have been wired**. The application accepts a principal object; the HTTP adapter must derive it from a verified session and current organization membership.

| Batch | Scope | Actual status |
|---|---|---|
| M31 | Authenticated principal contract | Committed; session adapter pending |
| M32 | Tenant-bound enqueue | Application check committed; persisted proposal must be recomputed server-side |
| M33 | Persona queue filtering | Committed application logic; DB access pending |
| M34 | Review permission gate | Committed; DB enforcement pending |
| M35 | Trusted proposal lookup | Injected dependency; implementation pending |
| M36 | Active tenant account lookup | Injected dependency; implementation pending |
| M37 | Review replay prevention | Contract present; transaction-level race verification pending |
| M38 | Approval evidence boundary | Committed; no journal posting |
| M39 | Unit regression coverage | Six tests written; not executed |
| M40 | End-to-end certification | BLOCKED / NO-GO |

## Required integration work
- Wire verified user session and organization membership from Planora's existing authentication stack; never accept a principal from the request body.
- The enqueue method currently accepts a caller-supplied MappingDecision; production endpoints must derive proposals from trusted normalized transactions and tenant-filtered account candidates.
- Implement tenant-scoped Prisma proposal/account/review readers and use a DB transaction for review eligibility, insertion and work-item transition.
- The migration currently uses FORCE RLS with no tenant policies: this is intentional default-deny, and live access will fail until secure role/session policies are established.
- Validate RLS with a non-owner, non-BYPASSRLS runtime role. Ensure tenant context is set transaction-locally, not globally on pooled connections.
- Verify that policy and accounting framework validation remains effective at posting time.
- Execute: `npx prisma validate`, `npx prisma generate`, `npm run typecheck`, `npx vitest run tests/unit/ai-mapping-*.test.ts`, integration/security/E2E tests and migration replay.
- Do not merge or deploy until raw certification evidence is available.

Decision: PARTIAL / NO-GO.

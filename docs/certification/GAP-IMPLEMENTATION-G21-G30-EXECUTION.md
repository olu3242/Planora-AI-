# Planora gap implementation G21–G30
Date: 2026-10-15
Status: PARTIAL / NO-GO

| Batch | Scope | Result |
|---|---|---|
| G21 | Locate canonical posting command | Done: src/lib/accounting/verified-posting-command.ts |
| G22 | Inspect transaction adapter | Done: src/lib/accounting/prisma-posting-adapter.ts |
| G23 | Inspect persisted approval checks | Done: src/lib/accounting/persisted-approval.ts and approval-policy.ts |
| G24 | Inspect canonical line validation | Done: src/lib/accounting/ai-native-controls.ts |
| G25 | Harden runtime account identifier validation | Code committed |
| G26 | Reject non-bigint monetary amounts | Code committed |
| G27 | Add malformed amount regression tests | Five test cases committed; not executed |
| G28 | Integrate new proposal/approval guards | Not performed; existing canonical controls already cover balance, SoD, expiry and scope; avoid duplicate posting paths |
| G29 | Validate tenant RLS and posting transaction in PostgreSQL | Pending |
| G30 | Exact SHA integrated certification | NO-GO |

## Findings
The existing verified posting command resolves the trusted session and role. Its Prisma adapter already uses a serializable transaction for account/period checks, idempotency, approval consumption, journal posting and audit. The existing approval policy rejects self-approval and expired/consumed approvals. These are inspected source properties, NOT database-certified outcomes.

A concrete gap was identified in the canonical line validator: untrusted runtime inputs with non-bigint monetary amounts could bypass intended integer type guarantees. This pass adds fail-closed runtime type checks and regression fixtures directly to the canonical validator.

## Required gates
Run npm ci, npm run typecheck, targeted Vitest, isolated PostgreSQL replay/concurrency/rollback and RLS tests, and full npm run certify on the exact SHA. Confirm no duplicate accounting paths are exposed. Do not merge or deploy until all P0 controls pass.

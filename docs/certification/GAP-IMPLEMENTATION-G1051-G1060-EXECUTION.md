# G1051-G1060 — Persist execution retry metadata

Date: 2026-10-18. Release decision: **NO-GO / NOT CERTIFIED**.

| Batch | Execution | Result |
|---|---|---|
| G1051 | Inspect prior head f23604a | Confirmed |
| G1052 | Inspect Merge Conflict Preflight | PASS on prior head |
| G1053 | Inspect CI | In progress on prior head |
| G1054 | Inspect Accounting Integrity | In progress on prior head |
| G1055 | Inspect Dependency Remediation Candidate | In progress on prior head |
| G1056 | Review runtime retry record and Prisma model | Missing attempts/errorClass |
| G1057 | Add Prisma retry attempt and error class columns | Committed |
| G1058 | Add additive PostgreSQL migration and nonnegative attempts constraint | Committed |
| G1059 | Round-trip retry metadata in PostgreSQL execution store | Committed |
| G1060 | Add metadata adapter regression test | Committed; CI pending |

Schema change: `WorkflowExecutionRecord.attempts Int @default(0)`, `errorClass String?`. Migration `20261018160000_workflow_execution_retry_metadata` adds both columns and nonnegative check. `PostgresRuntimeExecutionStore` reads and writes both fields. The new unit test uses a mocked Prisma client; real PostgreSQL migration, concurrent claims, worker restart and safe retry behavior remain unverified. Existing upsert and unconditional store paths are not safe for exactly-once financial effects. Security remediation candidate and full CI remain open release gates. No production migration, merge or deployment.

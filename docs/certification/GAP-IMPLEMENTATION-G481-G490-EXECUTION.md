# G481–G490 — Deterministic tenant RLS generator parity

Date: 2026-10-17. Decision: **NO-GO / NOT CERTIFIED**.

| Batch | Workstream | Result |
|---|---|---|
| G481 | Inspect G471–G480 exact-SHA CI | In progress at inspection |
| G482 | Inspect Accounting Integrity | In progress at inspection |
| G483 | Inspect Merge Conflict Preflight | PASS |
| G484 | Inspect independent security audit | Failed on inspected run |
| G485 | Inspect canonical tenant RLS migration and generator | Function and 56 table policies present |
| G486 | Create temporary-directory generator parity checker | Implemented |
| G487 | Compare generated migration SQL SHA-256 to committed SQL | Implemented |
| G488 | Compare generated tenant RLS manifest SHA-256 | Implemented |
| G489 | Add mandatory test:rls-generator to canonical certify | Implemented |
| G490 | Execute Docker E2E and migration reproduction | Pending; Docker unavailable in this environment |

The generator parity check runs before Prisma generation/reset and never modifies historical migration SQL. If schema or generator changes require new policy SQL, investigate and author a forward-only migration rather than rewriting an already applied migration. This source-level implementation is not evidence that CI, RLS, browser E2E, or the dependency audit passed. No production migration, merge or deployment.

# CleanBooks integration certification checkpoint

Status: **NO-GO**. This document records source review, not executed tests.

## Verified source blockers
- `package.json` contains unresolved merge conflict markers; dependency and script selection cannot be trusted.
- `prisma/schema.prisma` contains unresolved merge conflict markers; Prisma generation and migrations are not certified.
- No authenticated CleanBooks UI/API entrypoint or hosted evidence is established by this branch.
- Existing bank scan uses a 500-row per-account retrieval cap and reports coverage as incomplete at the cap; it does not paginate all rows.
- The bank scan checks active organization membership but does not establish controller-level permissions; do not expose it to an unauthenticated endpoint.
- The policy helper currently receives a hardcoded enabled flag; a persisted operator kill switch is **not implemented**.
- B3-B8 and B11-B49 are predominantly pure modules; production integration and persistence remain incomplete.
- Unit tests have been committed but have **not** been run in this execution environment.

## Required ordered gates
1. Reconcile package.json and Prisma schema against a known-good accounting branch, preserving existing GL, AP/AR, banking and FP&A models.
2. Install dependencies; run Prisma validate/generate and TypeScript typecheck.
3. Run CleanBooks unit suites and fix any failures.
4. Implement authenticated controller authorization and a real operational kill switch.
5. Add complete cursor-based bank transaction pagination and bounded scan resource controls.
6. Wire scoped accounting data into B3-B8 with immutable evidence and no auto-posting.
7. Implement authenticated dashboard, reviewer workflow and audited approval persistence.
8. Run isolated PostgreSQL integration, tenant-isolation, approval and locked-period tests.
9. Run Playwright browser E2E and accessibility tests.
10. Run hosted certification and release gates; merge/deploy only on independently verified GO.

## Safety invariant
CleanBooks recommendations do not themselves create, approve, modify, delete, or post financial records. No GO claim is permitted without execution evidence.

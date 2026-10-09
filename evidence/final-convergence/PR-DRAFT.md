# Draft PR: Consolidate Planora functionality into the canonical integration branch

Base: `main`
Head: `integration/planora-unified-20261009`

**BLOCKED — do not merge. This is a local PR draft, not an opened pull request.**

Convergence preserves the canonical financial model, persisted accounting approvals, tenant authorization, and human approval controls. Current local changes stop workflow dispatch when human approval is pending, render authenticated pages dynamically, and generate Prisma before build/typecheck while retaining strict environment validation.

See [the reconciliation and certification report](REPORT.md) for branch coverage, source-level dispositions, evidence, and blockers. Global reporting capability reconciliation is incomplete.

Validation: 162 unit, 8 financial, and 6 Excel tests passed. Lint and typecheck passed (one lint warning). Security certification is blocked by the unavailable isolated PostgreSQL database: 7 connection failures, 3 passes. Integration, build, performance, browser E2E, and responsive gates have not run. No certification claim applies to a newly committed SHA.

Recovery stashes remain untouched. No hosted migrations, production deployment, branch deletion, force-push, or merge into main was performed. Finish reconciliation and certification before committing, pushing, or opening this PR as review-ready.

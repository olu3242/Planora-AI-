# B5 dependency audit root-cause evidence

Source: GitHub Actions run 39872779927, job 120150980220, commit `9a02384a816670841327ebd733632f00f228eba3`.

## Confirmed chain
`eslint-config-next` -> `@next/eslint-plugin-next` -> `fast-glob` -> `micromatch` -> `braces`.

The full `npm audit --audit-level=moderate` returned five high-severity findings associated with advisory GHSA-vfj7-8cjw-p6xm.

`npm audit fix --force` proposed downgrading to `eslint-config-next@14.2.35`, a breaking change. **Do not apply this downgrade.**

## Safe remediation procedure
1. Preserve Next.js, React, Prisma, and current lint rules while evaluating a security-clean replacement.
2. Reconcile a new manifest and lockfile together in an isolated worktree.
3. Run lint-rule parity and negative canaries against the replacement, including Next.js, accessibility, and React Hooks.
4. Execute a full dependency audit, `npm ci`, lint, typecheck, unit, integration, financial, security, performance, Playwright, and build.
5. Record CI URLs and artifact hashes; do not merge/deploy if any mandatory gate fails.

## Status
B5 **NO-GO** until the dependency graph and lint parity pass on the same commit.

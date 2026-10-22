# Planora B1-B10 release certification gate

Baseline: PR #9, commit `5c61042edef2720e0c82ccaf70c9981bcc74470e`.

This branch is isolated from main and PR #9. Do not merge or deploy without final evidence.

## B1-B4: lint parity and accessibility
- Inventory rules from `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript` using the actual installed versions.
- Compare every rule and severity with the proposed replacement. Do not treat a custom `no-img-element` rule as full Next.js parity.
- Repair existing accessibility findings in application code, not by weakening enforcement.
- Add failing canary fixtures for unsafe images, React Hooks and keyboard accessibility.

## B5-B6: dependency integration
- Validate `package.json` and `package-lock.json` and check for merge markers before installing.
- Integrate only a reviewed, security-clean replacement; regenerate lockfile atomically.
- Run `npm ci`, full `npm audit --audit-level=moderate`, lint, typecheck, and unit tests.
- Retain full audit output and explain any remaining findings; do not downgrade the audit gate.

## B7-B9: release certification
- Execute financial, Excel, security, performance, integration and Playwright suites with isolated test data.
- Reconcile PR conflicts against latest main; keep original changes reviewable.
- In approved staging only, validate auth, cross-tenant denial, accounting workflows, recovery, and audit exports. Never use production customer data.

## B10: decision record
Capture SHA, environment, exact commands, exit codes, CI URLs, failing tests, security findings, and hosted E2E evidence. GO requires every mandatory gate passing on the same final commit; otherwise NO-GO.

## Verified starting observations
- PR #9 is draft and was reported mergeable when checked.
- PR head has a valid manifest and still uses `eslint-config-next` presets.
- Candidate ESLint replacement passed in GitHub Actions, but is not integrated into the PR manifest.
- The default branch's `package.json` contained merge conflict markers when inspected.
- Accounting integrity, static public guard, lockfile reconciliation, and security candidate workflows succeeded at baseline; full CI and experience E2E were still in progress at inspection.

## Evidence checklist
| Batch | Status | Required evidence |
| --- | --- | --- |
| B1 | Pending | Rule inventory |
| B2 | Pending | Rule-by-rule parity diff |
| B3 | Pending | Accessibility fixes and test output |
| B4 | Pending | Negative canary tests |
| B5 | Pending | Audit, lint, typecheck, unit logs |
| B6 | Pending | Atomic manifest/lockfile commit |
| B7 | Pending | Full financial/security/E2E matrix |
| B8 | Pending | PR conflict and CI results |
| B9 | Pending | Staging deployment and hosted evidence |
| B10 | Pending | Signed-off GO/NO-GO record |

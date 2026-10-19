# G821-G830 — Remediation candidate workflow activation

Date: 2026-10-18. Release decision: **NO-GO / NOT CERTIFIED**.

| Batch | Execution | Result |
|---|---|---|
| G821 | Inspect head 831839ac | Confirmed |
| G822 | Inspect Merge Conflict Preflight | PASS |
| G823 | Inspect Accounting Integrity | In progress |
| G824 | Inspect full CI | In progress |
| G825 | Discover GitHub connector workflow dispatch support | No dispatch action exposed |
| G826 | Inspect manual-only candidate workflow | Confirmed |
| G827 | Add narrowly scoped push trigger on workflow file changes | Committed |
| G828 | Inspect commit-triggered workflows | CI, Accounting, Preflight surfaced; candidate not surfaced in PR-run lookup |
| G829 | Preserve candidate non-mutating validation and audit gate | Preserved |
| G830 | Obtain actual candidate artifact and apply validated lockfile | Pending |

The workflow can now trigger when its own file changes on the feature branch, in addition to manual dispatch. However, the connector's commit workflow lookup only returns pull-request runs; absence of a candidate run in that response is not proof it did not trigger. GitHub may require the workflow to exist on the default branch for workflow_dispatch. No candidate artifact or successful audit is yet verified. No dependency lockfile change, production migration, merge or deployment.

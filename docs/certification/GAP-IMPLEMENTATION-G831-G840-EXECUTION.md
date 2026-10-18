# G831-G840 — Preserve dependency remediation candidate before validation

Date: 2026-10-18. Release decision: **NO-GO / NOT CERTIFIED**.

| Batch | Execution | Result |
|---|---|---|
| G831 | Inspect head 9a405f2 | Confirmed |
| G832 | Inspect Merge Conflict Preflight | PASS |
| G833 | Inspect Accounting Integrity | PASS |
| G834 | Inspect CI 39099309083 | FAIL overall |
| G835 | Inspect certify job 117592119859 | PASS |
| G836 | Inspect security audit job 117592120132 | FAIL |
| G837 | Inspect CI audit and certification artifacts | Available |
| G838 | Inspect candidate workflow artifact preservation | Candidate captured after npm ci |
| G839 | Move candidate lockfile and diff capture before npm ci | Committed |
| G840 | Retrieve executed remediation candidate and apply validated lockfile | Pending |

The candidate workflow now preserves the npm-generated lockfile and patch before npm ci, so subsequent installation validation cannot accidentally overwrite the candidate evidence. No candidate workflow run was verified, no actual dependency remediation was committed, and the independent audit remains a release blocker. The commit-based workflow lookup exposed only pull-request runs; this cannot establish whether a push-triggered candidate ran. No production migration, merge or deployment.

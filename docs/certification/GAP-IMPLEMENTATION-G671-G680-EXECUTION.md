# G671–G680 — Tenant RLS regression transaction isolation

Date: 2026-10-17. Release: **NO-GO / NOT CERTIFIED**.

| Batch | Execution | Result |
|---|---|---|
| G671 | Inspect head 2748be7f Actions | CI in progress |
| G672 | Inspect Merge Conflict Preflight | PASS |
| G673 | Inspect Accounting Integrity | In progress |
| G674 | Inspect independent security audit | FAIL |
| G675 | Inspect preceding completed CI 39092864049 | FAIL: React ref lint issue already fixed in G661-G670 |
| G676 | Inspect RLS audit regression test | Expected permission error was inside successful audit transaction |
| G677 | Separate forbidden User query into its own tenant session transaction | Committed |
| G678 | Remove requirement for preseeded forecast version | Committed |
| G679 | Preserve organization-scoped audit read and forbidden User access assertions | Preserved |
| G680 | Complete exact-SHA RLS, browser, build and security certification | Pending |

This correction prevents the expected PostgreSQL permission-denied query from aborting the transaction that validates successful audit-history reads. The test uses an existing tenant-owned forecast version when available and a random UUID otherwise. It does not relax tenant isolation or grant access to User. No successful exact-SHA run has been verified for this change. Independent dependency audit remains a blocker. No production migration, merge or deployment.

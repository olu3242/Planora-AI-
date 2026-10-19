# G591-G600 — Browser error-boundary diagnosis and tenant runtime evidence

Date: 2026-10-17. Decision: **NO-GO / NOT CERTIFIED**.

| Batch | Action | Result |
|---|---|---|
| G591 | Inspect exact-SHA run 39088486222 | In progress at inspection |
| G592 | Inspect Accounting Integrity | In progress at inspection |
| G593 | Inspect Merge Conflict Preflight | PASS |
| G594 | Inspect previous CI run 39087689215 | FAIL, one browser E2E |
| G595 | Inspect previous browser test | Persisted agent recommendation exists, no recommendation headings rendered |
| G596 | Inspect PostgreSQL server log | permission denied for public.User observed in restricted role session |
| G597 | Inspect tenant runtime role provisioning | Explicitly revokes User and Session privileges |
| G598 | Inspect authentication and tenant page wrappers | Authentication uses bootstrap connection; tenant request uses restricted transaction |
| G599 | Extend E2E failure diagnostics with page heading and alerts | Committed |
| G600 | Confirm root cause and pass exact-SHA Docker certification | Pending |

The PostgreSQL User permission error is a concrete signal, but it has not yet been correlated to the failing agent redirect request. Do not grant restricted tenant role access to User or Session as a workaround. Use the new error-boundary evidence and request correlation to determine whether an authorization lookup is escaping its intended bootstrap connection. The independent security audit remains failing. No production migration, merge, or deployment.

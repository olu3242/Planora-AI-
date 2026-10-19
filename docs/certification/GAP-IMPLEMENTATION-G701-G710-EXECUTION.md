# G701-G710 — Forecast comment User join RLS repair

Date: 2026-10-17. Decision: **NO-GO / NOT CERTIFIED**.

| Batch | Evidence / action | Result |
|---|---|---|
| G701 | Inspect exact-SHA ca296fe CI | FAILED |
| G702 | Inspect Accounting Integrity | PASS |
| G703 | Inspect Merge Conflict Preflight | PASS |
| G704 | Inspect certify stages | Unit/integration passed; browser E2E 38 pass, 1 fail |
| G705 | Inspect independent audit | FAIL: five high vulnerabilities |
| G706 | Trace browser error to PostgreSQL 42501 | Confirmed forbidden User query |
| G707 | Identify source in getTenantForecastVersion | Comment author includes User relation |
| G708 | Remove nested and top-level comment author joins | Committed |
| G709 | Render non-identifying comment attribution | Committed |
| G710 | Verify exact-SHA browser/RLS/build and audit | Pending |

The browser failure was not merely a display-label mismatch. After feedback submission, the forecast page queried the protected User table through forecast comment author relations, causing PostgreSQL 42501 and preventing the accepted recommendation from rendering. Both comment-author joins are removed from the tenant repository. The page now shows 'Authenticated contributor' or 'System' rather than a user name. This preserves RLS restrictions and avoids broadening grants. The change has not passed a new exact-SHA CI run; no release certification is claimed. Independent dependency audit remains a blocker. No production migration, merge or deployment.

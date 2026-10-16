# AI Mapping M41–M50 — Authentication and access alignment

| Batch | Deliverable | State |
|---|---|---|
| M41 | Inspect Planora session and membership model | Verified from src/auth/session.ts |
| M42 | Inspect RoleCode and permission grants | Verified from src/permissions/permissions.ts |
| M43 | Server-session mapping principal adapter | Committed |
| M44 | Map actual roles to conceptual accounting personas | Committed |
| M45 | Deny analyst mapping approvals | Committed role gate |
| M46 | Keep platform admin outside finance access | Committed role gate |
| M47 | Validate CFO/FPA director review grants | Committed role gate |
| M48 | Unit authorization regression tests | Five tests written; not executed |
| M49 | Reuse role checks in session adapter | Committed |
| M50 | Live HTTP/RLS and end-to-end certification | Pending / NO-GO |

## Certification blockers
- Verify the role mapping with product owners; FPA_DIRECTOR review access follows current mapping.approve permission but may need stricter accounting-specific grants.
- Wire API handlers to server-derived session principal, not request payloads.
- Current mapping repository's persistence and review methods require trusted DB reads and atomic authorization/review transitions.
- FORCE RLS has no runtime tenant policies; access is default-deny until policies and database role are certified.
- Run Prisma validation, generated client, typecheck, unit tests, integration tests, tenant-isolation and hosted E2E.
- Do not merge or deploy until certification evidence is collected.

Status: PARTIAL / NO-GO.

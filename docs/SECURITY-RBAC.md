# Planora Security and RBAC

## Security principles

- Deny by default; server enforcement is authoritative.
- Session establishes user identity; active membership establishes organization scope.
- Tenant scope is never accepted from a request body/query parameter as authority.
- All material mutations validate input, permission, resource tenant, state transition, and audit outcome in one application transaction.
- Uploaded workbooks and AI input are untrusted.

## MVP permissions

| Permission | CFO | FP&A Director | Analyst |
|---|:---:|:---:|:---:|
| `financial.read` | Yes | Yes | Yes |
| `excel.upload` / `mapping.edit` | Yes | Yes | Yes |
| `mapping.approve` | Yes | Yes | No |
| `certification.approve` | Yes | Yes | No |
| `plan.edit` / `forecast.edit` | Yes | Yes | Yes |
| `plan.approve` / `forecast.publish` | Yes | Yes | No |
| `scenario.create` | Yes | Yes | Yes |
| `decision.create` / `decision.approve` | Yes | Yes | No |
| `action.manage` | Yes | Yes | Yes when owner |
| `outcome.record` | Yes | Yes | Yes when owner |
| `report.publish` | Yes | Yes | No |
| `audit.read` | Yes | Yes | No |
| `admin.members.manage` | Yes | No | No |

Permissions are data, not scattered role-name checks. Role templates grant permissions; organization-specific assignments may be added later without changing handlers.

## Required controls

- Passwords use a memory-hard password hash; session tokens are random, hashed at rest, HTTP-only, secure in hosted environments, same-site, rotated on authentication, and expire.
- Login returns a generic failure and is rate limited. Authorization failures do not reveal cross-tenant resource existence.
- Resource queries always include `organizationId` from the resolved membership.
- Audit events capture actor, organization, action, target type/ID, correlation ID, timestamp, and redacted before/after metadata.
- Files are checked by signature, extension, size, compressed expansion limits, sheet/cell/formula limits, and malware scanning in hosted environments. Macros are never executed.
- AI tools receive an explicit allow list and tenant-bound context; protected approval/publication/certification operations are absent.

## Security tests

Authentication bypass, session fixation/expiry, cross-tenant direct ID access, unauthorized mutation, role escalation, malformed input, workbook zip bombs/formula abuse, secret/error leakage, and AI tool authorization bypass are release gates.

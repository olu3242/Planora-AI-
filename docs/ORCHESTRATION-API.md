# Authenticated orchestration API

Implemented repository routes:
- POST /api/orchestration/start
- GET /api/orchestration/:runId
- POST /api/orchestration/:runId/approve

Controls:
- mutations enforce same-origin
- all routes require active Planora session/membership
- start requires financial.write
- read requires financial.read
- approval requires forecast.approve
- organization boundary is enforced
- start and approval create durable audit events with correlation IDs
- approval uses the existing workflow state guard, so only WAITING_APPROVAL steps can be approved

PENDING:
- resume endpoint after runtime handler adapters are registered
- dedicated accounting-close permission if the RBAC vocabulary is expanded
- Prisma generate/validate and migration execution
- integration/security/browser certification
- retries, compensation and operational telemetry

No hosted migration or deployment is performed by this change.

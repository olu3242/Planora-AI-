# Durable orchestration boundary

## Added
- Application service for start, resume and approval operations.
- Explicit authorization context with organization isolation.
- Start authorization and actor/context binding.
- Approval authorization separated from workflow-start authority.
- Duplicate run protection.
- Prisma-backed run/execution adapter contract.
- Unit coverage for tenant isolation, approval authority and duplicate runs.

## PENDING
- Add and validate WorkflowRunRecord and WorkflowExecutionRecord Prisma models and migration.
- Bind authorization context to the repository's verified session/membership/RBAC boundary.
- Add authenticated HTTP start/resume/approve routes.
- Add durable audit events, bounded retry/error classification and compensation.
- Run integration, security, browser E2E and full repository certification.

No hosted database change is claimed by this slice.

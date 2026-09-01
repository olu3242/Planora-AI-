# Agentic Security Evidence

`npx vitest run tests/security --reporter=verbose`

- 1 test file passed
- 9 tests passed
- 0 failed

Covered denials include Analyst role elevation, Organization A access to Organization B organizations, accounts, facts, metrics, workbooks, mapping rules/suggestions, imports, forecasts, comments, recommendations, feedback, executions and exports, direct cross-tenant database references, autonomous approval/lock, validation bypass, and prompt-like untrusted commentary. Agent/feedback APIs derive actor, role, and organization from the authenticated server session.

The browser suite additionally signs in with the isolated `PLATFORM_ADMIN` membership, exercises only pilot organization/membership/agent operations, and receives explicit HTTP 403 responses for forecast edit, submit, approve, and lock. Direct financial-page access renders the restricted boundary, and platform audit queries exclude tenant financial payloads.

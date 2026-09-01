# Planora E2E Workflow and Dependencies

```text
Login/Session
  -> Membership/RBAC
  -> Excel Upload/Profile
  -> Mapping Review/Validation
  -> Canonical Import/Lineage
  -> Reconciliation/DQ/Certification
  -> Plan/Forecast Approval/Publication
  -> Command Center/Variance/Root Cause
  -> Scenario/Recommendation/Human Decision
  -> Action/Outcome/Realization/Reforecast
  -> Governed Copilot/Agents
  -> Human-approved Report
  -> Excel Export/Edit/Re-import/Diff/Approval/New Version
```

The automated final journey uses the exact reference figures from `docs/E2E-ACCEPTANCE.md`. A phase-level browser test may cover a shorter prefix, but final certification cannot mock a critical stage or bypass database state, authorization, financial calculations, audit, or lineage.

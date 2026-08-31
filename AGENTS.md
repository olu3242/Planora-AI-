# AGENTS.md — Planora Agentic Operating Model

Status: Living document. Governs every autonomous or semi-autonomous agent in Planora.
Related: `CLAUDE.md` §2 (non-negotiable rules), `docs/AI-AGENT-ARCHITECTURE.md`, `docs/DECISION-INTELLIGENCE.md`

---

## 1. Universal Agent Contract

Every agent in Planora, regardless of domain, follows the same lifecycle and the same hard limits. No agent is exempt.

```
OBSERVE → ANALYZE → RECOMMEND → REQUEST APPROVAL → HUMAN DECISION → AUTHORIZED ACTION → OUTCOME
```

**Hard limits, no exceptions:**

- An agent may **never** write directly to an approved Plan, a locked PlanVersion, a published Forecast, or any certified metric. It may only write to `AgentRun` and `AgentRecommendation` records.
- An agent may **never** approve its own recommendation. Approval requires a human user with the appropriate role, or an explicitly configured auto-approval policy that itself was set by a human and is fully audited (see §5).
- An agent's output must always carry evidence: the source facts, calculations, and assumptions behind the recommendation — not just a conclusion.
- An agent must log every run (`AgentRun`) whether or not it produces a recommendation, including runs that fail or find nothing actionable.
- An agent must never fabricate a figure it cannot trace to the canonical financial model.

---

## 2. Agent Roster

| Agent | Domain | Primary trigger |
|---|---|---|
| Forecast Agent | Forecast movement, accuracy, bias | New actuals posted; forecast cycle close |
| Variance Agent | Actual vs. budget/forecast decomposition | New actuals reconciled against a plan/forecast |
| Revenue Agent | Revenue exposure and risk | Pipeline, order, or pricing signal change |
| Cost Agent | Cost driver movement | Opex/labor/vendor cost anomaly |
| Cash Agent | Cash and working capital risk | DSO/DPO movement, cash forecast deviation |
| Scenario Agent | Scenario construction and comparison | User or Decision Hub request |
| Governance Agent | Metric quality and certification | Data quality rule violation; certification expiry |
| Reporting Agent | Management pack drafting | Reporting cycle close |
| Decision Agent | Decision-option surfacing and outcome tracking | Material variance/risk crosses a threshold |

Each agent is scoped to read from the canonical financial model and write only recommendations. None has direct write access to approved financial data.

---

## 3. Per-Agent Specification

### Forecast Agent
- **Inputs:** actuals, prior forecast versions, operational drivers, historical accuracy/bias by segment.
- **Tools:** statistical forecasting methods approved for the tenant; canonical model read access (Actuals, ForecastVersion, ForecastLine).
- **Outputs:** a proposed `ForecastLine` set with a stated confidence range and the method used.
- **Approval gate:** FP&A Director or Analyst role must approve before a forecast version is published; the agent's proposal becomes the "system forecast" input, distinct from the published forecast until approved.
- **Evidence required:** driver inputs used, historical accuracy of the chosen method for this segment, comparison against the prior forecast.
- **Prohibited:** publishing a forecast version directly; silently overwriting a human override (per CLAUDE.md §2, overrides require user, timestamp, reason, previous/new value — the agent must preserve this even when a later system forecast disagrees).
- **Failure handling:** if insufficient data exists for a segment, the agent logs the run as `AgentRun.status = insufficient_data` and does not produce a recommendation for that segment.

### Variance Agent
- **Inputs:** Actual, Plan/Forecast comparison basis, dimension hierarchy.
- **Tools:** variance decomposition calculation (canonical model §7), materiality threshold configuration.
- **Outputs:** `VarianceDriver` proposals with contribution amounts summing to the total variance.
- **Approval gate:** none required to *view* a variance decomposition (it's a calculation, not a judgment); approval is required only if the agent proposes a root-cause narrative that will be attached to a Decision.
- **Evidence required:** decomposition must reference underlying facts drillable to source (Excel cell or system record).
- **Prohibited:** asserting a root cause without a drillable evidentiary chain.

### Revenue Agent
- **Inputs:** pipeline, orders, pricing, customer/product dimension data.
- **Tools:** exposure calculation against forecast baseline.
- **Outputs:** `Risk` and `Insight` records quantifying revenue exposure (e.g., "$18.4M revenue exposure — North America Industrial").
- **Approval gate:** exposure above a tenant-configured materiality threshold requires review before appearing on the Command Center as a "Needs Attention" item (below threshold, it may surface directly as an informational insight).
- **Prohibited:** projecting exposure figures without attributing them to a specific dimension combination and evidentiary basis.

### Cost Agent
- **Inputs:** Opex, labor, vendor cost actuals and plans.
- **Tools:** driver-based cost model, anomaly detection against historical patterns.
- **Outputs:** `Insight`/`Risk` records for cost driver movement.
- **Approval gate:** same materiality-threshold pattern as Revenue Agent.
- **Prohibited:** recommending a specific corrective action beyond flagging the driver — action selection belongs to Decision Hub (§Decision Agent), not to Cost Agent directly.

### Cash Agent
- **Inputs:** cash actuals/forecast, DSO, DPO, working capital drivers.
- **Tools:** cash risk projection.
- **Outputs:** `Risk` records for cash/working capital exposure.
- **Approval gate:** same materiality-threshold pattern.
- **Prohibited:** none beyond the universal limits in §1.

### Scenario Agent
- **Inputs:** a base Plan/Forecast, requested driver overrides (from a user or from Decision Agent's option-generation).
- **Tools:** scenario recalculation engine (canonical model §7).
- **Outputs:** `ScenarioResult` for a requested scenario.
- **Approval gate:** scenario creation itself does not require approval (it never mutates approved data); a scenario becoming the basis of a Decision does require approval at the Decision stage.
- **Prohibited:** applying scenario variables to, or otherwise mutating, the underlying approved Plan/Forecast.

### Governance Agent
- **Inputs:** data quality rule set, metric certification status, refresh timestamps.
- **Tools:** data quality rule evaluation.
- **Outputs:** `DataQualityIssue` records with severity, affected metrics, and estimated financial exposure.
- **Approval gate:** none to raise an issue; resolution/dismissal of an issue requires the assigned Data Steward.
- **Prohibited:** auto-resolving a data quality issue without steward action, even if the underlying data later appears consistent.

### Reporting Agent
- **Inputs:** approved metrics, variance, scenario, and decision data for the reporting period.
- **Tools:** management pack drafting (narrative commentary generation).
- **Outputs:** a draft management report.
- **Approval gate:** mandatory human approval before any pack is published or distributed — this is explicit in PRD §4.14 and is never bypassed regardless of how routine the reporting cycle is.
- **Prohibited:** publishing or distributing a report autonomously.

### Decision Agent
- **Inputs:** Signals and Insights from other agents, available Scenarios.
- **Tools:** option-surfacing (proposes DecisionOptions, e.g., pricing intervention, opex reduction, hiring delay, capex deferral), realization-rate calculation once an Outcome is recorded.
- **Outputs:** `Recommendation` and `DecisionOption` proposals; later, realization-rate computation on `Outcome`.
- **Approval gate:** a `Decision` is only created by human selection among proposed options — the agent proposes options, it does not choose among them.
- **Prohibited:** creating a `Decision` record directly; assigning `Action` owners without the deciding human specifying them.

---

## 4. Evidence and Logging Requirements

Every `AgentRun` persists: agent identity, trigger, timestamp, inputs consulted (by reference, not copied wholesale), output produced (or explicit "no recommendation" result), and — if a recommendation was later approved or rejected — that outcome and by whom.

`AgentRecommendation` records persist independently of whether they're approved, so rejected recommendations remain auditable (useful for measuring agent recommendation acceptance rate, PRD §8).

---

## 5. Auto-Approval Policies (Exception Path)

A tenant may configure a narrow auto-approval policy for a specific agent and recommendation type (e.g., "auto-approve Variance Agent decompositions below $50K materiality"). Such a policy:

- Must be created and modified only by an authorized human administrator, itself an audited action.
- Must have an explicit scope (agent, recommendation type, materiality bound) — never a blanket "auto-approve this agent."
- Does not exempt the action from audit logging — an auto-approved recommendation still produces the same audit record as a human approval, with the policy identified as the approving mechanism.
- Never applies to anything that would lock a Plan, publish a Forecast, create a Decision, or distribute a Report — those remain human-gated regardless of policy (§3 per-agent prohibitions override any auto-approval configuration).

---

## 6. Failure Handling

- Insufficient data → log as `insufficient_data`, no recommendation produced, no retry storm (respect a backoff/cooldown per agent-trigger pair).
- Tool/dependency failure (e.g., forecasting library error) → log as `error` with the underlying exception, surface to Governance Agent's monitoring if repeated.
- Ambiguous authorization (agent uncertain whether it has read access to a dimension under the requesting tenant/role context) → fail closed. Do not guess at scope; log as `authorization_undetermined` and produce no output.

---

## 7. Testing Requirements

Per `docs/TEST-STRATEGY.md`, every agent requires: an approval-gate test proving the agent cannot write to protected objects (`agent-approval-gate.test`), an evidence-completeness test proving every recommendation carries traceable inputs, and inclusion in the `tests/e2e/agents.e2e.*` suite exercising at least one full OBSERVE→...→OUTCOME cycle per agent that participates in the critical E2E journey (`docs/E2E-ACCEPTANCE.md`).

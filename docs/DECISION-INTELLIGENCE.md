# Planora Decision Intelligence

## Governed chain

```text
Signal -> Insight -> Variance evidence -> Scenario options
-> Recommendation -> Human Decision -> Action -> Outcome -> Realization -> Reforecast
```

Analysis states what the evidence shows. A recommendation proposes options. A Decision records the authorized human selection. An Action assigns execution. An Outcome records observed results without rewriting history.

## Decision record

A Decision contains organization, problem statement, evidence references, options considered, selected option, expected financial impact/currency/period, decision maker, approval/timestamp, related variance/scenario/recommendation, and audit reference. Only a user with `decision.create` may create it.

## Measurement

Expected and realized recovery use exact `Money`. Realization is `realized / expected`; zero expected value is explicitly undefined, not coerced. Display rounding is separate from stored precision. Outcomes can seed a new forecast version through an explicit reforecast command and never modify the published predecessor.

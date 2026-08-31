# Planora Excel Mapping Specification

## Supported MVP shapes

- `WIDE`: dimension/account rows and one value column per fiscal period.
- `LONG`: one record per account/dimension/period/value combination.

Sheet-per-period, sheet-per-entity, hybrid and multi-block workbooks are detectable but not certified in the MVP.

## Alias normalization

Headers are trimmed and case-folded for matching while original text is retained for lineage. Initial aliases include `Dept`/`Department` -> Cost Center or Department (tenant decision required when ambiguous), `BU` -> Business Unit, `GL`/`Acct` -> Account, `Region` -> Geography, and `ACT`/`FCST`/`Plan` -> scenario/version semantics.

## Suggestion and decision

Suggestions carry source field/value, proposed canonical target, method, confidence, evidence and ambiguity flags. Exact approved tenant aliases may score highly; fuzzy/AI suggestions never approve themselves. Material ambiguity creates `MappingDecision` review work. The approved `MappingVersion` is immutable and referenced by every import.

## Validation

Validation checks required dimensions, period resolution, account existence/type/sign, duplicate grain, decimal parsing, currency, formula classification, unsupported values, excluded totals/headers, and reconciliation coverage. An unmapped account is blocking.

## Drift

Workbook hash, normalized schema fingerprint, sheet set, headers, range shapes, formula classes and representative dimension values are compared with the prior import. Drift creates a new mapping draft and prevents blind template reuse.

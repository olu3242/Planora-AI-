# Export Reconciliation

The canonical Playwright test parses the generated XLSX and independently queries persisted forecast lines.

| Measure | Planora | Export | Difference |
|---|---:|---:|---:|
| Revenue | $150,750,000.00 | $150,750,000.00 | $0.00 |
| Operating Expense | $23,000,000.00 | $23,000,000.00 | $0.00 |
| Forecast Total | $213,750,000.00 | $213,750,000.00 | $0.00 |
| Record count | 12 | 12 | 0 |

Selected variance values are also asserted against persisted `actualAmount - currentForecast` values.

Result: PASS

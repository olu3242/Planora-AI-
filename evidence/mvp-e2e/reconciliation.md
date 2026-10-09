# Export Reconciliation

The canonical Playwright test parses the generated XLSX and independently queries persisted forecast lines.

| Measure | Planora | Export | Difference |
|---|---:|---:|---:|
| Revenue | $150,750,000.00 | $150,750,000.00 | $0.00 |
| Operating Expense | $23,000,000.00 | $23,000,000.00 | $0.00 |
| Forecast Total | $213,750,000.00 | $213,750,000.00 | $0.00 |
| Record count | 12 | 12 | 0 |

Selected variance values are also asserted against persisted `actualAmount - currentForecast` values.

The hardened browser test now reads all three independent surfaces:

| Measure | Database | CFO dashboard | XLSX export | Difference |
|---|---:|---:|---:|---:|
| Revenue | $150,750,000.00 | $150,750,000.00 | $150,750,000.00 | $0.00 |
| Operating Expense | $23,000,000.00 | $23,000,000.00 | $23,000,000.00 | $0.00 |
| Forecast total | $213,750,000.00 | $213,750,000.00 | $213,750,000.00 | $0.00 |
| Material variance | -$3,750,000.00 | -$3,750,000.00 | -$3,750,000.00 | $0.00 |
| Record count | 12 | 12 | 12 | 0 |

Golden controls additionally assert actual total `$211,000,000.00`, imported prior/current baseline `$213,500,000.00`, final current-vs-prior movement `$250,000.00`, and NA Industrial material variance `-$3,750,000.00`.

Result: PASS

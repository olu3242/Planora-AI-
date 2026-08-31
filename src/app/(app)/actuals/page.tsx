import Link from "next/link";
import { ChevronRight, Database, FileSearch } from "lucide-react";
import { getActualStatement } from "@/application/financial/statement-service";
import { explainMetricValue } from "@/application/financial/lineage-service";
import { requirePageSession } from "@/auth/session";
import { hasPermission } from "@/permissions/permissions";

type Search = Promise<{ period?: string; geography?: string; product?: string }>;

export default async function ActualsPage({ searchParams }: { searchParams: Search }) {
  const session = await requirePageSession();
  if (!hasPermission(session.membership.role, "financial.read")) return <section className="panel" role="alert"><h1 className="page-heading">Actuals unavailable</h1><p className="subtle">Your role does not permit access to financial statements.</p></section>;
  const query = await searchParams;
  const statement = await getActualStatement(session.organization.id, { periodId: query.period, geographyId: query.geography, productId: query.product });
  if (statement.state === "empty") return <><h1 className="page-heading">Actuals</h1><section className="empty-state"><Database size={24} /><h2>No actuals available</h2><p className="subtle">No fiscal periods or canonical financial facts are available for this organization.</p></section></>;
  const ebitda = statement.lines.find((line) => line.code === "EBITDA")!;
  const headlineCodes = new Set(["REVENUE", "GROSS_PROFIT", "EBITDA", "EBITDA_MARGIN_PCT"]);
  const explanation = ebitda.metricValueId ? await explainMetricValue(session.organization.id, ebitda.metricValueId) : null;
  return <>
    <div className="page-title-row"><div><h1 className="page-heading">Actuals</h1><p className="subtle">Canonical P&amp;L for {statement.period.year.code} · {statement.period.name}</p></div><span className="status good">GOVERNED</span></div>
    <form className="filter-bar" method="get" aria-label="Statement filters">
      <label className="compact-field">Period<select name="period" defaultValue={statement.period.id}>{statement.filters.periods.map((period) => <option key={period.id} value={period.id}>{period.year.code} · {period.name}</option>)}</select></label>
      <label className="compact-field">Geography<select name="geography" defaultValue={statement.selected.geographyId ?? ""}><option value="">All geographies</option>{statement.filters.geographies.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label className="compact-field">Product<select name="product" defaultValue={statement.selected.productId ?? ""}><option value="">All products</option>{statement.filters.products.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <button className="button button-secondary" type="submit">Apply</button>
    </form>
    <section className="metrics" aria-label="Actual financial highlights">{statement.lines.filter((line) => headlineCodes.has(line.code)).map((line) => <div className="metric" key={line.code}><div className="metric-label">{line.label}</div><div className="metric-value">{line.compact}</div></div>)}</section>
    <section className="statement" aria-labelledby="statement-heading"><div className="statement-header"><div><h2 id="statement-heading">Profit and loss</h2><p>Actual · USD</p></div><div className="source-context"><FileSearch size={16} /><span>Fixture source</span><strong>{statement.source.identifier}</strong></div></div>
      <div className="statement-table" role="table" aria-label="Profit and loss statement"><div className="statement-row statement-columns" role="row"><span role="columnheader">Metric</span><span role="columnheader">Amount</span></div>{statement.lines.map((line) => <div className={`statement-row ${line.code === "EBITDA" ? "statement-total" : ""}`} role="row" key={line.code}><span role="cell">{line.label}</span><strong role="cell">{line.formatted}</strong></div>)}</div>
    </section>
    <details className="lineage-panel"><summary><span><strong>Explain EBITDA</strong><small>Formula, inputs, and source evidence</small></span><ChevronRight size={18} /></summary>{explanation && <div className="lineage-content"><div className="lineage-summary"><div><span>Calculated value</span><strong>{ebitda.formatted}</strong></div><div><span>Formula</span><strong>{explanation.formula}</strong></div><div><span>Source facts</span><strong>{explanation.facts.length}</strong></div></div><h3>Calculation inputs</h3><div className="fact-list">{explanation.facts.map((fact) => <div className="fact-row" key={fact.id}><div><strong>{fact.account.name}</strong><span>{fact.geography} · {fact.product}</span></div><div><strong>{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(fact.amount))}</strong><span>{fact.source[0]?.type} · {fact.source[0]?.identifier}</span></div></div>)}</div><Link className="api-link" href={`/api/metrics/${explanation.id}/lineage`}>Structured lineage API</Link></div>}</details>
  </>;
}

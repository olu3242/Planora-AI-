import type { Metadata } from "next";
import Link from "next/link";
import styles from "./landing.module.css";

export const metadata: Metadata = {
  title: { absolute: "Planora — Governed Financial Planning & Decision Intelligence" },
  description: "Connect financial data, forecasts, variance analysis, governance, and decisions in one traceable FP&A platform.",
};

const lifecycle = ["Data", "Plan", "Forecast", "Actual", "Variance", "Root Cause", "Scenario", "Recommendation", "Decision", "Action", "Outcome", "Reforecast"];
const capabilities = [
  ["Fragmented systems and data", "Financial Data Hub"], ["Spreadsheet dependency", "Planning Engine + Excel Integration"],
  ["Static forecasts", "Continuous Forecast Engine"], ["Difficult variance investigation", "Variance Intelligence"],
  ["Slow what-if analysis", "Scenario Lab"], ["Reports don’t create accountability", "Decision Hub"],
  ["Numbers aren’t trusted", "Governance Engine"], ["Manual repetitive analysis", "Planora Copilot"],
  ["Reactive finance teams", "Agentic Intelligence"],
];
const questions = [
  ["Does Planora replace Excel?", "No. Excel can remain a data source, a planning input, an offline working environment, or a reporting output indefinitely. Planora is designed for progressive adoption, not a forced migration."],
  ["Can it map our existing FP&A workbooks?", "Planora profiles your workbook’s actual structure — wide format, long format, sheet-based periods or departments, even one file per business unit — and proposes a mapping rather than requiring you to rebuild it to fit a template."],
  ["What systems can it connect to?", "ERP, CRM, HRIS, payroll, procurement, and treasury systems, plus data warehouses and operational APIs, alongside CSV and Excel uploads — all normalized into one governed financial model."],
  ["How does reconciliation work?", "Every import is checked against the source total. A reconciled import shows $0 difference; anything else surfaces the likely cause — unmapped accounts, period mismatch, currency mismatch — before the data is trusted downstream."],
  ["Does AI ever change financial data automatically?", "No. AI proposes mappings, forecasts, and recommendations with evidence attached. Committing any material change requires explicit human approval."],
  ["Can users trace a number back to its source?", "Yes — every governed metric can show its formula, owner, data source, freshness, and, for Excel-sourced figures, the exact workbook, sheet, and cell it came from."],
  ["Is Planora multi-tenant?", "Yes. Tenant isolation and role-based access are enforced server-side across every query and mutation, not only in the interface."],
  ["Can Planora export back to Excel?", "Yes. Scenario results, forecasts, and reports can round-trip back into Excel templates, and the exported workbook reconciles against Planora before you rely on it."],
];
const footerColumns = [
  ["Product", [["Planning", "#capabilities"], ["Forecasting", "#capabilities"], ["Variance", "#capabilities"], ["Scenarios", "#capabilities"]]],
  ["Solutions", [["Excel migration", "#excel"], ["Governance", "#governance"], ["Decision intelligence", "#capabilities"]]],
  ["Resources", [["FAQ", "#faq"], ["Documentation", "#capabilities"], ["Security", "#governance"]]],
  ["Company", [["About", "#top"], ["Contact", "/login"], ["Legal", "#faq"]]],
] as const;

export default function Home() {
  return <div className={styles.landing}>
    <header className="site"><div className="nav-row">
      <a href="#top" className="wordmark"><span className="mark" />Planora</a>
      <nav className="primary" aria-label="Primary navigation"><a href="#capabilities">Product</a><a href="#excel">Excel</a><a href="#governance">Governance</a><a href="#faq">FAQ</a></nav>
      <div className="nav-actions"><Link className="btn btn-ghost" href="/login">Sign in</Link><Link className="btn btn-primary" href="/login">Get started</Link></div>
      <details className="mobile-menu"><summary aria-label="Open navigation menu"><span /><span /><span /></summary><nav aria-label="Mobile navigation"><a href="#capabilities">Product</a><a href="#excel">Excel</a><a href="#governance">Governance</a><a href="#faq">FAQ</a><Link href="/login">Sign in</Link></nav></details>
    </div></header>

    <main id="top">
      <section className="hero"><div className="wrap hero-grid">
        <div><div className="eyebrow-line"><span className="dash" />Financial planning, governance &amp; decision intelligence</div><h1>Turn fragmented financial data into decisions you can stand behind.</h1><p className="sub">Planora connects your ERP, CRM, HRIS, and existing Excel models into one governed source of financial truth — then carries every number from variance to explanation to decision to measured outcome.</p><div className="hero-ctas"><Link href="/login" className="btn btn-primary">Get started</Link><a href="#e2e" className="link-inline">See the full workflow →</a></div></div>
        <div className="recon-card"><div className="card-label"><span>EBITDA — FY26 Latest Estimate</span><span className="status">RECONCILED</span></div><div className="recon-row"><span className="l">Forecast</span><span className="v">$94.0M</span></div><div className="recon-row"><span className="l">Latest</span><span className="v">$87.0M</span></div><div className="recon-total"><span>Variance</span><span className="v">-$7.0M</span></div><div className="drivers"><div className="dh">DRIVER DECOMPOSITION</div>{[["Volume", "-$3.1M"], ["Labor", "-$1.8M"], ["Pricing", "-$1.2M"], ["Logistics", "-$0.6M"], ["FX", "-$0.3M"]].map(([label, value]) => <div className="drv-row" key={label}><span>{label}</span><span className="v">{value}</span></div>)}</div><div className="card-source">FY26_Forecast.xlsx → P&amp;L → N42</div></div>
      </div></section>
      <hr className="rule" />
      <section id="pain-points"><div className="wrap"><div className="section-head"><div className="kicker">{"// the problem"}</div><h2>Finance teams already know these numbers.</h2><p className="desc">Not because they’re proud of them — because they’ve lived them every close.</p></div><div className="ledger"><div className="ledger-row"><div className="metric">6 wks</div><div className="label">Average budget cycle</div><div className="detail">Spreadsheets pass hand to hand across business units before a number is trusted enough to submit.</div></div><div className="ledger-row"><div className="metric">3+ hrs</div><div className="label">To investigate one variance</div><div className="detail">Explaining “why EBITDA missed” means chasing five systems and hoping the drivers still add up.</div></div><div className="ledger-row"><div className="metric">0</div><div className="label">Actions tracked after the review</div><div className="detail">The deck gets approved. The commitments inside it are rarely followed through to an outcome.</div></div></div></div></section>
      <hr className="rule" />
      <section id="e2e"><div className="wrap"><div className="section-head"><div className="kicker">{"// how planora works"}</div><h2>One lifecycle, not a folder of dashboards.</h2><p className="desc">Every figure in Planora sits on the same chain — from raw data to a measured, learned-from outcome.</p></div><div className="flow">{lifecycle.map((step) => <div className={`flow-step${step === "Variance" ? " on" : ""}`} key={step}>{step}</div>)}</div></div></section>
      <hr className="rule" />
      <section id="capabilities"><div className="wrap"><div className="section-head"><div className="kicker">{"// built around pain points"}</div><h2>Every capability answers one recurring problem.</h2></div><div className="cap-head"><span>Pain point</span><span>Planora capability</span></div><div className="cap-table">{capabilities.map(([pain, capability]) => <div className="cap-row" key={pain}><span className="pain">{pain}</span><span className="cap">{capability}</span></div>)}</div></div></section>
      <section id="excel"><div className="wrap"><div className="excel-band"><h2>Excel isn’t the enemy. It’s the input.</h2><p className="desc">Any reasonably structured FP&amp;A workbook maps into Planora without a rebuild — wide or long format, sheet-based departments, one file per business unit. Nothing executes inside your workbook; nothing gets overwritten without your review.</p><div className="excel-strip"><div className="excel-cell"><div className="l">Excel</div><div className="v">$428,612,934</div></div><div className="excel-cell"><div className="l">Planora</div><div className="v">$428,612,934</div></div><div className="excel-cell ok"><div className="l">Difference</div><div className="v">$0 — RECONCILED</div></div></div></div></div></section>
      <hr className="rule" />
      <section id="governance"><div className="wrap"><div className="section-head"><div className="kicker">{"// trust"}</div><h2>Every number can explain itself.</h2><p className="desc">Select any metric and Planora shows the formula, the owner, the source, and how fresh it is — before anyone has to ask.</p></div><div className="gov-grid"><div className="gov-item"><h3>Full lineage</h3><p>Trace any figure back to its workbook, cell, mapping rule, and the person who approved it — not a black box.</p></div><div className="gov-item"><h3>Server-side RBAC</h3><p>Roles and tenant boundaries are enforced where it matters, not just hidden in the interface.</p></div><div className="gov-item"><h3>Immutable audit trail</h3><p>Approvals, overrides, and imports are recorded permanently — actor, timestamp, previous value, reason.</p></div><div className="gov-item"><h3>Human approval, always</h3><p>AI proposes mappings, forecasts, and recommendations. A person approves anything material before it commits.</p></div></div></div></section>
      <hr className="rule" />
      <section id="faq"><div className="wrap"><div className="section-head"><div className="kicker">{"// questions"}</div><h2>Frequently asked</h2></div><div className="faq-list">{questions.map(([question, answer]) => <details className="faq-item" key={question}><summary>{question}<span className="plus">+</span></summary><div className="a">{answer}</div></details>)}</div></div></section>
      <div className="wrap"><div className="cta-band"><h2>Bring your first forecast in and see where it actually breaks.</h2><Link href="/login" className="btn btn-primary">Get started</Link></div></div>
    </main>
    <footer><div className="wrap"><div className="foot-grid"><div className="foot-brand"><div className="wordmark"><span className="mark" />Planora</div><p>Governed financial planning, analysis, and decision intelligence — built so Excel and trust can coexist.</p></div>{footerColumns.map(([heading, links]) => <div className="foot-col" key={heading}><h4>{heading}</h4><ul>{links.map(([label, href]) => <li key={label}><Link href={href}>{label}</Link></li>)}</ul></div>)}</div><div className="foot-bottom"><span>© 2026 Planora. All rights reserved.</span><span>Built for finance teams who still trust a workbook.</span></div></div></footer>
  </div>;
}

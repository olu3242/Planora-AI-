import Link from "next/link";
import { BarChart3, Database, FileChartColumn, FileSpreadsheet, ShieldCheck } from "lucide-react";
import { requirePageSession } from "@/auth/session";
import { hasPermission } from "@/permissions/permissions";
import { prisma } from "@/lib/prisma";

export default async function CommandCenter() {
  const session = await requirePageSession();
  const auditCount = await prisma.auditEvent.count({ where: { organizationId: session.organization.id } });
  const modules = [
    { label: "Actuals", accessibleLabel: "Open governed statements", description: "Review governed P&L results and trace EBITDA to source evidence.", href: "/actuals", Icon: Database, show: hasPermission(session.membership.role, "financial.read") },
    { label: "Excel imports", accessibleLabel: "Open source data intake", description: "Profile, map, validate, and reconcile a forecast workbook.", href: "/excel", Icon: FileSpreadsheet, show: hasPermission(session.membership.role, "financial.import") },
    { label: "Forecast cycles", accessibleLabel: "Open forecast cycle workspace", description: "Move a forecast through commentary, review, approval, lock, and export.", href: "/forecasts", Icon: FileChartColumn, show: hasPermission(session.membership.role, "financial.read") },
    { label: "Executive dashboard", accessibleLabel: "Open executive reporting workspace", description: "Inspect KPIs, material variances, movements, workflow health, and agent usage.", href: "/dashboard", Icon: BarChart3, show: hasPermission(session.membership.role, "forecast.approve") },
    { label: "Platform administration", accessibleLabel: "Open pilot operations", description: "Manage bounded pilot operations without tenant financial authority.", href: "/platform-admin", Icon: ShieldCheck, show: hasPermission(session.membership.role, "admin.manage") },
  ].filter((module) => module.show);
  return <>
    <div className="page-title-row"><div><h1 className="page-heading">Command Center</h1><p className="subtle">Governed workspace for {session.organization.name}. Continue from source data to review-ready financial decisions.</p></div><span className="status good">WORKSPACE READY</span></div>
    <section className="metrics" aria-label="Workspace status"><div className="metric"><div className="metric-label">Session</div><div className="metric-value">Active</div></div><div className="metric"><div className="metric-label">Tenant</div><div className="metric-value">Bound</div></div><div className="metric"><div className="metric-label">Role</div><div className="metric-value">{session.membership.role.replace("FPA_", "FP&A ").replace("PLATFORM_", "Platform ")}</div></div><div className="metric"><div className="metric-label">Audit events</div><div className="metric-value">{auditCount}</div></div></section>
    <section className="panel"><div className="section-heading"><div><h2>Continue the governed workflow</h2><p>Each destination preserves tenant scope, role checks, source evidence, and audit controls.</p></div></div><div className="journey-grid">{modules.map(({ label, accessibleLabel, description, href, Icon }) => <Link aria-label={accessibleLabel} className="journey-card" href={href} key={href}><Icon size={20} /><span><strong>{label}</strong><small>{description}</small></span><span aria-hidden="true">→</span></Link>)}</div></section>
  </>;
}

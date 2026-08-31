import Link from "next/link";
import { Database, FileSpreadsheet, Gauge, GitCompareArrows, Landmark, Settings, SquareChartGantt, WandSparkles } from "lucide-react";
import type { getSession } from "@/auth/session";

type Session = NonNullable<Awaited<ReturnType<typeof getSession>>>;
const nav = [
  ["Command Center", "/command-center", Gauge, true], ["Actuals", "/actuals", Database, false],
  ["Planning", "/planning", SquareChartGantt, false], ["Forecasts", "/forecasts", WandSparkles, false],
  ["Excel", "/excel", FileSpreadsheet, false], ["Reconciliation", "/reconciliation", GitCompareArrows, false],
  ["Governance", "/governance", Landmark, false], ["Administration", "/administration", Settings, false],
] as const;

export function AppShell({ session, children }: { session: Session; children: React.ReactNode }) {
  return <div className="app-shell"><aside className="sidebar"><Link className="brand" href="/command-center"><span className="brand-mark" />Planora</Link><div className="nav-group"><div className="nav-label">Workspace</div>{nav.map(([label, href, Icon, enabled]) => enabled ? <Link key={label} className="nav-link" href={href}><Icon size={17} />{label}</Link> : <span key={label} className="nav-link disabled" aria-disabled="true"><Icon size={17} />{label}<span className="soon">SOON</span></span>)}</div></aside><div className="main"><header className="topbar"><div><div className="org-name">{session.organization.name}</div><div className="subtle">{session.membership.role.replace("FPA_", "FP&A ")}</div></div><div className="user-area"><span>{session.user.name}</span><form action="/api/auth/logout" method="post"><button className="button button-secondary" type="submit">Sign out</button></form></div></header><main className="content">{children}</main></div></div>;
}

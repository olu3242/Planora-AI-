"use client";

import { useId, useRef, useState } from "react";
import { BookOpen, Bot, ChartNoAxesCombined, Check, ClipboardCheck, FileCheck2, Gauge, ShieldCheck } from "lucide-react";
import { PlanoraLogo } from "@/components/planora-logo";
import { dashboardViews, trackShowcase, type DashboardContent } from "./content";

const icons = [Gauge, BookOpen, FileCheck2, ChartNoAxesCombined, Bot];
export function PreviewChart({ area = false }: { area?: boolean }) {
  const id = useId().replaceAll(":", "");
  return <svg className="preview-chart" viewBox="0 0 440 140" role="img" aria-label="Illustrative workflow activity trend"><defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={area ? "#37b6bd" : "#6fbf91"} stopOpacity=".55"/><stop offset="1" stopColor="#d1e9df" stopOpacity=".12"/></linearGradient></defs>{[20, 50, 80, 110].map(y => <path key={y} d={`M0 ${y}H440`} stroke="#edf1ee" strokeWidth="1"/>)}<path d="M0 120C30 118 42 110 65 109S102 91 122 98S163 87 182 88S220 61 242 68S275 44 300 47S340 28 365 31S410 18 440 19V140H0Z" fill={`url(#${id})`}/><path className="trend-line" d="M0 120C30 118 42 110 65 109S102 91 122 98S163 87 182 88S220 61 242 68S275 44 300 47S340 28 365 31S410 18 440 19" fill="none" stroke={area ? "#199da6" : "#1b8256"} strokeWidth="2.5"/>{area && <path d="M0 133C62 128 82 125 122 126S185 117 223 119S280 111 320 110S376 94 440 97V140H0Z" fill="#168db3" opacity=".4"/>}</svg>;
}

export function DashboardPreview({ view = 0, hero = false, miniature = false, views = dashboardViews }: { view?: number; hero?: boolean; miniature?: boolean; views?: readonly DashboardContent[] }) {
  const data = views[view] ?? dashboardViews[0];
  const metrics = hero ? [["Tasks automated", "84%"], ["Books close", "92%"], ["Exceptions", "12"], ["Pending approvals", "7"]] : data.metrics;
  return <div className={`dashboard-preview ${hero ? "dashboard-hero" : ""} ${miniature ? "dashboard-miniature" : ""}`} aria-hidden={miniature || undefined}>
    {hero && <div className="preview-chrome"><PlanoraLogo /><span aria-hidden="true">−　□　◉</span></div>}
    <div className="preview-frame">{hero && <aside className="preview-sidebar">{views.map((item, i) => { const Icon = icons[i] ?? Gauge; return <div key={item.id} className={i === view ? "selected" : ""}><Icon size={13}/><span>{item.label}</span></div>; })}<div><ClipboardCheck size={13}/>Approvals</div><div><ShieldCheck size={13}/>Reports</div><span className="preview-sidebar-note">Illustrative preview</span></aside>}
      <div className="preview-main"><div className="preview-title"><div><h3>{data.title}</h3><p>{data.subtitle}</p></div><span className="preview-date">Sample period</span></div>
        <div className="preview-metrics">{metrics.map(([label, value], index) => <div key={label}><span>{label}</span><strong>{value}</strong><small className={index === 1 || index === 3 ? "amber-text" : "green-text"}>{index === 1 ? "Requires review" : index === 3 ? "Review queue" : "↗ Sample trend"}</small></div>)}</div>
        {hero ? <><div className="preview-charts"><div><h4>Cash position</h4><strong className="cash-value">$287,430</strong><PreviewChart/><small className="green-text">↗ 8% vs last month · illustrative</small></div><div><h4>Workflow status</h4><div className="donut-row"><div className="preview-donut"><b>38<small>Total tasks</small></b></div><div className="chart-legend"><span>Completed <b>26</b></span><span>In progress <b>7</b></span><span>Requires review <b>3</b></span><span>Overdue <b>2</b></span></div></div></div></div><div className="preview-activity"><h4>Recent activity</h4>{data.queue.map((item, i) => <div key={item}><span className={`activity-symbol ${i === 1 ? "amber" : ""}`}><Check size={11}/></span><span>{item}</span><small>{i + 2} min ago</small><em>{i === 1 ? "Needs review" : "Completed"}</em></div>)}</div></> : <><div className="preview-trend"><h4>{view === 3 ? "Illustrative cash outlook" : "Tasks over time"}</h4><div className="trend-layout"><div><PreviewChart area/><div className="chart-axis"><span>Oct 1</span><span>Oct 8</span><span>Oct 15</span><span>Oct 22</span><span>Oct 31</span></div></div><div className="chart-legend"><span>Completed</span><span>In progress</span><span>Requires review</span><span>Overdue</span></div></div></div><div className="preview-queue">{data.queue.map(item => <span key={item}><Check size={12}/>{item}</span>)}</div></>}
      </div></div>
  </div>;
}

export function DashboardShowcase({ views = dashboardViews }: { views?: readonly DashboardContent[] }) {
  const [view, setView] = useState(0);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const id = useId();
  if (!views.length) return null;
  const select = (index: number) => { setView(index); trackShowcase("dashboard", "select", views[index].id); };
  return <section id="platform" className="showcase-section"><div className="marketing-container tour-layout"><div><span className="eyebrow">Interactive product tour</span><h2>Explore Planora<br/>in action</h2><p className="section-copy">Switch between workspaces to see how Planora connects your data, automates work, and gives you complete visibility and control.</p><div className="dashboard-tabs" role="tablist" aria-label="Dashboard preview" aria-orientation="vertical">{dashboardViews.map((item, i) => { const Icon = icons[i] ?? Gauge; return <button key={item.id} ref={node => { tabs.current[i] = node; }} id={`${id}-tab-${i}`} role="tab" aria-selected={view === i} aria-controls={`${id}-panel`} tabIndex={view === i ? 0 : -1} onClick={() => select(i)} onKeyDown={event => { let next = i; if (["ArrowDown", "ArrowRight"].includes(event.key)) next = (i + 1) % views.length; else if (["ArrowUp", "ArrowLeft"].includes(event.key)) next = (i + views.length - 1) % views.length; else if (event.key === "Home") next = 0; else if (event.key === "End") next = views.length - 1; else return; event.preventDefault(); select(next); tabs.current[next]?.focus(); }}><span className="tab-icon"><Icon size={18}/></span><strong>{item.label}</strong><small>{item.description}</small></button>; })}</div></div><div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${view}`} tabIndex={0}><DashboardPreview view={view} views={views}/><p className="illustrative-note">Sample values and scenarios only. Interactive preview, not connected customer data.</p></div></div></section>;
}

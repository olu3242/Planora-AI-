"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { DashboardPreview } from "./dashboard-showcase";
import { solutionCards, trackShowcase, type SolutionContent } from "./content";

export function FeatureCarousel({ items = solutionCards }: { items?: readonly SolutionContent[] }) {
  const titleId = useId();
  const [selected, setSelected] = useState<number | null>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const track = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  useEffect(() => { const node = track.current; if (!node) return; const update = () => setEdges({ start: node.scrollLeft < 3, end: node.scrollLeft + node.clientWidth >= node.scrollWidth - 3 }); update(); node.addEventListener("scroll", update, { passive: true }); const observer = new ResizeObserver(update); observer.observe(node); return () => { node.removeEventListener("scroll", update); observer.disconnect(); }; }, []);
  useEffect(() => { if (selected !== null) dialog.current?.showModal(); }, [selected]);
  const move = (direction: number) => { const node = track.current; if (!node) return; node.scrollBy({ left: direction * (node.firstElementChild?.clientWidth ?? 250), behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" }); trackShowcase("solutions", "scroll", direction > 0 ? "next" : "previous"); };
  const close = () => { dialog.current?.close(); setSelected(null); opener.current?.focus(); };
  return <section id="solutions" className="solutions-section"><div className="marketing-container solutions-layout"><div><span className="eyebrow">Key use cases</span><h2>Solve real<br/>finance problems</h2><p className="section-copy">Explore how Planora helps you automate, streamline and gain control across your financial operations.</p><div className="carousel-controls"><button className="icon-button" disabled={edges.start} aria-label="Previous solution" onClick={() => move(-1)}><ArrowLeft size={18}/></button><button className="icon-button" disabled={edges.end} aria-label="Next solution" onClick={() => move(1)}><ArrowRight size={18}/></button></div></div><div className="solution-track" ref={track} role="region" aria-roledescription="carousel" aria-label="Planora solutions" tabIndex={0} onKeyDown={e => { if (["ArrowLeft", "ArrowRight"].includes(e.key)) { e.preventDefault(); move(e.key === "ArrowRight" ? 1 : -1); } }}>{items.map((item, i) => <button className="solution-card" key={item.title} onClick={e => { opener.current = e.currentTarget; setSelected(i); trackShowcase("solutions", "explore", item.title); }} aria-label={`Explore ${item.title}`}><div className="solution-thumbnail"><DashboardPreview view={item.view} miniature/></div><h3>{item.title}</h3><p>{item.text}</p><ArrowRight size={17}/></button>)}</div></div>{selected !== null && <dialog ref={dialog} className="showcase-dialog" aria-labelledby={titleId} onCancel={e => { e.preventDefault(); close(); }}><div className="dialog-heading"><div><span className="eyebrow">Workflow preview</span><h2 id={titleId}>{items[selected].title}</h2></div><button autoFocus className="icon-button" aria-label="Close workflow" onClick={close}><X size={20}/></button></div><DashboardPreview view={items[selected].view}/><ol className="workflow-steps">{items[selected].steps.map(step => <li key={step}>{step}</li>)}</ol><p className="illustrative-note">Illustrative workflow. No financial record is created or changed.</p></dialog>}</section>;
}

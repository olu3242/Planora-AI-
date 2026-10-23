"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Play, X, ArrowRight } from "lucide-react";
import { PlanoraLogo } from "@/components/planora-logo";
import { trackShowcase, videoChapters, type VideoChapter } from "./content";

export function VideoShowcase({ videos = videoChapters }: { videos?: readonly VideoChapter[] }) {
  const titleId = useId();
  const [selected, setSelected] = useState(0);
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const preview = useRef<HTMLVideoElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const node = preview.current;
    if (!node) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    const update = () => { if (visible && !media.matches && !open) void node.play().catch(() => {}); else node.pause(); };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); }, { threshold: .5 });
    observer.observe(node); media.addEventListener("change", update);
    return () => { observer.disconnect(); media.removeEventListener("change", update); node.pause(); };
  }, [open, selected]);
  useEffect(() => { if (open) dialog.current?.showModal(); }, [open]);
  if (!videos.length) return null;
  const close = () => { dialog.current?.close(); setOpen(false); opener.current?.focus(); };
  const show = (target: HTMLElement) => { opener.current = target; setOpen(true); trackShowcase("video", "play", videos[selected].title); };
  return <section id="demo" className="video-section"><div className="marketing-container video-layout"><div><span className="eyebrow">See Planora at work</span><h2>Watch how<br/>Planora works</h2><p className="section-copy">Take a quick tour of the workspace, reporting views, and financial insights.</p><button className="marketing-button" onClick={e => show(e.currentTarget)}><Play size={16} fill="currentColor"/>Watch product demo</button><p className="video-disclaimer">Illustrative product footage. No live customer information.</p></div><div><div className="video-poster"><div className="video-poster-copy"><PlanoraLogo/><h3>Your finance<br/>operations.<br/>Finally working<br/>together.</h3><span>A connected finance workspace</span></div><div className="video-preview-wrap">{failed ? <p role="status">This video is unavailable. Choose another chapter below.</p> : <video ref={preview} key={selected} src={videos[selected].src} muted playsInline loop preload="metadata" poster={videos[selected].poster} onError={() => setFailed(true)} aria-label={`${videos[selected].title} preview`}/>}<button className="video-play" aria-label={`Watch ${videos[selected].title} with audio`} onClick={e => show(e.currentTarget)}><Play size={28} fill="currentColor"/></button></div></div><div className="video-chapters" aria-label="Video chapters">{videos.map(({ title }, i) => <button key={title} aria-pressed={i === selected} onClick={() => { setSelected(i); setFailed(false); trackShowcase("video", "chapter", title); }}><span>{String(i + 1).padStart(2, "0")}</span>{title}<ArrowRight size={13}/></button>)}</div></div></div>{open && <dialog className="showcase-dialog video-dialog" ref={dialog} aria-labelledby={titleId} onCancel={e => { e.preventDefault(); close(); }}><div className="dialog-heading"><h2 id={titleId}>{videos[selected].title}</h2><button className="icon-button" aria-label="Close video" onClick={close}><X size={22}/></button></div><video src={videos[selected].src} autoPlay controls playsInline aria-label={videos[selected].title}><track kind="captions" src="/media/planora/walkthrough-captions.vtt" srcLang="en" label="English" default /></video><p>Planora product preview. All financial figures are illustrative.</p></dialog>}</section>;
}

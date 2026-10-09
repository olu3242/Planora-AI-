"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion, useAnimationControls } from "framer-motion";
import { ArrowRight, BookOpen, ChartNoAxesCombined, ChevronLeft, ChevronRight, FileCheck2, Play, ShieldCheck, X } from "lucide-react";

const personas = ["For Founders", "For Accountants", "For FP&A / Controllers"];
const features = [
  { title: "Understand the numbers", summary: "A clear view of actuals and what changed.", icon: ChartNoAxesCombined, detail: "Review revenue, cost, and EBITDA together. Follow source references to understand where a reported number came from.", steps: ["Open your financial view", "Compare the reporting period", "Inspect source evidence"] },
  { title: "Close with confidence", summary: "Evidence and review before financial changes.", icon: BookOpen, detail: "Review ledger entries and reconciliation evidence. Independent approval remains separate from preparation.", steps: ["Review the ledger", "Resolve reconciliation exceptions", "Request independent approval"] },
  { title: "Keep forecasts accountable", summary: "Bring assumptions and approvals together.", icon: FileCheck2, detail: "Review forecast changes with commentary, submit them for approval, and reconcile the locked export back to your workbook.", steps: ["Import and review mappings", "Explain changed assumptions", "Approve, lock, and export"] },
  { title: "Trace every decision", summary: "Clear ownership, source context, and controls.", icon: ShieldCheck, detail: "Inspect source lineage and approval history before relying on a financial change. AI suggestions remain proposals for human review.", steps: ["Inspect the source", "Review permissions and evidence", "Record the authorized outcome"] },
];
const groups = [[0,2,3],[1,0,3],[2,1,3]];

export type Walkthrough = { title: string; description: string; src?: string; poster?: string; captions?: string };
// Supplied Planora dashboard animation; figures are illustrative.
export const walkthroughs: Walkthrough[] = [
  { title: "Your finance dashboard", description: "An overview of the Planora workspace. Illustrative data.", src: "/media/planora/walkthrough-1.mp4" },
  { title: "A connected workspace", description: "Accounting, close, reporting, and planning navigation. Illustrative data.", src: "/media/planora/walkthrough-2.mp4" },
  { title: "Finding insights", description: "A closer look at dashboard navigation. Illustrative data.", src: "/media/planora/walkthrough-3.mp4" },
  { title: "Performance at a glance", description: "Revenue, gross margin, and cash in focus. Illustrative data.", src: "/media/planora/walkthrough-4.mp4" },
  { title: "AI Insights in focus", description: "A preview of the AI Insights card. Illustrative data.", src: "/media/planora/walkthrough-5.mp4" },
  { title: "Meet Planora", description: "The Planora brand signature.", src: "/media/planora/walkthrough-6.mp4" },
];
function VideoPreview({ media, active, reduced }: { media: Walkthrough; active: boolean; reduced: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const inView = useInView(video, { amount: 0.6 });
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const node = video.current;
    if (!node) return;
    const sync = () => {
      if (active && inView && !reduced && !document.hidden) void node.play().catch(() => {});
      else node.pause();
    };
    sync(); document.addEventListener("visibilitychange", sync);
    return () => { node.pause(); document.removeEventListener("visibilitychange", sync); };
  }, [active, inView, reduced]);
  if (!media.src || failed) return <div className="media-preview"><Play size={36} className="fc:mx-auto fc:mb-4" aria-hidden="true" /><h3 className="cluster-title">{media.title}</h3><p className="fc:mt-3 fc:text-slate-300">{media.description}</p><p className="fc:mt-5 fc:text-sm fc:text-slate-300">{failed ? "Video unavailable. Please try again later." : "Walkthrough video coming soon"}</p></div>;
  return <video ref={video} src={media.src} poster={media.poster} muted playsInline loop preload="metadata" onError={() => setFailed(true)} aria-label={media.title}>{media.captions && <track kind="captions" src={media.captions} srcLang="en" label="English" />}</video>;
}

function VideoLightbox({ media, close }: { media: Walkthrough; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    dialog.current?.showModal(); document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  return <motion.dialog initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:reduced?0:0.2,ease:[0.16,1,0.3,1]}} ref={dialog} className="cluster-dialog" aria-label={media.title} onCancel={event => { event.preventDefault(); close(); }}>
    <div className="fc:mx-auto fc:flex fc:h-full fc:max-w-6xl fc:flex-col fc:justify-center fc:gap-6 fc:p-6">
      <div className="fc:flex fc:items-center fc:justify-between fc:gap-4"><h2 className="fc:text-2xl fc:font-bold">{media.title}</h2><button autoFocus aria-label="Close video" onClick={close}><X /></button></div>
      <video src={media.src} poster={media.poster} autoPlay controls playsInline preload="metadata" aria-label={media.title}>{media.captions && <track kind="captions" src={media.captions} srcLang="en" label="English" default />}</video>
      <p>{media.description}</p>
    </div>
  </motion.dialog>;
}

export function FeatureCluster({ media = walkthroughs }: { media?: Walkthrough[] }) {
  const reduced = !!useReducedMotion();
  const transition = { duration: reduced ? 0 : 0.2, ease: [0.16,1,0.3,1] as const };
  const [persona, setPersona] = useState(0);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [slide, setSlide] = useState(0);
  const [lightbox, setLightbox] = useState<Walkthrough | null>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const track = useRef<HTMLDivElement>(null);
  const [stride, setStride] = useState(0);
  const dragged = useRef(false);
  const carousel = useAnimationControls();
  useEffect(() => { void carousel.start({ x: -(stride+24)*slide, transition: { duration: reduced ? 0 : 0.2 } }); }, [carousel, slide, stride, reduced]);
  useEffect(() => {
    const node = track.current; if (!node) return;
    const observer = new ResizeObserver(() => setStride((node.firstElementChild as HTMLElement | null)?.offsetWidth ?? 0));
    observer.observe(node); return () => observer.disconnect();
  }, []);
  const choose = (index: number) => { setPersona(index); setExpanded(null); };
  const move = (index: number) => setSlide(Math.max(0, Math.min(media.length - 1,index)));
  return <section id="features" className="feature-cluster fc:bg-slate-50 fc:py-20" aria-labelledby="cluster-heading">
    <div className="container">
      <div className="fc:mx-auto fc:mb-8 fc:max-w-2xl fc:text-center"><p className="fc:mb-3 fc:text-sm fc:font-semibold fc:text-blue-600">BUILT AROUND YOUR WORK</p><h2 id="cluster-heading" className="fc:text-3xl fc:font-bold">Less noise. Your next step, in focus.</h2><p className="cluster-copy fc:mt-4">Choose your perspective. Explore the detail when you need it.</p></div>
      <div id="personas" role="tablist" aria-label="Choose your finance role" className="cluster-tabs fc:mb-8 fc:flex fc:flex-wrap fc:justify-center fc:gap-3">
        {personas.map((label,i) => <button key={label} ref={node => { tabs.current[i]=node; }} role="tab" id={`persona-${i}`} aria-controls={`persona-panel-${i}`} aria-selected={persona===i} tabIndex={persona===i?0:-1} onClick={() => choose(i)} onKeyDown={event => {
          let next=i;if(event.key==="ArrowRight")next=(i+1)%3;else if(event.key==="ArrowLeft")next=(i+2)%3;else if(event.key==="Home")next=0;else if(event.key==="End")next=2;else return;
          event.preventDefault();choose(next);tabs.current[next]?.focus();
        }}>{label}</button>)}
      </div>
      <motion.div layout={!reduced} transition={transition}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={persona} role="tabpanel" id={`persona-panel-${persona}`} aria-labelledby={`persona-${persona}`} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:reduced?0:0.2,ease:"easeOut"}} className="cluster-grid">
            {groups[persona].map(id => { const feature=features[id];const Icon=feature.icon;return <motion.article key={id} layout={!reduced} transition={transition} whileHover={reduced?{}:{scale:1.02,boxShadow:"0 10px 25px rgba(15,23,42,.10)"}} className="cluster-card fc:dark:border-slate-800">
              <Icon size={26} className="fc:mb-5 fc:text-blue-600" aria-hidden="true" /><h3 className="cluster-title">{feature.title}</h3><p className="cluster-copy fc:mt-3">{feature.summary}</p>
              <div className="cluster-actions fc:mt-5"><button aria-expanded={expanded===id} aria-controls={`feature-detail-${id}`} onClick={() => setExpanded(expanded===id?null:id)} className="fc:flex fc:items-center fc:gap-2">{expanded===id?"Close workflow":"Explore workflow"}<ArrowRight size={16} /></button></div>
              <AnimatePresence initial={false}>{expanded===id && <motion.div id={`feature-detail-${id}`} initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} transition={transition} className="fc:overflow-hidden"><p className="cluster-copy fc:mt-4">{feature.detail}</p><ol className="fc:mt-4 fc:space-y-2 fc:text-sm">{feature.steps.map((step,i)=><li key={step}>{i+1}. {step}</li>)}</ol></motion.div>}</AnimatePresence>
            </motion.article>;})}
          </motion.div>
        </AnimatePresence>
      </motion.div>
      <div id="experience" className="fc:mt-14" role="region" aria-roledescription="carousel" aria-label="Feature walkthroughs">
        <div className="fc:mb-6 fc:flex fc:flex-wrap fc:items-end fc:justify-between fc:gap-4"><div><h3 className="cluster-title">See the workflow in context</h3><p className="cluster-copy fc:mt-2">Explore the supplied dashboard animation. Financial figures are illustrative.</p></div><span className="cluster-copy fc:text-sm" aria-live="polite">{media.length ? `${slide+1} / ${media.length} · ${media[slide]?.title}` : "No walkthroughs available"}</span></div>
        <div className="fc:overflow-hidden"><motion.div ref={track} className="fc:flex fc:gap-6" style={{touchAction:"pan-y"}} animate={carousel} transition={transition} drag={media.length>1?"x":false} dragConstraints={{left:-(stride+24)*Math.max(0,media.length-1),right:0}} dragElastic={0.08} dragMomentum={false} onDragStart={() => { dragged.current=true; }} onDragEnd={(_,info) => {const next=Math.max(0,Math.min(media.length-1,slide+(Math.abs(info.offset.x)>40?(info.offset.x<0?1:-1):0)));move(next);void carousel.start({x:-(stride+24)*next,transition});setTimeout(()=>{dragged.current=false;},0);}}>
          {media.map((item,i)=><motion.div key={item.title} className="media-slide" role="group" aria-roledescription="slide" aria-label={`${i+1} of ${media.length}: ${item.title}`} animate={{scale:i===slide?1:0.95,opacity:i===slide?1:0.5}} transition={transition}>
            <VideoPreview media={item} active={i===slide&&!lightbox} reduced={reduced} />
            {item.src && <button className="media-open" tabIndex={i===slide?0:-1} aria-label={`Watch ${item.title} with audio`} onClick={() => {if(!dragged.current)setLightbox(item);}}><span className="fc:rounded-full fc:bg-blue-600 fc:p-5"><Play /></span></button>}
          </motion.div>)}
        </motion.div></div>
        <div className="media-controls fc:mt-6 fc:flex fc:items-center fc:justify-center fc:gap-3"><button aria-label="Previous walkthrough" disabled={slide===0} onClick={()=>move(slide-1)}><ChevronLeft size={18}/></button>{media.map((item,i)=><button key={item.title} aria-label={`Show ${item.title}`} aria-current={i===slide} onClick={()=>move(i)} />)}<button aria-label="Next walkthrough" disabled={slide>=media.length-1} onClick={()=>move(slide+1)}><ChevronRight size={18}/></button></div>
      </div>
      <AnimatePresence>{lightbox && <VideoLightbox key="lightbox" media={lightbox} close={()=>setLightbox(null)} />}</AnimatePresence>
    </div>
  </section>;
}




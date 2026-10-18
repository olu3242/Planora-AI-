"use client";
import { useRef, useState } from "react";

type View = "Command Center" | "Accounting" | "Tax" | "FP&A" | "AI Agents";
const dashboards: Record<View,{headline:string; metrics:[string,string][]; queue:string[]}> = {
  "Command Center":{headline:"Every finance workflow, one place.",metrics:[["Open tasks","18"],["Approvals","4"],["Completed workflows","42"]],queue:["Review month-end exceptions","Approve reconciled transactions","Review cash-flow outlook"]},
  Accounting:{headline:"Books that stay ready for review.",metrics:[["Matched items","96%"],["Exceptions","8"],["Draft journals","12"]],queue:["Inspect unmatched bank items","Review suggested journal entries","Complete close checklist"]},
  Tax:{headline:"Keep obligations visible.",metrics:[["Upcoming deadlines","3"],["Draft workpapers","6"],["Review items","5"]],queue:["Review tax categorization","Check filing checklist","Validate supporting documents"]},
  "FP&A":{headline:"Make the next decision with context.",metrics:[["Forecasts","4"],["Scenarios","3"],["Variance alerts","2"]],queue:["Compare forecast scenarios","Review operating expenses","Inspect cash assumptions"]},
  "AI Agents":{headline:"Automation with human oversight.",metrics:[["Agent runs","24"],["Awaiting approval","2"],["Exceptions","3"]],queue:["Reconciliation agent: review needed","Bookkeeping agent: draft prepared","Close agent: awaiting approval"]}
};
const features = [
  {title:"Bank reconciliation",category:"Accounting OS",description:"Match records and surface exceptions for review."},
  {title:"Month-end close",category:"Workflow OS",description:"Coordinate tasks, dependencies and approvals."},
  {title:"Tax readiness",category:"Tax & Compliance",description:"Organize obligations and review supporting workpapers."},
  {title:"Cash forecasting",category:"FP&A",description:"Compare cash scenarios and investigate variance."},
  {title:"Governed AI agents",category:"Agent Runtime",description:"Make execution, escalation and approval visible."}
];
const audiences = [
  {name:"Growing businesses",description:"Organize day-to-day finance without disconnected tools."},
  {name:"Accounting firms",description:"Manage client work, reviews and recurring processes."},
  {name:"Enterprise finance teams",description:"Coordinate reporting, controls and multi-entity operations."},
  {name:"Merchants and informal businesses",description:"Simplify recordkeeping and prepare for local compliance."}
];
const shell:React.CSSProperties={maxWidth:1160,margin:"0 auto",padding:"0 24px"};
const button:React.CSSProperties={background:"#173C34",color:"#fff",border:0,borderRadius:12,padding:"12px 18px",cursor:"pointer",fontWeight:700};
const card:React.CSSProperties={background:"#fff",border:"1px solid #E0E7E2",borderRadius:18,padding:20};
export default function ExperiencePage(){
  const [view,setView]=useState<View>("Command Center");
  const [slide,setSlide]=useState(0);
  const [playing,setPlaying]=useState(false);
  const video=useRef<HTMLVideoElement>(null);
  const selected=dashboards[view];
  const move=(direction:number)=>setSlide(current=>(current+direction+features.length)%features.length);
  return <main style={{background:"#F6F7F3",color:"#173C34",fontFamily:"Inter,Arial,sans-serif",minHeight:"100vh"}}>
    <header style={{...shell,display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:22,paddingBottom:22,gap:20,flexWrap:"wrap"}}>
      <a href="/" style={{fontWeight:800,fontSize:25,color:"inherit",textDecoration:"none"}}>planora</a>
      <nav aria-label="Experience navigation" style={{display:"flex",gap:18,flexWrap:"wrap",fontSize:14}}>
        <a href="#dashboards">Dashboards</a><a href="#video">Video</a><a href="#solutions">Solutions</a><a href="#companies">Who it's for</a>
      </nav>
      <a href="/login" style={{...button,textDecoration:"none"}}>Get started</a>
    </header>
    <section style={{...shell,paddingTop:78,paddingBottom:68}}>
      <p style={{color:"#287C64",fontSize:13,fontWeight:800,letterSpacing:2}}>PLANORA PRODUCT EXPERIENCE</p>
      <h1 style={{fontSize:"clamp(40px,6vw,76px)",lineHeight:1.08,maxWidth:850,letterSpacing:"-0.045em",margin:"16px 0"}}>Your finance operations.<br/>Working together.</h1>
      <p style={{fontSize:19,maxWidth:650,lineHeight:1.6,color:"#53675D"}}>Explore how accounting, tax, forecasting and governed automation come together in one connected finance workspace.</p>
      <div style={{display:"flex",gap:12,flexWrap:"wrap",marginTop:26}}><a href="#dashboards" style={{...button,textDecoration:"none"}}>Explore dashboards</a><a href="#video" style={{...button,background:"transparent",border:"1px solid #A8BBB0",color:"#173C34",textDecoration:"none"}}>Watch product story</a></div>
    </section>
    <section id="dashboards" style={{...shell,paddingTop:40,paddingBottom:75}}>
      <p style={{color:"#287C64",fontWeight:800}}>INTERACTIVE PRODUCT PREVIEW</p>
      <h2 style={{fontSize:"clamp(28px,4vw,46px)",margin:"10px 0 25px"}}>One workspace. Multiple perspectives.</h2>
      <div role="tablist" aria-label="Dashboard preview" style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:18}}>
        {(Object.keys(dashboards) as View[]).map(name=><button key={name} type="button" role="tab" aria-selected={view===name} onClick={()=>setView(name)} style={{...button,background:view===name?"#173C34":"#fff",color:view===name?"#fff":"#173C34",border:"1px solid #C8D8CE"}}>{name}</button>)}
      </div>
      <div role="tabpanel" aria-label={view+" preview"} style={{...card,boxShadow:"0 18px 55px #173C3414",padding:28}}>
        <div style={{display:"flex",justifyContent:"space-between",gap:16,flexWrap:"wrap",alignItems:"center"}}><div><p style={{fontSize:12,fontWeight:800,color:"#287C64"}}>{view.toUpperCase()}</p><h3 style={{fontSize:27,margin:"7px 0 0"}}>{selected.headline}</h3></div><span style={{background:"#E7F4EC",borderRadius:30,padding:"8px 12px",fontSize:12}}>Illustrative demo</span></div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,margin:"25px 0"}}>
          {selected.metrics.map(([name,value])=><div key={name} style={{background:"#F3F7F3",borderRadius:14,padding:18}}><div style={{fontSize:13,color:"#53675D"}}>{name}</div><div style={{fontSize:30,fontWeight:800,marginTop:8}}>{value}</div></div>)}
        </div>
        <div style={{...card,background:"#FAFCFA"}}><h4 style={{margin:"0 0 12px"}}>Work queue</h4>{selected.queue.map((item,i)=><div key={item} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderTop:"1px solid #E4ECE6",color:"#40594A"}}><span aria-hidden="true" style={{color:"#287C64"}}>{i===0?"◷":"✓"}</span>{item}</div>)}</div>
        <p style={{fontSize:12,color:"#66766C",marginBottom:0}}>Sample values and scenarios only. No customer data or live operational information is exposed.</p>
      </div>
    </section>
    <section id="video" style={{background:"#173C34",color:"#fff",padding:"76px 0"}}>
      <div style={shell}><p style={{color:"#A8DEC4",fontWeight:800}}>SEE HOW IT WORKS</p><h2 style={{fontSize:"clamp(30px,4vw,48px)",margin:"10px 0"}}>A guided product story.</h2><p style={{color:"#D0E0D6",maxWidth:680}}>See the journey from incoming finance data to an AI-assisted recommendation and a human approval.</p>
      <div style={{border:"1px solid #547469",borderRadius:22,overflow:"hidden",background:"#234D40",marginTop:26}}>
        <video ref={video} controls playsInline preload="none" poster="/brand/planora-mark.svg" onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} style={{width:"100%",maxHeight:520,background:"#14362D"}}><source src="/media/planora-product-overview.mp4" type="video/mp4"/>Your browser does not support HTML video.</video>
        <div style={{padding:20,display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}><span>{playing?"Playing product video":"Product walkthrough — video pending publication"}</span><span style={{fontSize:12,color:"#D0E0D6"}}>Video player ready; no fabricated footage</span></div>
      </div></div>
    </section>
    <section id="solutions" style={{...shell,paddingTop:86,paddingBottom:86}}>
      <p style={{color:"#287C64",fontWeight:800}}>EXPLORE THE PLATFORM</p><h2 style={{fontSize:"clamp(30px,4vw,48px)",margin:"10px 0 28px"}}>From busywork to better decisions.</h2>
      <div aria-roledescription="carousel" aria-label="Planora solutions" style={{...card,padding:30}}>
        <div aria-live="polite" style={{minHeight:160}}><p style={{fontWeight:800,color:"#287C64"}}>{features[slide].category} · {slide+1} / {features.length}</p><h3 style={{fontSize:33,margin:"12px 0"}}>{features[slide].title}</h3><p style={{fontSize:18,color:"#53675D"}}>{features[slide].description}</p></div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}><button type="button" onClick={()=>move(-1)} aria-label="Previous solution" style={button}>← Previous</button><div style={{display:"flex",gap:6}}>{features.map((feature,i)=><button key={feature.title} type="button" aria-label={"Show "+feature.title} aria-current={i===slide?"true":undefined} onClick={()=>setSlide(i)} style={{width:10,height:10,borderRadius:20,border:0,background:i===slide?"#173C34":"#B6C9BB",cursor:"pointer"}}/>)}</div><button type="button" onClick={()=>move(1)} aria-label="Next solution" style={button}>Next →</button></div>
      </div>
    </section>
    <section id="companies" style={{background:"#EDF3ED",padding:"80px 0"}}><div style={shell}>
      <p style={{color:"#287C64",fontWeight:800}}>BUILT FOR YOUR TEAM</p><h2 style={{fontSize:"clamp(30px,4vw,48px)",margin:"10px 0 12px"}}>Finance work happens everywhere.</h2>
      <p style={{color:"#53675D",marginBottom:25}}>These are the types of organizations Planora is designed to serve, not a list of verified customers.</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:16}}>{audiences.map(a=><article key={a.name} style={card}><h3 style={{fontSize:20}}>{a.name}</h3><p style={{color:"#53675D",lineHeight:1.6}}>{a.description}</p></article>)}</div>
      <p style={{fontSize:13,color:"#53675D",marginTop:22}}>Customer logos, testimonials and results will appear only after verification and permission.</p>
    </div></section>
    <footer style={{...shell,paddingTop:40,paddingBottom:45,display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:16}}><strong>planora</strong><span style={{fontSize:13,color:"#53675D"}}>Public product preview · Illustrative content</span><a href="/">Return home</a></footer>
  </main>;
}

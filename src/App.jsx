import React,{useEffect,useRef,useState} from 'react'
import {Canvas} from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'; import {ScrollTrigger} from 'gsap/ScrollTrigger'
import World,{STOPS} from './Scene.jsx'; import {loadIndex,loadReport} from './data.js'
gsap.registerPlugin(ScrollTrigger)
const CH=[['State of the US Market','A tiny town tour · scroll to explore'],['Downtown','Index towers · height = YTD'],['Sector Ring · East','Growth & cyclicals'],['Sector Ring · West','Defensives & rate-sensitives'],['Market Square','The CPI price board & balloon'],['Rates Ride','Fed funds → 2Y → 10Y'],['The Jobs Works','Unemployment & commodities'],['Town Forecast','Outlook, risks & sources']]
export default function App(){const [d,setD]=useState(null),[err,setErr]=useState(null);const progress=useRef(0);const view=useRef({yaw:0,pitch:0,zoom:1,ty:0,tp:0,tz:1,chapter:0,free:false});const [free,setFreeS]=useState(false)
 const setFree=on=>{view.current.free=on;view.current.setFree?.(on);setFreeS(on);document.body.classList.toggle('free',on);if(!on){view.current.ty=0;view.current.tp=0;view.current.tz=1}}
 const zoomBy=f=>{const v=view.current;v.tz=THREE.MathUtils.clamp(v.tz*f,0.4,1.8)}
 const resetView=()=>{const v=view.current;v.ty=0;v.tp=0;v.tz=1}
 const ptr=useRef(new Map()),pinch=useRef(null)
 const onDown=e=>{if(view.current.free)return;if(e.pointerType==='mouse'&&e.button!==0)return;ptr.current.set(e.pointerId,{x:e.clientX,y:e.clientY});if(ptr.current.size===2){const [p1,p2]=[...ptr.current.values()];pinch.current={d:Math.hypot(p1.x-p2.x,p1.y-p2.y),z:view.current.tz}}}
 const onMove=e=>{if(view.current.free)return;const P=ptr.current,o=P.get(e.pointerId);if(!o)return;const v=view.current;const n={x:e.clientX,y:e.clientY};const dx=n.x-o.x,dy=n.y-o.y;P.set(e.pointerId,n)
  if(P.size===2&&pinch.current){const [p1,p2]=[...P.values()];const dd=Math.hypot(p1.x-p2.x,p1.y-p2.y);v.tz=THREE.MathUtils.clamp(pinch.current.z*pinch.current.d/Math.max(dd,1),0.4,1.8);v.ty=THREE.MathUtils.clamp(v.ty-dx*0.0025,-0.9,0.9);v.tp=THREE.MathUtils.clamp(v.tp+dy*0.0025,-0.45,0.45)}
  else if(e.pointerType==='mouse'){v.ty=THREE.MathUtils.clamp(v.ty-dx*0.005,-0.9,0.9);v.tp=THREE.MathUtils.clamp(v.tp+dy*0.004,-0.45,0.45)}}
 const onUp=e=>{ptr.current.delete(e.pointerId);if(ptr.current.size<2)pinch.current=null}
 useEffect(()=>{const w=e=>{if(view.current.free||!e.ctrlKey)return;e.preventDefault();zoomBy(Math.exp(e.deltaY*0.01))};addEventListener('wheel',w,{passive:false});return()=>removeEventListener('wheel',w)},[])
 const [index,setIndex]=useState(null),[date,setDate]=useState(null),[notice,setNotice]=useState(null)
 const open=async(idx,want,push)=>{try{const r=await loadReport(idx,want);setD(r.d);setDate(r.date);setNotice(r.notice)
  const u=new URL(location.href);if(r.date&&!r.notice&&(want||push))u.searchParams.set('date',r.date);else u.searchParams.delete('date')
  if(push)history.pushState({date:r.date},'',u);else history.replaceState({date:r.date},'',u)}catch(e){setErr(e.message)}}
 useEffect(()=>{loadIndex().then(idx=>{setIndex(idx);open(idx,new URLSearchParams(location.search).get('date'),false)});const pop=()=>loadIndex().then(idx=>open(idx,new URLSearchParams(location.search).get('date'),false));addEventListener('popstate',pop);return()=>removeEventListener('popstate',pop)},[])
 const dates=(index?.reports||[]).map(r=>r.date),di=dates.indexOf(date)
 useEffect(()=>{if(!d)return;const st=ScrollTrigger.create({trigger:'#scroll',start:'top top',end:'bottom bottom',scrub:true,onUpdate:s=>progress.current=s.progress})
  gsap.utils.toArray('.chip').forEach(c=>gsap.from(c,{y:40,duration:.5,scrollTrigger:{trigger:c,start:'top 80%'}}));return()=>ScrollTrigger.getAll().forEach(t=>t.kill())},[d])
 if(err) return <div className="loading">Couldn't load the report ({err})</div>
 if(!d) return <div className="loading">Building the tiny town…</div>
 return <>{notice&&<div className="notice" role="status">{notice}<button onClick={()=>setNotice(null)} aria-label="Dismiss">✕</button></div>}<Canvas className="stage" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onPointerLeave={onUp} shadows camera={{position:STOPS[0][0],fov:32,near:0.5,far:300}} dpr={location.search.includes('shot')?1:[1,1.75]} gl={{antialias:false,powerPreference:'high-performance'}}><World key={date||"x"} d={d} progress={progress} view={view}/></Canvas>
 <div className="viewbar" onPointerDown={e=>e.stopPropagation()}>{!free&&dates.length>0&&<div className="datebar" title="Report archive"><button className="vb" disabled={di<=0} onClick={()=>open(index,dates[di-1],true)} aria-label="Previous report">‹</button><select className="vb" value={date||''} onChange={e=>open(index,e.target.value,true)} aria-label="Report date">{[...index.reports].reverse().map(r=><option key={r.date} value={r.date}>{r.date}{r.date===index.latest?' (latest)':''}{r.mood?' · '+r.mood:''}</option>)}</select><button className="vb" disabled={di<0||di>=dates.length-1} onClick={()=>open(index,dates[di+1],true)} aria-label="Next report">›</button></div>}{free?<><button className="vb primary" onClick={()=>setFree(false)}>✕ Exit free view</button><span className="vhint">Drag rotate · Right-drag/2-finger pan · Wheel/pinch zoom · WASD move</span></>:<><button className="vb primary" onClick={()=>setFree(true)} title="Explore the town freely">🧭 Free view</button><button className="vb" onClick={()=>zoomBy(0.8)} title="Zoom in">＋</button><button className="vb" onClick={()=>zoomBy(1.25)} title="Zoom out">－</button><button className="vb" onClick={resetView} title="Reset view">⟲</button></>}</div>
 <div id="scroll">{CH.map(([t,s],i)=><section key={i} className="section"><div className={'chip'+(i===0?' hero':'')}><div className="kicker">{String(i+1).padStart(2,'0')} / {CH.length}</div><h2>{t}</h2><p>{s}{i===0?` · closes ${d.as_of??'n/a'}`:''}</p>
  {(i===2||i===3)&&<div className="takes">{(d.sectors||[]).slice(i===2?0:6,i===2?6:11).map(x=><p key={x.proxy_etf}><b>{x.sector} ({x.proxy_etf})</b> {x.take||''}</p>)}<p className="small">Hover a district sign for its take.</p></div>}
  {i===0&&d.as_of_note&&<p className="small">{d.as_of_note}</p>}
  {i===CH.length-1&&<details><summary>Sources ({(d.sources||[]).length})</summary>{(d.sources||[]).map(s=><div key={s.url}><a href={s.url} target="_blank">{s.name}</a></div>)}</details>}
  {i===CH.length-1&&<p className="small">Generated {d.generated_at_utc??'n/a'} · report {date??'latest'}</p>}</div></section>)}</div></>}

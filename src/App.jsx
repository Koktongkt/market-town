import React,{useEffect,useRef,useState} from 'react'
import {Canvas} from '@react-three/fiber'
import gsap from 'gsap'; import {ScrollTrigger} from 'gsap/ScrollTrigger'
import World,{STOPS} from './Scene.jsx'; import {loadData} from './data.js'
gsap.registerPlugin(ScrollTrigger)
const CH=[['State of the US Market','A tiny town tour · scroll to explore'],['Downtown','Index towers · height = YTD'],['Sector Ring · East','Growth & cyclicals'],['Sector Ring · West','Defensives & rate-sensitives'],['Market Square','The CPI price board & balloon'],['Rates Ride','Fed funds → 2Y → 10Y'],['The Jobs Works','Unemployment & commodities'],['Town Forecast','Outlook, risks & sources']]
export default function App(){const [d,setD]=useState(null),[err,setErr]=useState(null);const progress=useRef(0)
 useEffect(()=>{loadData().then(setD).catch(e=>setErr(e.message))},[])
 useEffect(()=>{if(!d)return;const st=ScrollTrigger.create({trigger:'#scroll',start:'top top',end:'bottom bottom',scrub:true,onUpdate:s=>progress.current=s.progress})
  gsap.utils.toArray('.chip').forEach(c=>gsap.from(c,{y:40,duration:.5,scrollTrigger:{trigger:c,start:'top 80%'}}));return()=>ScrollTrigger.getAll().forEach(t=>t.kill())},[d])
 if(err) return <div className="loading">Couldn't load data.json ({err})</div>
 if(!d) return <div className="loading">Building the tiny town…</div>
 return <><Canvas className="stage" shadows camera={{position:STOPS[0][0],fov:32,near:0.5,far:300}} dpr={location.search.includes('shot')?1:[1,1.75]} gl={{antialias:false,powerPreference:'high-performance'}}><World d={d} progress={progress}/></Canvas>
 <div id="scroll">{CH.map(([t,s],i)=><section key={i} className="section"><div className={'chip'+(i===0?' hero':'')}><div className="kicker">{String(i+1).padStart(2,'0')} / {CH.length}</div><h2>{t}</h2><p>{s}{i===0?` · closes ${d.as_of??'n/a'}`:''}</p>
  {(i===2||i===3)&&<div className="takes">{(d.sectors||[]).slice(i===2?0:6,i===2?6:11).map(x=><p key={x.proxy_etf}><b>{x.sector} ({x.proxy_etf})</b> {x.take||''}</p>)}<p className="small">Hover a district sign for its take.</p></div>}
  {i===0&&d.as_of_note&&<p className="small">{d.as_of_note}</p>}
  {i===CH.length-1&&<details><summary>Sources ({(d.sources||[]).length})</summary>{(d.sources||[]).map(s=><div key={s.url}><a href={s.url} target="_blank">{s.name}</a></div>)}</details>}
  {i===CH.length-1&&<p className="small">Generated {d.generated_at_utc??'n/a'} · refresh to reload data.json</p>}</div></section>)}</div></>}

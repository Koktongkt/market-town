import React,{useRef,useMemo,useState,useLayoutEffect} from 'react'
import {useFrame,useThree} from '@react-three/fiber'
import {Text as DText,Billboard,RoundedBox,Instances,Instance,Environment,Lightformer,Html} from '@react-three/drei'
import {EffectComposer,Bloom,Vignette,SMAA,N8AO} from '@react-three/postprocessing'
import * as THREE from 'three'
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import {num,pct,val,parseRange,cpiIsSeptember} from './data.js'
import {textures,facadeBox,rng} from './tex.js'
import Crowd,{buildAgents} from './Crowd.jsx'
const FONT_B='fonts/fredoka-latin-600-normal.woff',FONT='fonts/inter-latin-500-normal.woff'
const Text=({fontWeight,...p})=><DText font={fontWeight===700?FONT_B:FONT} {...p}/>
const C={mint:'#5ED6A0',coral:'#FF7A6B',sky:'#7CC4FF',butter:'#FFD66B',lilac:'#B9A4FF',ink:'#2B2440',cream:'#FFF6E9',wood:'#A8744A',roof:'#D9634F'}
const SLOT=k=>-Math.PI/2+k*Math.PI/6, R=15
const polar=(a,r)=>[Math.cos(a)*r,0,Math.sin(a)*r]
export const STOPS=[[[34,30,40],[0,0,0]],[[-15,19,15],[0,10.5,-14]],[[36,21,8],[14,2,0]],[[-36,21,-8],[-14,2,0]],
 [[5,10,13],[0,4,-1]],[[38,18,44],[21,5,22]],[[-36,11,38],[-21,2,22]],[[0,30,44],[0,19,-8]]]
const FACTORY={o:[-21,0,22],ry:0.5}

/* ---------- generic static instancing ---------- */
function Inst({geo,items,mat,cast=true,receive=false}){const ref=useRef()
 useLayoutEffect(()=>{const m=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),c=new THREE.Color();items.forEach((it,i)=>{m.compose(new THREE.Vector3(...it.p),q.setFromEuler(e.set(it.rx||0,it.ry||0,it.rz||0)),new THREE.Vector3(...(Array.isArray(it.s)?it.s:[it.s??1,it.s??1,it.s??1])));ref.current.setMatrixAt(i,m);if(it.c)ref.current.setColorAt(i,c.set(it.c))})
  ref.current.instanceMatrix.needsUpdate=true;if(ref.current.instanceColor)ref.current.instanceColor.needsUpdate=true;ref.current.computeBoundingSphere()},[items])
 return <instancedMesh ref={ref} args={[geo,mat,Math.max(1,items.length)]} castShadow={cast} receiveShadow={receive}/>}

/* ---------- signs ---------- */
function Sign({position,lines,w=4.2,color=C.butter,post=1.6,size=0.32,onOver,onOut}){const pitch=size*1.45,h=0.35+lines.length*pitch
 return <group position={position}><mesh position={[0,post/2,0]} castShadow><cylinderGeometry args={[0.06,0.07,post,8]}/><meshStandardMaterial color="#5A5A66" metalness={0.7} roughness={0.35}/></mesh>
 <Billboard position={[0,post+h/2,0]} lockX lockZ><group onPointerOver={onOver} onPointerOut={onOut}><RoundedBox args={[w+0.12,h+0.12,0.1]} radius={0.08} position={[0,0,-0.03]}><meshStandardMaterial color={C.ink}/></RoundedBox><RoundedBox args={[w,h,0.12]} radius={0.07} castShadow><meshStandardMaterial color={color} roughness={0.6} emissive={color} emissiveIntensity={0.45}/></RoundedBox>
 {lines.map((l,i)=><Text key={i} position={[0,h/2-0.18-pitch*0.5-i*pitch,0.08]} fontSize={i===0?size*1.1:size*0.9} color={l.c||C.ink} anchorX="center" anchorY="middle" fontWeight={i===0?700:400} outlineWidth={size*0.03} outlineColor={color}>{l.t}</Text>)}</group></Billboard></group>}

/* ---------- materials ---------- */
function useFacadeMats(){const T=textures();return useMemo(()=>{const mk=(type,color)=>{const f=T.facades[type];return new THREE.MeshStandardMaterial({color,map:f.map,roughnessMap:f.orm,metalnessMap:f.orm,metalness:1,roughness:1,emissiveMap:f.emi,emissive:'#FFC874',emissiveIntensity:0.05,envMapIntensity:1.3})};return {mk,list:[]}},[])}

/* ---------- city layout ---------- */
function layout(d){const r=rng(5),B=[],roofs=[],ac=[],tanks=[],eyes=[],mouths=[],benches=[],lamps=[],planters=[],districts=[]
 ;(d.sectors||[]).slice(0,11).forEach((s,idx)=>{const k=idx+1,a=SLOT(k),ytd=num(s.change_ytd_pct),m1=num(s.change_1m_pct),up=(m1??0)>=0
  const base=ytd==null?2:THREE.MathUtils.clamp(1.6+ytd/7,1,7.5);const col=ytd==null?'#CFC8D8':up?(ytd>15?'#4FCB93':'#86DDB3'):(ytd<0?'#F06A57':'#FF9F86')
  const type=base>4.5?'glass':idx%2?'brick':'concrete';const ry=-a+Math.PI/2,cs=Math.cos(ry),sn=Math.sin(ry),[cx,,cz]=polar(a,R)
  const W=(x,z)=>[cx+x*cs+z*sn,0,cz-x*sn+z*cs]
  const lots=[[-1.45,-1.15,1],[1.35,-1.25,0.75],[-1.35,1.35,0.6],[1.45,1.25,0.85],[0,0.1,1.2]]
  lots.forEach((L,i)=>{const w=1.15+r()*0.35,dd=1.1+r()*0.3,h=Math.max(0.9,base*L[2]*(0.85+r()*0.3));const p=W(L[0],L[1]);const tone=i%2?col:new THREE.Color(col).offsetHSL(0,-0.05,-0.08).getStyle()
   B.push({p,w,d:dd,h,ry,type,tone,k});roofs.push({p:[p[0],h+0.07,p[2]],ry,s:[w+0.1,0.14,dd+0.1],c:ytd==null?'#CFC8D8':up?'#2FBF7A':'#F0503C'})
   if(r()<0.7)ac.push({p:[p[0]+(r()-0.5)*w*0.5,h+0.24,p[2]+(r()-0.5)*dd*0.4],ry,s:[0.32,0.22,0.28]});if(type!=='glass'&&r()<0.35)tanks.push({p:[p[0],h+0.12,p[2]],s:1})
   if(i===4){const fy=Math.min(h-0.45,1.7);[-0.2,0.2].forEach(x=>{const q=W(L[0]+x,L[1]-dd/2-0.02);eyes.push({p:[q[0],fy+0.14,q[2]],ry:ry+Math.PI,s:1})});const q=W(L[0],L[1]-dd/2-0.02);mouths.push({p:[q[0],fy-0.06,q[2]],ry:ry+Math.PI,rz:up?Math.PI:0,s:1})}})
  const front=polar(a,11.3);benches.push({p:W(1.8,-3.4),ry:ry+Math.PI,busy:up?1:2});planters.push({p:W(-2.6,-3.3),c:up?'#FF9FB2':'#C9A0FF'},{p:W(2.7,3),c:'#FFD66B'})
  districts.push({s,k,a,ytd,m1,up,base,front:[front[0],front[2]],W,col})})
 for(let i=0;i<6;i++){const a=i/6*Math.PI*2+0.5;benches.push({p:[Math.cos(a)*4.6,0,Math.sin(a)*4.6],ry:Math.atan2(-Math.cos(a),-Math.sin(a))+0,busy:1+(i%2)})}
 for(let i=0;i<18;i++){const a=i/18*Math.PI*2;lamps.push({p:[Math.cos(a)*6.3,0,Math.sin(a)*6.3]})}
 for(let i=0;i<28;i++){const a=i/28*Math.PI*2+0.05;lamps.push({p:[Math.cos(a)*21.8,0,Math.sin(a)*21.8]})}
 for(let i=0;i<8;i++){const a=i/8*Math.PI*2+0.2;lamps.push({p:[Math.cos(a)*5.05,0,Math.sin(a)*5.05]});planters.push({p:[Math.cos(a+0.2)*5,0,Math.sin(a+0.2)*5],c:['#FF9FB2','#FFD66B','#C9A0FF'][i%3]})}
 const stalls=[1.05,1.57,2.09].map((a,i)=>({p:[Math.cos(a)*3.5,0,Math.sin(a)*3.5],ry:Math.atan2(Math.cos(a),Math.sin(a))+Math.PI,c:[C.coral,C.sky,C.mint][i]}))
 // benches face: ry such that sitter forward = +z local rotated; compute simple
 benches.forEach(b=>{if(b.ry==null)b.ry=0})
 return {B,roofs,ac,tanks,eyes,mouths,benches,lamps,planters,districts,stalls}}

/* ---------- district buildings ---------- */
function Buildings({L,matsRef}){const {mk}=useFacadeMats()
 const mats=useMemo(()=>{const m={};L.B.forEach(b=>{const key=b.type+b.tone;if(!m[key])m[key]=mk(b.type,b.tone)});matsRef.current.push(...Object.values(m));return m},[L])
 const geos=useMemo(()=>L.B.map(b=>facadeBox(b.w,b.h,b.d)),[L])
 return <>{L.B.map((b,i)=><mesh key={i} geometry={geos[i]} material={mats[b.type+b.tone]} position={[b.p[0],b.h/2,b.p[2]]} rotation-y={b.ry} castShadow receiveShadow/>)}
  <Inst geo={G.box} items={L.roofs} mat={MAT.roofLit}/><Inst geo={G.box} items={L.ac} mat={MAT.metal}/><Inst geo={G.tank} items={L.tanks} mat={MAT.wood}/>
  <Inst geo={G.eye} items={L.eyes} mat={MAT.ink} cast={false}/><Inst geo={G.mouth} items={L.mouths} mat={MAT.ink} cast={false}/></>}
function DistrictSigns({L}){const [hov,setHov]=useState(-1)
 return <>{L.districts.map((dd,i)=>{const p=dd.W(0,-3.6);return <group key={i}>
  <Sign position={p} w={5.4} post={Math.max(2.4,dd.base*1.2+0.9)} size={0.42} color={dd.up?'#E9FFF3':'#FFECE6'} onOver={e=>{e.stopPropagation();setHov(i);document.body.style.cursor='help'}} onOut={()=>{setHov(-1);document.body.style.cursor=''}}
   lines={[{t:dd.s.sector??'Sector'},{t:`${dd.s.proxy_etf??''} · YTD ${pct(dd.ytd,1)} · 1M ${pct(dd.m1,1)}`,c:dd.up?'#0F7A47':'#B8321F'}]}/>
  {hov===i&&dd.s.take&&<Html position={[p[0],Math.max(2.4,dd.base*1.2+0.9)+2.2,p[2]]} center style={{pointerEvents:'none'}}><div className="tip"><b>{dd.s.sector}</b><br/>{dd.s.take}</div></Html>}
  <mesh rotation-x={-Math.PI/2} position={[...polar(dd.a,R)].map((v,j)=>j===1?0.025:v)} receiveShadow><planeGeometry args={[6.4,6.4]}/><meshStandardMaterial color={dd.up?'#A8E6B8':'#F5C2B4'} emissive={dd.up?'#5ED6A0':'#FF7A6B'} emissiveIntensity={0.18} roughness={0.95}/></mesh></group>})}</>}

/* ---------- shared geos/mats ---------- */
const G={box:new THREE.BoxGeometry(1,1,1),tank:mergeGeometries([new THREE.CylinderGeometry(0.22,0.22,0.35,10).translate(0,0.4,0),new THREE.ConeGeometry(0.25,0.15,10).translate(0,0.65,0),...[[-1,-1],[1,1],[1,-1],[-1,1]].map(([x,z])=>new THREE.BoxGeometry(0.03,0.25,0.03).translate(x*0.14,0.12,z*0.14))]),
 eye:new THREE.CircleGeometry(0.07,12),mouth:new THREE.TorusGeometry(0.11,0.028,6,14,Math.PI),
 trunk:new THREE.CylinderGeometry(0.07,0.1,0.6,6).translate(0,0.3,0),cone:new THREE.ConeGeometry(0.48,1.2,7).translate(0,1.05,0),round:new THREE.IcosahedronGeometry(0.55,1).translate(0,1.05,0),
 bench:mergeGeometries([new THREE.BoxGeometry(0.9,0.05,0.3).translate(0,0.3,0),new THREE.BoxGeometry(0.9,0.25,0.04).translate(0,0.48,-0.14),...[-0.4,0.4].map(x=>new THREE.BoxGeometry(0.04,0.3,0.28).translate(x,0.15,0))]),
 lampPole:mergeGeometries([new THREE.CylinderGeometry(0.035,0.05,1.5,6).translate(0,0.75,0),new THREE.CylinderGeometry(0.12,0.08,0.06,8).translate(0,1.52,0)]),lampBulb:new THREE.SphereGeometry(0.11,10,8).translate(0,1.62,0),
 planter:new THREE.BoxGeometry(0.6,0.3,0.6).translate(0,0.15,0),bush:new THREE.IcosahedronGeometry(0.3,1).translate(0,0.42,0)}
const MAT={white:new THREE.MeshStandardMaterial({color:'#fff',roughness:0.8}),roofLit:new THREE.MeshBasicMaterial({color:'#fff',toneMapped:false}),metal:new THREE.MeshStandardMaterial({color:'#B9BCC6',metalness:0.8,roughness:0.35}),wood:new THREE.MeshStandardMaterial({color:C.wood,roughness:0.8}),ink:new THREE.MeshBasicMaterial({color:C.ink}),
 leaf:new THREE.MeshStandardMaterial({color:'#fff',roughness:0.85,flatShading:true}),bark:new THREE.MeshStandardMaterial({color:'#7A5235',roughness:1}),
 iron:new THREE.MeshStandardMaterial({color:'#3A3D4A',metalness:0.7,roughness:0.4}),lit:new THREE.MeshStandardMaterial({color:'#FFF6D0',emissive:'#FFC85A',emissiveIntensity:0.2}),stone:new THREE.MeshStandardMaterial({color:'#CFC6B6',roughness:0.9})}

function StreetProps({L}){return <>
 <Inst geo={G.bench} items={L.benches} mat={MAT.wood}/><Inst geo={G.lampPole} items={L.lamps} mat={MAT.iron}/><Inst geo={G.lampBulb} items={L.lamps} mat={MAT.lit} cast={false}/>
 <Inst geo={G.planter} items={L.planters} mat={MAT.stone}/><Inst geo={G.bush} items={L.planters.map(p=>({...p,c:'#5DAE4F'}))} mat={MAT.leaf}/>
 <Inst geo={G.bush} items={L.planters.map(p=>({p:[p.p[0]+0.12,p.p[1]+0.15,p.p[2]],s:0.4,c:p.c}))} mat={MAT.leaf}/></>}

function Trees(){const items=useMemo(()=>{const r=rng(7),out=[];const ok=p=>!(Math.hypot(p[0]-21,p[2]-22)<10||Math.hypot(p[0]+21,p[2]-22)<10)
  for(let i=0;i<170;i++){const a=r()*Math.PI*2,rr=23.5+r()*11;const p=[Math.cos(a)*rr,0,Math.sin(a)*rr];if(ok(p))out.push({p,s:0.8+r()*0.8,ry:r()*6,c:['#5DBB57','#7FCB5E','#4FA84E','#F2B05E','#E98A4A'][i%5],round:r()<0.45})}
  for(let k=0;k<12;k++){const a=SLOT(k)+Math.PI/12;for(let j=0;j<3;j++){const p=polar(a+(j-1)*0.05,11+j*3.2);out.push({p,s:0.6+r()*0.3,ry:0,c:'#5DBB57',round:true})}}
  return out},[])
 return <><Inst geo={G.trunk} items={items} mat={MAT.bark}/><Inst geo={G.cone} items={items.filter(t=>!t.round)} mat={MAT.leaf}/><Inst geo={G.round} items={items.filter(t=>t.round)} mat={MAT.leaf}/></>}

function Car({r,speed,phase,color,lane}){const ref=useRef();useFrame(({clock})=>{const a=phase+clock.elapsedTime*speed;ref.current.position.set(Math.cos(a)*(r+lane),0,Math.sin(a)*(r+lane));ref.current.rotation.y=-a-(speed>0?0:Math.PI)})
 return <group ref={ref}><RoundedBox args={[0.5,0.3,0.95]} radius={0.08} position={[0,0.24,0]} castShadow><meshPhysicalMaterial color={color} clearcoat={1} roughness={0.35} metalness={0.2}/></RoundedBox><RoundedBox args={[0.44,0.24,0.5]} radius={0.06} position={[0,0.48,-0.05]}><meshPhysicalMaterial color="#9EC4E8" metalness={0.5} roughness={0.08}/></RoundedBox></group>}
function Smoke({p,dark}){const g=useRef();useFrame(({clock})=>{g.current.children.forEach((m,i)=>{const t=(clock.elapsedTime*0.35+i/8)%1;m.position.set(Math.sin(i*2+t*3)*0.3*t,t*4,0);m.scale.setScalar(0.25+t*0.9);m.material.opacity=0.7*(1-t)})})
 return <group ref={g} position={p}>{Array.from({length:8}).map((_,i)=><mesh key={i}><icosahedronGeometry args={[0.5,1]}/><meshStandardMaterial color={dark?'#8E8A98':'#F2F0F5'} transparent depthWrite={false} flatShading/></mesh>)}</group>}
function Birds(){const g=useRef();useFrame(({clock})=>{const t=clock.elapsedTime;g.current.children.forEach((b,i)=>{const a=t*0.25+i*0.5;b.position.set(Math.cos(a)*(10+i),13+Math.sin(t+i)*0.6,Math.sin(a)*(10+i)-4);b.rotation.y=-a;b.children.forEach((w,j)=>w.rotation.z=(j?-1:1)*(0.4+Math.sin(t*10+i)*0.4))})})
 return <group ref={g}>{Array.from({length:7}).map((_,i)=><group key={i}>{[1,-1].map(s=><mesh key={s} position={[s*0.18,0,0]}><boxGeometry args={[0.36,0.03,0.12]}/><meshStandardMaterial color={C.ink}/></mesh>)}</group>)}</group>}
function Cloud({p,s=1,dark,label}){const ref=useRef();useFrame(({clock})=>{ref.current.position.x=p[0]+Math.sin(clock.elapsedTime*0.1+p[2])*2})
 return <group ref={ref} position={p} scale={s}>{[[0,0,0,1.2],[1.1,-0.2,0.2,0.9],[-1.1,-0.2,0,0.85],[0.4,0.5,-0.2,0.8]].map((q,i)=><mesh key={i} position={q.slice(0,3)}><icosahedronGeometry args={[q[3],1]}/><meshStandardMaterial color={dark?'#A3A8BB':'#FFFFFF'} flatShading roughness={1}/></mesh>)}
 {label&&<Billboard position={[0,-1.9,0]}><RoundedBox args={[7.2,1.1,0.08]} radius={0.15}><meshStandardMaterial color="#fff" transparent opacity={0.92}/></RoundedBox><Text position={[0,0,0.06]} fontSize={0.42} maxWidth={7} textAlign="center" color={C.ink} anchorY="middle">{label}</Text></Billboard>}</group>}

/* ---------- downtown ---------- */
function Downtown({d,matsRef}){const ix=(d.indices||[]).slice(0,4);const [cx,,cz]=polar(SLOT(0),R-1);const T=textures()
 const tints=['#9FCBEB','#C3B4F0','#F2D27A','#F4B2C8']
 const mats=useMemo(()=>{const ms=tints.map(c=>{const f=T.facades.glass;const m=new THREE.MeshStandardMaterial({color:c,map:f.map.clone(),roughnessMap:f.orm,metalnessMap:f.orm,metalness:1,roughness:1,emissiveMap:f.emi.clone(),emissive:'#FFC874',emissiveIntensity:0.05,envMapIntensity:1.5});m.map.repeat.set(7,1);m.emissiveMap.repeat.set(7,1);return m});matsRef.current.push(...ms);return ms},[])
 return <group position={[cx,0,cz]}>{ix.map((t,i)=>{const ytd=num(t.change_ytd_pct),m1=num(t.change_1m_pct);const h=ytd==null?5:4+ytd/1.6;const x=(i-1.5)*3.5,up=(m1??0)>=0
  const m=mats[i];m.map.repeat.set(7,h/1.4);m.emissiveMap.repeat.set(7,h/1.4)
  return <group key={i} position={[x,0,i%2?0.8:-0.6]}><mesh position={[0,0.3,0]} receiveShadow castShadow><cylinderGeometry args={[1.25,1.35,0.6,i%2?6:8]}/><meshStandardMaterial color="#D8D2C8" map={T.concrete}/></mesh>
   <mesh position={[0,h/2+0.6,0]} castShadow receiveShadow material={m}><cylinderGeometry args={[0.85,1.0,h,i%2?6:8]}/></mesh>
   <mesh position={[0,h+0.7,0]}><cylinderGeometry args={[0.9,0.9,0.18,i%2?6:8]}/><meshStandardMaterial color="#F4F1EC"/></mesh>
   <mesh position={[0,h+1.35,0]} castShadow><coneGeometry args={[0.85,1.2,i%2?6:8]}/><meshStandardMaterial color={up?C.mint:C.coral} metalness={0.4} roughness={0.35}/></mesh>
   <mesh position={[0,h+2.25,0]}><sphereGeometry args={[0.15,10,10]}/><meshStandardMaterial color="#fff" emissive={up?C.mint:C.coral} emissiveIntensity={3}/></mesh>
   <Billboard position={[0,h+3.9,0]}><RoundedBox args={[3.3,1.6,0.1]} radius={0.08}><meshStandardMaterial color={C.cream} emissive={C.cream} emissiveIntensity={0.4}/></RoundedBox>
    <Text position={[0,0.42,0.07]} fontSize={0.38} fontWeight={700} color={C.ink}>{(t.name||t.symbol||'').replace(' Industrial Average','').replace(' Composite','')}</Text>
    <Text position={[0,0.0,0.07]} fontSize={0.34} color={C.ink}>{num(t.level)?.toLocaleString()??'n/a'}</Text>
    <Text position={[0,-0.42,0.07]} fontSize={0.25} color={(ytd??0)>=0?'#0F7A47':'#B8321F'}>{`YTD ${pct(ytd,1)} · 1M ${pct(m1,1)} · 1D ${pct(t.change_1d_pct)}`}</Text></Billboard></group>})}
  <Sign position={[0,0,3.4]} w={4.2} lines={[{t:'DOWNTOWN · Index Towers'},{t:'height = YTD · crown = 1M'}]} size={0.34}/></group>}

/* ---------- market square ---------- */
function Balloon({p,alt,color,ghost,label}){const ref=useRef();useFrame(({clock})=>{ref.current.position.y=alt+Math.sin(clock.elapsedTime*1.1+p[0])*0.2;ref.current.rotation.y=clock.elapsedTime*0.2})
 const stripes=[color,'#FFFFFF'];return <group position={p}>
  <mesh position={[0,alt/2,0]}><cylinderGeometry args={[0.01,0.01,alt]}/><meshBasicMaterial color={C.ink} transparent opacity={0.5}/></mesh>
  <group ref={ref}>{Array.from({length:8}).map((_,i)=><mesh key={i} rotation-y={i*Math.PI/4} castShadow={!ghost}><sphereGeometry args={[1.3,8,16,0,Math.PI/4]}/><meshPhysicalMaterial color={stripes[i%2]} transparent={ghost} opacity={ghost?0.45:1} roughness={0.5} sheen={1}/></mesh>)}
   <mesh position={[0,-1.75,0]} castShadow><cylinderGeometry args={[0.35,0.3,0.4,10]}/><meshStandardMaterial color={C.wood} transparent={ghost} opacity={ghost?0.45:1}/></mesh>
   <Billboard position={[0,2.2,0]}><RoundedBox args={[3.6,0.7,0.08]} radius={0.06}><meshStandardMaterial color={ghost?C.lilac:C.butter}/></RoundedBox><Text position={[0,0,0.06]} fontSize={0.3} fontWeight={700} color={C.ink}>{label}</Text></Billboard></group></group>}
function Square({d,L}){const m=d.macro||{};const T=textures();const yoy=num(m.cpi_headline_yoy?.value);const cons=m.cpi_september_consensus;const fr=parseRange(cons?.headline_yoy);const showF=!cpiIsSeptember(m)&&fr
 const per=m.cpi_headline_yoy?.period||m.cpi_headline_yoy?.date||'latest';const alt=v=>3+v*1.6
 return <group>
  <mesh rotation-x={-Math.PI/2} position={[0,0.03,0]} receiveShadow><circleGeometry args={[5.4,48]}/><meshStandardMaterial map={T.paving} roughness={0.85}/></mesh>
  <mesh position={[0,0.25,0]} castShadow receiveShadow><cylinderGeometry args={[1.3,1.4,0.5,24]}/><meshStandardMaterial color="#E4DED4" map={T.concrete}/></mesh><mesh position={[0,0.52,0]}><cylinderGeometry args={[1.15,1.15,0.04,24]}/><meshPhysicalMaterial color="#7CC4FF" roughness={0.05} metalness={0.1} transmission={0.2} clearcoat={1}/></mesh><mesh position={[0,0.9,0]}><cylinderGeometry args={[0.12,0.2,0.8,10]}/><meshStandardMaterial color="#E4DED4"/></mesh>
  <group position={[0,0,-3.2]}>{[-2.6,2.6].map(x=><mesh key={x} position={[x,1.4,0]} castShadow><boxGeometry args={[0.2,2.8,0.2]}/><meshStandardMaterial color="#5A5A66" metalness={0.7} roughness={0.35}/></mesh>)}
   <RoundedBox args={[6.2,3.3,0.25]} radius={0.1} position={[0,3.9,-0.05]} castShadow><meshStandardMaterial color={C.ink}/></RoundedBox><RoundedBox args={[6,3.1,0.2]} radius={0.1} position={[0,3.9,0]}><meshStandardMaterial color={C.cream}/></RoundedBox>
   <Text position={[0,5.05,0.12]} fontSize={0.42} fontWeight={700} color={C.ink}>PRICE BOARD · CPI</Text>
   <RoundedBox args={[2.8,1.9,0.05]} radius={0.06} position={[-1.45,3.7,0.12]}><meshStandardMaterial color={C.butter}/></RoundedBox>
   <Text position={[-1.45,4.35,0.16]} fontSize={0.21} fontWeight={700} color={C.ink}>{`${per.toUpperCase()} · ACTUAL`}</Text>
   <Text position={[-1.45,3.8,0.16]} fontSize={0.58} fontWeight={700} color={C.ink}>{val(yoy,'%')}</Text>
   <Text position={[-1.45,3.2,0.16]} fontSize={0.17} color={C.ink} maxWidth={2.6} textAlign="center">{`headline y/y · m/m ${val(m.cpi_headline_mom?.value,'%')}\ncore ${val(m.core_cpi_yoy?.value,'%')} y/y · ${val(m.core_cpi_mom?.value,'%')} m/m`}</Text>
   {showF?<><RoundedBox args={[2.8,1.9,0.05]} radius={0.06} position={[1.45,3.7,0.12]}><meshStandardMaterial color={C.lilac}/></RoundedBox>
   <Text position={[1.45,4.35,0.16]} fontSize={0.18} fontWeight={700} color={C.ink}>SEP · FORECAST (consensus)</Text>
   <Text position={[1.45,3.8,0.16]} fontSize={0.5} fontWeight={700} color={C.ink}>{fr.txt+'%'}</Text>
   <Text position={[1.45,3.2,0.16]} fontSize={0.17} color={C.ink} maxWidth={2.6} textAlign="center">{`m/m ${cons.headline_mom??'n/a'}% · core ${cons.core_yoy??'n/a'}% y/y\nout ${cons.release?new Date(cons.release).toLocaleString('en-US',{timeZone:'America/New_York',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})+' ET':'n/a'}`}</Text></>
   :<Text position={[1.45,3.7,0.16]} fontSize={0.22} color={C.ink} maxWidth={2.6} textAlign="center">Latest print shown. No pending forecast.</Text>}</group>
  {yoy!=null&&<Balloon p={[-3,0,1]} alt={alt(yoy)} color={C.coral} label={`${per} actual ${yoy}%`}/>}
  {showF&&<Balloon p={[3.2,0,0.5]} alt={alt(fr.mid)} color={C.lilac} ghost label={`Sep FORECAST ${fr.txt}%`}/>}
  {[1,2,3,4,5].map(v=><Text key={v} position={[-5,alt(v),1]} fontSize={0.3} color={C.ink} outlineWidth={0.02} outlineColor="#fff">{`— ${v}%`}</Text>)}
  {L.stalls.map((s,i)=><group key={i} position={s.p} rotation-y={s.ry}><mesh position={[0,0.45,0]} castShadow><boxGeometry args={[1.1,0.9,0.6]}/><meshStandardMaterial color="#F4EADB" roughness={0.8}/></mesh>
   {[-0.5,0.5].map(x=><mesh key={x} position={[x,0.9,0.3]}><cylinderGeometry args={[0.025,0.025,1.0]}/><meshStandardMaterial color="#555"/></mesh>)}
   <mesh position={[0,1.45,0.15]} rotation-x={0.35} castShadow><boxGeometry args={[1.3,0.05,0.9]}/><meshStandardMaterial color={s.c}/></mesh>
   {[-0.3,0,0.3].map((x,j)=><mesh key={j} position={[x,0.95,0.1]}><sphereGeometry args={[0.1,8,8]}/><meshStandardMaterial color={['#FF5A4E','#FFC83D','#6FCF5A'][j]}/></mesh>)}</group>)}
 </group>}

/* ---------- rates coaster ---------- */
function Coaster({d}){const m=d.macro||{};const ffr=m.fed_funds_target_range||{};const lo=num(ffr.lower),hi=num(ffr.upper);const ff=lo!=null&&hi!=null?(lo+hi)/2:null;const y2=num(m.us_2y_yield?.value),y10=num(m.us_10y_yield?.value)
 const hs=[ff,y2,y10].map(v=>v==null?1.5:Math.max(1.5,(v-3)*4+2))
 const curve=useMemo(()=>{const p=[[-7,0.6,3],[-6,hs[0],0],[-4,1.2,-1.5],[-1,hs[1],-1],[1,1.5,1],[4,hs[2],0],[6.5,1,-1.5],[7,0.7,2.5],[3,0.7,4],[-3,0.7,4.2]];return new THREE.CatmullRomCurve3(p.map(q=>new THREE.Vector3(...q)),true)},[hs.join()])
 const cart=useRef();const tmp=new THREE.Vector3();useFrame(({clock})=>{const t=(clock.elapsedTime*0.05)%1;cart.current.position.copy(curve.getPointAt(t));curve.getPointAt((t+0.005)%1,tmp);cart.current.lookAt(tmp)})
 const supports=useMemo(()=>Array.from({length:44}).map((_,i)=>{const p=curve.getPointAt(i/44);return {p:[p.x,p.y/2,p.z],s:[0.07,p.y,0.07]}}),[curve])
 const peaks=[[-6,hs[0],0,'FED FUNDS',lo!=null?`${lo}–${hi}%`:'n/a'],[-1,hs[1],-1,'2Y YIELD',val(y2,'%')],[4,hs[2],0,'10Y YIELD',val(y10,'%')]]
 return <group position={[21,0,22]} rotation-y={-0.5}>
  <mesh rotation-x={-Math.PI/2} position={[0,0.03,0]} receiveShadow><circleGeometry args={[9,40]}/><meshStandardMaterial map={textures().paving} color="#D6ECF7"/></mesh>
  <mesh castShadow><tubeGeometry args={[curve,260,0.14,8,true]}/><meshStandardMaterial color={C.coral} metalness={0.5} roughness={0.3}/></mesh>
  <Inst geo={G.box} items={supports} mat={MAT.white}/>
  <group ref={cart}><RoundedBox args={[0.6,0.45,0.9]} radius={0.12} position={[0,0.3,0]}><meshPhysicalMaterial color={C.butter} clearcoat={1}/></RoundedBox>{[-0.12,0.12].map(x=><mesh key={x} position={[x,0.65,0]}><sphereGeometry args={[0.1,8,8]}/><meshStandardMaterial color="#FFD9B8"/></mesh>)}</group>
  {peaks.map(([x,y,z,t,v],i)=><group key={i} position={[x,y,z]}><mesh position={[0,0.8,0]}><cylinderGeometry args={[0.03,0.03,1.6]}/><meshStandardMaterial color="#555"/></mesh><mesh position={[0.35,1.4,0]}><boxGeometry args={[0.7,0.4,0.02]}/><meshStandardMaterial color={[C.sky,C.lilac,C.coral][i]}/></mesh>
   <Billboard position={[0,2.5,0]}><RoundedBox args={[2.6,1.1,0.08]} radius={0.06}><meshStandardMaterial color={C.cream}/></RoundedBox><Text position={[0,0.22,0.06]} fontSize={0.27} fontWeight={700} color={C.ink}>{t}</Text><Text position={[0,-0.2,0.06]} fontSize={0.4} fontWeight={700} color={C.ink}>{v}</Text></Billboard></group>)}
  <FerrisWheel p={[-5,0,-6]}/>
  <Sign position={[0,0,6.6]} w={5.2} lines={[{t:'RATES RIDE'},{t:'peak height = yield (scale from 3%)'},...(d.macro?.next_fomc?[{t:`next FOMC ${d.macro.next_fomc.value??d.macro.next_fomc.date??''}`}]:[])]} size={0.34}/>
 </group>}
function FerrisWheel({p}){const w=useRef();useFrame((_,dt)=>w.current.rotation.z+=dt*0.2)
 return <group position={p}><mesh position={[0,2,0]}><boxGeometry args={[0.15,4,0.15]}/><meshStandardMaterial color="#fff"/></mesh><group ref={w} position={[0,4,0]}><mesh><torusGeometry args={[2.4,0.06,6,32]}/><meshStandardMaterial color={C.lilac} metalness={0.5} roughness={0.3}/></mesh>{Array.from({length:8}).map((_,i)=>{const a=i/8*Math.PI*2;return <group key={i}><mesh rotation-z={a}><boxGeometry args={[4.8,0.04,0.04]}/><meshStandardMaterial color="#fff"/></mesh><mesh position={[Math.cos(a)*2.4,Math.sin(a)*2.4,0]}><boxGeometry args={[0.4,0.35,0.35]}/><meshStandardMaterial color={[C.coral,C.butter,C.mint,C.sky][i%4]}/></mesh></group>})}</group></group>}

/* ---------- factory ---------- */
function Factory({d,matsRef}){const u=num(d.macro?.unemployment_rate?.value);const mood=d.mood?.overall;const T=textures()
 const hall=useMemo(()=>{const f=T.facades.brick;const m=new THREE.MeshStandardMaterial({color:'#E6A08A',map:f.map,roughnessMap:f.orm,metalnessMap:f.orm,metalness:1,roughness:1,emissiveMap:f.emi,emissive:'#FFC874',emissiveIntensity:0.05});matsRef.current.push(m);return m},[])
 return <group position={FACTORY.o} rotation-y={FACTORY.ry}>
  <mesh rotation-x={-Math.PI/2} position={[0,0.03,0]} receiveShadow><planeGeometry args={[16,14]}/><meshStandardMaterial map={T.concrete} color="#D8D0C2"/></mesh>
  <mesh position={[0,1.5,-2]} castShadow receiveShadow geometry={useMemo(()=>facadeBox(8,3,4),[])} material={hall}/>
  {[0,1,2,3].map(i=><mesh key={i} position={[-3+i*2,3.5,-2]} rotation-z={Math.PI/4} castShadow><boxGeometry args={[1.4,1.4,4]}/><meshStandardMaterial color={i%2?'#7F8798':'#9AA3B5'} metalness={0.6} roughness={0.4}/></mesh>)}
  {[-2.5,2.5].map(x=><group key={x}><mesh position={[x,3.8,-3.5]} castShadow><cylinderGeometry args={[0.35,0.45,4.6,12]}/><meshStandardMaterial color="#B7533F" roughness={0.9}/></mesh><Smoke p={[x,6.3,-3.5]} dark={mood==='bear'}/></group>)}
  <mesh position={[0,0.6,0.02]}><planeGeometry args={[1.2,1.2]}/><meshStandardMaterial color="#5B5470"/></mesh>
  <mesh position={[0,3.4,0.05]}><planeGeometry args={[4,0.6]}/><meshStandardMaterial color={C.cream}/></mesh><Text position={[0,3.4,0.08]} fontSize={0.36} fontWeight={700} color={C.ink}>JOBS WORKS Co.</Text>
  <Sign position={[4.6,0,4.6]} w={5.6} lines={[{t:'HIRING BOARD'},{t:`Unemployment ${val(u,'%')} (${d.macro?.unemployment_rate?.period??''})`,c:'#9E2414'},...(()=>{const pr=d.macro?.nonfarm_payrolls??d.macro?.payrolls;const v=num(pr?.value);return v==null?[]:[{t:`payrolls ${v>0?'+':''}${v}${pr.unit&&pr.unit!=='%'?' '+pr.unit:''}${pr.period?' ('+pr.period+')':''}`}]})(),{t:`coral walkers = 1 in ${u?Math.round(100/u):'?'} job-hunting`}]} size={0.36}/>
  <group position={[-5.5,0,4.5]}>{[0,1,2].map(i=><mesh key={i} position={[i*0.6,0.35,0]} castShadow><cylinderGeometry args={[0.25,0.25,0.7,12]}/><meshStandardMaterial color="#2F2F3A" metalness={0.6} roughness={0.4}/></mesh>)}<mesh position={[0.6,0.12,1]}><boxGeometry args={[0.7,0.25,0.35]}/><meshStandardMaterial color="#FFC83D" metalness={1} roughness={0.25}/></mesh>
   <Sign position={[0.6,0,-1]} w={5} lines={[{t:'COMMODITY YARD'},{t:`WTI $${val(d.macro?.wti?.value)} · Brent $${val(d.macro?.brent?.value)}`},{t:`Gold $${num(d.macro?.gold?.value)?.toLocaleString()??'n/a'} · DXY ${val(d.macro?.dxy?.value)}`}]} size={0.34} post={1.2}/></group>
 </group>}

/* ---------- island ---------- */
function Island(){const T=textures();return <group>
  <mesh position={[0,-1.5,0]} receiveShadow><cylinderGeometry args={[36,30,3,64]}/><meshStandardMaterial map={T.rock} roughness={1}/></mesh>
  <mesh rotation-x={-Math.PI/2} position={[0,0.005,0]} receiveShadow><circleGeometry args={[36,64]}/><meshStandardMaterial map={T.grass} roughness={1}/></mesh>
  {[7.6,20.4].map(r=><group key={r}><mesh rotation-x={-Math.PI/2} position={[0,0.02,0]} receiveShadow><ringGeometry args={[r-1,r+1,96]}/><meshStandardMaterial map={T.asphalt} roughness={0.9}/></mesh>
   {[r-1.15,r+1.15].map(q=><mesh key={q} rotation-x={-Math.PI/2} position={[0,0.035,0]} receiveShadow><ringGeometry args={[q-0.18,q+0.18,96]}/><meshStandardMaterial color="#D9D3C7" map={T.concrete}/></mesh>)}
   <mesh rotation-x={-Math.PI/2} position={[0,0.03,0]}><ringGeometry args={[r-0.04,r+0.04,96]}/><meshBasicMaterial color="#FFF3B0"/></mesh></group>)}
  {Array.from({length:12}).map((_,i)=>{const a=SLOT(i)+Math.PI/12;return <mesh key={i} rotation-x={-Math.PI/2} rotation-z={-a} position={[Math.cos(a)*14,0.018,Math.sin(a)*14]} receiveShadow><planeGeometry args={[12,1.2]}/><meshStandardMaterial map={T.asphalt} color="#B9B6C4"/></mesh>})}
  <mesh rotation-x={-Math.PI/2} position={[0,0.02,-30]}><circleGeometry args={[4,32]}/><meshPhysicalMaterial color="#6FB6EE" roughness={0.05} clearcoat={1}/></mesh>
 </group>}

/* ---------- weather & light ---------- */
function Weather({d,progress,matsRef}){const {scene}=useThree();const sun=useRef(),hemi=useRef();const mood=d.mood?.overall||'neutral'
 const skyA=new THREE.Color('#BFE3F7'),skyB=new THREE.Color('#F6B38E'),skyC=new THREE.Color('#5B4C86'),c=new THREE.Color(),sunA=new THREE.Color('#FFE9C4'),sunB=new THREE.Color('#FF8A4A')
 const moodDim={bull:1.1,neutral:1,bear:0.7}[mood]??1
 useFrame(()=>{const p=progress.current;const a=THREE.MathUtils.lerp(0.35,Math.PI-0.25,p);sun.current.position.set(Math.cos(a)*40,Math.sin(a)*35+6,25)
  c.copy(skyA).lerp(skyB,0.75*THREE.MathUtils.smoothstep(p,0.45,0.85)).lerp(skyC,0.6*THREE.MathUtils.smoothstep(p,0.85,1));if(mood==='bear')c.lerp(new THREE.Color('#7D8196'),0.4)
  scene.background.copy(c);scene.fog.color.copy(c);sun.current.color.copy(sunA).lerp(sunB,0.45*THREE.MathUtils.smoothstep(p,0.5,1));sun.current.intensity=(3-0.9*THREE.MathUtils.smoothstep(p,0.6,1))*moodDim
  hemi.current.intensity=(0.55-0.1*p)*moodDim;scene.environmentIntensity=(0.8-0.15*p)*moodDim;const night=THREE.MathUtils.smoothstep(p,0.6,1)
  matsRef.current.forEach(m=>m.emissiveIntensity=0.03+night*0.45);MAT.lit.emissiveIntensity=0.3+night*5})
 const risks=(d.risks||[]).slice(0,6);const nClouds={bull:3,neutral:7,bear:12}[mood]??7;const r=rng(3);const themes=(d.themes||[]).slice(0,5)
 return <>
  <color attach="background" args={['#BFE3F7']}/><fog attach="fog" args={['#BFE3F7',55,140]}/>
  <Environment resolution={256} frames={1}><Lightformer form="rect" intensity={2.2} color="#FFF4E0" position={[0,20,0]} rotation-x={Math.PI/2} scale={[40,40,1]}/><Lightformer form="rect" intensity={1.2} color="#BFE3FF" position={[-20,8,10]} rotation-y={Math.PI/2} scale={[30,10,1]}/><Lightformer form="rect" intensity={1.5} color="#FFC890" position={[20,6,-10]} rotation-y={-Math.PI/2} scale={[30,8,1]}/><Lightformer form="ring" intensity={3} color="#FFFFFF" position={[10,15,20]} scale={6}/></Environment>
  <hemisphereLight ref={hemi} args={['#ffffff','#C9A27A',0.5]}/>
  <directionalLight ref={sun} castShadow position={[30,30,20]} intensity={3} shadow-mapSize={[2048,2048]} shadow-bias={-0.0003} shadow-normalBias={0.03} shadow-radius={4}>
   <orthographicCamera attach="shadow-camera" args={[-40,40,40,-40,1,130]}/></directionalLight>
  {mood!=='bear'&&<mesh position={[-30,30,-50]}><sphereGeometry args={[3,24,24]}/><meshBasicMaterial color="#FFE48A" toneMapped={false}/></mesh>}
  {Array.from({length:nClouds}).map((_,i)=><Cloud key={'c'+i} p={[(r()-0.5)*80,24+r()*8,-20-r()*30]} s={0.7+r()*0.7} dark={mood==='bear'}/>)}
  {risks.map((t,i)=>{const a=-Math.PI*0.9+i*(Math.PI*0.8/Math.max(1,risks.length-1));return <Cloud key={'r'+i} p={[Math.cos(a)*26,20+(i%2)*3.5,Math.sin(a)*12-16]} s={1.1} dark label={'! '+t}/>})}
  <Billboard position={[0,28.6,-12]}><RoundedBox args={[18.4,9.4,0.2]} radius={0.3}><meshStandardMaterial color={C.cream} emissive={C.cream} emissiveIntensity={0.5}/></RoundedBox>
   <Text position={[0,3.2,0.15]} fontSize={0.9} fontWeight={700} color={C.ink}>{`TOWN FORECAST: ${({bull:'SUNNY (BULL)',bear:'STORMY (BEAR)',neutral:'PARTLY CLOUDY (NEUTRAL)'})[mood]||mood}`}</Text>
   <Text position={[0,2.1,0.15]} fontSize={0.42} maxWidth={17} textAlign="center" color={C.ink}>{d.mood?.reason||''}</Text>
   {themes.map((t,i)=><Text key={i} position={[0,1.1-i*1.05,0.15]} fontSize={0.34} maxWidth={17.2} textAlign="center" anchorY="top" lineHeight={1.15} color={C.ink}>{`• ${t.title}: ${t.explanation}`}</Text>)}</Billboard>
  <Birds/></>}

function Perf(){const {gl}=useThree();useLayoutEffect(()=>{gl.info.autoReset=false},[gl])
 useFrame(()=>{const i=gl.info;window.__perf={calls:i.render.calls,triangles:i.render.triangles,geometries:i.memory.geometries,textures:i.memory.textures,programs:i.programs?.length};i.reset()})
 return null}

export default function World({d,progress}){const matsRef=useRef([]);const L=useMemo(()=>layout(d),[d])
 const agents=useMemo(()=>buildAgents({districts:L.districts,benches:L.benches.map(b=>({...b,ry:b.ry})),stalls:L.stalls,factory:FACTORY,unemp:num(d.macro?.unemployment_rate?.value)}),[L])
 const p=new THREE.Vector3(),l=new THREE.Vector3(),look=useRef(new THREE.Vector3()),a=new THREE.Vector3(),b=new THREE.Vector3()
 useFrame(({camera,clock},dt)=>{const k=1-Math.exp(-Math.min(dt,0.5)*5);const f=progress.current*(STOPS.length-1);const i=Math.min(STOPS.length-2,Math.floor(f)),t=THREE.MathUtils.smootherstep(f-i,0,1)
  p.copy(a.set(...STOPS[i][0])).lerp(b.set(...STOPS[i+1][0]),t);l.copy(a.set(...STOPS[i][1])).lerp(b.set(...STOPS[i+1][1]),t)
  p.y+=Math.sin(clock.elapsedTime*0.4)*0.12;camera.position.lerp(p,k);look.current.lerp(l,k);camera.lookAt(look.current)})
 return <>
  <Perf/><Weather d={d} progress={progress} matsRef={matsRef}/>
  <Island/><Trees/><StreetProps L={L}/><Square d={d} L={L}/><Downtown d={d} matsRef={matsRef}/>
  <Buildings L={L} matsRef={matsRef}/><DistrictSigns L={L}/><Crowd agents={agents}/>
  {Array.from({length:16}).map((_,i)=><Car key={i} r={i<6?7.6:20.4} lane={i%2?0.45:-0.45} speed={(i%2?1:-1)*(i<6?0.18:0.08)} phase={i*1.1} color={['#E85A4F','#4A90D9','#F2C94C','#3FB68B','#9B7FE6','#F4F4F4','#2B2440'][i%7]}/>)}
  <Coaster d={d}/><Factory d={d} matsRef={matsRef}/>
  <EffectComposer multisampling={0} disableNormalPass><N8AO aoRadius={1.2} intensity={2.2} distanceFalloff={0.6} quality="performance" halfRes/><SMAA/><Bloom luminanceThreshold={0.9} intensity={0.55} mipmapBlur/><Vignette darkness={0.3} offset={0.35}/></EffectComposer></>}

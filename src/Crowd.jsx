import React,{useMemo,useRef,useLayoutEffect} from 'react'
import {useFrame} from '@react-three/fiber'
import * as THREE from 'three'
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import {rng} from './tex.js'
const SHIRTS=['#FF7A6B','#7CC4FF','#FFD66B','#5ED6A0','#B9A4FF','#F7A6C8','#FFFFFF','#3E5C8A','#E8833A','#6B8E4E']
const PANTS=['#3B3F58','#5B4636','#2F4F6F','#7A7F8C','#C8B89A']
const SKIN=['#FFD9B8','#F2C29B','#D9A27A','#B07A55','#8A5A3C']
const HAIR=['#2B2440','#5A3A22','#C9A15A','#8A3B24','#DDDDDD','#FF7A6B','#7CC4FF']
const DOGS=['#C98B5A','#FFFFFF','#2B2440','#E8C38A']
const pick=(r,a)=>a[Math.floor(r()*a.length)]
// region helpers
export function buildAgents({districts,benches,stalls,factory,unemp}){const r=rng(42),A=[]
 const base=(o)=>{const kid=r()<0.12;const a={phase:r()*20,shirt:pick(r,SHIRTS),pants:pick(r,PANTS),skin:pick(r,SKIN),hair:pick(r,HAIR),hat:r()<0.25,s:kid?0.72:0.92+r()*0.2,bag:false,dog:null,bike:false,pos:new THREE.Vector3(),yaw:r()*6.28,speed:0.6+r()*0.3,...o};
  if(a.region&&!o.pos){a.pos.copy(rp(a.region))}a.target=a.region?rp(a.region):null;A.push(a);return a}
 const rp=(g)=>{const ang=r()*6.28,rr=g.r0!=null?g.r0+r()*(g.r-g.r0):Math.sqrt(r())*g.r;return new THREE.Vector3(g.c[0]+Math.cos(ang)*rr,0,g.c[1]+Math.sin(ang)*rr)}
 const SQ={c:[0,0],r:4.4,r0:1.9}
 for(let i=0;i<16;i++)base({type:'walk',region:SQ,bag:r()<0.35})
 for(let i=0;i<3;i++)base({type:'dog',region:SQ,dog:pick(r,DOGS)})
 stalls.forEach(st=>{for(let j=0;j<2;j++){const p=new THREE.Vector3(st.p[0]+Math.sin(st.ry)*0.9+(j-0.5)*0.45,0,st.p[2]+Math.cos(st.ry)*0.9);base({type:'shop',pos:p,yaw:st.ry+Math.PI,bag:j===0})}})
 benches.forEach((b,i)=>{const n=b.busy;for(let j=0;j<n;j++){const off=(j-(n-1)/2)*0.42;base({type:'sit',pos:new THREE.Vector3(b.p[0]+Math.cos(b.ry)*off,0,b.p[2]-Math.sin(b.ry)*off),yaw:b.ry})}})
 for(let i=0;i<3;i++){const ang=r()*6.28,c=[Math.cos(ang)*3.4,Math.sin(ang)*3.4];const p1=new THREE.Vector3(c[0]-0.25,0,c[1]),p2=new THREE.Vector3(c[0]+0.25,0,c[1]);base({type:'chat',pos:p1,yaw:Math.PI/2});base({type:'chat',pos:p2,yaw:-Math.PI/2})}
 for(let i=0;i<8;i++)base({type:'jog',loop:{r:i<3?5.5:22.6,dir:i%2?1:-1,a0:r()*6.28},speed:1.6+r()*0.5})
 for(let i=0;i<9;i++)base({type:'cycle',loop:{r:19.3,dir:i%2?1:-1,a0:r()*6.28},speed:2.6+r()*0.8,bike:true})
 districts.forEach(dd=>{const reg={c:dd.front,r:1.6};const up=dd.up
  for(let i=0;i<3;i++)base({type:'walk',region:reg,bag:r()<0.3,speed:up?0.8:0.45})
  if(up){base({type:'jog',loop:{r:11.2,dir:1,a0:dd.a+r()},speed:1.8});base({type:'wave',pos:rp(reg),yaw:dd.a+Math.PI});base({type:'dog',region:reg,dog:pick(r,DOGS)});base({type:'walk',region:reg,bag:true})}
  else{const p=rp(reg);base({type:'chat',pos:p.clone().add(new THREE.Vector3(-0.25,0,0)),yaw:Math.PI/2});base({type:'chat',pos:p.clone().add(new THREE.Vector3(0.25,0,0)),yaw:-Math.PI/2});base({type:'walk',region:reg,speed:0.35})}})
 // factory: queue + leavers (local -> world)
 const {o,ry}=factory,cs=Math.cos(ry),sn=Math.sin(ry),W=(x,z)=>new THREE.Vector3(o[0]+x*cs+z*sn,0,o[2]-x*sn+z*cs)
 const N=40,out=unemp==null?0:Math.max(1,Math.round(unemp/100*N))
 for(let i=0;i<N-out;i++)base({type:'queue',pos:W(-3.6+(i%10)*0.75,1.6+Math.floor(i/10)*0.7),yaw:ry+Math.PI})
 for(let i=0;i<out*2;i++)base({type:'leave',from:W(0.6,0.6),to:W(5,5.5),phase:i/(out*2),shirt:'#FF7A6B'})
 // generic wanderers on the outer lawn ring
 for(let i=0;i<14;i++)base({type:i%4===0?'dog':'walk',region:{c:[0,0],r:26,r0:23},dog:pick(r,DOGS),bag:r()<0.3})
 return A}
const m4=new THREE.Matrix4(),m5=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),v=new THREE.Vector3(),one=new THREE.Vector3(1,1,1),col=new THREE.Color()
function geos(){const body=new THREE.CapsuleGeometry(0.11,0.2,2,6);body.translate(0,0.37,0)
 const head=new THREE.SphereGeometry(0.1,8,6);head.translate(0,0.66,0)
 const hair=new THREE.SphereGeometry(0.106,10,6,0,Math.PI*2,0,Math.PI*0.55);hair.translate(0,0.67,-0.005)
 const hat=mergeGeometries([new THREE.CylinderGeometry(0.15,0.15,0.02,12).translate(0,0.73,0),new THREE.CylinderGeometry(0.08,0.09,0.08,12).translate(0,0.78,0)])
 const limb=new THREE.BoxGeometry(0.065,0.2,0.065);limb.translate(0,-0.1,0)
 const bag=new THREE.BoxGeometry(0.12,0.14,0.07);bag.translate(0,-0.24,0)
 const dog=mergeGeometries([new THREE.BoxGeometry(0.12,0.11,0.28).translate(0,0.15,0),new THREE.BoxGeometry(0.11,0.11,0.12).translate(0,0.23,0.17),new THREE.BoxGeometry(0.03,0.08,0.03).translate(0,0.22,-0.15),...[[-1,-1],[1,-1],[-1,1],[1,1]].map(([x,z])=>new THREE.BoxGeometry(0.03,0.1,0.03).translate(x*0.045,0.05,z*0.1))])
 const bike=mergeGeometries([new THREE.TorusGeometry(0.17,0.022,5,14).rotateY(Math.PI/2).translate(0,0.17,0.3),new THREE.TorusGeometry(0.17,0.022,5,14).rotateY(Math.PI/2).translate(0,0.17,-0.3),new THREE.BoxGeometry(0.03,0.03,0.6).translate(0,0.32,0),new THREE.BoxGeometry(0.03,0.2,0.03).translate(0,0.3,0.25),new THREE.BoxGeometry(0.22,0.025,0.025).translate(0,0.42,0.25)])
 return {body,head,hair,hat,limb,bag,dog,bike}}
export default function Crowd({agents}){const G=useMemo(geos,[]);const N=agents.length
 const refs={body:useRef(),head:useRef(),hair:useRef(),hat:useRef(),leg:useRef(),arm:useRef(),bag:useRef(),dog:useRef(),bike:useRef()}
 const counts={bag:agents.filter(a=>a.bag).length||1,dog:agents.filter(a=>a.dog).length||1,bike:agents.filter(a=>a.bike).length||1,hat:agents.filter(a=>a.hat).length||1}
 useLayoutEffect(()=>{let ib=0,id=0,ih=0;agents.forEach((a,i)=>{refs.body.current.setColorAt(i,col.set(a.shirt));refs.head.current.setColorAt(i,col.set(a.skin));refs.hair.current.setColorAt(i,col.set(a.hair))
  refs.leg.current.setColorAt(i*2,col.set(a.pants));refs.leg.current.setColorAt(i*2+1,col);refs.arm.current.setColorAt(i*2,col.set(a.shirt));refs.arm.current.setColorAt(i*2+1,col)
  if(a.dog)refs.dog.current.setColorAt(id++,col.set(a.dog));if(a.hat)refs.hat.current.setColorAt(ih++,col.set(['#FFD66B','#FF7A6B','#2B2440','#7CC4FF'][i%4]))})
  Object.values(refs).forEach(r=>{if(r.current.instanceColor)r.current.instanceColor.needsUpdate=true})},[agents])
 useFrame(({clock},dt)=>{const t=clock.elapsedTime;dt=Math.min(dt,0.05);let ib=0,id=0,ibk=0,ih=0
  for(let i=0;i<N;i++){const a=agents[i],ph=t+a.phase;let legA=0,armA=0,armR=null,bob=0,seat=0,sitting=false,lift=0
   if(a.type==='walk'||a.type==='dog'){v.subVectors(a.target,a.pos);const dist=v.length();if(dist<0.15){a.target.copy(randIn(a))}else{v.multiplyScalar(1/dist);a.pos.addScaledVector(v,a.speed*dt);a.yaw=lerpAng(a.yaw,Math.atan2(v.x,v.z),0.15)}
    legA=Math.sin(ph*a.speed*11)*0.55;armA=-legA*0.8;bob=Math.abs(Math.sin(ph*a.speed*11))*0.025}
   else if(a.type==='jog'||a.type==='cycle'){const L=a.loop,ang=L.a0+L.dir*t*a.speed/L.r;a.pos.set(Math.cos(ang)*L.r,0,Math.sin(ang)*L.r);a.yaw=Math.atan2(-Math.sin(ang)*L.dir,Math.cos(ang)*L.dir)
    if(a.type==='jog'){legA=Math.sin(ph*13)*0.9;armA=-legA;bob=Math.abs(Math.sin(ph*13))*0.07}else{legA=0;lift=0.2;sitting=false}}
   else if(a.type==='sit'){sitting=true;seat=0.13;armA=Math.sin(ph*0.7)*0.1}
   else if(a.type==='chat'){bob=Math.max(0,Math.sin(ph*3))*0.03;armR=Math.sin(ph*2)>0.6?-1.2+Math.sin(ph*9)*0.3:0;armA=0.1}
   else if(a.type==='shop'){armR=Math.sin(ph*0.8)>0.3?-1.3:0;bob=Math.sin(ph*2)*0.01}
   else if(a.type==='wave'){armR='wave';bob=Math.abs(Math.sin(ph*4))*0.02}
   else if(a.type==='queue'){bob=Math.abs(Math.sin(ph*1.5))*0.012}
   else if(a.type==='leave'){const s=(t*0.08+a.phase)%1;a.pos.lerpVectors(a.from,a.to,s);v.subVectors(a.to,a.from);a.yaw=Math.atan2(v.x,v.z);legA=Math.sin(ph*9)*0.5;armA=-legA}
   q.setFromEuler(e.set(0,a.yaw,0));const sc=v.set(a.s,a.s,a.s);const P=new THREE.Vector3(a.pos.x,bob+lift-(sitting?0.04:0),a.pos.z)
   if(sitting)P.y=0.13;m4.compose(P,q,sc)
   refs.body.current.setMatrixAt(i,m4);refs.head.current.setMatrixAt(i,m4);refs.hair.current.setMatrixAt(i,a.hat?m5.makeScale(0,0,0):m4)
   if(a.hat)refs.hat.current.setMatrixAt(ih++,m4)
   for(let s=0;s<2;s++){const side=s?1:-1
    let la=a.type==='cycle'?Math.sin(ph*a.speed*4+s*Math.PI)*0.6-0.9:(sitting?-1.5:legA*side)
    m5.makeRotationX(la).setPosition(side*0.05,0.19,sitting?0.0:0);refs.leg.current.setMatrixAt(i*2+s,m5.premultiply(m4))
    let aa=armA*side,az=side*0.12
    if(s===1&&armR==='wave'){aa=Math.PI;az=0.3+Math.sin(ph*8)*0.4}else if(s===1&&typeof armR==='number'&&armR!==0)aa=armR
    if(a.type==='cycle')aa=-1.1
    m5.makeRotationFromEuler(e.set(aa,0,az)).setPosition(side*0.14,0.52,0);refs.arm.current.setMatrixAt(i*2+s,m5.premultiply(m4))}
   if(a.bag){m5.makeRotationX(armA).setPosition(0.15,0.52,0);refs.bag.current.setMatrixAt(ib++,m5.premultiply(m4))}
   if(a.dog){const dx=Math.sin(a.yaw+0.6)*0.6,dz=Math.cos(a.yaw+0.6)*0.6;m5.compose(v.set(a.pos.x+dx,Math.abs(Math.sin(ph*9))*0.04,a.pos.z+dz),q,one);refs.dog.current.setMatrixAt(id++,m5)}
   if(a.bike){m5.compose(v.set(a.pos.x,0,a.pos.z),q,one);refs.bike.current.setMatrixAt(ibk++,m5)}}
  Object.values(refs).forEach(r=>r.current.instanceMatrix.needsUpdate=true)})
 const std=c=><meshStandardMaterial color={c||'#fff'} roughness={0.7}/>
 return <group>
  <instancedMesh ref={refs.body} args={[G.body,null,N]} castShadow frustumCulled={false}>{std()}</instancedMesh>
  <instancedMesh ref={refs.head} args={[G.head,null,N]} castShadow frustumCulled={false}>{std()}</instancedMesh>
  <instancedMesh ref={refs.hair} args={[G.hair,null,N]} frustumCulled={false}>{std()}</instancedMesh>
  <instancedMesh ref={refs.hat} args={[G.hat,null,counts.hat]} frustumCulled={false}>{std()}</instancedMesh>
  <instancedMesh ref={refs.leg} args={[G.limb,null,N*2]} castShadow frustumCulled={false}>{std()}</instancedMesh>
  <instancedMesh ref={refs.arm} args={[G.limb,null,N*2]} frustumCulled={false}>{std()}</instancedMesh>
  <instancedMesh ref={refs.bag} args={[G.bag,null,counts.bag]} frustumCulled={false}><meshStandardMaterial color="#E8C38A" roughness={0.9}/></instancedMesh>
  <instancedMesh ref={refs.dog} args={[G.dog,null,counts.dog]} castShadow frustumCulled={false}>{std()}</instancedMesh>
  <instancedMesh ref={refs.bike} args={[G.bike,null,counts.bike]} castShadow frustumCulled={false}><meshStandardMaterial color="#C0392B" metalness={0.6} roughness={0.35}/></instancedMesh>
 </group>}
function randIn(a){const g=a.region,ang=Math.random()*6.28,rr=g.r0!=null?g.r0+Math.random()*(g.r-g.r0):Math.sqrt(Math.random())*g.r;return new THREE.Vector3(g.c[0]+Math.cos(ang)*rr,0,g.c[1]+Math.sin(ang)*rr)}
function lerpAng(a,b,t){let d=((b-a+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;return a+d*t}

import * as THREE from 'three'
const rng=s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}
const cv=(w=512,h=w)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return [c,c.getContext('2d')]}
const tex=(c,srgb=true,rep=[1,1])=>{const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(...rep);t.anisotropy=8;if(srgb)t.colorSpace=THREE.SRGBColorSpace;return t}
function noise(g,w,h,a,seed,col='0,0,0'){const r=rng(seed);for(let i=0;i<w*h/30;i++){g.fillStyle=`rgba(${col},${r()*a})`;g.fillRect(r()*w,r()*h,1+r()*2,1+r()*2)}}
// facade tile = 1 world unit wide x 1.4 tall, 2x2 windows
const WIN=[[0.12,0.1,0.32,0.34],[0.56,0.1,0.32,0.34],[0.12,0.56,0.32,0.34],[0.56,0.56,0.32,0.34]]
function facade(type,seed){const S=512,[c,g]=cv(S),[o,go]=cv(S),[e,ge]=cv(S);const r=rng(seed)
 go.fillStyle='rgb(255,215,0)';go.fillRect(0,0,S,S);ge.fillStyle='#000';ge.fillRect(0,0,S,S)
 if(type==='brick'){g.fillStyle='#E9E2DA';g.fillRect(0,0,S,S);const bh=S/22,bw=S/8;for(let y=0;y<22;y++)for(let x=-1;x<9;x++){const v=200+r()*45;g.fillStyle=`rgb(${v},${v*0.93},${v*0.88})`;g.fillRect(x*bw+(y%2)*bw/2+2,y*bh+2,bw-4,bh-4)}
 }else if(type==='concrete'){g.fillStyle='#E4E2DE';g.fillRect(0,0,S,S);noise(g,S,S,0.12,seed);g.fillStyle='rgba(0,0,0,0.12)';g.fillRect(0,S*0.47,S,6);g.fillRect(0,S*0.97,S,6)}
 else{g.fillStyle='#D8DEE6';g.fillRect(0,0,S,S)}
 const wins=type==='glass'?[[0.04,0.04,0.42,0.86],[0.54,0.04,0.42,0.86]].flatMap(([x,y,w,h])=>[[x,y*0.5,w,0.43],[x,0.5+y*0.5,w,0.43]]):WIN
 wins.forEach(([x,y,w,h])=>{const X=x*S,Y=y*S,W=w*S,H=h*S
  if(type!=='glass'){g.fillStyle='#FFFFFF';g.fillRect(X-6,Y-6,W+12,H+14)}
  const gr=g.createLinearGradient(X,Y,X+W,Y+H);gr.addColorStop(0,'#9FB4CC');gr.addColorStop(0.5,'#5F7591');gr.addColorStop(1,'#B9CBE0');g.fillStyle=gr;g.fillRect(X,Y,W,H)
  g.fillStyle='rgba(255,255,255,0.35)';g.beginPath();g.moveTo(X,Y+H*0.6);g.lineTo(X+W*0.5,Y);g.lineTo(X+W*0.7,Y);g.lineTo(X,Y+H*0.9);g.fill()
  if(type!=='glass'){g.fillStyle='#FFFFFF';g.fillRect(X+W/2-3,Y,6,H);g.fillRect(X,Y+H/2-3,W,6)}
  go.fillStyle='rgb(255,25,200)';go.fillRect(X,Y,W,H)
  if(r()<0.7){ge.fillStyle=`rgb(255,${190+r()*50|0},${110+r()*60|0})`;ge.fillRect(X,Y,W,H)}})
 if(type==='glass'){g.fillStyle='#EEF2F6';g.fillRect(0,S*0.465,S,S*0.035);g.fillRect(0,S*0.965,S,S*0.035);g.fillRect(S*0.48,0,S*0.04,S)}
 return {map:tex(c),orm:tex(o,false),emi:tex(e)}}
let cache=null
export function textures(){if(cache)return cache;const [ga,gg]=cv(512);gg.fillStyle='#8CC56A';gg.fillRect(0,0,512,512);noise(gg,512,512,0.25,3,'40,90,30');noise(gg,512,512,0.2,4,'230,255,190')
 const [as,ag]=cv(256);ag.fillStyle='#5E5D6B';ag.fillRect(0,0,256,256);noise(ag,256,256,0.5,5);noise(ag,256,256,0.25,6,'255,255,255')
 const [pv,pg]=cv(256);pg.fillStyle='#E6D8BC';pg.fillRect(0,0,256,256);for(let y=0;y<8;y++)for(let x=0;x<8;x++){pg.fillStyle=`hsl(38,${35+((x*7+y*3)%5)*4}%,${78+((x+y)%3)*3}%)`;pg.fillRect(x*32+(y%2)*16+1,y*32+1,30,30)}noise(pg,256,256,0.15,7)
 const [rk,rg]=cv(256);rg.fillStyle='#B48A62';rg.fillRect(0,0,256,256);for(let i=0;i<14;i++){rg.fillStyle=`rgba(80,50,30,${0.15+i%3*0.05})`;rg.fillRect(0,i*18+(i%2)*5,256,3)}noise(rg,256,256,0.3,8)
 const [cn,cg]=cv(256);cg.fillStyle='#D9D6D0';cg.fillRect(0,0,256,256);noise(cg,256,256,0.18,9)
 cache={grass:tex(ga,true,[14,14]),asphalt:tex(as,true,[40,40]),paving:tex(pv,true,[4,4]),rock:tex(rk,true,[10,1]),concrete:tex(cn,true,[3,3]),
  facades:{brick:facade('brick',11),concrete:facade('concrete',12),glass:facade('glass',13)}};return cache}
export function facadeBox(w,h,d){const g=new THREE.BoxGeometry(w,h,d);const uv=g.attributes.uv;const dims=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]]
 for(let f=0;f<6;f++)for(let v=0;v<4;v++){const i=f*4+v;uv.setXY(i,uv.getX(i)*dims[f][0],uv.getY(i)*dims[f][1]/1.4)}return g}
export {rng}

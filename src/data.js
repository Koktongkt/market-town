export async function loadData(){ const r=await fetch('data.json?t='+Date.now(),{cache:'no-store'}); if(!r.ok) throw new Error('data.json '+r.status); return r.json() }
export const num=v=>(typeof v==='number'&&isFinite(v))?v:null
export const parseRange=s=>{ if(s==null||s==='') return null; const p=String(s).split('-').map(Number).filter(isFinite); if(!p.length) return null; return {lo:p[0],hi:p[p.length-1],mid:(p[0]+p[p.length-1])/2,txt:String(s)} }
export const pct=(v,d=2)=>{v=num(v);return v==null?'n/a':(v>0?'+':'')+v.toFixed(d)+'%'}
export const val=(v,suf='')=>{v=num(v);return v==null?'n/a':v+suf}
export const get=(o,path)=>path.split('.').reduce((a,k)=>a==null?a:a[k],o)
// CPI is "September" if the period or date says so -> hide forecast
export const cpiIsSeptember=m=>{const c=m?.cpi_headline_yoy;if(!c)return false;return /sep/i.test(c.period||'')||/-09$/.test(c.date||'')}

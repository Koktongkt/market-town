const bust=()=>'?t='+Date.now()
async function getJSON(u){const r=await fetch(u+bust(),{cache:'no-store'});if(!r.ok)throw new Error(u+' '+r.status);return r.json()}
export const DATE_RE=/^\d{4}-\d{2}-\d{2}$/
export async function loadIndex(){try{return await getJSON('data/index.json')}catch{return null}}
// Returns {d,date,notice}. Falls back to latest (then legacy data.json) on a missing/invalid date.
export async function loadReport(index,want){let notice=null;const dates=(index?.reports||[]).map(r=>r.date)
 if(want&&!DATE_RE.test(want)){notice=`"${want}" isn't a valid date (YYYY-MM-DD). Showing the latest report.`;want=null}
 else if(want&&!dates.includes(want)){notice=`No report for ${want}. Showing the latest report.`;want=null}
 if(want)return {d:await getJSON(`data/reports/${want}.json`),date:want,notice}
 try{return {d:await getJSON('data/latest.json'),date:index?.latest??null,notice}}catch{return {d:await getJSON('data.json'),date:null,notice}}}
export async function loadData(){return getJSON('data.json')}
export const num=v=>(typeof v==='number'&&isFinite(v))?v:null
export const parseRange=s=>{ if(s==null||s==='') return null; const p=String(s).split('-').map(Number).filter(isFinite); if(!p.length) return null; return {lo:p[0],hi:p[p.length-1],mid:(p[0]+p[p.length-1])/2,txt:String(s)} }
export const pct=(v,d=2)=>{v=num(v);return v==null?'n/a':(v>0?'+':'')+v.toFixed(d)+'%'}
export const val=(v,suf='')=>{v=num(v);return v==null?'n/a':v+suf}
export const get=(o,path)=>path.split('.').reduce((a,k)=>a==null?a:a[k],o)
// CPI is "September" if the period or date says so -> hide forecast
export const cpiIsSeptember=m=>{const c=m?.cpi_headline_yoy;if(!c)return false;return /sep/i.test(c.period||'')||/-09$/.test(c.date||'')}

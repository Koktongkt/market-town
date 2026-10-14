import fs from 'node:fs'; import path from 'node:path'; import {fileURLToPath} from 'node:url'
import Ajv from 'ajv'; import addFormats from 'ajv-formats'
export const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..')
export const DATA=path.join(ROOT,'public/data'), REPORTS=path.join(DATA,'reports')
export const DATE_RE=/^\d{4}-\d{2}-\d{2}$/
export const readJSON=f=>JSON.parse(fs.readFileSync(f,'utf8'))
export const writeJSON=(f,o)=>fs.writeFileSync(f,JSON.stringify(o,null,2)+'\n')
export const validDate=s=>DATE_RE.test(s)&&!isNaN(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s
const ajv=new Ajv({allErrors:true,strict:false});addFormats(ajv)
export const validateReport=ajv.compile(readJSON(path.join(ROOT,'schema/report.schema.json')))
export const fmtErrors=errs=>(errs||[]).map(e=>`  ${e.instancePath||'/'} ${e.message}${e.params?.allowedValues?' '+JSON.stringify(e.params.allowedValues):''}`).join('\n')
// Extra checks beyond the schema
export function semanticErrors(r){const out=[];const ids=(r.sectors||[]).map(s=>s.proxy_etf);if(new Set(ids).size!==ids.length)out.push('  /sectors duplicate proxy_etf')
 for(const p of r.null_fields||[]){} return out}
export const summary=(date,r)=>({date,as_of:r.as_of,mood:r.mood?.overall??null,title:r.themes?.[0]?.title??null,generated_at_utc:r.generated_at_utc??null})
export function buildIndex(){const files=fs.readdirSync(REPORTS).filter(f=>/^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort()
 const reports=files.map(f=>summary(f.slice(0,10),readJSON(path.join(REPORTS,f))));return {latest:reports.at(-1)?.date??null,count:reports.length,reports}}

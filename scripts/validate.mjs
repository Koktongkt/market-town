#!/usr/bin/env node
// Validates every archived report, index.json consistency, latest.json and data.json alias.
// Usage: node scripts/validate.mjs [extra-file.json ...]   (extra files are schema-checked only)
import fs from 'node:fs'; import path from 'node:path'
import {ROOT,DATA,REPORTS,readJSON,validateReport,fmtErrors,semanticErrors,buildIndex,validDate} from './lib.mjs'
let fail=0;const bad=(m)=>{fail++;console.error('✗ '+m)}
function checkReport(f,label=path.relative(ROOT,f)){let r;try{r=readJSON(f)}catch(e){bad(`${label}: invalid JSON (${e.message})`);return null}
 const ok=validateReport(r);const sem=semanticErrors(r);if(!ok||sem.length){bad(`${label}: schema errors\n${fmtErrors(validateReport.errors)}${sem.length?'\n'+sem.join('\n'):''}`);return null}
 console.log('✓ '+label);return r}
const extra=process.argv.slice(2)
if(extra.length){for(const f of extra)checkReport(path.resolve(f),f);process.exit(fail?1:0)}
if(!fs.existsSync(REPORTS))bad('public/data/reports/ missing')
else{const files=fs.readdirSync(REPORTS).filter(f=>f.endsWith('.json')).sort()
 if(!files.length)bad('no reports in public/data/reports/')
 for(const f of files){const d=f.replace(/\.json$/,'');if(!validDate(d))bad(`reports/${f}: file name is not a valid YYYY-MM-DD date`);checkReport(path.join(REPORTS,f))}
 const ip=path.join(DATA,'index.json');if(!fs.existsSync(ip))bad('public/data/index.json missing')
 else{const idx=readJSON(ip),dates=(idx.reports||[]).map(r=>r.date)
  const sorted=[...dates].sort();if(JSON.stringify(sorted)!==JSON.stringify(dates))bad('index.json reports not sorted ascending by date')
  if(new Set(dates).size!==dates.length)bad('index.json has duplicate dates')
  for(const d of dates)if(!files.includes(d+'.json'))bad(`index.json lists ${d} but reports/${d}.json is missing`)
  for(const f of files)if(!dates.includes(f.slice(0,10)))bad(`reports/${f} is not listed in index.json`)
  const exp=buildIndex();if(JSON.stringify(exp)!==JSON.stringify(idx))bad('index.json is stale (summaries/latest/count differ from reports/); run: node scripts/publish.mjs --reindex')
  const newest=sorted.at(-1);if(idx.latest!==newest)bad(`index.json latest=${idx.latest} but newest date is ${newest}`)
  if(newest&&files.includes(newest+'.json')){const want=fs.readFileSync(path.join(REPORTS,newest+'.json'),'utf8')
   for(const alias of ['public/data/latest.json','public/data.json']){const ap=path.join(ROOT,alias);if(!fs.existsSync(ap))bad(`${alias} missing`);else if(fs.readFileSync(ap,'utf8')!==want)bad(`${alias} is not identical to reports/${newest}.json`);else console.log(`✓ ${alias} == reports/${newest}.json`)}}
  if(!fail)console.log(`✓ index.json consistent (${dates.length} report(s), latest ${idx.latest})`)}}
if(fail){console.error(`\nValidation FAILED (${fail} problem(s))`);process.exit(1)}console.log('\nValidation passed')

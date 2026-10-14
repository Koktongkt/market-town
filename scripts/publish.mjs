#!/usr/bin/env node
// Publish a daily report: node scripts/publish.mjs <data.json> [YYYY-MM-DD] [--no-push]
//   node scripts/publish.mjs --reindex   (rebuild index/latest from reports/, no commit)
// Date defaults to today in America/New_York. Re-running with identical data is a no-op.
// Pushes to origin main using GITHUB_TOKEN from the environment (never stored or printed).
import fs from 'node:fs'; import path from 'node:path'; import {execFileSync} from 'node:child_process'
import {ROOT,DATA,REPORTS,readJSON,writeJSON,validateReport,fmtErrors,semanticErrors,buildIndex,validDate} from './lib.mjs'
const args=process.argv.slice(2),flags=new Set(args.filter(a=>a.startsWith('--'))),pos=args.filter(a=>!a.startsWith('--'))
const die=(m,c=1)=>{console.error('✗ '+m);process.exit(c)}
const git=(...a)=>execFileSync('git',a,{cwd:ROOT,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim()
const CRED=['-c','credential.helper=','-c','credential.helper=!f(){ echo username=x-access-token; echo "password=$GITHUB_TOKEN"; };f']
const gitAuth=(...a)=>execFileSync('git',[...CRED,...a],{cwd:ROOT,encoding:'utf8',stdio:['ignore','pipe','pipe'],env:process.env}).trim()
function writeDerived(){const idx=buildIndex();writeJSON(path.join(DATA,'index.json'),idx)
 if(idx.latest){const src=fs.readFileSync(path.join(REPORTS,idx.latest+'.json'));fs.writeFileSync(path.join(DATA,'latest.json'),src);fs.writeFileSync(path.join(ROOT,'public/data.json'),src)}return idx}
if(flags.has('--reindex')){fs.mkdirSync(REPORTS,{recursive:true});const i=writeDerived();console.log(`reindexed: ${i.count} report(s), latest ${i.latest}`);process.exit(0)}
const [file,dateArg]=pos;if(!file)die('usage: publish.mjs <data.json> [YYYY-MM-DD] [--no-push]',2)
const date=dateArg||new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())
if(!validDate(date))die(`invalid date "${date}" (want YYYY-MM-DD)`,2)
let r;try{r=readJSON(path.resolve(file))}catch(e){die(`cannot read ${file}: ${e.message}`,2)}
if(!validateReport(r)||semanticErrors(r).length)die(`${file} fails schema/report.schema.json:\n${fmtErrors(validateReport.errors)}\n${semanticErrors(r).join('\n')}`,3)
if(r.as_of!==date)console.warn(`! note: report as_of=${r.as_of} differs from publish date ${date}`)
const push=!flags.has('--no-push')
if(push){if(!process.env.GITHUB_TOKEN)die('GITHUB_TOKEN is not set in this process environment',4)
 if(git('rev-parse','--abbrev-ref','HEAD')!=='main')die('repo is not on branch main',5)
 if(git('status','--porcelain'))die(`working tree at ${ROOT} has uncommitted changes; commit or stash them first`,5)
 try{gitAuth('pull','--ff-only','origin','main')}catch(e){die('git pull --ff-only failed: '+e.stderr,6)}}
fs.mkdirSync(REPORTS,{recursive:true});writeJSON(path.join(REPORTS,date+'.json'),r);const idx=writeDerived()
try{execFileSync('node',[path.join(ROOT,'scripts/validate.mjs')],{cwd:ROOT,stdio:'inherit'})}catch{git('checkout','--','public');git('clean','-fdq','public/data');die('archive validation failed; changes reverted',3)}
git('add','public/data','public/data.json')
if(!git('status','--porcelain','public')){console.log(`= ${date} already published with identical content; nothing to do`);process.exit(0)}
if(!push){console.log(`wrote reports/${date}.json (latest ${idx.latest}); --no-push: not committed`);process.exit(0)}
git('-c','user.name=Market Town Publisher','-c','user.email=47135423+Koktongkt@users.noreply.github.com','commit','-qm',`Publish report ${date}`)
try{gitAuth('push','origin','main')}catch(e){die('git push failed (commit kept locally; fix and run `git push`): '+e.stderr,6)}
const sha=git('rev-parse','HEAD');console.log(`✓ published ${date} (${sha.slice(0,7)}); latest is ${idx.latest}`)
console.log('  Actions: https://github.com/Koktongkt/market-town/actions')
console.log(`  Live (~2 min): https://koktongkt.github.io/market-town/?date=${date}`)

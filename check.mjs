import {chromium} from 'playwright'
const url=process.argv[2]
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']})
const p=await b.newPage({viewport:{width:1440,height:900}});const ext=new Set();const errs=[]
p.on('request',r=>{const u=new URL(r.url());if(!r.url().startsWith(url))ext.add(u.host)});p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()))
await p.goto(url,{waitUntil:'load'});await p.waitForTimeout(25000)
await p.screenshot({path:process.argv[3],timeout:180000})
console.log('external hosts:',[...ext].join(',')||'none');console.log('perf',JSON.stringify(await p.evaluate(()=>window.__perf)));console.log('errors:',errs.join(' | ')||'none');await b.close()

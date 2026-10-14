import {chromium} from 'playwright'
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']})
const p=await b.newPage({viewport:{width:1440,height:900}});const errs=[];p.on('console',m=>m.type()==='error'&&errs.push(m.text()));p.on('pageerror',e=>errs.push(e.message))
await p.goto('http://localhost:5173/?shot',{waitUntil:'load'});await p.waitForTimeout(15000)
const names=['v3-01-overview','v3-02-downtown','v3-03-sectors-east','v3-04-sectors-west','v3-05-cpi-square','v3-06-rates-ride','v3-07-jobs-works','v3-08-forecast']
for(const i of [5,6,7]){await p.evaluate(i=>window.scrollTo(0,i*(document.body.scrollHeight-innerHeight)/7),i);await p.waitForTimeout(8000);await p.screenshot({path:`screenshots/${names[i]}.png`,timeout:180000});console.log(names[i],JSON.stringify(await p.evaluate(()=>window.__perf)))}
console.log('ERR',errs.join('\n'));await b.close()

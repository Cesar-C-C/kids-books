// Upgrade a real old installation, retaining HTTP cache, asset cache and old client JS.
// Never unregister, clear storage or directly call registration.update from the test.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),cp=require('node:child_process'),assert=require('node:assert/strict');
const pw=require(process.env.PLAYWRIGHT_MODULE||'../.qa-deps/node_modules/playwright');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f));
const historical=f=>cp.execFileSync('git',['show','87b7b8795bb4c30b5e4f7f0b0b8230621cfd076c:'+f],{cwd:root});
const oldWorker=historical('sw.js'),oldClient=historical('shared/pwa.js');
const raw=read('pwa-assets.js').toString(),catalog=JSON.parse(raw.slice(raw.indexOf('{'),raw.lastIndexOf('}')+1));
const prior=JSON.parse(JSON.stringify(catalog));prior.version='installed-before-new-books';delete prior.books.sound;delete prior.books.soap;
let stage='old';const requests=[];
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://local'),p=u.pathname;requests.push({url:req.url,stage});
 let f=path.resolve(root,'.'+decodeURIComponent(p));if(!f.startsWith(root+path.sep))return res.writeHead(403).end();
 if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');
 res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.mp3':'audio/mpeg'})[path.extname(f)]||'application/octet-stream');
 res.setHeader('Cache-Control',p==='/pwa-assets.js'?'public,max-age=86400':'no-store');
 if(p==='/pwa-assets.js')return res.end(stage==='old'?'self.KB_ASSETS='+JSON.stringify(prior)+';':raw);
 if(p==='/sw.js'&&stage!=='fixed')return res.end(oldWorker);
 if(p==='/shared/pwa.js'&&stage!=='fixed')return res.end(oldClient);
 fs.readFile(f,(e,b)=>e?res.writeHead(404).end():res.end(b));
});
async function status(page){return page.evaluate(()=>new Promise(resolve=>{const c=new MessageChannel();c.port1.onmessage=e=>{c.port1.close();resolve(e.data);};navigator.serviceWorker.controller.postMessage({type:'KB_STATUS'},[c.port2]);}));}
async function waitStatus(page,predicate){const until=Date.now()+90000;let s;do{s=await status(page);if(predicate(s))return s;await page.waitForTimeout(100);}while(Date.now()<until);throw Error('Status timeout '+JSON.stringify(s));}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 const out=path.join(root,'.qa-labs/installed-upgrade');fs.mkdirSync(out,{recursive:true});
 try {
  browser=await pw.chromium.launch({channel:'chrome',headless:true});const context=await browser.newContext({viewport:{width:820,height:1000}});
  await context.addInitScript(()=>{const native=window.matchMedia.bind(window);window.matchMedia=q=>q==='(display-mode: standalone)'?{matches:true,addEventListener(){},removeEventListener(){}}:native(q);});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));const base='http://127.0.0.1:'+server.address().port;
  await page.goto(base+'/index.html');await page.waitForFunction(()=>!!navigator.serviceWorker.controller);await page.locator('#kbFab').click();
  await page.waitForFunction(()=>!document.getElementById('obtn-airplane').disabled);await page.locator('#obtn-airplane').click();
  await waitStatus(page,s=>s.books.airplane.cached===s.books.airplane.total);
  const beforeKeys=await page.evaluate(async()=>Promise.all((await (await caches.open('kb-asset-v1')).keys()).map(async r=>[r.url,Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await (await caches.match(r)).arrayBuffer()))).join(',')])));
  // Reproduce the published bug: new shelf/catalog on server, unchanged old worker,
  // browser may reuse its still-fresh imported manifest. Ordinary reload is insufficient.
  stage='broken';await page.reload();await page.locator('#kbFab').click();await page.waitForTimeout(1800);
  assert.equal((await status(page)).version,prior.version);
  for(const b of ['sound','soap']){assert.equal(await page.locator('#osize-'+b).textContent(),'读取中…');assert(await page.locator('#obtn-'+b).isDisabled());}
  await page.screenshot({path:path.join(out,'before.png')});
  // Serve the fix; keep the same installation and all cached old client files.
  stage='fixed';await page.reload();await page.locator('#kbFab').click();
  const upgraded=await waitStatus(page,s=>s.version===catalog.version);
  assert.equal(upgraded.books.airplane.cached,upgraded.books.airplane.total);
  for(const b of ['sound','soap']){await page.waitForFunction(b=>!document.getElementById('obtn-'+b).disabled,b);assert.equal(await page.locator('#obtn-'+b).textContent(),'下载');await page.locator('#obtn-'+b).click();await waitStatus(page,s=>s.books[b].cached===s.books[b].total);await page.waitForFunction(b=>document.getElementById('obtn-'+b).textContent==='删除',b);}
  const after=await page.evaluate(async()=>{const c=await caches.open('kb-asset-v1');const map={};for(const r of await c.keys())map[r.url]=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await (await c.match(r)).arrayBuffer()))).join(',');return map;});
  for(const [key,hash]of beforeKeys)assert.equal(after[key],hash,'existing download changed '+key);
  assert(requests.some(r=>r.stage==='fixed'&&r.url==='/pwa-assets.js?v='+catalog.version));
  await page.screenshot({path:path.join(out,'after.png')});
  await context.setOffline(true);await page.reload();await page.locator('#kbFab').click();
  for(const b of ['sound','soap'])assert.equal(await page.locator('#obtn-'+b).textContent(),'删除');
  for(const b of ['sound','soap']){await page.goto(base+'/books/'+b+'/');await page.locator('[data-scene-id]').first().waitFor();await page.evaluate(()=>{const Native=window.Audio;window.__played=[];window.Audio=function(src){const a=new Native(src);a.playbackRate=4;const r={src,ended:false,error:false};window.__played.push(r);a.addEventListener('ended',()=>r.ended=true);a.addEventListener('error',()=>r.error=true);return a;};});
   for(const lang of ['zh','en']){if(await page.evaluate(()=>BookUI.lang)!==lang)await page.locator('#language').click();await page.locator('[data-scene-id] button').first().click();await page.waitForFunction(()=>__played.at(-1)?.ended||__played.at(-1)?.error);assert(await page.evaluate(()=>__played.at(-1).ended&&!__played.at(-1).error));}
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({version:catalog.version,reproducedOriginalBug:true,ordinaryReloadRecovery:true,oldDownloadResources:beforeKeys.length,newBooks:upgraded.books,offlineBilingualSamples:4,errors,limits:'Real Chrome service worker/storage; standalone display-mode emulated, not a physical OS-installed app.'},null,2));
  console.log('INSTALLED_UPGRADE_PASS',catalog.version,'preserved',beforeKeys.length);
 }finally{await browser?.close();server.closeAllConnections();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

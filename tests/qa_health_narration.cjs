const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
let chromium;
try { ({chromium}=require('playwright')); }
catch { ({chromium}=require('../.qa-deps/node_modules/playwright')); }
const root=path.resolve(__dirname,'..');
const jobs=JSON.parse(fs.readFileSync(path.join(root,'workbench/health-narration-update/jobs.json')));
const server=http.createServer((req,res)=>{let p=path.join(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname)); if(p.endsWith(path.sep))p+='index.html'; if(!p.startsWith(root+path.sep)){res.writeHead(403).end();return;} fs.readFile(p,(e,b)=>{if(e){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.html':'text/html','.mp3':'audio/mpeg','.webmanifest':'application/manifest+json','.webp':'image/webp'})[path.extname(p)]||'application/octet-stream');res.end(b);});});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const context=await browser.newContext();
 const results=[];
 try {
  await context.addInitScript(()=>{const Native=window.Audio;window.__audio=[];window.Audio=function(...args){const a=new Native(...args);window.__audio.push(a);return a;};});
  const page=await context.newPage();
  const base=(process.env.HEALTH_QA_BASE_URL || `http://127.0.0.1:${server.address().port}`).replace(/\/$/,'');
  for(const book of ['myopia','cavities']) {
   await context.setOffline(false);
   await page.goto(`${base}/books/${book}/index.html`);
   await page.evaluate(()=>Promise.race([navigator.serviceWorker.ready,new Promise((_,r)=>setTimeout(()=>r(Error('SW readiness timeout')),30000))]));
   const download=await page.evaluate(book=>new Promise((resolve,reject)=>{const ch=new MessageChannel();const t=setTimeout(()=>reject(Error('download timeout')),45000);ch.port1.onmessage=e=>{if(['done','error'].includes(e.data.state)){clearTimeout(t);resolve(e.data);}};navigator.serviceWorker.ready.then(r=>r.active.postMessage({type:'KB_DOWNLOAD',bookId:book},[ch.port2]));}),book);
   assert.equal(download.state,'done');
   for(const offline of [false,true]) {
    await context.setOffline(offline);
    if(offline) await page.reload();
    for(const j of jobs.filter(j=>j.book===book)) {
     const language=await page.locator('body').getAttribute('data-language');
     if(language!==j.lang)await page.locator('#language').click();
     const timeline=page.locator(`#decay-timeline button[data-page-index="${j.index}"]`);
     const inCity=await timeline.count()>0;
     if(inCity)await timeline.click();
     const card=inCity?page.locator('#city-detail'):page.locator(`article[data-page-index="${j.index}"]`);
     assert.equal(await card.locator(`p.copy-${j.lang}`).first().textContent(),j.text);
     await card.locator('button.scene-listen,button.story-listen').click();
     await page.waitForFunction(()=>{const a=window.__audio.at(-1);return a&&!a.paused&&a.currentTime>0.1;},null,{timeout:15000});
     const evidence=await page.evaluate(()=>{const a=window.__audio.at(-1);return {url:a.src,duration:a.duration,time:a.currentTime,error:a.error?.code||null};});
     assert.ok(evidence.url.endsWith(`/audio/${j.id}.mp3?v=6`));
     assert.ok(evidence.duration>0&&!evidence.error);
     results.push({book,id:j.id,offline,...evidence});
     console.log('PASS',book,j.id,offline?'offline':'online');
    }
   }
  }
  fs.writeFileSync(path.join(root,process.env.HEALTH_QA_BASE_URL ? '.deploy_verify/health-browser-validation.json' : 'workbench/health-narration-update/browser-validation.json'),JSON.stringify(results,null,2));
 } finally {await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});

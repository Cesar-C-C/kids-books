'use strict';
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict'),crypto=require('crypto');
const root=path.resolve(process.env.ROPEWAY_ROOT||path.join(__dirname,'..')),out=path.resolve(process.env.ROPEWAY_REPORT_DIR||path.join(root,'.qa-labs/ropeway'));fs.mkdirSync(out,{recursive:true});
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.mp3':'audio/mpeg','.webmanifest':'application/manifest+json'};
const misses=[];
const server=http.createServer((req,res)=>{try{let target=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!target.startsWith(root+path.sep))throw Error('scope');if(fs.statSync(target).isDirectory())target=path.join(target,'index.html');res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(fs.readFileSync(target));}catch(e){res.statusCode=404;misses.push(req.url);res.end('Not found');}});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
 const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1,serviceWorkers:'allow'}),page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const requestFailures=[];page.on('requestfailed',r=>requestFailures.push({url:r.url(),failure:r.failure()}));
 await page.addInitScript(()=>{
  const log=window.__ropewayDiagnostics={lifecycle:[],media:[]};
  for(const name of ['blur','focus','pagehide'])addEventListener(name,e=>log.lifecycle.push({event:name,trusted:e.isTrusted,time:performance.now(),hidden:document.hidden}));
  document.addEventListener('visibilitychange',e=>log.lifecycle.push({event:'visibilitychange',trusted:e.isTrusted,time:performance.now(),hidden:document.hidden}));
  window.Audio=new Proxy(window.Audio,{construct(target,args){const a=Reflect.construct(target,args,target);for(const name of ['play','playing','pause','ended','error','stalled','waiting'])a.addEventListener(name,()=>log.media.push({event:name,src:a.src,time:performance.now(),currentTime:a.currentTime,readyState:a.readyState,networkState:a.networkState,errorCode:a.error?.code||null}));return a;}});
 });
 const runtimeSha256=sha(['index.html','ropeway.css','model.js','content.js','scene.js','audio-manifest.js','audio.js','app.js'].map(f=>f+'\n'+fs.readFileSync(path.join(root,'labs/ropeway',f),'utf8').replace(/\r\n/g,'\n')).join('\n'));
 const report={base,runtimeSha256,limits:'Fresh isolated browser Service Worker and offline playback; not an original user installation or physical-device acceptance.',online:[],offline:[]};
 async function select(id){
  await page.locator('#reset').click();await page.locator('[data-mode="journey"]').click();
  if(['support','detach','decelerate','board','accelerate','couple','check'].includes(id)){
   if(await page.locator('.phase-tools').getAttribute('open')===null)await page.locator('.phase-tools > summary').click();await page.locator('[data-phase="'+id+'"]').click();
  }else if(id==='monitor'){await page.locator('[data-mode="safety"]').click();await page.locator('#grip-fault').click();await page.waitForFunction(()=>RopewayLab.getSnapshot().mode==='protective-stop');}
  else await page.locator('[data-lesson="'+id+'"]').click();
  await page.waitForFunction(id=>RopewayLab.getSnapshot().lesson===id,id);
 }
 async function audioPass(kind){
  const ready=await page.evaluate(()=>ROPEWAY_AUDIO_MANIFEST.status==='ready');report.formalAudio=ready?'ready':'pending';
  if(!ready){console.log(kind+': formal audio pending; model-only acceptance.');return;}
  const ids=await page.evaluate(()=>ROPEWAY_CONTENT.map(c=>c.id));
  for(const lang of ['zh','en']){
   if(await page.evaluate(()=>RopewayLab.getSnapshot().language)!==lang)await page.locator('#language').click();
   for(const id of ids){
    await select(id);assert.equal(await page.locator('#listen').isDisabled(),false,id+' '+lang);
    if(id==='loop')await page.locator('#play').click();
    await page.locator('#listen').click();
    try{await page.waitForFunction(()=>{const a=RopewayLab.getSnapshot().audio;return a.currentTime>.04&&a.duration>0&&!a.paused;});}
    catch(e){
     const state=await page.evaluate(()=>({url:location.href,online:navigator.onLine,hidden:document.hidden,focused:document.hasFocus(),snapshot:RopewayLab.getSnapshot(),audioStatus:document.getElementById('audio-status').textContent,diagnostics:window.__ropewayDiagnostics}));
     const failure={status:'FAIL',kind,id,lang,runtimeSha256,completedOnline:report.online.length,completedOffline:report.offline.length,error:e.message,state,requestFailures};
     const name='audio-failure-'+Date.now()+'.json';fs.writeFileSync(path.join(out,name),JSON.stringify(failure,null,2)+'\n');console.error('Retained playback failure '+name+' at '+kind+' '+id+'-'+lang);throw e;
    }
    assert.equal(await page.evaluate(()=>RopewayLab.getSnapshot().factor),0,'narration holds the current mechanism clue');
    const a=await page.evaluate(()=>RopewayLab.getSnapshot().audio);report[kind].push({id,lang,duration:a.duration,src:a.src});
    await page.locator('#audio-stop').click();assert.equal(await page.evaluate(()=>RopewayLab.getSnapshot().audio.src),null);
    const decoded=await page.evaluate(async src=>{
     const bytes=await fetch(src).then(r=>{if(!r.ok)throw Error('MP3 response '+r.status);return r.arrayBuffer();});
     const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
     const context=new AudioContext({sampleRate:24000});
     try{
      const b=await context.decodeAudioData(bytes.slice(0));let energy=0,peak=0,finite=true,samples=0;
      for(let ch=0;ch<b.numberOfChannels;ch++)for(const x of b.getChannelData(ch)){finite=finite&&Number.isFinite(x);energy+=x*x;peak=Math.max(peak,Math.abs(x));samples++;}
      return {sha256:hash,duration:b.duration,sampleRate:b.sampleRate,channels:b.numberOfChannels,finite,rms:Math.sqrt(energy/samples),peak};
     }finally{await context.close();}
    },a.src);
    const expected=await page.evaluate(key=>ROPEWAY_AUDIO_MANIFEST.tracks[key].sha256,id+'-'+lang);
    assert.equal(decoded.sha256,expected,'served/cached MP3 bytes match manifest');assert.equal(decoded.finite,true);assert.equal(decoded.sampleRate,24000);assert.equal(decoded.channels,1);assert.ok(decoded.rms>.001&&decoded.peak>.005,'full MP3 decode has finite non-silent samples');
    assert.ok(decoded.peak<=1.000001,'full browser MP3 decode stays below 0 dBFS');
    report[kind].at(-1).decoded=decoded;
   }
  }console.log(kind+': '+report[kind].length+' source-bound clips played/stopped through actual UI and fully decoded with exact served-byte hashes.');
 }
 try{
  await page.goto(base+'/labs/ropeway/index.html');await page.waitForFunction(()=>window.RopewayLab);
  console.log('Waiting for fresh Service Worker control and completed core precache...');
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller,null,{timeout:120000});
  report.controller=await page.evaluate(()=>navigator.serviceWorker.controller.scriptURL);
  report.caches=await page.evaluate(()=>caches.keys());assert.equal(misses.length,0,'no missing precache assets: '+misses.join(','));
  const audioPaths=await page.evaluate(()=>Object.values(ROPEWAY_AUDIO_MANIFEST.tracks||{}).map(t=>t.file));
  report.precachedAudio=await page.evaluate(async paths=>{const missing=[];for(const p of paths)if(!await caches.match(new URL(p,location.href)))missing.push(p);return {expected:paths.length,exactVersionedKeys:true,missing};},audioPaths);
  assert.deepEqual(report.precachedAudio.missing,[],'all formal audio must already be cached before disconnecting');
  await ctx.setOffline(true);await page.reload();await page.waitForFunction(()=>window.RopewayLab);
  await page.locator('header a[href="../index.html"]').click();await page.waitForURL('**/labs/index.html');
  await page.waitForFunction(()=>document.querySelector('[data-lab-id="ropeway"] img').naturalWidth>0);
  await page.locator('[data-lab-id="ropeway"] .enter-lab').click();await page.waitForFunction(()=>window.RopewayLab);report.offlineCatalogEntry=true;
  assert.equal(sha(await page.evaluate(()=>fetch('content.js').then(r=>r.text()))),sha(fs.readFileSync(path.join(root,'labs/ropeway/content.js'))),'offline exact frozen source');
  await select('board');const s=await page.evaluate(()=>RopewayLab.getSnapshot());assert.equal(s.cars[0].rail,true);assert.equal(s.cars[0].grip,0);
  await page.locator('#play').click();await page.waitForFunction(t=>RopewayLab.getSnapshot().time>t+.1,s.time);await page.locator('#pause').click();
  await audioPass('offline');
  report.coldOfflineBeforeAnyOnlineAudio=true;
  await ctx.setOffline(false);await page.reload();await page.waitForFunction(()=>window.RopewayLab);await audioPass('online');
  assert.deepEqual(errors,[]);report.pageErrors=errors;report.status='PASS';report.offlineCore=true;report.missingAssets=misses;
  await page.screenshot({path:path.join(out,'offline-phone.png'),fullPage:true});fs.writeFileSync(path.join(out,'offline-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
 }finally{await ctx.close();await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

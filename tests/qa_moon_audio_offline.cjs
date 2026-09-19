// Full-duration native audio from actual reader buttons, online and after offline-package upgrade.
// Uses 4x playback (no seeking); this is technical coverage, never human hearing approval.
const fs=require('node:fs'), path=require('node:path'), http=require('node:http');
const assert=require('node:assert/strict'), crypto=require('node:crypto');
let pw;try{pw=require('playwright');}catch{pw=require(process.env.PLAYWRIGHT_MODULE||'../.qa-deps/node_modules/playwright');}
const root=path.resolve(__dirname,'..'), out=path.join(root,'.qa-labs/moon-audio-offline');
const story=JSON.parse(fs.readFileSync(path.join(root,'books/moon/story.json'),'utf8'));
const audioManifest=JSON.parse(fs.readFileSync(path.join(root,'books/moon/audio-manifest.json'),'utf8'));
const raw=fs.readFileSync(path.join(root,'pwa-assets.js'),'utf8');
const manifest=JSON.parse(raw.slice(raw.indexOf('{'),raw.lastIndexOf('}')+1));
assert.equal(manifest.books.moon.complete,true,'Formal audio must be delivered and manifest regenerated first');
const audioFiles=manifest.books.moon.files.filter(f=>f.includes('/audio/'));
assert.equal(audioFiles.length,audioManifest.entries.length);
const prior=JSON.parse(JSON.stringify(manifest));
prior.version='moon-visual-only-test';
prior.books.moon.files=prior.books.moon.files.filter(f=>!f.includes('/audio/'));
prior.books.moon.bytes=prior.books.moon.files.reduce((n,f)=>n+fs.statSync(path.join(root,f)).size,0);
prior.books.moon.complete=false;prior.books.moon.missingAudio=audioFiles;
let upgraded=false,denyAudio=false;
const requests=[];
const server=http.createServer((req,res)=>{
  const name=new URL(req.url,'http://local').pathname;
  if(name.includes('/books/moon/audio/')){requests.push({name,denied:denyAudio});if(denyAudio)return res.writeHead(503).end();}
  let file=path.resolve(root,'.'+decodeURIComponent(name));
  if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.mp3':'audio/mpeg'})[path.extname(file)]||'application/octet-stream');
  if(name==='/pwa-assets.js')return res.end(upgraded?raw:'self.KB_ASSETS='+JSON.stringify(prior)+';');
  if(name==='/sw.js')return res.end(fs.readFileSync(file,'utf8')+'\n// audio upgrade '+upgraded);
  fs.readFile(file,(error,buffer)=>error?res.writeHead(404).end():res.end(buffer));
});
async function message(page,type,bookId){return page.evaluate(({type,bookId})=>new Promise((resolve,reject)=>{
  const ch=new MessageChannel(), timer=setTimeout(()=>reject(Error('Worker timeout')),60000);
  ch.port1.onmessage=({data})=>{if(data.type==='KB_PROGRESS'&&data.state==='running')return;clearTimeout(timer);ch.port1.close();resolve(data);};
  navigator.serviceWorker.controller.postMessage({type,bookId},[ch.port2]);
}),{type,bookId});}
async function instrumentation(context){await context.addInitScript(()=>{
  const NativeAudio=window.Audio;window.__audioRecords=[];window.__fallbacks=0;
  window.Audio=function(src){const audio=new NativeAudio(src), record={src,duration:null,maxTime:0,ended:false,error:null};
    audio.playbackRate=4;record.audio=audio;__audioRecords.push(record);
    audio.addEventListener('loadedmetadata',()=>{record.duration=audio.duration;});
    audio.addEventListener('timeupdate',()=>{record.maxTime=Math.max(record.maxTime,audio.currentTime);});
    audio.addEventListener('ended',()=>{record.ended=true;record.endedAt=audio.currentTime;});
    audio.addEventListener('error',()=>{record.error=audio.error?.code||'unknown';});
    return audio;
  };
  const speak=window.speechSynthesis?.speak.bind(window.speechSynthesis);
  if(speak)window.speechSynthesis.speak=u=>{__fallbacks++;return speak(u);};
});}
async function allReaderAudio(page,label,base){
  await page.goto(base+'/books/moon/');await page.locator('#angle').waitFor();
  const version=await page.evaluate(()=>MoonBook.getState().audioVersion), results=[];
  async function play(locator,id){
    const index=await page.evaluate(()=>__audioRecords.length);await locator.click();
    await page.waitForFunction(i=>__audioRecords[i]?.ended||__audioRecords[i]?.error,index,{timeout:45000});
    const r=await page.evaluate(i=>{const {audio,...record}=__audioRecords[i];return {...record,active:__audioRecords.filter(x=>!x.audio.paused).length,fallbacks:__fallbacks};},index);
    assert.equal(r.src,`audio/${id}.mp3?v=${version}`);assert.equal(r.error,null);assert.equal(r.ended,true);
    assert(r.duration>0&&r.endedAt>=r.duration-.08&&r.maxTime>0);assert.equal(r.active,0);assert.equal(r.fallbacks,0);
    results.push({id,...r});console.log(label,results.length+'/'+audioManifest.entries.length,id,'ended',r.duration);
  }
  for(const lang of ['zh','en']){
    if(await page.evaluate(()=>MoonBook.getState().lang)!==lang)await page.locator('#language').click();
    while(await page.evaluate(()=>MoonBook.getState().album)>0)await page.locator('.album-nav button').first().click();
    const album=story.scenes.filter(s=>s.act==='album');
    for(const scene of story.scenes){
      if(scene.act==='album')while(await page.evaluate(()=>MoonBook.getState().album)<album.findIndex(s=>s.id===scene.id))await page.locator('.album-nav button').last().click();
      await play(page.locator(`[data-scene-id="${scene.id}"] button`).first(),`scene-${scene.id}-${lang}`);
    }
    for(let i=0;i<story.vocab.length;i++)await play(page.locator('.vocab button').nth(i),`vocab-${story.vocab[i].id}-${lang}`);
  }
  assert.deepEqual(results.map(r=>r.id).sort(),audioManifest.entries.map(e=>e.id).sort());
  // Interruption must pause native objects before the next narration.
  while(await page.evaluate(()=>MoonBook.getState().album)>0)await page.locator('.album-nav button').first().click();
  for(const action of ['stop','language','album']){
    await page.locator('[data-scene-id="gift"] button').first().click();
    await page.waitForFunction(()=>__audioRecords.at(-1).audio.currentTime>.15);
    if(action==='album')await page.locator('.album-nav button').last().click();else await page.locator('#'+action).click();
    assert(await page.evaluate(()=>__audioRecords.every(r=>r.audio.paused)));
  }
  return results;
}
module.exports={instrumentation,allReaderAudio,message};
if(require.main===module)(async()=>{
  fs.mkdirSync(out,{recursive:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser=await pw.chromium.launch({channel:'chrome',headless:true}), errors=[];
  const base=`http://127.0.0.1:${server.address().port}`;let onlineContext,offlineContext;
  try{
    onlineContext=await browser.newContext({serviceWorkers:'block'});await instrumentation(onlineContext);
    const onlinePage=await onlineContext.newPage();onlinePage.on('pageerror',e=>errors.push(e.message));
    const online=await allReaderAudio(onlinePage,'ONLINE',base);await onlineContext.close();onlineContext=null;
    offlineContext=await browser.newContext({viewport:{width:390,height:844}});await instrumentation(offlineContext);
    const page=await offlineContext.newPage();page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base+'/index.html');await page.waitForFunction(()=>!!navigator.serviceWorker.controller,null,{timeout:60000});
    assert.equal((await message(page,'KB_DOWNLOAD','moon')).state,'partial');
    const old=await message(page,'KB_STATUS');assert.equal(old.books.moon.complete,false);assert.equal(old.books.moon.cached,old.books.moon.total);
    await page.locator('#kbFab').click();await page.waitForFunction(()=>document.querySelector('#osize-moon').textContent.includes('配音待交付'));
    await page.screenshot({path:path.join(out,'old-partial.png')});
    upgraded=true;await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update();});
    await page.evaluate(version=>new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{cleanup();reject(Error('Upgrade timed out'));},60000);
      function cleanup(){clearTimeout(timer);navigator.serviceWorker.removeEventListener('controllerchange',check);}
      function check(){const ch=new MessageChannel();ch.port1.onmessage=e=>{ch.port1.close();if(e.data.version===version){cleanup();resolve();}};navigator.serviceWorker.controller.postMessage({type:'KB_STATUS'},[ch.port2]);}
      navigator.serviceWorker.addEventListener('controllerchange',check);check();
    }),manifest.version);
    const updated=await message(page,'KB_STATUS');assert.equal(updated.books.moon.cached,old.books.moon.total);assert.equal(updated.books.moon.total,manifest.books.moon.files.length);
    await page.waitForFunction(()=>document.querySelector('#obtn-moon').textContent==='下载');
    assert.equal(await page.locator('#orow-moon').evaluate(e=>e.classList.contains('done')),false);
    await page.locator('#obtn-moon').click();await page.waitForFunction(()=>document.querySelector('#obtn-moon').textContent==='删除',null,{timeout:60000});
    assert.equal(await page.locator('#orow-moon').evaluate(e=>e.classList.contains('done')),true);
    await page.screenshot({path:path.join(out,'complete-download.png')});
    const cacheHashes=await page.evaluate(async files=>{
      const cache=await caches.open('kb-asset-v1');return Promise.all(files.map(async file=>{
        const response=await cache.match('/'+file);if(!response)throw Error('Missing cache '+file);
        const bytes=await response.arrayBuffer(), digest=await crypto.subtle.digest('SHA-256',bytes);
        return {file,sha256:[...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,'0')).join('')};
      }));
    },audioFiles);
    for(const r of cacheHashes)assert.equal(r.sha256,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,r.file.split('?')[0]))).digest('hex'));
    // Wrong-version bytes cannot replace current ?v=1 playback.
    await page.evaluate(async()=>{const cache=await caches.open('kb-asset-v1');await cache.put('/books/moon/audio/scene-gift-zh.mp3?v=0',new Response('obsolete audio'));});
    denyAudio=true;await offlineContext.setOffline(true);
    const offline=await allReaderAudio(page,'OFFLINE',base);
    assert.equal(requests.filter(r=>r.denied).length,0);assert.deepEqual(errors,[]);
    const report={version:manifest.version,online,offline,cacheHashes,errors,oldPartial:old.books.moon,
      afterUpgrade:updated.books.moon,serverAudioRequestsAfterDisconnection:0,
      checks:['all files play to native ended at 4x without seeking','zero device-speech fallback','stop/language/album interrupt real audio','visual-only cache upgraded to complete without false done','wrong-version cache does not override current URLs'],
      humanHearing:'Not independently verified; no publication performed'};
    fs.writeFileSync(path.join(out,'playback-report.json'),JSON.stringify(report,null,2));
    console.log('PASS',online.length,'ONLINE +',offline.length,'OFFLINE full native playback; no speech fallback');
  }finally{await onlineContext?.close();await offlineContext?.close();await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});

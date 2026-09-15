// Real service worker + downloaded cloud book + browser offline mode.
const fs=require('fs'),path=require('path'),http=require('http'),vm=require('vm'),assert=require('assert/strict');
let pw;try{pw=require('playwright');}catch{pw=require(require.resolve('playwright',{paths:[path.join(__dirname,'../kids-books/.qa-deps/node_modules')]}));}
const sandbox={self:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'pwa-assets.js'),'utf8'),sandbox);
const files=sandbox.self.KB_ASSETS.books.cloud.files;
const audio=files.filter(f=>f.includes('/audio/')&&f.includes('.mp3?'));
assert.equal(audio.length,80);
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 const rel=decodeURIComponent(url.pathname).replace(/^\//,'')+(url.pathname.endsWith('/')?'index.html':'');
 const target=path.resolve(__dirname,rel);
 if(!target.startsWith(__dirname+path.sep)||!fs.existsSync(target)){res.writeHead(404).end();return;}
 const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.webmanifest':'application/manifest+json','.mp3':'audio/mpeg','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'};
 res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store'});
 fs.createReadStream(target).pipe(res);
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}/`;
 const browser=await pw.chromium.launch({headless:true,channel:'msedge'});
 try{
  const context=await browser.newContext({serviceWorkers:'allow'}),page=await context.newPage();
  page.setDefaultTimeout(180000);
  await page.goto(base+'books/cloud/index.html');
  await page.evaluate(()=>navigator.serviceWorker.ready.then(()=>true));
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  const downloaded=await page.evaluate(()=>new Promise(async(resolve,reject)=>{
   const timer=setTimeout(()=>reject(Error('download timeout')),120000);
   const channel=new MessageChannel();
   channel.port1.onmessage=({data})=>{if(data.state&&data.state!=='running'){clearTimeout(timer);channel.port1.close();resolve(data);}};
   (await navigator.serviceWorker.ready).active.postMessage({type:'KB_DOWNLOAD',bookId:'cloud'},[channel.port2]);
  }));
  assert.equal(downloaded.state,'done');assert.equal(downloaded.failed||0,0);
  await context.setOffline(true);
  await page.reload({waitUntil:'domcontentloaded'});
  assert.equal(await page.evaluate(()=>navigator.onLine),false);
  await page.waitForFunction(()=>document.querySelector('#illustration')?.naturalWidth>0);
  const decoded=await page.evaluate(async ({base,audio})=>{
   const ac=new AudioContext();let seconds=0;
   try{for(const file of audio){const r=await fetch(base+file);if(!r.ok)throw Error(file+': '+r.status);const a=await ac.decodeAudioData(await r.arrayBuffer());if(a.duration<=0)throw Error('empty '+file);seconds+=a.duration;}}
   finally{await ac.close();}return {count:audio.length,seconds};
  },{base,audio});
  await page.click('#narrate');
  await page.waitForFunction(()=>document.querySelector('#narrate').getAttribute('aria-pressed')==='true'&&document.querySelector('#audio-status').textContent==='');
  await page.click('#narrate');
  assert.equal(await page.getAttribute('#narrate','aria-pressed'),'false');
  console.log('PASS cloud actual offline: downloaded book, offline reload/image, '+decoded.count+' MP3 decoded, listen and stop; '+decoded.seconds.toFixed(1)+' seconds');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

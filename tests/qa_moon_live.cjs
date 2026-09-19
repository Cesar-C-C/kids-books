// Explicit production read/interaction verification, never runs in ordinary CI.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
let pw;try{pw=require('playwright');}catch{pw=require(process.env.PLAYWRIGHT_MODULE||'../.qa-deps/node_modules/playwright');}
const {instrumentation,allReaderAudio,message}=require('./qa_moon_audio_offline.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'.deploy_verify/moon-live');
const base=process.env.MOON_LIVE_URL;
assert(base&&/^https:\/\//.test(base),'Set MOON_LIVE_URL explicitly to the deployed site root');
const raw=fs.readFileSync(path.join(root,'pwa-assets.js'),'utf8');
const local=JSON.parse(raw.slice(raw.indexOf('{'),raw.lastIndexOf('}')+1));
const canonical=(bytes,file)=>/\.(html|js|css|json)$/.test(file.split('?')[0])?Buffer.from(bytes.toString('utf8').replace(/\r\n/g,'\n')):bytes;
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
(async()=>{
 fs.mkdirSync(out,{recursive:true});const browser=await pw.chromium.launch({channel:'chrome',headless:true});
 let onlineContext,offlineContext;const errors=[];
 try{
  onlineContext=await browser.newContext({serviceWorkers:'block',viewport:{width:390,height:844}});await instrumentation(onlineContext);
  const response=await onlineContext.request.get(base+'/pwa-assets.js',{timeout:90000});assert.equal(response.status(),200);
  const source=await response.text(),live=JSON.parse(source.slice(source.indexOf('{'),source.lastIndexOf('}')+1));assert.equal(live.version,local.version);
  const assets=[...new Set(['index.html','pwa-assets.js','sw.js','shared/pwa.js',...local.books.moon.files,'books/moon/images/gift_card480.webp'])];
  const hashes=[];let next=0;
  async function worker(){while(next<assets.length){const file=assets[next++];let result;
   for(let retry=0;retry<3;retry++){try{result=await onlineContext.request.get(base+'/'+file,{timeout:90000});if(result.ok())break;}catch(e){if(retry===2)throw e;}}
   assert.equal(result.status(),200,file);const data=await result.body(),disk=fs.readFileSync(path.join(root,file.split('?')[0]));
   assert.equal(hash(canonical(data,file)),hash(canonical(disk,file)),file);hashes.push({file,sha256:hash(data),status:200});
  }}
  await Promise.all(Array.from({length:4},worker));console.log('LIVE_ASSET_HASHES_PASS',hashes.length);
  const page=await onlineContext.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/index.html');
  const card=page.locator('a.book-card[href="books/moon/index.html"]');await card.scrollIntoViewIfNeeded();
  assert.equal(await card.locator('h3').innerText(),'Why Does the Moon Change Shape?');assert.equal(await card.locator('.zh').innerText(),'月亮怎么少了一块？');
  await page.waitForFunction(()=>document.querySelector('a[href="books/moon/index.html"] img').naturalWidth>0);
  await page.screenshot({path:path.join(out,'shelf-mobile.png')});await card.click();await page.locator('#angle').waitFor();
  for(const angle of [0,90,180,270]){await page.evaluate(a=>MoonBook.setAngle(a),angle);assert.equal(await page.locator('#angle').inputValue(),String(angle));}
  await page.setViewportSize({width:1280,height:900});await page.locator('#orbit').screenshot({path:path.join(out,'orbit-desktop.png')});
  const online=await allReaderAudio(page,'LIVE_ONLINE',base);await onlineContext.close();onlineContext=null;
  offlineContext=await browser.newContext({viewport:{width:390,height:844}});await instrumentation(offlineContext);
  const p=await offlineContext.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(base+'/index.html');
  console.log('WAITING_FOR_PRODUCTION_SW_INSTALL');
  await p.waitForFunction(()=>!!navigator.serviceWorker.controller,null,{timeout:240000});
  const status=await message(p,'KB_STATUS');assert.equal(status.version,local.version);assert.equal(status.books.moon.total,53);
  await p.locator('#kbFab').click();await p.locator('#obtn-moon').click();
  await p.waitForFunction(()=>document.querySelector('#obtn-moon').textContent==='删除',null,{timeout:180000});
  const downloaded=await message(p,'KB_STATUS');assert.equal(downloaded.books.moon.cached,53);assert.equal(downloaded.books.moon.complete,true);
  // Retain an existing title alongside the new download for a production regression.
  assert.equal((await message(p,'KB_DOWNLOAD','airplane')).state,'done');
  await offlineContext.setOffline(true);await p.reload();const offlineCard=p.locator('a.book-card[href="books/moon/index.html"]');await offlineCard.scrollIntoViewIfNeeded();
  await p.waitForFunction(()=>document.querySelector('a[href="books/moon/index.html"] img').naturalWidth>0);
  await offlineCard.click();await p.locator('#angle').waitFor();await p.evaluate(()=>MoonBook.setAngle(180));assert.equal(await p.locator('#angle').inputValue(),'180');
  const offline=await allReaderAudio(p,'LIVE_OFFLINE',base);
  await p.locator('.art img').evaluateAll(xs=>xs.forEach(x=>x.loading='eager'));await p.waitForFunction(()=>[...document.querySelectorAll('.art img')].every(x=>x.complete&&x.naturalWidth));
  await p.screenshot({path:path.join(out,'reader-offline-mobile.png')});
  const oldAudio=local.books.airplane.files.find(f=>f.includes('page_01_en.mp3'));
  await p.evaluate(src=>new Promise((resolve,reject)=>{const a=new Audio(src);a.onended=resolve;a.onerror=()=>reject(Error('old book offline media failure'));a.playbackRate=4;a.play().catch(reject);}),base+'/'+oldAudio);
  assert.deepEqual(errors,[]);const report={base,version:local.version,hashes,online,offline,downloaded:downloaded.books.moon,errors,
   viewport:'390x844 simulated mobile; 1280x900 desktop, not physical-device validation',legacyAirplane:'native offline ended',userListening:'accepted separately for exact released audio hashes'};
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log('LIVE_PASS',online.length,offline.length,local.version);
 }finally{await onlineContext?.close();await offlineContext?.close();await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

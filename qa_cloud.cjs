const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),http=require('http');
const root=__dirname,dir=path.join(root,'books/cloud'),data={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(dir,'book.js'),'utf8'),data);
vm.runInNewContext(fs.readFileSync(path.join(dir,'overlays.js'),'utf8'),data);
const {BOOK,PAGES,CLOUD_HOTSPOTS}=data.window;
assert.equal(PAGES.length,16);assert.equal(BOOK.coverImg,PAGES[0].img);
assert.equal(new Set(PAGES.map(p=>p.img)).size,15);
let audioFiles=[];
PAGES.forEach((p,i)=>{
 for(const k of ['title','titleEn','zh','en','why','whyEn','factZh','factEn'])assert.ok(p[k]?.length,`page ${i+1}: ${k}`);
 assert.ok(fs.statSync(path.join(dir,p.img)).size>10000,`image ${p.img}`);
 const point=CLOUD_HOTSPOTS[i];assert.ok(point&&point[0]>24&&point[0]<1192&&point[1]>24&&point[1]<808);
 if(p.choicesZh){assert.equal(p.choicesZh.length,p.choicesEn.length);assert.ok(p.answer>=-1&&p.answer<p.choicesZh.length);}
 for(const lang of ['zh','en'])for(const kind of ['page','fact'])audioFiles.push(`${kind}_${String(i).padStart(2,'0')}_${lang}.mp3`);
 for(const w of p.glossary||[])for(const lang of ['zh','en'])audioFiles.push(`word_${w.en.toLowerCase().replaceAll(' ','_')}_${lang}.mp3`);
});
for(const f of audioFiles){assert.ok(fs.statSync(path.join(dir,'audio',f)).size>1000,f);}
const pwa={self:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'pwa-assets.js'),'utf8'),pwa);
const offline=pwa.self.KB_ASSETS.books.cloud.files;
for(const f of ['index.html','book.js','overlays.js','cloud.js','cloud.css',...PAGES.map(p=>p.img),...audioFiles.map(f=>'audio/'+f+'?v=4')])assert.ok(offline.includes('books/cloud/'+f),'offline dependency: '+f);
assert.match(fs.readFileSync(path.join(root,'index.html'),'utf8'),/href="books\/cloud\/index.html"/);
console.log('PASS cloud static: 16 bilingual pages, 15 illustrations, 80 audio files, hotspots and complete offline dependencies');
if(process.argv.includes('--static'))process.exit(0);
let playwright;try{playwright=require('playwright');}catch{playwright=require(require.resolve('playwright',{paths:[path.join(root,'../kids-books/.qa-deps/node_modules')]}));}
const out=path.join(root,'.qa-labs/cloud');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+decodeURIComponent(url.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 let target=file;if(fs.existsSync(target)&&fs.statSync(target).isDirectory())target=path.join(target,'index.html');
 if(!fs.existsSync(target)){res.writeHead(404);return res.end();}
 res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.webp':'image/webp','.mp3':'audio/mpeg'})[path.extname(target)]||'application/octet-stream');fs.createReadStream(target).pipe(res);
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await playwright.chromium.launch({channel:'chrome',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'}),page=await context.newPage(),errors=[];
  // PWA installation belongs to the site-wide tests; avoid precaching unrelated books here.
  await context.route('**/shared/pwa.js',r=>r.fulfill({contentType:'application/javascript',body:''}));
  page.on('pageerror',e=>errors.push(e.message));
  const base=process.env.CLOUD_LIVE_BASE||`http://127.0.0.1:${server.address().port}/`;
  await page.goto(base+'books/cloud/index.html');
  const imageReady=()=>page.waitForFunction(()=>{const i=document.getElementById('illustration');return i.complete&&i.naturalWidth>0;});
  const jump=async i=>{await page.locator('#contents').click();await page.locator('#toc-pages button').nth(i).click();await imageReady();};
  for(let i=0;i<PAGES.length;i++){
   if(i)await page.locator('#next').click();await imageReady();
   assert.equal(await page.locator('#story').textContent(),PAGES[i].zh);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow');
   await page.locator('#hotspots .hot').focus();await page.keyboard.press('Enter');
   assert.equal(await page.locator('#bubble').textContent(),PAGES[i].factZh);
   await page.keyboard.press('Escape');assert.ok(await page.locator('#bubble').isHidden());
   assert.equal(await page.locator('#narrate').getAttribute('aria-pressed'),'false');
   await page.locator('#discovery summary').click();
   if(PAGES[i].choicesZh){const correct=PAGES[i].answer;if(correct>=0){await page.locator('.answers button').nth(1-correct).click();assert.match(await page.locator('#feedback').textContent(),/再观察/);}await page.locator('.answers button').nth(Math.max(0,correct)).click();assert.equal(await page.locator('#feedback').textContent(),PAGES[i].feedbackZh);}
   await page.screenshot({path:path.join(out,`page-${String(i+1).padStart(2,'0')}.png`),fullPage:true});
  }
  await page.locator('#next').click();assert.equal(await page.locator('#title').textContent(),PAGES[0].title);
  await jump(13);await page.locator('.answers button').nth(0).click();assert.match(await page.locator('#feedback').textContent(),/再想想/);
  for(const label of ['蒸发进入空气','冷却凝结成云','长大成为雨滴','落地流入河流'])await page.getByRole('button',{name:label,exact:true}).click();
  assert.equal(await page.locator('.answers button:disabled').count(),4);assert.match(await page.locator('#feedback').textContent(),/连起来了/);
  await page.locator('#language').click();assert.equal(await page.locator('#story').textContent(),PAGES[13].en);
  await page.locator('#translation').click();assert.equal(await page.locator('#translated-story').textContent(),PAGES[13].zh);assert.ok(await page.locator('#translated-story').isVisible());
  await page.reload();assert.equal(await page.locator('#story').textContent(),PAGES[13].en);
  await page.locator('#language').click();await jump(0);
  // Decode every delivered recording using the browser audio decoder, not just file extensions.
  const decoded=await page.evaluate(async files=>{const ac=new AudioContext();try{for(const f of files){const r=await fetch('audio/'+f+'?v=4');if(!r.ok)throw Error(f+' '+r.status);const b=await ac.decodeAudioData(await r.arrayBuffer());if(b.duration<=0)throw Error('Empty audio '+f);}return files.length;}finally{await ac.close();}},audioFiles);
  assert.equal(decoded,80);
  await page.locator('#narrate').click();await page.waitForFunction(()=>document.getElementById('audio-status').textContent==='');assert.equal(await page.locator('#narrate').getAttribute('aria-pressed'),'true');await page.locator('#next').click();assert.equal(await page.locator('#narrate').getAttribute('aria-pressed'),'false');
  await page.locator('#auto').click();await page.waitForFunction(()=>document.getElementById('narrate').getAttribute('aria-pressed')==='true');await page.locator('#auto').click();assert.equal(await page.locator('#narrate').getAttribute('aria-pressed'),'false');
  for(const size of [{width:1024,height:768},{width:390,height:844}]){
   await page.setViewportSize(size);await jump(11);await page.locator('#discovery summary').click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.screenshot({path:path.join(out,`layout-${size.width}.png`),fullPage:true});
  }
  await page.route('**/audio/*.mp3*',r=>r.abort());
  await page.evaluate(()=>{window.spoken=[];speechSynthesis.speak=u=>window.spoken.push(u.text);});
  await page.locator('#narrate').click();await page.waitForFunction(()=>window.spoken.length===1);assert.equal(await page.evaluate(()=>window.spoken[0]),PAGES[11].zh);
  await page.locator('#language').click();await page.locator('#narrate').click();await page.waitForFunction(()=>window.spoken.length===2);assert.equal(await page.evaluate(()=>window.spoken[1]),PAGES[11].en);
  const noStorage=await browser.newContext({serviceWorkers:'block',viewport:{width:390,height:844},isMobile:true,hasTouch:true});await noStorage.route('**/shared/pwa.js',r=>r.fulfill({body:''}));await noStorage.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw Error('disabled');}});});
  const mobile=await noStorage.newPage();await mobile.goto(base+'books/cloud/index.html');await mobile.locator('#next').tap();assert.equal(await mobile.locator('#title').textContent(),PAGES[1].title);await noStorage.close();
  assert.deepEqual(errors,[]);console.log('PASS cloud browser: all pages/images, SVG keyboard activation, questions, sequence game, language, persistence, 80 decoded recordings, stop/auto/fallback, tablet/mobile');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

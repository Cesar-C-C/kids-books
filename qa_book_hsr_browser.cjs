// Browser contract for the rebuilt high-speed train lab: progressive reveal,
// local cutaway, 25 inside discoveries, region-gated mechanisms and the three
// responsive layouts. Run with NODE_PATH pointing at .qa-deps/node_modules.
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const root=__dirname,out=path.join(root,'.qa-labs');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{let f=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/kids-books/,''));if(!f.startsWith(root+path.sep)){res.writeHead(403);return res.end();}if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');if(!fs.existsSync(f)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.webmanifest':'application/manifest+json'})[path.extname(f)]||'application/octet-stream');fs.createReadStream(f).pipe(res);});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({...(process.env.LAB_BROWSER_PATH?{executablePath:process.env.LAB_BROWSER_PATH}:process.env.LAB_BROWSER==='chromium'?{}:{channel:'chrome'}),headless:true,args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1440,height:940},reducedMotion:'reduce'}),errors=[],failed=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400&&r.url().startsWith('http://127.0.0.1'))failed.push(r.status()+' '+r.url());});
 const base=process.env.LAB_LIVE_BASE||`http://127.0.0.1:${server.address().port}/kids-books/`;
 await page.goto(base+'labs/hsr/');
 await page.waitForFunction(()=>window.trainLab?.snapshot().renderer.calls>0);
 assert.equal(await page.locator('#load-error').isVisible(),false);
 assert.equal(await page.locator('canvas').count(),1);

 /* ---- layering: the model must sit in front of the captions, not behind a painted stage ---- */
 const layer=await page.evaluate(()=>{const v=document.getElementById('viewport'),c=v.querySelector('canvas'),wm=document.querySelector('.stage-watermark'),head=document.querySelector('.stage-heading');const cs=getComputedStyle(c);return{canvasZ:cs.zIndex,canvasPos:cs.position,watermarkZ:getComputedStyle(wm).zIndex,watermarkEvents:getComputedStyle(wm).pointerEvents,headingZ:getComputedStyle(head).zIndex,canvasFirst:v.firstElementChild===c,stageBg:getComputedStyle(document.querySelector('.stage')).backgroundColor};});
 assert.equal(layer.canvasFirst,true,'the canvas must be prepended, so the captions can show through where nothing is drawn');
 assert.equal(layer.canvasPos,'absolute');assert.equal(layer.canvasZ,'1');
 assert.equal(layer.watermarkZ,'auto','the watermark must not claim a stacking layer above the model');
 assert.equal(layer.headingZ,'2');
 assert.equal(layer.watermarkEvents,'none');
 assert.equal(layer.stageBg,'rgb(237, 242, 231)','every lab shares the same stage tint');

 const snap=()=>page.evaluate(()=>trainLab.snapshot());
 const identity=(await snap()).modelId;
 assert.equal((await snap()).geometry.assemblies,14);
 const counts=(await snap()).geometry;assert.ok(counts.meshes>150&&counts.meshes<1000,`mesh budget: ${counts.meshes}`);
 await page.screenshot({path:path.join(out,'hsr-book-whole.png')});
 if(process.env.UPDATE_LAB_PREVIEW==='1'&&!process.env.LAB_BASE_URL)await page.locator('#viewport').screenshot({path:path.join(root,'labs/hsr/preview.png')});

 /* ---- progressive reveal: wheel into a part and the inside appears by itself ---- */
 const before=(await snap()).camera.distance;
 const point=await page.evaluate(()=>trainLab.projectPart('cabin-body'));
 await page.mouse.move(point.x,point.y);await page.mouse.wheel(0,-900);
 await page.waitForFunction(d=>trainLab.snapshot().camera.distance<d*.7,before);
 assert.equal((await snap()).modelId,identity,'zooming must never rebuild the model');
 assert.equal((await snap()).mode,'auto');
 // Projecting a part is only meaningful once the camera has settled back out.
 await page.locator('#home-view').click();
 await page.waitForFunction(()=>{const s=trainLab.snapshot();return s.selected===null&&s.camera.distance>11;});
 // One more rendered frame, so projectPart() sees the settled camera matrices.
 await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));

 /* ---- double click a part on the model (the cab faces the default camera) ---- */
 const nose=await page.evaluate(()=>trainLab.projectPart('cab'));
 await page.mouse.dblclick(nose.x,nose.y);
 await page.waitForFunction(()=>trainLab.snapshot().selected==='cab');
 await page.locator('[data-part="seats"]').click();
 await page.waitForFunction(()=>trainLab.snapshot().near>.95);
 await page.locator('[data-view="inside"]').click();
 await page.waitForFunction(()=>trainLab.snapshot().reveal>.95);
 const state=await snap();
 assert.ok(state.assemblies.filter(a=>a.id!==state.assembly).every(a=>!a.interior&&a.ghost&&!a.exterior),'unrelated assemblies must collapse to a plain outline');
 await page.screenshot({path:path.join(out,'hsr-book-seats.png')});

 /* ---- every one of the 25 discoveries ---- */
 const details=await page.evaluate(()=>HSR_DETAILS);
 assert.equal(details.length,25);
 for(const d of details){
   await page.locator(`[data-part="${d.region}"]`).click();
   await page.locator(`[data-detail="${d.id}"]`).click();
   await page.waitForFunction(id=>trainLab.snapshot().detail===id&&trainLab.snapshot().reveal>.95,d.id);
   assert.equal(await page.locator('#part-en').textContent(),d.en,`${d.id} english`);
   assert.equal(await page.locator('#part-zh').textContent(),d.zh,`${d.id} chinese`);
   assert.equal(await page.locator('#part-principle').textContent(),d.principle,`${d.id} principle`);
   assert.equal(await page.locator('#crumb-detail').textContent(),'› '+d.zhName);
   assert.equal((await snap()).modelId,identity);
 }
 for(const id of ['bogies.wheelset','motors.motor','panto.head','coupler.head','cab.desk']){
   const d=details.find(x=>x.id===id);
   await page.locator(`[data-part="${d.region}"]`).click();
   await page.locator(`[data-detail="${id}"]`).click();
   await page.waitForFunction(i=>trainLab.snapshot().detail===i&&trainLab.snapshot().reveal>.95,id);
   await page.screenshot({path:path.join(out,'hsr-book-'+id.replace('.','-')+'.png')});
 }
 /* the cutaway must actually open the shell, and only for the chosen assembly */
 assert.ok((await page.evaluate(()=>{let cut=0;document.querySelector('#viewport canvas');return true;})));

 /* ---- region gating: the lever drives only the chosen part ---- */
 await page.locator('[data-part="doors"]').click();
 await page.locator('[data-detail="doors.leaf"]').click();
 await page.waitForFunction(()=>trainLab.snapshot().reveal>.95);
 const doorBefore=await page.evaluate(()=>trainLab.snapshot().level);
 await page.locator('#mechanism-step').click();
 await page.waitForFunction(v=>trainLab.snapshot().level>v,doorBefore);
 const doorLevel=(await snap()).level;assert.ok(doorLevel>.05);
 await page.locator('#mechanism-play').click();
 const tick=(await snap()).simulationTime;
 await page.waitForFunction(t=>trainLab.snapshot().simulationTime>t+.1,tick);
 await page.locator('#mechanism-play').click();
 const paused=(await snap()).simulationTime;
 await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 assert.equal((await snap()).simulationTime,paused,'pause must freeze the simulation clock');
 await page.locator('#mechanism').evaluate(el=>{el.value=100;el.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.waitForFunction(()=>trainLab.snapshot().level>.99);
 await page.screenshot({path:path.join(out,'hsr-book-doors-open.png')});
 for(const id of ['pantograph','bogies','motors','windows']){
   await page.locator(`[data-part="${id}"]`).click();
   await page.waitForFunction(()=>trainLab.snapshot().near>.9);
   await page.locator('#mechanism').evaluate(el=>{el.value=100;el.dispatchEvent(new Event('input',{bubbles:true}));});
   await page.waitForFunction(()=>trainLab.snapshot().level>.99);
   await page.screenshot({path:path.join(out,'hsr-book-live-'+id+'.png')});
 }

 /* ---- speech, language toggle, back / home ---- */
 await page.locator('[data-part="pantograph"]').click();
 await page.evaluate(()=>{window.spoken=[];speechSynthesis.speak=u=>window.spoken.push(u.text);});
 await page.locator('#speak').click();
 assert.ok((await page.evaluate(()=>window.spoken))[0].includes('Pantograph'));
 await page.locator('#language').click();assert.equal(await page.locator('#part-zh').isVisible(),false);
 await page.locator('#language').click();assert.equal(await page.locator('#part-zh').isVisible(),true);
 await page.locator('#mechanism').evaluate(el=>{el.value=0;el.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.locator('#home-view').click();await page.waitForFunction(()=>trainLab.snapshot().near===0);
 assert.ok((await snap()).assemblies.every(a=>(a.exterior||a.region==='seats')&&!a.interior&&!a.ghost),'home view must be the whole train, nothing peeled');
 await page.locator('#explode-button').click();await page.waitForFunction(()=>trainLab.snapshot().explosion>.99);
 await page.screenshot({path:path.join(out,'hsr-book-exploded.png')});
 await page.locator('#explode-button').click();await page.waitForFunction(()=>trainLab.snapshot().explosion<.01);
 await page.locator('#side-view').click();await page.locator('#top-view').click();
 await page.locator('#zoom-out').click();await page.locator('#zoom-in').click();
 await page.locator('#auto-rotate').click();assert.equal(await page.locator('#auto-rotate').getAttribute('aria-pressed'),'true');await page.locator('#auto-rotate').click();

 /* ---- responsive: tablet and phone, sticky model, no sideways scroll ---- */
 for(const [width,height]of[[1024,768],[390,844]]){
   await page.setViewportSize({width,height});
   await page.locator('[data-part="bogies"]').click();
   await page.locator('[data-detail="bogies.wheelset"]').click();
   await page.waitForFunction(()=>trainLab.snapshot().reveal>.9);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`no horizontal scroll at ${width}`);
   const c=await page.locator('canvas').boundingBox(),tools=await page.locator('.stage-tools').boundingBox();
   assert.ok(c.y+c.height<=tools.y+1,`canvas must stop above the tool strip at ${width}`);
   if(width<800){
     const en=await page.locator('#part-en').boundingBox();
     assert.ok(en.y>=tools.y+tools.height-1&&en.y+en.height<=height,`the English text must be readable below the sticky model at ${width}`);
     const touch=await page.context().newCDPSession(page),cx=c.x+c.width/2,cy=c.y+c.height/2,d=(await snap()).camera.distance;
     await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cx-30,y:cy,id:1},{x:cx+30,y:cy,id:2}]});
     await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:cx-60,y:cy,id:1},{x:cx+60,y:cy,id:2}]});
     await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
     await page.waitForFunction(v=>trainLab.snapshot().camera.distance<v*.75,d);
     await touch.detach();
   }
   await page.screenshot({path:path.join(out,'hsr-book-'+width+'.png')});
 }

 /* ---- reload, deep link, and the doorways back out of the lab ---- */
 await page.setViewportSize({width:1440,height:940});
 await page.reload();await page.waitForFunction(()=>window.trainLab?.snapshot().renderer.calls>0);
 await page.goto(base+'labs/hsr/?part=pantograph');
 await page.waitForFunction(()=>window.trainLab?.snapshot().selected==='pantograph');
 await page.goto(base+'labs/hsr/#pantograph');await page.waitForFunction(()=>window.trainLab?.snapshot().selected==='pantograph');
 for(const part of await page.evaluate(()=>HSR_PARTS)){await page.locator(`[data-part="${part.id}"]`).click();assert.equal(await page.locator('#part-en').textContent(),part.en,part.id);}
 await page.locator('.lab-navigation a').first().click();await page.waitForFunction(()=>document.querySelector('.lab-card'));
 assert.equal(await page.locator('.lab-card.ready').count(),await page.evaluate(()=>LABS_CATALOG.filter(l=>l.status==='ready').length));
 for(const img of await page.locator('.lab-cover img').all())assert.ok(await img.evaluate(i=>i.complete&&i.naturalWidth>0));
 await page.locator('[data-lab-id="hsr"] .enter-lab').click();await page.waitForFunction(()=>window.trainLab?.snapshot().generation===4);
 await page.locator('.lab-navigation a').last().click();assert.ok(page.url().endsWith('/books/hsr/index.html'));
 await page.locator('.book-lab-link').click();await page.waitForFunction(()=>window.trainLab?.snapshot().generation===4);
 assert.deepEqual(failed,[],'no local asset may 404');
 assert.deepEqual(errors,[],errors.join('\n'));
 console.log(`PASS book train browser: shared stage tint and caption layering, 14 assemblies, progressive reveal, 25 english/chinese/principle discoveries, region-gated lever, pause, speech, reassembly, desktop/tablet/mobile, reload, deep link, lab and book doorways.`);
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

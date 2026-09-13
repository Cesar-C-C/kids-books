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


 const snap=()=>page.evaluate(()=>trainLab.snapshot());
 const frame=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 const select=async id=>{await page.locator('#part-directory').evaluate(e=>e.open=true);await page.locator(`[data-part="${id}"]`).click();await frame();assert.equal(await page.locator('#part-directory').getAttribute('open'),'','directory remains open after selection');};
 const open=async()=>{if(await page.locator('#open-part').isVisible()&&!(await snap()).opening){await page.locator('#open-part').click();await page.waitForFunction(()=>trainLab.snapshot().openAmount>.99);}};
 const identity=(await snap()).modelId;
 assert.equal((await snap()).geometry.assemblies,14);
 await page.screenshot({path:path.join(out,'hsr-book-whole.png')});
 if(process.env.UPDATE_LAB_PREVIEW==='1'&&!process.env.LAB_LIVE_BASE)await page.locator('#viewport').screenshot({path:path.join(root,'labs/hsr/preview.png')});
 if(!process.env.LAB_REAR_ONLY){
 const initial=(await snap()).camera,canvas=await page.locator('canvas').boundingBox();
 await page.mouse.move(canvas.x+canvas.width/2,canvas.y+canvas.height/2);await page.mouse.wheel(0,-600);await frame();
 let state=await snap();assert.ok(state.camera.distance<initial.distance);assert.equal(state.selected,null);assert.equal(state.reveal,0);assert.deepEqual(state.camera.target,initial.target);
 await select('seats');const selected=(await snap()).camera;
 assert.deepEqual(selected,state.camera,'selection must not move camera');
 assert.equal((await snap()).opening,null);
 await page.locator('#focus-part').click();await frame();assert.notEqual((await snap()).camera.distance,selected.distance);
 await page.locator('#back-view').click();await frame();assert.deepEqual((await snap()).camera,selected,'previous view restores exact camera');
 await open();state=await snap();assert.equal(state.opening,'cabin');
 assert.ok(state.assemblies.find(a=>a.id==='roof').exteriorPosition[1]>3);
 assert.ok(state.assemblies.find(a=>a.id==='seats').interior);
 assert.ok(state.assemblies.find(a=>a.id==='cabin-body').exteriorPosition[2]<-3);
 assert.equal(state.changedOpacity,0);
 await page.screenshot({path:path.join(out,'hsr-book-seats.png')});
 await page.locator('[data-detail="seats.back"]').click();await frame();
 assert.equal((await snap()).opening,'cabin');
 await page.locator('#open-part').click();await page.waitForFunction(()=>trainLab.snapshot().openAmount<.001);state=await snap();
 assert.ok(state.assemblies.every(a=>a.exteriorPosition.every(x=>x===0)),'closing restores all exterior positions');
 assert.deepEqual(state.camera,selected,'closing restores view from before opening');assert.equal(state.detail,null);assert.ok(state.assemblies.every(a=>!a.interior));
 const discoveries=await page.evaluate(()=>HSR_DETAILS);assert.equal(discoveries.length,25);
 for(const d of discoveries){await select(d.region);await open();await page.locator(`[data-detail="${d.id}"]`).click();await frame();
   assert.equal((await snap()).detail,d.id);assert.equal(await page.locator('#part-en').textContent(),d.en);assert.equal(await page.locator('#part-zh').textContent(),d.zh);assert.equal(await page.locator('#part-principle').textContent(),d.principle);
   assert.equal((await snap()).modelId,identity);assert.equal((await snap()).changedOpacity,0);
 }
 await select('motors');await open();const normal=(await snap()).cutNormal;
 await page.locator('#side-view').click();await page.locator('#top-view').click();await frame();assert.deepEqual((await snap()).cutNormal,normal,'section stays fixed while rotating camera');
 for(const id of ['cab','bogies','motors']){await select(id);await open();await page.screenshot({path:path.join(out,'hsr-book-open-'+id+'.png')});}
 await select('doors');await page.locator('#mechanism-play').click();const t=(await snap()).simulationTime;await page.waitForFunction(t=>trainLab.snapshot().simulationTime>t+.1,t);await page.locator('#mechanism-play').click();const paused=(await snap()).simulationTime;await frame();assert.equal((await snap()).simulationTime,paused);
 await select('pantograph');await page.evaluate(()=>{window.spoken=[];speechSynthesis.speak=u=>spoken.push(u.text);});await page.locator('#speak').click();assert.ok((await page.evaluate(()=>spoken))[0].includes('Pantograph'));
 await select('seats');await open();await page.locator('#explode-button').click();await frame();assert.equal((await snap()).opening,null);assert.equal((await snap()).explosion,1);
 await page.locator('#explode-button').click();await frame();assert.equal((await snap()).explosion,0);
 await page.locator('#home-view').click();await frame();assert.equal((await snap()).opening,null);
 for(const [width,height]of[[1440,940],[1024,768],[390,844]]){
  await page.setViewportSize({width,height});await select('seats');await open();
  await page.evaluate(()=>{window.scrollTo(0,0);document.querySelector('.inspector').scrollTop=0;});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  const c=await page.locator('canvas').boundingBox(),tools=await page.locator('.stage-tools').boundingBox(),inspector=await page.locator('.inspector').boundingBox();
  assert.ok(c.y+c.height<=tools.y+1,'tools stay outside canvas');
  if(width>800)assert.ok(inspector.x>=c.x+c.width-1);else assert.ok(inspector.y>=tools.y+tools.height-1);
  await page.screenshot({path:path.join(out,'hsr-book-'+width+'.png')});
  if(width===390){const touch=await page.context().newCDPSession(page),cx=c.x+c.width/2,cy=c.y+c.height/2,d=(await snap()).camera.distance;
   await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cx-30,y:cy,id:1},{x:cx+30,y:cy,id:2}]});
   await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:cx-60,y:cy,id:1},{x:cx+60,y:cy,id:2}]});
   await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await frame();assert.ok((await snap()).camera.distance<d*.75);assert.equal((await snap()).opening,'cabin');await touch.detach();
  }
 }
 }
 await page.setViewportSize({width:1440,height:940});
 await page.evaluate(()=>trainLab.setView(2.7,.22,10,40));await frame();await select('cab');
 assert.equal((await snap()).assembly,'coach-25.1','nearest tail cab can be selected');
 await open();state=await snap();assert.equal(state.opening,'cab');assert.ok(state.assemblies.find(a=>a.id==='coach-25.1').interior);
 await page.screenshot({path:path.join(out,'hsr-book-rear-cab.png')});
 await page.locator('#part-directory').evaluate(e=>e.open=false);await page.locator('#home-view').click();await frame();
 assert.equal(await page.locator('#part-directory').getAttribute('open'),null,'manual collapse is preserved');
 await page.goto(base+'labs/hsr/?part=pantograph');await page.waitForFunction(()=>window.trainLab?.snapshot().selected==='pantograph');
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
 console.log(process.env.LAB_REAR_ONLY?'PASS: reverse rear cab selection, visible interior and manual directory state.':'PASS: independent selection/zoom, exact camera return, explicit opening and restoration, stable cut plane, 25 bilingual details, mechanisms, speech, mutually exclusive explosion, desktop/tablet/mobile layout and pinch.');
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

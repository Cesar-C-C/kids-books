// Real browser regression for the five picture-book exhibits.
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const root=__dirname,out=path.join(root,'.qa-labs');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{let f=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/kids-books/,''));if(!f.startsWith(root+path.sep)){res.writeHead(403);return res.end();}if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');if(!fs.existsSync(f)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png'})[path.extname(f)]||'application/octet-stream');fs.createReadStream(f).pipe(res);});
const cases=[['airplane','airplaneLab','AIRPLANE_DETAILS','fuselage','engines'],['rocket','rocketLab','ROCKET_DETAILS','satellite','fuel'],['schoolbus','busLab','SCHOOLBUS_DETAILS','seats','hood'],['doubledecker','doubledeckerLab','DOUBLEDECKER_DETAILS','lower','stairs'],['station','stationLab','STATION_DETAILS','interior','solar']].filter(c=>!process.env.LAB_SUBJECT||c[0]===process.env.LAB_SUBJECT);
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({...(process.env.LAB_BROWSER==='chromium'?{}:{channel:'chrome'}),headless:true,args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
 const base=process.env.LAB_LIVE_BASE||`http://127.0.0.1:${server.address().port}/kids-books/`;
 for(const [id,api,detailVar,insidePart,second] of cases){
  const page=await browser.newPage({viewport:{width:1440,height:940},reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(base))errors.push(r.status()+' '+r.url());});
  await page.goto(base+`labs/${id}/`);await page.waitForFunction(api=>window[api]?.snapshot().renderer.calls>0,api);
  const snap=()=>page.evaluate(api=>window[api].snapshot(),api),frame=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const select=async part=>{await page.locator('#part-directory').evaluate(e=>e.open=true);await page.locator(`[data-part="${part}"]`).click();await frame();};
  const open=async()=>{if(!(await snap()).opening){await page.locator('#open-part').click();await frame();}};
  let state=await snap();const identity=state.modelId;assert.equal(state.displayVersion,1);assert.equal(state.opening,null);assert.equal(state.changedOpacity,0);
  await page.screenshot({path:path.join(out,`${id}-exhibit-whole.png`)});
  if(process.env.UPDATE_LAB_PREVIEW==='1'&&!process.env.LAB_LIVE_BASE)await page.locator('#viewport').screenshot({path:path.join(root,'labs',id,'preview.png')});
  const initial=state.camera,c=await page.locator('canvas').boundingBox();await page.mouse.move(c.x+c.width/2,c.y+c.height/2);await page.mouse.wheel(0,-450);await frame();
  state=await snap();assert.ok(state.camera.distance<initial.distance);assert.equal(state.selected,null);assert.equal(state.reveal,0);assert.equal(state.changedOpacity,0);assert.deepEqual(state.camera.target,initial.target);
  await select(insidePart);const previous=(await snap()).camera;assert.deepEqual(previous,state.camera,'select does not move camera');
  await page.locator('#focus-part').click();await frame();assert.notEqual((await snap()).camera.distance,previous.distance);
  await page.locator('#back-view').click();await frame();assert.deepEqual((await snap()).camera,previous);
  await open();state=await snap();assert.ok(state.opening);assert.ok(state.assemblies.some(a=>a.interior));assert.equal(state.changedOpacity,0);
  await page.screenshot({path:path.join(out,`${id}-exhibit-open.png`)});
  await page.locator('#open-part').click();await frame();state=await snap();assert.equal(state.opening,null);assert.equal(state.openAmount,0);assert.deepEqual(state.camera,previous);assert.ok(state.assemblies.every(a=>a.exteriorPosition.every(x=>x===0)));
  const details=await page.evaluate(k=>window[k],detailVar);
  for(const d of details){
   // Exercise each DOM action without browser auto-scrolling between every detail.
   await page.evaluate(({region})=>document.querySelector(`[data-part="${region}"]`).click(),d);await frame();
   if(!(await snap()).opening){await page.locator('#open-part').evaluate(e=>e.click());await frame();}
   await page.locator(`[data-detail="${d.id}"]`).evaluate(e=>e.click());await frame();state=await snap();
   assert.equal(state.detail,d.id);assert.equal(state.changedOpacity,0);assert.equal(state.modelId,identity);assert.equal(await page.locator('#part-en').textContent(),d.en);assert.equal(await page.locator('#part-zh').textContent(),d.zh);
  }
  const moving={airplane:'engines',rocket:'satellite',schoolbus:'stopsign',doubledecker:'doors',station:'solar'}[id];
  await select(moving);await page.locator('#mechanism-play').click();const tick=(await snap()).simulationTime;await page.waitForFunction(({api,tick})=>window[api].snapshot().simulationTime>tick+.1,{api,tick});await page.locator('#mechanism-play').click();const paused=(await snap()).simulationTime;await frame();assert.equal((await snap()).simulationTime,paused);
  await page.evaluate(()=>{window.spoken=[];speechSynthesis.speak=u=>spoken.push(u.text);});await page.locator('#speak').click();assert.ok((await page.evaluate(()=>spoken)).length);
  await select(second);await open();const normal=(await snap()).cutNormal;await page.locator('#side-view').click();await frame();assert.deepEqual((await snap()).cutNormal,normal);await page.locator('#focus-part').click();await frame();
  await page.evaluate(()=>document.querySelector('.inspector').scrollTop=0);await page.screenshot({path:path.join(out,`${id}-exhibit-detail.png`)});
  await page.locator('#explode-button').click();await frame();assert.equal((await snap()).opening,null);assert.equal((await snap()).explosion,1);await page.locator('#explode-button').click();await frame();assert.equal((await snap()).explosion,0);
  await select(insidePart);await open();
  for(const [width,height]of[[1024,768],[390,844]]){
   await page.setViewportSize({width,height});await page.locator('#focus-part').click();await frame();await page.evaluate(()=>{window.scrollTo(0,0);document.querySelector('.inspector').scrollTop=0;});
   const c=await page.locator('canvas').boundingBox(),tools=await page.locator('.stage-tools').boundingBox(),panel=await page.locator('.inspector').boundingBox();
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.ok(c.y+c.height<=tools.y+1);if(width>800)assert.ok(panel.x>=c.x+c.width-1);else assert.ok(panel.y>=tools.y+tools.height-1);
   await page.screenshot({path:path.join(out,`${id}-exhibit-${width}.png`)});
   if(width===390){const cd=await page.context().newCDPSession(page),x=c.x+c.width/2,y=c.y+c.height/2,before=(await snap());
    await cd.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x-30,y,id:1},{x:x+30,y,id:2}]});await cd.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-60,y,id:1},{x:x+60,y,id:2}]});await cd.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await frame();assert.ok((await snap()).camera.distance<before.camera.distance*.75);assert.equal((await snap()).opening,before.opening);await cd.detach();}
  }
  await page.reload();await page.waitForFunction(api=>window[api]?.snapshot().renderer.calls>0,api);assert.equal((await snap()).opening,null);assert.deepEqual(errors,[]);console.log(`PASS ${id}: ${details.length} bilingual details; zoom, focus/back, opening/close, fixed section, explode, desktop/tablet/mobile and pinch.`);await page.close();
 }
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

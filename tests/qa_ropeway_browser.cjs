'use strict';
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict'),crypto=require('crypto');
const root=path.resolve(process.env.ROPEWAY_ROOT||path.join(__dirname,'..')),out=path.resolve(process.env.ROPEWAY_REPORT_DIR||path.join(root,'.qa-labs/ropeway'));fs.mkdirSync(out,{recursive:true});
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.mp3':'audio/mpeg','.webmanifest':'application/manifest+json'};
const server=http.createServer((req,res)=>{let target;try{target=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(target!==root&&!target.startsWith(root+path.sep))throw Error('scope');if(fs.statSync(target).isDirectory())target=path.join(target,'index.html');res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');res.end(fs.readFileSync(target));}catch(e){res.statusCode=404;res.end('Not found');}});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const runtimeSha256=crypto.createHash('sha256').update(['index.html','ropeway.css','model.js','content.js','scene.js','audio-manifest.js','audio.js','app.js'].map(f=>f+'\n'+fs.readFileSync(path.join(root,'labs/ropeway',f),'utf8').replace(/\r\n/g,'\n')).join('\n')).digest('hex');
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']}),report={base,runtimeSha256,profiles:[],limits:'Trusted browser/CDP simulation, not a physical-device or installed-PWA acceptance.'};
 try{
 for(const profile of [{name:'desktop',width:1360,height:920,touch:false},{name:'phone',width:390,height:844,touch:true},{name:'tablet',width:820,height:1180,touch:true},{name:'fallback',width:390,height:844,touch:true,fallback:true}]){
  const ctx=await browser.newContext({viewport:{width:profile.width,height:profile.height},isMobile:profile.touch,hasTouch:profile.touch,deviceScaleFactor:1,serviceWorkers:'block',reducedMotion:'reduce'});
  const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/index.html');await page.locator('.library-nav a[href="labs/index.html"]').click();
  const entry=page.locator('[data-lab-id="ropeway"]');await entry.waitFor();
  assert.equal(await page.locator('#lab-count').innerText(),'8 个已开放 · 一起动手探索');
  await page.waitForFunction(()=>document.querySelector('[data-lab-id="ropeway"] img').naturalWidth>0);
  await entry.locator('.enter-lab').click();await page.waitForURL('**/labs/ropeway/index.html');
  if(profile.fallback)await page.goto(base+'/labs/ropeway/index.html?render=fallback');
  await page.waitForFunction(()=>window.RopewayLab);
  const snap=()=>page.evaluate(()=>RopewayLab.getSnapshot());
  let s=await snap();assert.equal(s.render,profile.fallback?'fallback':'webgl');assert.equal(s.lessonMode,'journey');assert.equal(s.mode,'paused');assert.equal(s.time,0);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'no horizontal page overflow');
  await page.waitForTimeout(100);await page.locator('#stage').screenshot({path:path.join(out,profile.name+'-overview.png')});
  if(profile.name==='desktop'&&process.env.ROPEWAY_GENERATE_PREVIEW==='1')await page.locator('#stage').screenshot({path:path.join(root,'labs/ropeway/preview.png')});
  await page.locator('[data-mode="tension"]').click();
  const tensionBefore=await snap(),fallbackBefore=profile.fallback?await page.locator('#fallback-drive').getAttribute('transform'):null;
  await page.locator('#stretch').focus();await page.locator('#stretch').press('End');
  await page.waitForFunction(()=>RopewayLab.getSnapshot().stretch===1);
  if(profile.fallback){
   await page.waitForFunction(()=>document.querySelector('#fallback-drive').getAttribute('transform')==='translate(92.5 160)');
   assert.notEqual(await page.locator('#fallback-drive').getAttribute('transform'),fallbackBefore);
  }else{
   await page.waitForFunction(()=>Math.abs(RopewayLab.getSnapshot().visual.frameX+.3)<1e-8);
   const v=(await snap()).visual;assert.ok(Math.abs(v.ropeMinX-tensionBefore.visual.ropeMinX+.3)<.003,'drawn rope follows sliding frame');
   for(const id of ['decelerate','board','accelerate']){
    const speeds=v.conveyors.filter(x=>x.phase===id).map(x=>x.speed);assert.equal(speeds.length,9);
    assert.ok(id==='decelerate'?speeds[0]>speeds[8]:id==='accelerate'?speeds[0]<speeds[8]:speeds.every(x=>x===.36));
   }
  }
  await page.locator('#stage').screenshot({path:path.join(out,profile.name+'-tension.png')});
  await page.locator('#reset').click();await page.locator('[data-mode="journey"]').click();
  await page.locator('.phase-tools > summary').click();
  await page.locator('[data-phase="detach"]').click();s=await snap();assert.ok(s.cars[0].grip<1&&s.cars[0].rail);
  await page.locator('[data-phase="board"]').click();s=await snap();assert.equal(s.cars[0].grip,0);assert.ok(s.cars[0].speed<1.8);assert.equal(s.follow,true);
  await page.waitForTimeout(100);await page.locator('#stage').screenshot({path:path.join(out,profile.name+'-boarding.png')});
  await page.locator('[data-phase="couple"]').click();assert.equal((await snap()).cars[0].speed,1.8);
  await page.locator('.phase-tools > summary').click();
  await page.locator('#language').click();assert.equal((await snap()).language,'en');assert.equal(await page.locator('h1').innerText(),'How does a gondola take us uphill?');
  await page.locator('[data-mode="safety"]').click();await page.locator('#grip-fault').click();await page.waitForFunction(()=>RopewayLab.getSnapshot().mode==='protective-stop');
  s=await snap();assert.equal(s.cars[0].checked,false);assert.equal(s.cars[0].phase,'check');assert.equal(await page.locator('#auxiliary').isDisabled(),true);assert.equal(await page.locator('#play').isDisabled(),true);
  if(profile.fallback)await page.waitForFunction(()=>document.querySelector('#fallback-brake').getAttribute('stroke-width')==='4');
  else await page.waitForFunction(()=>Math.abs(RopewayLab.getSnapshot().visual.safetyGap-.13)<1e-8&&Math.abs(RopewayLab.getSnapshot().visual.serviceGap-.37)<1e-8);
  await page.locator('#reset').click();await page.locator('#power-fault').click();await page.waitForFunction(()=>RopewayLab.getSnapshot().auxiliaryAllowed);
  await page.locator('#auxiliary').click();s=await snap();assert.equal(s.drive,'auxiliary');assert.equal(s.factor,.22);
  if(profile.fallback)await page.waitForFunction(()=>document.querySelector('#fallback-aux').getAttribute('stroke-width')==='5');
  else await page.waitForFunction(()=>RopewayLab.getSnapshot().visual.auxiliaryGlow>0&&Math.abs(RopewayLab.getSnapshot().visual.safetyGap-.25)<1e-8);
  await page.locator('#pause').click();s=await snap();assert.equal(s.mode,'power-stop');assert.equal(s.factor,0);assert.equal(s.fault,'power');assert.equal(s.auxiliaryAllowed,true);
  await page.waitForFunction(()=>!document.getElementById('auxiliary').disabled&&document.getElementById('play').disabled);
  const auxiliaryPause=s.time;await page.waitForTimeout(80);assert.equal((await snap()).time,auxiliaryPause);
  await page.locator('#auxiliary').click();await page.waitForFunction(t=>RopewayLab.getSnapshot().time>t,auxiliaryPause);assert.equal((await snap()).factor,.22);
  await page.waitForFunction(()=>RopewayLab.getSnapshot().lesson==='auxiliary');
  if(!await page.locator('#listen').isDisabled()){
   await page.locator('#listen').click();await page.waitForFunction(()=>RopewayLab.getSnapshot().audio.currentTime>.04);
   assert.equal((await snap()).mode,'power-stop');assert.equal((await snap()).auxiliaryAllowed,true);assert.equal(await page.locator('#play').isDisabled(),true);
   await page.locator('#audio-stop').click();await page.locator('#auxiliary').click();assert.equal((await snap()).mode,'aux-running');assert.equal((await snap()).factor,.22);
  }
  await page.locator('#reset').click();await page.locator('[data-mode="journey"]').click();
  await page.locator('#stage').scrollIntoViewIfNeeded();const box=await page.locator('#stage').boundingBox(),x=box.x+box.width*.5,y=box.y+box.height*.65;
  const before=await snap(),scrollBefore=await page.evaluate(()=>scrollY);
  if(profile.touch){
   const cdp=await ctx.newCDPSession(page),tp=(id,px,py)=>({id,x:px,y:py,radiusX:1,radiusY:1,force:1});
   async function touch(type,pts){await cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts});await page.waitForTimeout(28);}
   if(profile.fallback){
    for(const selector of ['#fallback-drive ellipse','#fallback-rope']){
     await page.locator('[data-mode="journey"]').click();await page.waitForTimeout(70);
     const point=await page.evaluate(selector=>{
      const e=document.querySelector(selector);
      for(let q=.025;q<1;q+=.025){
       const p=e.getPointAtLength(e.getTotalLength()*q),v=new DOMPoint(p.x,p.y).matrixTransform(e.getScreenCTM());
       if(document.elementFromPoint(v.x,v.y)===e)return {x:v.x,y:v.y};
      }throw Error('No visible SVG hit point: '+selector);
     },selector),yaw=(await snap()).view.yaw;
     await touch('touchStart',[tp(1,point.x,point.y)]);await touch('touchMove',[tp(1,point.x+25,point.y)]);await touch('touchMove',[tp(1,point.x+40,point.y)]);await touch('touchEnd',[]);
     assert.ok(Math.abs((await snap()).view.yaw-yaw)>.2,'native orbit starts on SVG shape '+selector);
    }
    await page.locator('[data-mode="journey"]').click();await page.locator('#stage').scrollIntoViewIfNeeded();
   }
   await touch('touchStart',[tp(1,x,y)]);for(let i=1;i<=7;i++)await touch('touchMove',[tp(1,x,y-i*20)]);await touch('touchEnd',[]);
   const after=await snap();assert.ok(await page.evaluate(()=>scrollY)>scrollBefore+40,'native vertical scroll');assert.ok(Math.abs(after.view.yaw-before.view.yaw)<1e-6);
   await page.locator('#stage').scrollIntoViewIfNeeded();const b=await page.locator('#stage').boundingBox(),hx=b.x+b.width*.25,hy=b.y+b.height*.5;
   const horizontalBefore=(await snap()).view.yaw;await touch('touchStart',[tp(1,hx,hy)]);await touch('touchMove',[tp(1,hx+45,hy)]);await touch('touchMove',[tp(1,hx+70,hy)]);await touch('touchEnd',[]);
   assert.ok(Math.abs((await snap()).view.yaw-horizontalBefore)>.2,'single horizontal orbit');
   await touch('touchStart',[tp(1,hx,hy)]);await touch('touchMove',[tp(1,hx+25,hy)]);const multiBefore=(await snap()).view.yaw;
   await touch('touchStart',[tp(1,hx+25,hy),tp(2,hx+100,hy)]);await touch('touchMove',[tp(1,hx+35,hy),tp(2,hx+120,hy)]);await touch('touchEnd',[]);
   assert.equal((await snap()).view.yaw,multiBefore,'multi-touch freezes camera');
   await page.locator('#stage').scrollIntoViewIfNeeded();const recoveryY=await page.evaluate(()=>scrollY),recoveryYaw=(await snap()).view.yaw;
   await touch('touchStart',[tp(1,hx,hy)]);for(let i=1;i<=5;i++)await touch('touchMove',[tp(1,hx+i*2,hy-i*20)]);await touch('touchEnd',[]);
   assert.ok(await page.evaluate(()=>scrollY)>recoveryY+30,'diagonal vertical recovery after multi-touch');assert.equal((await snap()).view.yaw,recoveryYaw);
   await page.locator('#stage').scrollIntoViewIfNeeded();const cancelBox=await page.locator('#stage').boundingBox(),cx=cancelBox.x+cancelBox.width*.3,cy=cancelBox.y+cancelBox.height*.5;
   await touch('touchStart',[tp(1,cx,cy)]);await touch('touchMove',[tp(1,cx+30,cy)]);await touch('touchCancel',[]);const cancelYaw=(await snap()).view.yaw;
   await touch('touchStart',[tp(1,cx,cy)]);await touch('touchMove',[tp(1,cx+40,cy)]);await touch('touchEnd',[]);assert.ok(Math.abs((await snap()).view.yaw-cancelYaw)>.2,'orbit recovers after native cancellation');
  }else{
   await page.mouse.move(x,y);await page.mouse.wheel(0,180);await page.waitForTimeout(100);assert.ok(await page.evaluate(()=>scrollY)>scrollBefore+50,'wheel scroll');
   await page.locator('#stage').scrollIntoViewIfNeeded();const b=await page.locator('#stage').boundingBox();await page.mouse.move(b.x+100,b.y+100);await page.mouse.down();await page.mouse.move(b.x+150,b.y+130,{steps:5});await page.mouse.up();s=await snap();assert.ok(Math.abs(s.view.yaw-before.view.yaw)>.2);assert.ok(Math.abs(s.view.pitch-before.view.pitch)>.1);
  }
  await page.locator('.view-tools > summary').click();await page.locator('#overview').click();await page.locator('#stage').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,profile.name+'.png'),fullPage:true});
  const beforeZoom=(await snap()).view.distance;await page.locator('#zoom-in').focus();await page.locator('#zoom-in').press('Enter');assert.ok((await snap()).view.distance<beforeZoom);
  await page.locator('#zoom-out').focus();await page.locator('#zoom-out').press('Enter');assert.ok(Math.abs((await snap()).view.distance-beforeZoom)<1e-8);
  await page.locator('#roof').focus();await page.locator('#roof').press('Enter');assert.equal((await snap()).cutaway,false);
  await page.locator('#roof').press('Enter');assert.equal((await snap()).cutaway,true);
  s=await snap();assert.deepEqual(errors,[]);if(s.geometry){assert.ok(s.geometry.calls<250);assert.ok(s.geometry.triangles<50000);}
  report.profiles.push({name:profile.name,render:s.render,geometry:s.geometry,errors,entry:true,passed:'real shelf/catalog entry, mechanism, visible tension/brakes/auxiliary/tire gradient, language, native scroll/orbit and keyboard controls'});
  await ctx.close();
 }
 report.status='PASS';fs.writeFileSync(path.join(out,'browser-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

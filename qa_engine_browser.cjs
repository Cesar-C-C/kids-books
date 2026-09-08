const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const root=__dirname,out=path.join(root,'.qa-labs');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let file=path.resolve(root,'.'+pathname.replace(/^\/kids-books/,''));if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');if(!fs.existsSync(file)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1050}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const base=process.env.LAB_LIVE_BASE||`http://127.0.0.1:${server.address().port}/kids-books/`;
  // The primary airplane entry is exercised by qa_inline_engine.cjs.
  // Keep the previously shared standalone URL usable as well.
  await page.goto(base+'labs/airplane/engine/');
  await page.waitForFunction(()=>window.engineDiscovery?.snapshot().rendered);
  assert.equal(await page.locator('[data-engine-part]').count(),8);
  await page.locator('#front-view').click();await page.waitForTimeout(150);
  let canvas=await page.locator('#engine-viewport canvas').boundingBox();await page.mouse.click(canvas.x+canvas.width/2,canvas.y+canvas.height/2);
  assert.equal(await page.evaluate(()=>engineDiscovery.snapshot().selected),'fan','Actual fan mesh can be clicked');
  await page.locator('#reset-view').click();canvas=await page.locator('#engine-viewport canvas').boundingBox();await page.mouse.move(canvas.x+40,canvas.y+canvas.height-30);await page.mouse.down();await page.mouse.move(canvas.x+110,canvas.y+canvas.height-20,{steps:5});await page.mouse.up();assert.ok(await page.evaluate(()=>engineDiscovery.snapshot().camera.yaw<-.5));
  await page.locator('#zoom-in').click();assert.ok(await page.evaluate(()=>engineDiscovery.snapshot().camera.distance<12.5));await page.locator('#reset-view').click();
  await page.locator('#shell-open').fill('100');
  await page.locator('[data-engine-part="fan"]').click();
  await page.locator('#play').click();await page.waitForTimeout(350);await page.locator('#play').click();
  const t=await page.evaluate(()=>engineDiscovery.snapshot().time);await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>engineDiscovery.snapshot().time),t,'Pause stops simulation');
  await page.locator('#step').click();assert.ok(await page.evaluate(t=>engineDiscovery.snapshot().time>t,t));
  await page.locator('[data-task="find"]').click();await page.locator('[data-answer="fan"]').click();assert.match(await page.locator('#task-feedback').textContent(),/发现记录/);
  await page.locator('[data-task="routes"]').click();await page.locator('[data-flow="bypass"]').click();await page.locator('#step').click();await page.locator('[data-flow="core"]').click();await page.locator('#step').click();
  await page.locator('[data-answer="core"]').click();assert.equal(await page.evaluate(()=>engineDiscovery.snapshot().journal.explained.includes('routes')),false,'Wrong answer cannot complete task');
  await page.locator('[data-answer="bypass"]').click();
  await page.locator('[data-task="connect"]').click();await page.locator('#shaft-toggle').click();await page.locator('#step').click();await page.locator('[data-answer="shaft"]').click();
  await page.locator('[data-task="fuel"]').click();await page.locator('[data-engine-part="combustor"]').click();await page.locator('[data-answer="combustor"]').click();
  assert.equal(await page.evaluate(()=>engineDiscovery.snapshot().journal.explained.length),4);
  await page.reload();await page.waitForFunction(()=>window.engineDiscovery?.snapshot().rendered);
  assert.equal(await page.evaluate(()=>engineDiscovery.snapshot().journal.explained.length),4);
  assert.equal(await page.locator('#engine-name').textContent(),'Combustor');
  await page.locator('[data-engine-part="shaft"]').click();await page.locator('#shell-open').fill('100');
  await page.screenshot({path:path.join(out,'engine-desktop.png'),fullPage:true});
  await page.evaluate(()=>{window.__spoken=[];speechSynthesis.speak=u=>window.__spoken.push(u.text);});
  await page.locator('#say-name').click();assert.equal((await page.evaluate(()=>window.__spoken))[0],'Shaft');
  await page.locator('#reset-view').click();assert.equal(await page.locator('#shell-open').inputValue(),'0');assert.equal(await page.evaluate(()=>engineDiscovery.snapshot().journal.explained.length),4,'Model reset preserves learning');
  await page.setViewportSize({width:390,height:844});await page.locator('#shell-open').fill('100');await page.locator('[data-engine-part="fan"]').click();await page.waitForTimeout(300);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:path.join(out,'engine-mobile.png'),fullPage:true});
  await page.locator('#clear-progress').click();await page.locator('#confirm-clear').click();await page.waitForFunction(()=>engineDiscovery.snapshot().journal.explained.length===0);
  await page.locator('[data-engine-part="fan"]').click();await page.locator('#step').click();
  await page.locator('#clear-progress').click();await page.keyboard.press('Escape');await page.waitForTimeout(100);
  assert.ok(await page.evaluate(()=>engineDiscovery.snapshot().journal.found.includes('fan')),'Cancel clear preserves new discoveries');
  await page.locator('#shell-open').fill('100');await page.locator('#shaft-toggle').click();await page.locator('[data-flow="core"]').click();await page.locator('#step').click();
  assert.equal(await page.evaluate(()=>engineDiscovery.snapshot().journal.operated.includes('core')),false,'Hidden air cannot count as observed');
  await page.locator('[data-task="routes"]').click();await page.locator('[data-answer="bypass"]').click();assert.match(await page.locator('#task-feedback').textContent(),/先/,'Observation required after reset');
  assert.equal(errors.length,0,errors.join('\n'));
  await page.locator('.next-discovery a').click();await page.waitForFunction(()=>window.airplaneLab?.snapshot().selected==='wings');
  const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const touch=await mobile.newPage();await touch.goto(base+'labs/airplane/engine/');await touch.waitForFunction(()=>window.engineDiscovery?.snapshot().rendered);await touch.locator('[data-engine-part="fan"]').tap();assert.equal(await touch.locator('#engine-name').textContent(),'Fan');await touch.locator('#engine-viewport').scrollIntoViewIfNeeded();
  const bounds=await touch.locator('#engine-viewport').boundingBox(),cdp=await mobile.newCDPSession(touch),cx=bounds.x+bounds.width/2,cy=bounds.y+bounds.height/2;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cx-30,y:cy},{x:cx+30,y:cy}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:cx-65,y:cy},{x:cx+65,y:cy}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.ok(await touch.evaluate(()=>engineDiscovery.snapshot().camera.distance<12.5),'Two-finger pinch zooms');await mobile.close();
  const fallback=await browser.newContext();await fallback.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw Error('blocked storage')}}));const textPage=await fallback.newPage();await textPage.route('**/vendor/three.min.js',r=>r.abort());await textPage.goto(base+'labs/airplane/engine/');await textPage.locator('[data-engine-part="turbine"]').click();assert.equal(await textPage.locator('#engine-name').textContent(),'Turbine');assert.ok(await textPage.locator('#engine-error').isVisible());assert.match(await textPage.locator('#save-status').textContent(),/暂不能保存/);assert.ok(await textPage.locator('#play').isDisabled());await fallback.close();
  console.log('PASS engine browser: entry, render, eight parts, pause/step, four observation tasks, retry, persistence, speech, mobile, reset');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const root=__dirname,out=path.join(root,'.qa-labs');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{let f=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/kids-books/,''));if(!f.startsWith(root+path.sep)){res.writeHead(403);return res.end();}if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');if(!fs.existsSync(f)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css'})[path.extname(f)]||'application/octet-stream');fs.createReadStream(f).pipe(res);});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto((process.env.LAB_LIVE_BASE||`http://127.0.0.1:${server.address().port}/kids-books/`)+'labs/airplane/');await page.waitForFunction(()=>window.airplaneLab?.snapshot().renderer.calls>0);
 const intersects=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
 for(const [width,height] of [[1440,900],[1024,768],[390,844]]){
  await page.setViewportSize({width,height});await page.locator('#home-view').click();
  if(width<781)await page.locator('#controls-toggle').click();
  await page.locator('#assembly-options').evaluate(e=>e.open=true);
  await page.locator('#explode').fill('0');
  const before=await page.locator('canvas').boundingBox();
  assert.equal(await page.locator('.model-panel #exploration-controls').count(),0);
  assert.equal(await page.locator('.learning-panel #exploration-controls').count(),1);
  assert.ok(!intersects(before,await page.locator('.view-tools').boundingBox()),'View tools must stay outside canvas');
  if(width>780){assert.ok(before.height>height*.58,'Canvas should use most available height');assert.ok(!intersects(before,await page.locator('#exploration-controls').boundingBox()),'Sliders must stay beside canvas');}
  else {await page.locator('#mechanism').scrollIntoViewIfNeeded();const slider=await page.locator('#mechanism').boundingBox(),canvas=await page.locator('canvas').boundingBox();assert.ok(!intersects(canvas,slider),'Mobile slider must not cover canvas');}
  await page.locator('#assembly-options').evaluate(e=>e.open=false);
  assert.ok(Math.abs((await page.locator('canvas').boundingBox()).height-before.height)<2,'Opening assembly cannot shrink canvas');
  await page.locator('[data-part="engines"]').click();await page.locator('[data-detail="engine.fan"]').click();await page.waitForTimeout(1800);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  if(width>780)await page.locator('#part-name').scrollIntoViewIfNeeded();
  await page.screenshot({path:path.join(out,`clear-focus-${width}.png`),animations:'disabled'});
 }
 assert.equal(errors.length,0,errors.join('\n'));console.log('PASS layout: desktop/tablet/mobile controls outside canvas, no shrink on assembly, no overflow');
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

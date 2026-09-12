// Browser contract for the explorer-architecture labs. hsr moved to the v3
// studio and is covered by qa_v3_hsr_browser.cjs.
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const root=__dirname,output=path.join(root,'.qa-labs');fs.mkdirSync(output,{recursive:true});
const server=http.createServer((req,res)=>{
  let url;try{url=decodeURIComponent(new URL(req.url,'http://local').pathname);}catch{res.writeHead(400);return res.end();}
  if(!url.startsWith('/kids-books/')){res.writeHead(404);return res.end();}
  let file=path.resolve(root,url.slice(12));
  if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  if(!fs.existsSync(file)){res.writeHead(404);return res.end();}
  const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp'};
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);
});
(async()=>{
  const browser=await chromium.launch({...(process.env.LAB_BROWSER_PATH?{executablePath:process.env.LAB_BROWSER_PATH}:process.env.LAB_BROWSER==='chromium'?{}:{channel:'chrome'}),headless:true,args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const reports=[];
  try{
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    const base=process.env.LAB_BASE_URL||`http://127.0.0.1:${server.address().port}/kids-books/`;
    for(const id of ['rocket','schoolbus']){
      const page=await browser.newPage({viewport:{width:1440,height:1120},deviceScaleFactor:1});
      const errors=[],failures=[],remote=[];
      page.on('pageerror',e=>errors.push(e.message));
      page.on('response',r=>{if(r.status()>=400)failures.push(r.status()+' '+r.url());});
      page.on('request',r=>{if(!r.url().startsWith(base))remote.push(r.url());});
      await page.goto(base+`labs/${id}/index.html`);
      await page.waitForFunction(()=>window.labExplorer?.snapshot().renderer.calls>0);
      assert.equal(await page.locator('#load-error').isVisible(),false);
      const parts=await page.evaluate(()=>window.LAB_PARTS),config=await page.evaluate(()=>window.LAB_CONFIG);
      await page.screenshot({path:path.join(output,`${id}-assembled.png`),fullPage:true});
      if(process.env.UPDATE_LAB_PREVIEW==='1'&&!process.env.LAB_BASE_URL)await page.locator('#viewport').screenshot({path:path.join(root,'labs',id,'preview.png')});
      if(process.env.LAB_CAPTURE_ONLY==='1'){await page.locator('#explode-button').click();await page.waitForFunction(()=>window.labExplorer.snapshot().explosion>.995);await page.screenshot({path:path.join(output,`${id}-exploded.png`),fullPage:true});await page.close();continue;}
      for(const p of parts){
        await page.locator(`[data-part="${p.id}"]`).click();
        assert.equal(await page.locator('#part-name').textContent(),p.name);
        assert.equal(await page.locator('#part-en').textContent(),p.en);
        assert.equal(await page.evaluate(()=>window.labExplorer.snapshot().selected),p.id);
      }
      assert.equal(await page.locator('#progress-text').textContent(),`${parts.length} / ${parts.length}`);
      await page.locator('#explode-button').click();await page.waitForFunction(()=>window.labExplorer.snapshot().explosion>.995);
      const exploded=await page.evaluate(()=>window.labExplorer.snapshot());
      assert.ok(exploded.position.filter(n=>n.position.some((v,i)=>Math.abs(v-n.base[i])>.4)).length>=parts.length-1);
      await page.locator('#toggle-labels').click();
      await page.waitForFunction(n=>document.querySelectorAll('.model-label:not([hidden])').length===n,parts.length);
      await page.screenshot({path:path.join(output,`${id}-exploded.png`),fullPage:true});
      await page.locator('#assemble').click();await page.waitForFunction(()=>window.labExplorer.snapshot().explosion<.005);
      assert.ok((await page.evaluate(()=>window.labExplorer.snapshot().position)).every(n=>n.position.every((v,i)=>Math.abs(v-n.base[i])<.03)));
      await page.locator('#explode').fill('50');await page.waitForFunction(()=>Math.abs(window.labExplorer.snapshot().explosion-.5)<.005);
      await page.locator('#assemble').click();await page.locator('#toggle-labels').click();
      await page.locator('#top-view').click();await page.waitForFunction(()=>window.labExplorer.snapshot().camera.pitch>1.5);
      await page.locator('#side-view').click();await page.waitForFunction(()=>window.labExplorer.snapshot().camera.pitch<.08);
      await page.locator('#home-view').click();await page.waitForFunction(y=>Math.abs(window.labExplorer.snapshot().camera.yaw-y)<.01,config.camera.yaw);
      const startYaw=await page.evaluate(()=>window.labExplorer.snapshot().camera.yaw);
      const dragPoint=await page.evaluate(()=>{const r=document.querySelector('canvas').getBoundingClientRect();for(const f of [.82,.72,.62])for(const x of [.18,.35,.5]){const p={x:r.x+r.width*x,y:r.y+r.height*f};if(document.elementFromPoint(p.x,p.y)?.tagName==='CANVAS')return p;}});
      assert.ok(dragPoint);await page.mouse.move(dragPoint.x,dragPoint.y);await page.mouse.down();await page.mouse.move(dragPoint.x+70,dragPoint.y+20,{steps:6});await page.mouse.up();
      await page.waitForFunction(y=>window.labExplorer.snapshot().camera.yaw<y-.2,startYaw);
      await page.locator('#zoom-in').click();await page.waitForFunction(d=>window.labExplorer.snapshot().camera.distance<d-.6,config.camera.distance);
      // Find a visible mesh by scanning the rendered canvas with real click input.
      const hit=await page.evaluate(()=>{const canvas=document.querySelector('canvas'),r=canvas.getBoundingClientRect();const before=window.labExplorer.snapshot().selected;return {r:{x:r.x,y:r.y,width:r.width,height:r.height},before};});
      let meshClicked=false;
      for(const [x,y]of [[.4,.45],[.5,.5],[.55,.4],[.35,.55],[.6,.6],[.45,.6]]){
        const px=hit.r.x+hit.r.width*x,py=hit.r.y+hit.r.height*y;
        if(await page.evaluate(p=>document.elementFromPoint(p.x,p.y)?.tagName!=='CANVAS',{x:px,y:py}))continue;
        await page.mouse.click(px,py);
        if((await page.evaluate(()=>window.labExplorer.snapshot().selected))!==hit.before){meshClicked=true;break;}
      }
      assert.ok(meshClicked,`${id}: direct mesh selection`);
      await page.locator('#language').click();assert.equal(await page.locator('#part-zh').isVisible(),false);await page.locator('#language').click();
      await page.evaluate(()=>{window.__spoken=[];window.speechSynthesis.speak=u=>window.__spoken.push({text:u.text,lang:u.lang});});
      await page.locator('#speak').click();assert.ok((await page.evaluate(()=>window.__spoken))[0].text.length>30);
      await page.locator('#quiz').click();
      for(let round=0;round<5;round++){
        const q=await page.locator('#quiz-question').textContent(),correct=parts.find(p=>p.question===q);assert.ok(correct);
        await page.locator('#quiz-options').getByRole('button',{name:correct.name,exact:true}).click();
        assert.ok((await page.locator('#quiz-feedback').textContent()).startsWith('Yes!'));await page.locator('#quiz-next').click();
      }
      assert.equal(await page.locator('#quiz-question').textContent(),'✦ 5 / 5');await page.locator('.dialog-close').click();
      await page.locator('#home-view').click();await page.setViewportSize({width:390,height:844});
      await page.waitForFunction(d=>Math.abs(window.labExplorer.snapshot().camera.distance-d)<.01,config.camera.distance);
      await page.screenshot({path:path.join(output,`${id}-mobile.png`),fullPage:true});
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      assert.equal(await page.locator('.lab-navigation a').count(),3);
      assert.equal(errors.length,0,errors.join('\n'));assert.equal(failures.length,0,failures.join('\n'));assert.equal(remote.length,0,remote.join('\n'));
      reports.push({id,parts:parts.length,meshes:exploded.meshCount,checks:'render, all lessons, explode/reassemble, slider, labels, views, drag, zoom, mesh picking, speech call, 5/5 quiz, mobile, links, local resources',pass:true});
      console.log(`PASS browser ${id}: ${parts.length} parts, ${exploded.meshCount} meshes`);await page.close();
    }
    if(process.env.LAB_CAPTURE_ONLY!=='1'){
      const page=await browser.newPage({viewport:{width:1440,height:1000}});
      await page.goto(base+'labs/index.html');assert.equal(await page.locator('.lab-card.ready').count(),4);assert.equal(await page.locator('.lab-card.planned').count(),0);
      for(const id of ['rocket','hsr','schoolbus'])assert.ok(await page.locator(`[data-lab-id="${id}"] img`).evaluate(img=>img.complete&&img.naturalWidth>0));
      await page.screenshot({path:path.join(output,'all-labs-directory.png'),fullPage:true});await page.close();
    }
    fs.writeFileSync(path.join(output,'more-labs-results.json'),JSON.stringify(reports,null,2));
  }finally{await browser.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exit(1);});

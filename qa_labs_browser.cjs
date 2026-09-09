const {chromium} = require('playwright');
const path = require('path');
const fs = require('fs');
const assert = require('assert/strict');
const root = __dirname;
const output=path.join(root,'.qa-labs');fs.mkdirSync(output,{recursive:true});
const http=require('http');
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!pathname.startsWith('/kids-books/')){res.writeHead(404);return res.end();}
  let file=path.resolve(root,pathname.slice('/kids-books/'.length));
  if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  if(!fs.existsSync(file)){res.writeHead(404);return res.end();}
  const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.png':'image/png','.webp':'image/webp'};
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);
});
(async()=>{
  const browser = await chromium.launch({... (process.env.LAB_BROWSER_PATH ? {executablePath:process.env.LAB_BROWSER_PATH} : process.env.LAB_BROWSER==='chromium' ? {} : {channel:'chrome'}),headless:true,args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  try {
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    const base='http://127.0.0.1:'+server.address().port+'/kids-books/';
    const page = await browser.newPage({viewport:{width:1440,height:1120},deviceScaleFactor:1});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    const requests=[];page.on('request',r=>requests.push(r.url()));
    await page.goto(base+'labs/airplane/index.html');
    await page.waitForFunction(()=>window.airplaneLab?.snapshot().renderer.calls>0);
    await page.screenshot({path:path.join(output,'desktop.png'),fullPage:true});
    if(process.env.UPDATE_LAB_PREVIEW==='1')await page.locator('#viewport').screenshot({path:path.join(root,'labs/airplane/preview.png')});
    assert.equal(await page.locator('.lab-navigation a').count(),3);
    assert.equal(await page.locator('#load-error').isVisible(),false);
    assert.equal(await page.locator('.model-label:visible').count(),1);
    const enginePoint=await page.evaluate(()=>window.airplaneLab.projectPart('engines'));
    await page.mouse.click(enginePoint.x,enginePoint.y);
    assert.equal(await page.evaluate(()=>window.airplaneLab.snapshot().selected),'engines','Clicking engine mesh should select engines');
    for(const p of await page.evaluate(()=>window.PLANE_PARTS)){
      await page.locator(`[data-part="${p.id}"]`).click();
      assert.equal(await page.locator('#part-name').textContent(),p.name);
      assert.equal(await page.evaluate(()=>window.airplaneLab.snapshot().selected),p.id);
      assert.equal(await page.locator('#part-en').textContent(),p.en);
    }
    await page.locator('#assembly-options > summary').click();
    await page.locator('#explode-button').click();
    await page.waitForFunction(()=>window.airplaneLab.snapshot().explosion>.995);
    const exploded=await page.evaluate(()=>window.airplaneLab.snapshot());
    assert.ok(exploded.position.filter(n=>n.position.some((v,i)=>Math.abs(v-n.base[i])>.5)).length>=10);
    await page.locator('#toggle-labels').click();
    await page.waitForFunction(()=>document.querySelectorAll('.model-label:not([hidden])').length===10);
    await page.screenshot({path:path.join(output,'exploded.png'),fullPage:true});
    await page.locator('#assemble').click();
    await page.waitForFunction(()=>window.airplaneLab.snapshot().explosion<.005);
    assert.ok((await page.evaluate(()=>window.airplaneLab.snapshot().position)).every(n=>n.position.every((v,i)=>Math.abs(v-n.base[i])<.015)));
    await page.locator('#explode').fill('50');
    await page.waitForFunction(()=>Math.abs(window.airplaneLab.snapshot().explosion-.5)<.005);
    await page.locator('#assemble').click();
    await page.locator('#top-view').click();
    await page.waitForFunction(()=>window.airplaneLab.snapshot().camera.pitch>1.5);
    await page.locator('#side-view').click();
    await page.waitForFunction(()=>window.airplaneLab.snapshot().camera.pitch<.08);
    await page.locator('#home-view').click();
    await page.waitForFunction(()=>Math.abs(window.airplaneLab.snapshot().camera.yaw+.45)<.01);
    const canvas=await page.locator('canvas').boundingBox();
    const dragPoint=await page.evaluate(r=>{
      for(const f of [.85,.75,.65])for(const x of [.2,.35,.5]){
        const p={x:r.x+r.width*x,y:r.y+r.height*f};
        if(document.elementFromPoint(p.x,p.y)?.tagName==='CANVAS')return p;
      }
    },canvas);
    assert.ok(dragPoint,'Need an unobstructed canvas point for drag');
    await page.mouse.move(dragPoint.x,dragPoint.y);
    await page.mouse.down();await page.mouse.move(dragPoint.x+80,dragPoint.y+20,{steps:8});await page.mouse.up();
    await page.waitForFunction(()=>window.airplaneLab.snapshot().camera.yaw<-.7);
    await page.locator('#zoom-in').click();
    await page.waitForFunction(()=>window.airplaneLab.snapshot().camera.distance<13);
    await page.locator('#language').click();assert.equal(await page.locator('#part-zh').isVisible(),false);
    await page.locator('#language').click();assert.equal(await page.locator('#part-zh').isVisible(),true);
    await page.locator('#quiz').click();assert.equal(await page.locator('#quiz-dialog').isVisible(),true);
    for(let round=0;round<5;round++){
      for(const option of await page.locator('#quiz-options button').all()){
        if(await page.locator('#quiz-next').isVisible())break;
        await option.click();
      }
      assert.ok((await page.locator('#quiz-feedback').textContent()).startsWith('Yes!'));
      await page.locator('#quiz-next').click();
    }
    assert.ok((await page.locator('#quiz-count').textContent()).includes('挑战完成'));
    await page.locator('.dialog-close').click();
    await page.evaluate(()=>{
      window.__spoken=[];
      window.speechSynthesis.speak=u=>window.__spoken.push({text:u.text,lang:u.lang,rate:u.rate});
    });
    await page.locator('#speak').click();
    assert.ok((await page.evaluate(()=>window.__spoken))[0].text.length>30);
    await page.locator('#home-view').click();await page.locator('[data-part="engines"]').click();
    await page.locator('#toggle-labels').click();
    await page.setViewportSize({width:390,height:844});
    await page.waitForFunction(()=>document.querySelector('canvas').clientWidth<400);
    await page.waitForFunction(()=>Math.abs(window.airplaneLab.snapshot().camera.distance-13.8)<.01);
    await page.screenshot({path:path.join(output,'mobile.png'),fullPage:true});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    assert.equal(errors.length,0,errors.join('\n'));
    assert.equal(requests.filter(u=>/^https?:/.test(u)&&!u.startsWith(base)).length,0,'Lab loaded an external asset');
    await page.setViewportSize({width:1440,height:1000});
    await page.locator('.lab-navigation a').first().click();
    assert.ok(page.url().endsWith('/labs/index.html'));
    await page.waitForFunction(()=>Array.isArray(window.LABS_CATALOG)&&document.querySelector('.lab-card'));
    const catalog=await page.evaluate(()=>window.LABS_CATALOG);
    assert.equal(await page.locator('.lab-card.ready').count(),catalog.filter(l=>l.status==='ready').length);
    assert.equal(await page.locator('.lab-card.planned').count(),catalog.filter(l=>l.status==='planned').length);
    assert.equal(await page.locator('.lab-card.planned a').count(),0);
    assert.equal(await page.locator('canvas').count(),0);
    for(const img of await page.locator('.lab-cover img').all())assert.ok(await img.evaluate(img=>img.complete&&img.naturalWidth>0));
    await page.screenshot({path:path.join(output,'directory.png'),fullPage:true});
    await page.setViewportSize({width:390,height:844});
    await page.screenshot({path:path.join(output,'directory-mobile.png'),fullPage:true});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.locator('[data-lab-id="airplane"] .enter-lab').click();
    await page.waitForFunction(()=>window.airplaneLab?.snapshot().renderer.calls>0);
    // Existing cover CDN is unrelated to navigation; avoid downloading all books.
    await page.route('https://**',route=>route.abort());
    await page.locator('.lab-navigation a').nth(1).click();
    assert.equal(await page.locator('.book-card').count(),12);
    await page.locator('.labs-banner').click();
    assert.ok(page.url().endsWith('/labs/index.html'));
    await page.locator('[data-lab-id="airplane"] .enter-lab').click();
    await page.locator('.lab-navigation a').last().click();
    assert.ok(page.url().endsWith('/books/airplane/index.html'));
    await page.locator('.book-lab-link').click();
    await page.waitForFunction(()=>window.airplaneLab?.snapshot().renderer.calls>0);
    assert.equal(errors.length,0,errors.join('\n'));
    const report={pass:true,entry:'labs/airplane/index.html (HTTP, /kids-books/ project subpath)',meshCount:exploded.meshCount,lessons:10,checks:['WebGL renders','direct 3D mesh click','10 selectable parts','exploded positions','reassembly','slider','labels','camera presets','drag','zoom','language','all 5 quiz rounds','speech call','mobile overflow','no runtime errors','no external lab assets','directory ready/planned status','bookshelf and related-book round trips'],speech:'Browser speech API wired; audio audibility requires a device with an English voice.',screenshots:['desktop.png','exploded.png','mobile.png']};
    fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exit(1)});

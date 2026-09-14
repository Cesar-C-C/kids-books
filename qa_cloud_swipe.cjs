const assert = require('node:assert/strict');
const { chromium } = require('../kids-books/.qa-deps/node_modules/playwright');
const base = process.env.CLOUD_LIVE_BASE || 'http://127.0.0.1:8768/';
(async () => {
 const browser = await chromium.launch({channel:'chrome',headless:true});
 try {
  for (const viewport of [{width:390,height:844},{width:1024,height:768}]) {
   const context = await browser.newContext({viewport,isMobile:true,hasTouch:true,serviceWorkers:'block'});
   await context.route('**/shared/pwa.js',r=>r.fulfill({body:''}));
   const page=await context.newPage(); await page.goto(base+'books/cloud/index.html');
   const cdp=await context.newCDPSession(page);
   const number=()=>page.locator('#page-number').textContent();
   const drag=async (x,y,dx,dy,extra=false,cancel=false)=>{
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:0},...(extra?[{x:x+40,y:y+40,id:1}]:[])]});
    for(let i=1;i<=6;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*i/6,y:y+dy*i/6,id:0},...(extra?[{x:x+40-dx*i/6,y:y+40,id:1}]:[])]});
    await cdp.send('Input.dispatchTouchEvent',{type:cancel?'touchCancel':'touchEnd',touchPoints:[]});
   };
   const art=()=>page.locator('.art').boundingBox();
   let b=await art(); const x=()=>b.x+b.width*.7,y=()=>b.y+b.height*.22;
   await drag(x(),y(),-150,3);assert.equal(await number(),'02 / 16','left swipe advances exactly one page');
   await drag(x()-150,y(),150,3);assert.equal(await number(),'01 / 16','right swipe goes back');
   await drag(x()-150,y(),150,3);assert.equal(await number(),'01 / 16','first page does not wrap');
   await page.locator('#narrate').tap();await page.waitForFunction(()=>document.getElementById('narrate').getAttribute('aria-pressed')==='true');
   await page.evaluate(()=>scrollTo(0,0));
   await drag(x(),y(),-150,0);assert.equal(await number(),'02 / 16');
   assert.equal(await page.locator('#narrate').getAttribute('aria-pressed'),'false','swipe stops previous narration');
   assert.ok(await page.locator('#bubble').isHidden(),'swipe does not activate a hotspot');
   await drag(x()-150,y(),150,0);assert.equal(await number(),'01 / 16');
   await drag(x(),y(),-20,2);assert.equal(await number(),'01 / 16','jitter does not turn');
   await drag(x(),y(),-150,2,false,true);assert.equal(await number(),'01 / 16','cancelled gesture does not turn');
   await drag(x()-30,y(),-60,0,true);assert.equal(await number(),'01 / 16','two fingers do not turn');
   await cdp.send('Emulation.setPageScaleFactor',{pageScaleFactor:1});
   // Start on a real control: dragging it must not turn or activate it.
   await page.locator('#narrate').scrollIntoViewIfNeeded();
   const btn=await page.locator('#narrate').boundingBox();
   await drag(btn.x+btn.width*.75,btn.y+btn.height/2,100,0);
   assert.equal(await number(),'01 / 16','button gesture excluded');
   await page.evaluate(()=>scrollTo(0,0)); b=await art();
   await drag(x(),y(),3,-100);assert.equal(await number(),'01 / 16','vertical scroll does not turn');
   if(viewport.width===390)await page.waitForFunction(()=>scrollY>0,{},{timeout:3000});
   await page.locator('#contents').click();await page.locator('#toc-pages button').last().click();b=await art();
   await drag(x(),y(),-150,0);assert.equal(await number(),'16 / 16','last page does not wrap');
   await page.locator('#contents').click();
   await drag(280,220,-150,0);assert.equal(await number(),'16 / 16','dialog does not turn background');
   await page.locator('#close-toc').click();
   assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('#reader')).touchAction),'auto','pinch zoom is not disabled');
   await context.close();
   console.log(`PASS native touch ${viewport.width}: both directions, boundaries, jitter, cancel, multi-touch, controls, vertical scroll, dialog`);
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

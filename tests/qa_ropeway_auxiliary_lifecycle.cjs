'use strict';
const fs=require('fs'),path=require('path'),http=require('http'),crypto=require('crypto'),assert=require('assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(process.env.ROPEWAY_ROOT||path.join(__dirname,'..')),out=path.resolve(process.env.ROPEWAY_REPORT_DIR||path.join(root,'.qa-labs/ropeway'));fs.mkdirSync(out,{recursive:true});
const sha=x=>crypto.createHash('sha256').update(x).digest('hex'),beforeSha=process.env.ROPEWAY_REPLAY_BEFORE_SHA;
let model=fs.readFileSync(path.join(root,'labs/ropeway/model.js'),'utf8');
if(beforeSha){
 const fixed="state.mode=state.mode==='aux-running'?'power-stop':'paused';state.factor=0;";
 assert.equal(model.split(fixed).length,2,'one exact pause-line delta');
 model=model.replace(fixed,"state.mode='paused';state.factor=0;");
 assert.equal(sha(model),beforeSha,'replayed model must match prior candidate bytes');
}
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.mp3':'audio/mpeg','.webmanifest':'application/manifest+json'};
const server=http.createServer((req,res)=>{try{let p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!p.startsWith(root+path.sep))throw Error('scope');if(fs.statSync(p).isDirectory())p=path.join(p,'index.html');res.setHeader('Content-Type',mime[path.extname(p)]||'application/octet-stream');res.end(p===path.join(root,'labs/ropeway/model.js')?model:fs.readFileSync(p));}catch(e){res.statusCode=404;res.end('Not found');}});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
 const runtimeSha256=sha(['index.html','ropeway.css','model.js','content.js','scene.js','audio-manifest.js','audio.js','app.js'].map(f=>f+'\n'+(f==='model.js'?model:fs.readFileSync(path.join(root,'labs/ropeway',f),'utf8')).replace(/\r\n/g,'\n')).join('\n'));
 const report={modelSha256:sha(model),runtimeSha256,beforeReplay:!!beforeSha,limits:beforeSha?'Prior SHA-bound model replay via exact pause-line reversal; current app/assets are retained.':'Chrome native taps; injected WebGL unavailability and explicitly labelled synthetic lifecycle callbacks are not physical-device evidence.',cases:[]};
 try{
  for(const profile of [{name:'phone-landscape',width:844,height:390},{name:'tablet-landscape',width:1180,height:820},{name:'automatic-no-webgl',width:390,height:844,fallback:true}])for(const lang of ['zh','en']){
   const ctx=await browser.newContext({viewport:{width:profile.width,height:profile.height},isMobile:true,hasTouch:true,serviceWorkers:'block'}),page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   if(profile.fallback)await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/i.test(type)?null:original.call(this,type,...args);};});
   const tap=id=>page.locator(id).tap(),snap=()=>page.evaluate(()=>RopewayLab.getSnapshot());
   try{
    await page.goto(base+'/labs/ropeway/index.html?lang='+lang);await page.waitForFunction(()=>window.RopewayLab);
    assert.equal((await snap()).render,profile.fallback?'fallback':'webgl');assert.equal((await snap()).language,lang);
    await tap('[data-mode="safety"]');await tap('#power-fault');await page.waitForFunction(()=>RopewayLab.getSnapshot().auxiliaryAllowed);
    await tap('#auxiliary');await page.waitForFunction(()=>RopewayLab.getSnapshot().mode==='aux-running');
    await tap('#pause');await page.waitForFunction(()=>RopewayLab.getSnapshot().factor===0);
    const paused=await snap(),auxDisabled=await page.locator('#auxiliary').isDisabled(),mainDisabled=await page.locator('#play').isDisabled();
    const row={profile:profile.name,lang,paused:{mode:paused.mode,time:paused.time,fault:paused.fault,auxDisabled,mainDisabled}};
    report.cases.push(row);
    if(beforeSha){assert.equal(paused.mode,'paused');assert.equal(auxDisabled,true);assert.equal(mainDisabled,true);row.result='EXPECTED_OLD_DEAD_END';continue;}
    async function assertStandby(){const s=await snap();assert.equal(s.mode,'power-stop');assert.equal(s.factor,0);assert.equal(s.fault,'power');assert.equal(s.brakes,true);assert.equal(s.auxiliaryAllowed,true);await page.waitForFunction(()=>!document.getElementById('auxiliary').disabled);assert.equal(await page.locator('#play').isDisabled(),true);return s;}
    async function resume(){const s=await assertStandby();await tap('#auxiliary');await page.waitForFunction(t=>RopewayLab.getSnapshot().time>t,s.time);const after=await snap();assert.equal(after.factor,.22);assert.equal(after.fault,'power');}
    await assertStandby();
    row.paused.auxDisabled=await page.locator('#auxiliary').isDisabled();row.paused.mainDisabled=await page.locator('#play').isDisabled();
    for(let n=0;n<3;n++){await resume();await tap('#pause');const a=await assertStandby();await page.waitForTimeout(60);assert.equal((await snap()).time,a.time);}
    row.manualPauseResume=3;
    await resume();await page.waitForFunction(()=>RopewayLab.getSnapshot().lesson==='auxiliary');
    if(!await page.locator('#listen').isDisabled()){
     await tap('#listen');await page.waitForFunction(()=>RopewayLab.getSnapshot().audio.currentTime>.04);
     await assertStandby();await tap('#audio-stop');assert.equal((await snap()).audio.src,null);await resume();row.narrationPauseResume=true;
    }else row.narrationPauseResume='pending';
    const hiddenPage=await ctx.newPage();await hiddenPage.bringToFront();await page.waitForTimeout(80);
    row.nativeTabSuspensionObserved=(await snap()).mode==='power-stop';
    await page.bringToFront();await hiddenPage.close();
    if(!row.nativeTabSuspensionObserved)await page.evaluate(()=>dispatchEvent(new Event('blur')));
    await assertStandby();await resume();row.blurPauseResume=true;
    await page.evaluate(()=>{
     const own=Object.getOwnPropertyDescriptor(document,'hidden');
     Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));
     if(own)Object.defineProperty(document,'hidden',own);else delete document.hidden;
    });
    await assertStandby();await resume();row.syntheticHiddenPauseResume=true;
    await tap('[data-mode="tension"]');await assertStandby();assert.equal((await snap()).lessonMode,'tension');assert.equal((await snap()).audio.src,null);
    await tap('[data-mode="journey"]');await assertStandby();
    await tap('[data-mode="safety"]');await resume();row.modeSwitchPreservesFault=true;
    await tap('#reset');await page.waitForFunction(()=>!RopewayLab.getSnapshot().fault);
    assert.equal(await page.locator('#auxiliary').isDisabled(),true);assert.equal((await snap()).auxiliaryAllowed,false);
    await tap('#grip-fault');await page.waitForFunction(()=>RopewayLab.getSnapshot().mode==='protective-stop');
    const grip=await snap();assert.equal(grip.cars[0].checked,false);assert.equal(grip.auxiliaryAllowed,false);assert.equal(await page.locator('#auxiliary').isDisabled(),true);assert.equal(await page.locator('#play').isDisabled(),true);
    for(const mode of ['journey','tension','safety']){await tap('[data-mode="'+mode+'"]');assert.equal((await snap()).mode,'protective-stop');assert.equal((await snap()).fault,'grip');assert.equal((await snap()).factor,0);}
    await tap('#reset');await tap('[data-mode="journey"]');await tap('#play');assert.equal((await snap()).mode,'running');await tap('#pause');assert.equal((await snap()).mode,'paused');
    assert.deepEqual(errors,[]);row.gripAndNoFaultGuards=true;row.result='PASS';
   }finally{await ctx.close();}
  }
  report.status=beforeSha?'EXPECTED_OLD_MODEL_FAILURES':'PASS';
  fs.writeFileSync(path.join(out,'auxiliary-'+(beforeSha?'before':'after')+'-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

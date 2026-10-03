// Native touch lifecycle regression. No JS-dispatched input; isolated Chrome profiles only.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
let playwright;
try { playwright = require('playwright'); }
catch { playwright = require(process.env.PLAYWRIGHT_MODULE || '../.qa-deps/node_modules/playwright'); }
const { chromium } = playwright;
const root = path.resolve(process.env.EARTHQUAKE_TOUCH_ROOT || path.join(__dirname, '..'));
const out = process.env.EARTHQUAKE_TOUCH_REPORT;
const failures = [];
const baselineSha = crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'labs/earthquake/v3/app.js'),'utf8').replace(/\r\n/g,'\n')).digest('hex');
const report = { checkedAtUtc: new Date().toISOString(), servedRoot: root, expectedAppCanonicalSha256: baselineSha, input: 'Chrome CDP Input.dispatchTouchEvent; trusted native PointerEvents; not physical device input or JS-dispatched events', scopes: [], errors: [], boundaries: { productionCodeChanged: false, userProfileOrCacheChanged: false, gitOrReleaseChanged: false, physicalDeviceTested: false, pointerLifecycleObserverOnly: true } };
const mime = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json' };
const server = http.createServer((req, res) => {
  let file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://local').pathname));
  if (!file.startsWith(path.resolve(root) + path.sep)) return res.writeHead(403).end();
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) return res.writeHead(404).end();
  res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(file).pipe(res);
});
function flush() { if(out) fs.writeFileSync(out, JSON.stringify(report, null, 2)); }
const pause = page => page.waitForTimeout(35);
async function metrics(page) {
  return page.evaluate(() => ({ y: scrollY, maxY: document.scrollingElement.scrollHeight-innerHeight, dialogY: document.getElementById('narration-dialog').scrollTop, view: earthquakeLab.snapshot().view, events: window.__scrollDiagnosis.events.slice() }));
}
function delta(a,b) { return { scrollY: b.y-a.y, dialogY:b.dialogY-a.dialogY, yaw:b.view.yaw-a.view.yaw, pitch:b.view.pitch-a.view.pitch }; }
function stable(d) { return Math.abs(d.yaw)<1e-6 && Math.abs(d.pitch)<1e-6; }
async function native(session, page, type, points) {
  await session.send('Input.dispatchTouchEvent', {type, touchPoints:points.map(p=>({...p,radiusX:1,radiusY:1,force:1}))});
  await pause(page);
}
async function move(session,page,from,to,other=[]) {
  for(let i=1;i<=8;i++) await native(session,page,'touchMove',[{id:from.id,x:from.x+(to.x-from.x)*i/8,y:from.y+(to.y-from.y)*i/8},...other]);
}
async function swipe(session,page,from,to) {
  await native(session,page,'touchStart',[from]);
  await move(session,page,from,to);
  await native(session,page,'touchEnd',[]);
  await page.waitForTimeout(180);
}
async function nextVertical(page,session) {
  // Fixture positioning is not counted as input evidence; camera and handler state remain untouched.
  await page.evaluate(()=>{scrollTo({top:0,behavior:'instant'}); window.__scrollDiagnosis.events=[];});
  const box=await page.locator('#viewport canvas').boundingBox();
  const from={id:1,x:box.x+box.width*.48,y:box.y+box.height*.8};
  const before=await metrics(page);
  await swipe(session,page,from,{...from,y:from.y-Math.min(170,box.height*.55)});
  const after=await metrics(page), d=delta(before,after);
  return {before,after,delta:d,pass:d.scrollY>60&&stable(d)};
}
async function nextHorizontal(page,session) {
  await page.evaluate(()=>{scrollTo({top:0,behavior:'instant'});window.__scrollDiagnosis.events=[];});
  const box=await page.locator('#viewport canvas').boundingBox();
  const from={id:1,x:box.x+box.width*.3,y:box.y+box.height*.5};
  const before=await metrics(page);
  await swipe(session,page,from,{...from,x:from.x+70});
  const after=await metrics(page),d=delta(before,after);
  return {before,after,delta:d,pass:Math.abs(d.yaw)>.2&&Math.abs(d.pitch)<1e-6&&Math.abs(d.scrollY)<1e-6};
}
async function runScope(browser,url,label,width,height,full) {
  const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const page=await context.newPage();
  const scope={label,url,viewport:[width,height],serviceWorkers:'blocked only in new isolated QA context',cases:[]};
  report.scopes.push(scope);
  await page.addInitScript(()=>{
    window.__scrollDiagnosis={events:[]};
    for(const name of ['pointerdown','pointermove','pointerup','pointercancel','lostpointercapture','pointerleave']) {
      document.addEventListener(name,event=>{
        const data={name,id:event.pointerId,primary:event.isPrimary,type:event.pointerType,trusted:event.isTrusted,x:event.clientX,y:event.clientY,buttons:event.buttons,target:event.target.id||event.target.tagName,time:Math.round(performance.now())};
        // Snapshot after the app's listener has run, without replacing/preventing any handler.
        setTimeout(()=>{data.yScroll=scrollY;data.view=window.earthquakeLab?.snapshot().view;window.__scrollDiagnosis.events.push(data);},0);
      },true);
    }
  });
  const session=await context.newCDPSession(page);
  let captured=false;
  page.on('response',async response=>{
    if(captured||!response.url().endsWith('/v3/app.js'))return;
    captured=true;
    try {
      const bytes=await response.body();
      scope.appSha256=crypto.createHash('sha256').update(bytes).digest('hex');
      scope.appBytesMatchBaseline=scope.appSha256===baselineSha;
      scope.appCanonicalSha256=crypto.createHash('sha256').update(bytes.toString('utf8').replace(/\r\n/g,'\n')).digest('hex');
      scope.appMatchesBaseline=scope.appCanonicalSha256===baselineSha;
      scope.lineEndingPolicy='Keep raw hash; canonical-source comparison normalizes CRLF only';
    } catch(error){scope.appReadError=error.message;}
  });
  async function prepare() {
    await page.goto(url,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.earthquakeLab?.snapshot().renderer==='webgl');
    await page.evaluate(()=>{scrollTo({top:0,behavior:'instant'});window.__scrollDiagnosis.events=[];});
    return page.locator('#viewport canvas').boundingBox();
  }
  async function record(name,action) {
    const box=await prepare(), before=await metrics(page);
    const extra=await action(box);
    await page.waitForTimeout(180);
    const observation=await metrics(page);
    const after=extra.gestureAfter||extra.phases?.at(-1)?.metrics||observation;
    const item={name,before,after,delta:delta(before,after),...extra};
    if(extra.nextGesture)item.afterFollowup=observation;
    scope.cases.push(item);
    if(item.nextGesture&&!item.nextGesture.pass)failures.push(label+' '+name+': new vertical gesture fails');
    if(item.nextHorizontal&&!item.nextHorizontal.pass)failures.push(label+' '+name+': new horizontal gesture fails after release');
    if(item.check&&!item.check.pass)failures.push(label+' '+name+': '+item.check.expected);
    if(name.startsWith('second-finger-')) {
      const initial=item.phases[0].metrics;
      item.multiTouchCameraStable=item.phases.slice(1).every(p=>stable(delta(initial,p.metrics)));
      if(!item.multiTouchCameraStable)failures.push(label+' '+name+': secondary contact rotates or jumps camera');
    }
    if(name==='vertical-then-horizontal'&&(item.after.y<60||!stable(item.delta)))failures.push(label+' '+name+': vertical pan rotates camera or cannot scroll');
    if(name==='horizontal-then-vertical'&&!stable(delta(item.phases[0].metrics,item.phases[1].metrics)))failures.push(label+' '+name+': vertical turn changes locked camera');
    if(name==='native-cancel-then-new-vertical'&&!item.phases[1].metrics.events.some(e=>e.name==='pointercancel'&&e.type==='touch'&&e.trusted))failures.push(label+' native cancellation was not observed');
    flush();
    console.log(label+' '+name+' '+JSON.stringify({delta:item.delta,nextPass:item.nextGesture?.pass,check:item.check,phases:item.phases?.map(p=>({phase:p.phase,y:p.metrics.y,yaw:p.metrics.view.yaw,pitch:p.metrics.view.pitch}))}));
  }
  try {
    for(const direction of ['horizontal-then-vertical','vertical-then-horizontal']) {
      await record(direction,async box=>{
        const a={id:1,x:box.x+box.width*.28,y:box.y+box.height*.8};
        const b={...a,x:a.x+(direction.startsWith('horizontal')?60:0),y:a.y-(direction.startsWith('vertical')?150:0)};
        const c={...b,x:a.x+60,y:a.y-150};
        await native(session,page,'touchStart',[a]);await move(session,page,a,b);
        const first=await metrics(page);await move(session,page,b,c);await native(session,page,'touchEnd',[]);
        const end=await metrics(page), nextGesture=await nextVertical(page,session);
        return {expectation:'Same gesture may retain initial direction; after lift a new vertical gesture must scroll without rotating',phases:[{phase:'first-direction',metrics:first},{phase:'turned-and-ended',metrics:end}],nextGesture};
      });
    }
    if(full) for(const firstX of [10,20]) {
      await record('small-horizontal-'+firstX+'-then-vertical',async box=>{
        const a={id:1,x:box.x+box.width*.38,y:box.y+box.height*.8},b={...a,x:a.x+firstX},c={...b,y:b.y-150};
        await native(session,page,'touchStart',[a]);await move(session,page,a,b);const first=await metrics(page);
        await move(session,page,b,c);await native(session,page,'touchEnd',[]);const end=await metrics(page);
        return {expectation:'Record browser direction arbitration, not an unconditional turn-midgesture guarantee',phases:[{phase:'small-horizontal',metrics:first},{phase:'vertical-turn',metrics:end}],nextGesture:await nextVertical(page,session)};
      });
    }
    await record('native-cancel-then-new-vertical',async box=>{
      const a={id:1,x:box.x+box.width*.3,y:box.y+box.height*.65},b={...a,x:a.x+50};
      await native(session,page,'touchStart',[a]);await move(session,page,a,b);const beforeCancel=await metrics(page);
      await native(session,page,'touchCancel',[]);const afterCancel=await metrics(page);
      return {expectation:'Native pointercancel releases camera gesture state; next gesture scrolls without rotation',phases:[{phase:'before-cancel',metrics:beforeCancel},{phase:'after-cancel',metrics:afterCancel}],nextGesture:await nextVertical(page,session),nextHorizontal:await nextHorizontal(page,session)};
    });
    for(const mode of ['first-finger-already-orbiting','first-finger-stationary',...(full?['first-finger-already-scrolling']:[])]) {
      await record('second-finger-'+mode,async box=>{
        const a={id:1,x:box.x+box.width*.25,y:box.y+box.height*.7};
        let first={...a};await native(session,page,'touchStart',[a]);
        if(mode.includes('orbiting')) {first.x+=35;await move(session,page,a,first);}
        if(mode.includes('scrolling')) {first.y-=65;await move(session,page,a,first);}
        const phases=[{phase:'before-second',metrics:await metrics(page)}];
        let second={id:2,x:first.x+90,y:first.y-20};
        await native(session,page,'touchStart',[first,second]);phases.push({phase:'second-added',metrics:await metrics(page)});
        const secondMoved={...second,x:second.x+12,y:second.y-10};
        await move(session,page,second,secondMoved,[first]);second=secondMoved;phases.push({phase:'only-second-moved',metrics:await metrics(page)});
        const firstMoved={...first,x:first.x+12};
        await move(session,page,first,firstMoved,[second]);first=firstMoved;phases.push({phase:'only-first-moved',metrics:await metrics(page)});
        // Keeping one active point emits the removed point's native pointerup, per CDP active-point semantics.
        await native(session,page,'touchMove',[first]);phases.push({phase:'second-removed',metrics:await metrics(page)});
        const firstUp={...first,y:first.y-90};await move(session,page,first,firstUp);phases.push({phase:'remaining-first-moved-vertical',metrics:await metrics(page)});
        await native(session,page,'touchEnd',[]);phases.push({phase:'all-lifted',metrics:await metrics(page)});
        return {expectation:'Both pointer ids must not rotate the camera during multi-touch or before all contacts lift; fresh gestures must recover',phases,nextGesture:await nextVertical(page,session),nextHorizontal:await nextHorizontal(page,session)};
      });
    }
    await record('second-finger-outside-model',async box=>{
      const a={id:1,x:box.x+box.width*.32,y:box.y+box.height*.65},first={...a,x:a.x+30};
      await native(session,page,'touchStart',[a]);await move(session,page,a,first);
      const phases=[{phase:'before-second',metrics:await metrics(page)}];
      const second={id:2,x:first.x+70,y:box.y-12};
      await native(session,page,'touchStart',[first,second]);phases.push({phase:'second-outside-added',metrics:await metrics(page)});
      const moved={...first,x:first.x+30};await move(session,page,first,moved,[second]);phases.push({phase:'first-moved-with-second-outside',metrics:await metrics(page)});
      await native(session,page,'touchMove',[moved]);phases.push({phase:'second-outside-removed',metrics:await metrics(page)});
      await move(session,page,moved,{...moved,x:moved.x+30});phases.push({phase:'remaining-first-still-suspended',metrics:await metrics(page)});
      await native(session,page,'touchEnd',[]);phases.push({phase:'all-lifted',metrics:await metrics(page)});
      return {expectation:'A contact outside the model also suspends orbit until all lift',phases,nextGesture:await nextVertical(page,session),nextHorizontal:await nextHorizontal(page,session)};
    });
    if(full) {
      await record('model-to-controls-boundary-downward',async()=>{
        await page.evaluate(()=>scrollTo({top:140,behavior:'instant'}));
        const box=await page.locator('#viewport canvas').boundingBox(),a={id:1,x:box.x+box.width*.5,y:Math.max(25,box.y+box.height*.25)};
        const before=await metrics(page);await swipe(session,page,a,{...a,y:a.y+220});const after=await metrics(page),d=delta(before,after);
        return {gestureBefore:before,gestureAfter:after,check:{expected:'scroll back up without camera rotation',pass:d.scrollY< -60&&stable(d)},nextGesture:await nextVertical(page,session)};
      });
      await record('page-text-outside-model',async()=>{
        await page.evaluate(()=>scrollTo({top:300,behavior:'instant'}));
        const box=await page.locator('.lesson-panel').boundingBox(),a={id:1,x:box.x+box.width*.5,y:Math.min(height-40,Math.max(320,box.y+180))};
        const before=await metrics(page);await swipe(session,page,a,{...a,y:a.y-160});const after=await metrics(page),d=delta(before,after);
        return {gestureBefore:before,gestureAfter:after,check:{expected:'page-text vertical pan scrolls without changing model',pass:d.scrollY>60&&stable(d)}};
      });
      for(const position of ['middle','bottom','top']) {
        await record('dialog-'+position,async()=>{
          await page.locator('#narration-open').click();
          const dialog=page.locator('#narration-dialog');
          await dialog.evaluate((el,pos)=>{el.scrollTop=pos==='bottom'?el.scrollHeight:pos==='middle'?200:0;},position);
          await page.evaluate(()=>window.__scrollDiagnosis.events=[]);
          const box=await dialog.boundingBox(),a={id:1,x:box.x+box.width*.5,y:position==='top'?box.y+170:box.y+box.height*.7};
          const b={...a,y:a.y+(position==='top'?170:-170)},before=await metrics(page);
          await swipe(session,page,a,b);const after=await metrics(page),d=delta(before,after);
          await page.locator('#narration-close').click();
          return {gestureBefore:before,gestureAfter:after,check:{expected:'dialog scrolling or boundary overscroll must not move the background or camera',pass:Math.abs(d.scrollY)<1e-6&&stable(d)&&(position!=='middle'||d.dialogY>60)}};
        });
      }
    }
    scope.allFollowupGesturesPassed=scope.cases.filter(c=>c.nextGesture).every(c=>c.nextGesture.pass);
    scope.allExplicitChecksPassed=scope.cases.filter(c=>c.check).every(c=>c.check.pass);
    scope.multiTouchSuspensionPassed=scope.cases.filter(c=>c.name.startsWith('second-finger-')).every(c=>c.multiTouchCameraStable);
  } finally {await context.close();flush();}
}
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  try {
    const local=`http://127.0.0.1:${server.address().port}/labs/earthquake/index.html`;
    await runScope(browser,local,'local-phone',390,844,true);
    await runScope(browser,local,'local-touch-tablet',820,720,true);
    report.completed=true;
    report.failures=failures;
    assert.deepEqual(failures, [], 'Native touch lifecycle regressions');
    console.log('Earthquake native touch lifecycle: single-pointer orbit, multi-touch suspension, cancellation, page and dialog boundaries PASS');
  }catch(error){report.failures=failures;report.errors.push(error.stack);process.exitCode=1;console.error(error);}
  finally{await browser.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));flush();}
})();

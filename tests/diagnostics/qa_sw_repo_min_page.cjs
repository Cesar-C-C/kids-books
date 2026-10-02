// Diagnostic only: actual published/current SWs and manifests with a tiny client page.
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const http = require('node:http');
const assert = require('node:assert/strict');
const pw = require(process.env.PLAYWRIGHT_MODULE || '../../.qa-deps/node_modules/playwright');

const root = path.resolve(__dirname, '../..');
const OLD = '89e5a4ad332380e5c32f2b4bc1ce6d1733a508d5';
const historical = file => cp.execFileSync('git', ['show', OLD + ':' + file], {cwd:root});
const old = Object.fromEntries(['index.html','shared/pwa.js','sw.js','pwa-assets.js']
  .map(file => [file,historical(file)]));
if (process.env.KB_DIAG_OPEN_NO_UPDATE) {
  const source = old['shared/pwa.js'].toString();
  const edited = source.replace('    loadStatus();\n    checkForUpdate(false);\n    if (ui.panel)',
    '    loadStatus();\n    if (ui.panel)');
  assert.notEqual(edited, source);
  old['shared/pwa.js'] = Buffer.from(edited);
}
const oldManifest = JSON.parse(old['pwa-assets.js'].toString().split('self.KB_ASSETS = ')[1].replace(/;\s*$/, ''));
const currentManifestRaw = fs.readFileSync(path.join(root,'pwa-assets.js'),'utf8');
const currentManifest = JSON.parse(currentManifestRaw.slice(currentManifestRaw.indexOf('{'),
  currentManifestRaw.lastIndexOf('}')+1));
let currentWorker = fs.readFileSync(path.join(root,'sw.js'));
if (process.env.KB_DIAG_NEW_SKIP_EARLY) {
  const source = currentWorker.toString();
  const edited = source.replace('var KB = self.KB_ASSETS',
    'self.skipWaiting();\nvar KB = self.KB_ASSETS');
  assert.notEqual(edited, source);
  currentWorker = Buffer.from(edited);
}
const html = `<!doctype html><meta charset="utf-8"><title>Repo SW minimal client</title>
<script>navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'});</script>`;
const htmlVariant = process.env.KB_DIAG_HTML || 'minimal';
function pageHtml(stage) {
  if (htmlVariant === 'minimal') return html;
  let source = stage === 'old' ? old['index.html'].toString() :
    fs.readFileSync(path.join(root,'index.html'),'utf8');
  if (htmlVariant === 'real-no-pwa') source = source.replace(
    '<script src="shared/pwa.js"></script>',
    '<script>navigator.serviceWorker.register("/sw.js",{scope:"/",updateViaCache:"none"});</script>');
  if (htmlVariant === 'real-no-cdn') source = source.replace(
    '<script src="shared/cdn.js"></script>', '');
  return source;
}
const mime = {'.html':'text/html','.js':'text/javascript','.json':'application/json',
  '.css':'text/css','.webp':'image/webp','.png':'image/png','.mp3':'audio/mpeg'};

async function message(page, data) {
  return page.evaluate(data => new Promise(resolve => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => resolve({timeout:true}), 5000);
    channel.port1.onmessage = event => {
      if (data.type === 'KB_DOWNLOAD' && event.data?.state === 'running') return;
      clearTimeout(timer); channel.port1.close(); resolve(event.data);
    };
    navigator.serviceWorker.controller.postMessage(data, [channel.port2]);
  }), data);
}
async function runCase(browser, mode) {
  let stage='old';
  const requests=[];
  const server=http.createServer((request,response) => {
    const pathname=decodeURIComponent(new URL(request.url,'http://local').pathname);
    let file=path.resolve(root,'.'+pathname);
    if (file !== root && !file.startsWith(root+path.sep)) return response.writeHead(403).end();
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file=path.join(file,'index.html');
    const rel=path.relative(root,file).replaceAll('\\','/');
    requests.push({stage,path:pathname});
    response.setHeader('Cache-Control',rel==='pwa-assets.js'?'public,max-age=86400':'no-store');
    response.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
    if (rel==='index.html') return response.end(pageHtml(stage));
    if (stage==='old' && rel==='shared/pwa.js' && process.env.KB_DIAG_USE_CURRENT_CLIENT_OLD_STAGE)
      return response.end(fs.readFileSync(path.join(root,'shared/pwa.js')));
    if (stage==='old' && old[rel]) return response.end(old[rel]);
    if (stage==='current' && rel==='sw.js') return response.end(currentWorker);
    fs.readFile(file,(error,bytes)=>error?response.writeHead(404).end():response.end(bytes));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const context=await browser.newContext();
  if (process.env.KB_DIAG_STUB_ESTIMATE) await context.addInitScript(() => {
    Object.defineProperty(navigator.storage, 'estimate', {
      configurable: true, value: () => Promise.resolve({usage:0,quota:1000000000})
    });
  });
  try {
    const page=await context.newPage();
    const base='http://127.0.0.1:'+server.address().port;
    await page.goto(base+'/index.html');
    await page.waitForFunction(()=>!!navigator.serviceWorker.controller,null,{timeout:60000});
    assert.equal((await message(page,{type:'KB_STATUS'})).version,oldManifest.version);
    if(mode==='panel-direct-download'||mode==='panel-no-download') {
      await page.locator('#kbFab').click();
      await page.waitForFunction(()=>document.querySelector('#obtn-airplane')?.textContent==='下载');
    }
    if(mode==='sw-download'||mode==='panel-direct-download') {
      const result=await message(page,{type:'KB_DOWNLOAD',bookId:'airplane'});
      assert.equal(result.state,'done');
      const status=await message(page,{type:'KB_STATUS'});
      assert.equal(status.books.airplane.cached,status.books.airplane.total);
    }
    if(mode==='ui-download') {
      await page.locator('#kbFab').click();
      await page.waitForFunction(()=>document.querySelector('#obtn-airplane')?.textContent==='下载');
      await page.locator('#obtn-airplane').click();
      await page.waitForFunction(()=>document.querySelector('#obtn-airplane')?.textContent==='删除',
        null,{timeout:60000});
      const status=await message(page,{type:'KB_STATUS'});
      assert.equal(status.books.airplane.cached,status.books.airplane.total);
    }
    if (process.env.KB_DIAG_PRE_STAGE_WAIT_MS)
      await page.waitForTimeout(Number(process.env.KB_DIAG_PRE_STAGE_WAIT_MS));
    const pre=await page.evaluate(async()=>{
      const value=await navigator.serviceWorker.getRegistration();
      return {active:value?.active?.state||null,waiting:value?.waiting?.state||null,
        installing:value?.installing?.state||null};
    });
    console.log('REPO_SW_PRE',JSON.stringify({mode,pre,
      oldWorkerRequests:requests.filter(item=>item.stage==='old'&&item.path==='/sw.js').length}));
    stage='current';
    await page.reload({waitUntil:'domcontentloaded',timeout:30000});
    const first=await message(page,{type:'KB_STATUS'});
    const changed=first.version===currentManifest.version?'already-current':await page.evaluate(() =>
      new Promise(resolve=>{
        const timer=setTimeout(()=>resolve('timeout'),20000);
        navigator.serviceWorker.addEventListener('controllerchange',()=>{
          clearTimeout(timer);resolve('controllerchange');
        },{once:true});
      }));
    const final=await message(page,{type:'KB_STATUS'});
    const registration=await page.evaluate(async()=>{
      const value=await navigator.serviceWorker.getRegistration();
      return {active:value?.active?.state||null,waiting:value?.waiting?.state||null};
    });
    return {mode,old:oldManifest.version,current:currentManifest.version,
      first:first.version,changed,final:final.version,registration,requests:requests.length,
      workerFetches:requests.filter(item=>item.path==='/sw.js').map(item=>item.stage),
      manifestFetches:requests.filter(item=>item.path==='/pwa-assets.js').map(item=>item.stage)};
  } finally {
    await context.close(); server.closeAllConnections(); server.close();
  }
}

(async()=>{
  const channel=process.env.KB_DIAG_BROWSER_CHANNEL||'chrome';
  const browser=await pw.chromium.launch({channel,headless:true});
  try {
    console.log('BROWSER',channel,browser.version(),'HTML_VARIANT',htmlVariant);
    for(const mode of (process.env.KB_DIAG_MODE ? [process.env.KB_DIAG_MODE] : ['none','sw-download']))
      console.log('REPO_SW_MIN_PAGE',JSON.stringify(await runCase(browser,mode)));
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});

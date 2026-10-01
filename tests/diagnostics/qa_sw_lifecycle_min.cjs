// Diagnostic only: isolate Chrome's SW lifecycle from the book app.
const http = require('node:http');
const assert = require('node:assert/strict');
const pw = require(process.env.PLAYWRIGHT_MODULE || '../../.qa-deps/node_modules/playwright');

const html = `<!doctype html><meta charset="utf-8"><title>SW probe</title>
<script>navigator.serviceWorker.register('/sw.js', {scope:'/', updateViaCache:'none'});</script>`;
const shellCount = Math.max(0, Math.min(520, Number(process.env.KB_DIAG_SHELL_COUNT || 0)));
const shellBytes = Math.max(1, Math.min(65536, Number(process.env.KB_DIAG_SHELL_BYTES || 1024)));
const script = version => `const VERSION=${JSON.stringify(version)};
const SHELL='shell-'+VERSION;
self.addEventListener('install', event => event.waitUntil((async () => {
  const cache=await caches.open(SHELL);
  const response=await fetch('/index.html', {cache:'no-cache'});
  await cache.put('/index.html', response.clone());
  await Promise.all(Array.from({length:${shellCount}}, async (_,i) => {
    const url='/shell/'+i+'.bin';
    const response=await fetch(url, {cache:'no-cache'});
    await cache.put(url,response.clone());
  }));
  await self.skipWaiting();
})()));
self.addEventListener('activate', event => event.waitUntil((async () => {
  for (const name of await caches.keys())
    if (name.startsWith('shell-') && name !== SHELL) await caches.delete(name);
  await self.clients.claim();
})()));
self.addEventListener('message', event => {
  const port=event.ports[0];
  if (event.data?.type==='STATUS') { port.postMessage({version:VERSION}); return; }
  if (event.data?.type==='DOWNLOAD') event.waitUntil((async () => {
    port.postMessage({state:'running',done:0});
    const response=await fetch('/asset.bin', {cache:'no-store'});
    await (await caches.open('asset')).put('/asset.bin', response.clone());
    port.postMessage({state:'running',done:1});
    await (await caches.open('asset')).keys();
    port.postMessage({state:'done',done:1});
  })());
});
self.addEventListener('fetch', event => {
  if (event.request.mode !== 'navigate') return;
  event.respondWith((async () => {
    const cache=await caches.open(SHELL);
    const cached=await cache.match('/index.html');
    const refresh=fetch(event.request).then(response => {
      if (response.ok) cache.put('/index.html', response.clone()).catch(() => {});
      return response;
    }).catch(() => null);
    return cached || await refresh || new Response('offline',{status:503});
  })());
});`;

async function message(page, type) {
  return page.evaluate(type => new Promise(resolve => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => resolve({timeout:true}), 3000);
    channel.port1.onmessage = event => {
      if (type === 'DOWNLOAD' && event.data?.state === 'running') return;
      clearTimeout(timer); channel.port1.close(); resolve(event.data);
    };
    navigator.serviceWorker.controller.postMessage({type}, [channel.port2]);
  }), type);
}
async function runCase(browser, mode) {
  let stage = 'old';
  const requests = [];
  const server = http.createServer((request, response) => {
    requests.push({stage, path:request.url});
    response.setHeader('Cache-Control', 'no-store');
    if (request.url === '/sw.js') return response.writeHead(200, {'Content-Type':'text/javascript'}).end(script(stage));
    if (request.url === '/index.html') return response.writeHead(200, {'Content-Type':'text/html'}).end(html);
    if (request.url === '/asset.bin') return response.writeHead(200, {'Content-Type':'application/octet-stream'}).end(Buffer.alloc(4096, 17));
    if (request.url.startsWith('/shell/')) return response.writeHead(200, {'Content-Type':'application/octet-stream'}).end(Buffer.alloc(shellBytes, 23));
    response.writeHead(404).end();
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    const base = 'http://127.0.0.1:' + server.address().port;
    await page.goto(base + '/index.html');
    await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, {timeout:15000});
    assert.equal((await message(page, 'STATUS')).version, 'old');
    if (mode === 'page-cache') await page.evaluate(async () => {
      const response = await fetch('/asset.bin', {cache:'no-store'});
      await (await caches.open('asset')).put('/asset.bin', response);
    });
    if (mode === 'sw-download') assert.equal((await message(page, 'DOWNLOAD')).state, 'done');
    stage = 'new';
    await page.reload({waitUntil:'domcontentloaded', timeout:15000});
    const first = await message(page, 'STATUS');
    const change = first.version === 'new' ? 'already-new' : await page.evaluate(() => new Promise(resolve => {
      const timer = setTimeout(() => resolve('timeout'), 10000);
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        clearTimeout(timer); resolve('controllerchange');
      }, {once:true});
    }));
    const final = await message(page, 'STATUS');
    const registration = await page.evaluate(async () => {
      const value = await navigator.serviceWorker.getRegistration();
      return {active:value?.active?.state||null, waiting:value?.waiting?.state||null};
    });
    return {mode, first:first.version, change, final:final.version, registration,
      requests:requests.length};
  } finally {
    await context.close();
    server.closeAllConnections(); server.close();
  }
}

(async () => {
  const browser = await pw.chromium.launch({channel:'chrome', headless:true});
  try {
    console.log('CHROME_VERSION', browser.version(), 'SHELL_COUNT', shellCount, 'SHELL_BYTES', shellBytes);
    for (const mode of ['none', 'page-cache', 'sw-download'])
      console.log('MIN_SW_LIFECYCLE', JSON.stringify(await runCase(browser, mode)));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

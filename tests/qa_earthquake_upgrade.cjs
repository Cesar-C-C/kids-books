// Historical installed PWA -> candidate by ordinary refresh, preserving old downloads.
// Never clear storage, unregister, call registration.update(), or force skipWaiting.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const cp = require('node:child_process');
const assert = require('node:assert/strict');
const pw = require(process.env.PLAYWRIGHT_MODULE || '../.qa-deps/node_modules/playwright');

const root = path.resolve(__dirname, '..');
const OLD = '89e5a4ad332380e5c32f2b4bc1ce6d1733a508d5';
const historical = file => cp.execFileSync('git', ['show', OLD + ':' + file], { cwd: root });
const old = Object.fromEntries(['index.html', 'shared/pwa.js', 'sw.js', 'pwa-assets.js']
  .map(file => [file, historical(file)]));
const parseManifest = source => {
  const raw = source.toString();
  return JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1));
};
const previous = parseManifest(old['pwa-assets.js']);
const current = parseManifest(fs.readFileSync(path.join(root, 'pwa-assets.js')));
let stage = 'old';
const requests = [];
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.webp': 'image/webp', '.png': 'image/png', '.mp3': 'audio/mpeg' };
const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://local').pathname);
  let file = path.resolve(root, '.' + pathname);
  if (file !== root && !file.startsWith(root + path.sep)) return response.writeHead(403).end();
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  const rel = path.relative(root, file).replaceAll('\\', '/');
  requests.push({ stage, path: pathname });
  response.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  response.setHeader('Cache-Control', rel === 'pwa-assets.js' ? 'public,max-age=86400' : 'no-store');
  if (stage === 'old' && old[rel]) return response.end(old[rel]);
  fs.readFile(file, (error, bytes) => error ? response.writeHead(404).end() : response.end(bytes));
});

async function status(page) {
  return page.evaluate(() => new Promise(resolve => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => { channel.port1.close(); resolve(null); }, 3000);
    channel.port1.onmessage = event => {
      clearTimeout(timer); channel.port1.close(); resolve(event.data);
    };
    if (navigator.serviceWorker.controller)
      navigator.serviceWorker.controller.postMessage({ type: 'KB_STATUS' }, [channel.port2]);
  }));
}
async function waitStatus(page, predicate, timeout = 60000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const value = await status(page);
    if (value && predicate(value)) return value;
    await page.waitForTimeout(200);
  }
  throw new Error('KB_STATUS timeout');
}
async function assetHashes(page) {
  return page.evaluate(async () => {
    const cache = await caches.open('kb-asset-v1');
    const entries = [];
    for (const request of await cache.keys()) {
      const bytes = await (await cache.match(request)).arrayBuffer();
      const hash = await crypto.subtle.digest('SHA-256', bytes);
      entries.push([request.url, Array.from(new Uint8Array(hash),
        byte => byte.toString(16).padStart(2, '0')).join('')]);
    }
    return Object.fromEntries(entries);
  });
}
async function registrationState(page) {
  return page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    return { active: registration?.active?.state || null,
      waiting: registration?.waiting?.state || null,
      controller: !!navigator.serviceWorker.controller };
  });
}

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await pw.chromium.launch({ channel: 'chrome', headless: true });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.addInitScript(() => {
      const native = window.matchMedia.bind(window);
      window.matchMedia = query => query === '(display-mode: standalone)'
        ? { matches: true, addEventListener() {}, removeEventListener() {} } : native(query);
    });
    const page = await context.newPage();
    const base = 'http://127.0.0.1:' + server.address().port;
    await page.goto(base + '/index.html');
    await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 60000 });
    assert.equal((await status(page)).version, previous.version);

    await page.locator('#kbFab').click();
    for (const id of ['airplane', 'sound']) {
      await page.waitForFunction(id => document.querySelector('#obtn-' + id)?.textContent === '下载', id);
      await page.locator('#obtn-' + id).click();
      await page.waitForFunction(id => document.querySelector('#obtn-' + id)?.textContent === '删除', id,
        { timeout: 60000 });
    }
    const oldStatus = await status(page);
    assert.equal(oldStatus.books.airplane.cached, oldStatus.books.airplane.total);
    assert.equal(oldStatus.books.sound.cached, oldStatus.books.sound.total);
    const before = await assetHashes(page);
    assert(Object.keys(before).length >= previous.books.airplane.files.length);

    stage = 'current';
    const firstNavigation = page.waitForEvent('framenavigated', { timeout: 30000 });
    await page.evaluate(() => setTimeout(() => location.reload(), 0));
    await firstNavigation;
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    // The new worker must take control without closing the installed app or forcing an update.
    const first = await status(page);
    const change = first?.version === current.version ? 'already-current' : await page.evaluate(() =>
      new Promise(resolve => {
        const timer = setTimeout(() => resolve('timeout'), 20000);
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          clearTimeout(timer); resolve('controllerchange');
        }, { once: true });
      }));
    const upgraded = await status(page);
    if (upgraded?.version !== current.version) {
      const waiting = await registrationState(page);
      // Closing/reopening is diagnostic recovery, not a pass for normal refresh.
      await page.close();
      const reopened = await context.newPage();
      await reopened.goto(base + '/index.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await reopened.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 30000 });
      const recovered = await waitStatus(reopened, value => value.version === current.version, 15000);
      const afterRestart = await assetHashes(reopened);
      for (const [url, hash] of Object.entries(before))
        assert.equal(afterRestart[url], hash, 'old downloaded byte changed: ' + url);
      console.error('EARTHQUAKE_UPGRADE_BLOCKED', JSON.stringify({
        old: previous.version, next: current.version, change, waiting,
        restartVersion: recovered.version, preserved: Object.keys(before).length,
        workerRequests: requests.filter(item => item.path === '/sw.js').length }));
      throw new Error('Normal refresh did not activate the new worker; app restart did');
    }

    assert.equal(upgraded.books.airplane.cached, upgraded.books.airplane.total);
    assert.equal(upgraded.books.sound.cached, upgraded.books.sound.total);
    const after = await assetHashes(page);
    for (const [url, hash] of Object.entries(before))
      assert.equal(after[url], hash, 'old downloaded byte changed: ' + url);
    console.log('EARTHQUAKE_UPGRADE_PASS old=' + previous.version + ' new=' + current.version +
      ' preserved=' + Object.keys(before).length);
    await context.close();
  } finally {
    await browser?.close();
    server.closeAllConnections();
    server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

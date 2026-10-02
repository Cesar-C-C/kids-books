// Historical installed PWA -> candidate by ordinary refresh, preserving old downloads.
// Never clear storage, unregister, call registration.update(), or force skipWaiting.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const cp = require('node:child_process');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const pw = require(process.env.PLAYWRIGHT_MODULE || '../.qa-deps/node_modules/playwright');
const nativeAudio = require('./qa_earthquake_book_native_audio.cjs');

const root = path.resolve(__dirname, '..');
const OLD = 'dce876b7d52c9c7554bda1aee42988c003aaf22e';
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
let networkAvailable = true;
const requests = [];
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.webp': 'image/webp', '.png': 'image/png', '.mp3': 'audio/mpeg' };
const server = http.createServer((request, response) => {
  if (!networkAvailable) return request.socket.destroy();
  const pathname = decodeURIComponent(new URL(request.url, 'http://local').pathname);
  let file = path.resolve(root, '.' + pathname);
  if (file !== root && !file.startsWith(root + path.sep)) return response.writeHead(403).end();
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  const rel = path.relative(root, file).replaceAll('\\', '/');
  requests.push({ stage, path: pathname });
  response.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  response.setHeader('Cache-Control', rel === 'pwa-assets.js' ? 'public,max-age=86400' : 'no-store');
  if (stage === 'old' && /^(books|labs)\/earthquake\//.test(rel)) {
    if (!old[rel]) old[rel] = historical(rel);
    return response.end(old[rel]);
  }
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
    await nativeAudio.observe(context);
    await context.addInitScript(() => {
      const native = window.matchMedia.bind(window);
      window.matchMedia = query => query === '(display-mode: standalone)'
        ? { matches: true, addEventListener() {}, removeEventListener() {} } : native(query);
    });
    const page = await context.newPage();
    const base = 'http://127.0.0.1:' + server.address().port;
    await page.goto(base + '/index.html');
    await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 120000 });
    assert.equal((await status(page)).version, previous.version);

    await page.locator('#kbFab').click();
    for (const id of ['airplane', 'sound', 'earthquake']) {
      await page.waitForFunction(id => document.querySelector('#obtn-' + id)?.textContent === '下载', id);
      await page.locator('#obtn-' + id).click();
      await page.waitForFunction(id => document.querySelector('#obtn-' + id)?.textContent === '删除', id,
        { timeout: 120000 });
    }
    const oldStatus = await status(page);
    assert.equal(oldStatus.books.airplane.cached, oldStatus.books.airplane.total);
    assert.equal(oldStatus.books.sound.cached, oldStatus.books.sound.total);
    assert.equal(oldStatus.books.earthquake.cached, oldStatus.books.earthquake.total);
    assert.equal(oldStatus.books.earthquake.audioExpected, 56, 'installed v1 has 56 book clips');
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
    assert.equal(upgraded.books.earthquake.audioExpected, 74, 'ordinary upgrade reads the v2 catalog');
    assert(upgraded.books.earthquake.cached < upgraded.books.earthquake.total,
      'old v1 MP3 keys cannot masquerade as the updated v2 download');
    const after = await assetHashes(page);
    for (const [url, hash] of Object.entries(before))
      assert.equal(after[url], hash, 'old downloaded byte changed: ' + url);
    await page.locator('#kbFab').click();
    await page.waitForFunction(() => document.querySelector('#obtn-earthquake')?.textContent === '下载');
    await page.locator('#obtn-earthquake').click();
    await page.waitForFunction(() => document.querySelector('#obtn-earthquake')?.textContent === '删除', null,
      { timeout: 120000 });
    const downloaded = await status(page);
    assert.equal(downloaded.books.earthquake.cached, downloaded.books.earthquake.total);
    assert.equal(downloaded.books.earthquake.missingAudio, 0);
    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'books/earthquake/audio-manifest.json'), 'utf8'));
    const expected = manifest.entries.map(entry => [
      base + '/books/earthquake/' + entry.output + '?v=' + encodeURIComponent(manifest.contentVersion),
      entry.fileSha256
    ]);
    const actual = await assetHashes(page);
    for (const [url, hash] of expected) assert.equal(actual[url], hash, 'v2 cache has current clip bytes: ' + url);
    for (const [url, hash] of Object.entries(before)) {
      const relative = new URL(url).pathname.slice(1);
      const mutableBookCore = relative.startsWith('books/earthquake/') &&
        /\.(html|js|css|json)$/.test(relative);
      if (mutableBookCore) {
        const nextHash = createHash('sha256').update(fs.readFileSync(path.join(root, relative))).digest('hex');
        assert.equal(actual[url], nextHash, 'redownload refreshes the current book core: ' + url);
      } else {
        assert.equal(actual[url], hash, 'unrelated downloads and immutable media survive: ' + url);
      }
    }
    networkAvailable = false;
    await context.setOffline(true);
    const coldOffline = await page.evaluate(async () => {
      const response = await fetch('books/earthquake/images/opening.webp?qa-upgrade-cold=' + crypto.randomUUID());
      return response.status;
    });
    assert.equal(coldOffline, 504, 'an uncached valid image proves the upgraded worker network is truly disconnected');
    await page.goto(base + '/books/earthquake/index.html?lang=en#fault-lab');
    await page.waitForFunction(() => window.EarthquakeBook?.snapshot().audioState === 'idle');
    const currentSource = await page.evaluate(async () => (await fetch('story.json')).json());
    assert.equal(currentSource.scriptVersion, 'earthquake-story-v2', 'offline ordinary upgrade serves v2 text');
    const invitation = manifest.entries.find(entry => entry.kind === 'scene' && entry.itemId === 'invitation' && entry.lang === 'en');
    const invitationUrl = base + '/books/earthquake/' + invitation.output + '?v=' + encodeURIComponent(manifest.contentVersion);
    const responseReady = page.waitForResponse(response => response.url() === invitationUrl);
    await page.locator('.listen[data-kind="scene"][data-item-id="invitation"]').click();
    const invitationResponse = await responseReady;
    assert.equal(invitationResponse.status(), 200);
    assert.equal(invitationResponse.fromServiceWorker(), true, 'upgraded offline audio comes from the production worker');
    assert.equal(createHash('sha256').update(await invitationResponse.body()).digest('hex'), invitation.fileSha256);
    await page.waitForFunction(() => {
      const audio = __bookNativeAudio.at(-1);
      return EarthquakeBook.snapshot().audioState === 'playing' && audio instanceof HTMLAudioElement &&
        !audio.paused && !audio.error && audio.duration > 0 && audio.currentTime > .12;
    });
    await page.locator('#stop').click();
    await page.waitForFunction(() => EarthquakeBook.snapshot().audioState === 'stopped');
    assert.doesNotMatch(await page.locator('#edition').textContent(), /pending|待更新/i);
    console.log('EARTHQUAKE_UPGRADE_PASS old=' + previous.version + ' new=' + current.version +
      ' preserved=' + Object.keys(before).length + ' v2Clips=' + expected.length);
    await context.close();
  } finally {
    await browser?.close();
    server.closeAllConnections();
    server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

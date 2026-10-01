// Exercise the real Service Worker message handler against controlled Cache Storage.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const worker = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const origin = 'https://example.test/kids-books/';
const files = ['labs/earthquake/index.html', 'labs/earthquake/v3/app.js?v=2'];
const cached = new Set();
const handlers = {};
const self = {
  location: new URL(origin + 'sw.js'),
  KB_ASSETS: null,
  addEventListener(type, listener) { handlers[type] = listener; },
  skipWaiting() {},
};
const context = {
  self, URL, Request, Response, console,
  importScripts() {
    self.KB_ASSETS = { version: 'earthquake-test-v1', shell: files, books: {},
      labs: { earthquake: { files } } };
  },
  caches: {
    async open() {
      return { async match(url) { return cached.has(url) ? { status: 200 } : undefined; } };
    },
  },
};
vm.runInNewContext(worker, context, { filename: 'sw.js' });

async function ask(labId) {
  let result, pending;
  handlers.message({ data: { type: 'KB_LAB_STATUS', labId },
    ports: [{ postMessage(value) { result = value; } }],
    waitUntil(promise) { pending = promise; } });
  if (pending) await pending;
  return result;
}

(async () => {
  const unknown = await ask('not-a-lab');
  assert.equal(unknown?.ready, false, 'unknown lab must fail closed');
  assert.equal(unknown.type, 'KB_LAB_STATUS');
  const empty = await ask('earthquake');
  assert.equal(empty?.ready, false, 'uncached lab must not look ready');
  cached.add(origin + files[0]);
  const partial = await ask('earthquake');
  assert.equal(partial?.ready, false, 'partial core cache must not look ready');
  cached.add(origin + files[1]);
  const full = await ask('earthquake');
  assert.equal(full?.ready, true, 'all current-version core assets are cached');
  assert.equal(full.version, 'earthquake-test-v1');
  const clientScript = fs.readFileSync(path.join(root, 'shared/pwa.js'), 'utf8');
  function client(reply, controlled = true, channelAvailable = true) {
    const messages = [];
    const window = {};
    const target = { postMessage(message, ports) {
      messages.push(message);
      if (reply) queueMicrotask(() => ports[0].postMessage(reply));
    } };
    class Channel {
      constructor() {
        this.port1 = { onmessage: null, close() {} };
        this.port2 = { postMessage: value => this.port1.onmessage?.({ data: value }) };
      }
    }
    const navigator = { serviceWorker: { controller: controlled ? target : null } };
    const document = { currentScript: { src: origin + 'shared/pwa.js' },
      readyState: 'loading', addEventListener() {} };
    const location = new URL(origin + 'books/earthquake/index.html');
    const globals = { window, navigator, document, location, setTimeout, clearTimeout, console };
    if (channelAvailable) globals.MessageChannel = Channel;
    vm.runInNewContext(clientScript, globals, { filename: 'shared/pwa.js' });
    return { window, messages };
  }
  const readyClient = client({ type: 'KB_LAB_STATUS', labId: 'earthquake', ready: true, version: 'earthquake-test-v1' });
  assert.deepEqual(JSON.parse(JSON.stringify(await readyClient.window.KBOfflineLab.check('earthquake'))),
    { ready: true, version: 'earthquake-test-v1' });
  assert.equal(readyClient.messages[0].type, 'KB_LAB_STATUS');
  const noController = client(null, false);
  assert.deepEqual(JSON.parse(JSON.stringify(await noController.window.KBOfflineLab.check('earthquake'))),
    { ready: false, version: null });
  const oldWorker = client(null);
  assert.deepEqual(JSON.parse(JSON.stringify(await oldWorker.window.KBOfflineLab.check('earthquake'))),
    { ready: false, version: null }, 'old silent worker must time out safely');
  const malformed = client({ type: 'KB_STATUS', books: {} });
  assert.equal((await malformed.window.KBOfflineLab.check('earthquake')).ready, false);
  const noChannel = client(null, true, false);
  assert.equal((await noChannel.window.KBOfflineLab.check('earthquake')).ready, false,
    'browser without MessageChannel must fail closed');
  assert.equal((await readyClient.window.KBOfflineLab.check('unknown')).ready, false);

  const catalogContext = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'labs/catalog.js'), 'utf8'), catalogContext);
  const earthquake = catalogContext.window.LABS_CATALOG.find(item => item.id === 'earthquake');
  assert.equal(earthquake?.status, 'ready', 'completed local lab candidate belongs in ready catalog');
  assert.equal(earthquake.bookId, 'earthquake');
  assert(earthquake.features.includes('中英双语点读'));
  assert(!earthquake.features.includes('配音制作中'));
  assert(fs.existsSync(path.join(root, 'labs', earthquake.image)));
  const shelf = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(shelf, /class="book-card" href="books\/earthquake\/index\.html"/);
  assert.match(shelf, /src="books\/earthquake\/images\/opening_card480\.webp"/);
  assert.match(shelf, /地震原理 · 双语互动 · 双语点读/,
    'completed narration must be announced on the earthquake shelf card');
  assert.doesNotMatch(shelf, /地震原理 · 双语互动 · 配音制作中/);
  assert.doesNotMatch(shelf, /部分新书配音制作中/);
  console.log('EARTHQUAKE_LAB_STATUS_PASS unknown/empty/partial/full');
})().catch(error => { console.error(error); process.exitCode = 1; });

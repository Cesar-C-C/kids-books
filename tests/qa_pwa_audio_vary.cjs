// Production hosts vary full GETs by encoding; native media requests identity.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const origin = 'https://example.test/kids-books/';
const handlers = {};
const entries = new Map();
let networkRequests = 0;
function storage(name) {
  if (!entries.has(name)) entries.set(name, new Map());
  const values = entries.get(name);
  return {
    async match(request, options = {}) {
      const url = typeof request === 'string' ? request : request.url;
      const record = values.get(url);
      if (!record) return;
      if (!options.ignoreVary) {
        const incoming = typeof request === 'string' ? new Request(request) : request;
        const vary = (record.response.headers.get('Vary') || '').split(',').map(value => value.trim()).filter(Boolean);
        if (vary.some(header => header === '*' || incoming.headers.get(header) !== record.request.headers.get(header))) return;
      }
      return record.response.clone();
    },
    async put(request, response) {
      const key = typeof request === 'string' ? new Request(request) : request;
      values.set(key.url, { request: key, response: response.clone() });
    }
  };
}
const self = { location: new URL(origin + 'sw.js'), addEventListener(type, handler) { handlers[type] = handler; } };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8'), {
  self, URL, Request, Response, console,
  importScripts() { self.KB_ASSETS = { version: 'test', shell: [], books: {} }; },
  caches: { async open(name) { return storage(name); } },
  async fetch() { networkRequests++; throw Error('Real network unavailable in this fixture'); }
});
async function request(relative, headers = {}) {
  let pending;
  handlers.fetch({ request: new Request(new URL(relative, origin), { headers }), respondWith(promise) { pending = promise; } });
  return await pending;
}
async function seed(relative, vary = 'Accept-Encoding', status = 200, cacheName = 'kb-asset-v1') {
  const responseHeaders = { 'Content-Type': 'audio/mpeg', Vary: vary };
  if (status === 206) responseHeaders['Content-Range'] = 'bytes 0-3/18';
  await storage(cacheName).put(new Request(new URL(relative, origin), { headers: { 'Accept-Encoding': 'gzip, br', 'X-Role': 'parent' } }),
    new Response('complete MP3 bytes', { status, headers: responseHeaders }));
}
(async () => {
  const clip = 'labs/earthquake/audio/current-en.mp3?v=' + 'a'.repeat(64);
  await seed(clip);
  let response = await request(clip, { Range: 'bytes=0-', 'Accept-Encoding': 'identity;q=1, *;q=0' });
  assert.equal(response.status, 200, 'native identity Range request must reuse the complete encoding-varied MP3');
  assert.equal(response.headers.get('Content-Range'), null);
  assert.equal(await response.text(), 'complete MP3 bytes');
  assert.equal(networkRequests, 0, 'no hidden network fallback after an exact versioned cache hit');
  response = await request(clip, { 'Accept-Encoding': 'gzip, br', 'X-Role': 'parent' });
  assert.equal(response.status, 200, 'ordinary matching full fetch still works');
  await seed('books/earthquake/audio/current-zh.mp3?v=story-v2', ' accept-encoding ', 200, 'kb-shell-test');
  assert.equal((await request('books/earthquake/audio/current-zh.mp3?v=story-v2', { Range: 'bytes=0-', 'Accept-Encoding': 'identity' })).status, 200,
    'complete audio can be found in the secondary shell cache');
  assert.equal((await request(clip.replace('a'.repeat(64), 'b'.repeat(64)), { Range: 'bytes=0-' })).status, 504,
    'never ignore a version query or reuse stale clip bytes');
  await seed('audio/partial.mp3', 'Accept-Encoding', 206);
  assert.equal((await request('audio/partial.mp3', { Range: 'bytes=0-', 'Accept-Encoding': 'identity' })).status, 504,
    'a partial response can never be promoted to complete audio');
  await seed('audio/role.mp3', 'Accept-Encoding, X-Role');
  assert.equal((await request('audio/role.mp3', { 'Accept-Encoding': 'identity', 'X-Role': 'child' })).status, 504,
    'only encoding-only Vary is eligible; other variants stay separated');
  await seed('audio/wildcard.mp3', '*');
  assert.equal((await request('audio/wildcard.mp3', { 'Accept-Encoding': 'identity' })).status, 504);
  await seed('shared/controller.js');
  assert.equal((await request('shared/controller.js', { 'Accept-Encoding': 'identity' })).status, 504,
    'mutable non-audio resources retain ordinary variant matching');
  console.log('PWA_AUDIO_VARY_PASS full200/exact-version/secondary/partial/other-vary/non-audio');
})().catch(error => { console.error(error); process.exitCode = 1; });

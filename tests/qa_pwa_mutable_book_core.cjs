// A new download must refresh mutable book core files, not bless stale v1 bytes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const origin = 'https://example.test/kids-books/';
const files = [
  'books/earthquake/story.json', 'books/earthquake/book.js',
  'books/earthquake/images/opening.webp',
  'books/earthquake/audio/vocab-fault-zh.mp3?v=earthquake-story-v2'
];
const stored = new Map(files.map(file => [origin + file, new Response(
  file.endsWith('.json') ? 'v1 source' : file.endsWith('.js') ? 'v1 controller' : 'immutable bytes'
)]));
const requests = [];
const cache = {
  async match(input) { return stored.get(typeof input === 'string' ? input : input.url)?.clone(); },
  async put(input, response) { stored.set(typeof input === 'string' ? input : input.url, response.clone()); },
  async keys() { return [...stored.keys()].map(url => new Request(url)); }
};
const handlers = {};
const self = {
  location: new URL(origin + 'sw.js'),
  addEventListener(type, listener) { handlers[type] = listener; },
  skipWaiting() {}
};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8'), {
  self, URL, Request, Response, console,
  importScripts() { self.KB_ASSETS = { version: 'v2', shell: [], books: {
    earthquake: { files, bytes: 100, audioExpected: 2, missingAudio: [], complete: true }
  } }; },
  caches: { async open() { return cache; } },
  async fetch(request) {
    requests.push(request.url);
    return new Response(request.url.endsWith('.json') ? 'v2 source' : 'v2 controller');
  }
});
(async () => {
  let pending;
  const progress = [];
  handlers.message({ data: { type: 'KB_DOWNLOAD', bookId: 'earthquake' },
    ports: [{ postMessage(message) { progress.push(message); } }],
    waitUntil(promise) { pending = promise; } });
  await pending;
  assert.equal(await stored.get(origin + files[0]).text(), 'v2 source', 'new download refreshes the frozen source');
  assert.equal(await stored.get(origin + files[1]).text(), 'v2 controller', 'new download refreshes the controller');
  assert.equal(await stored.get(origin + files[2]).text(), 'immutable bytes', 'unchanged illustration bytes survive');
  assert.equal(await stored.get(origin + files[3]).text(), 'immutable bytes', 'versioned narration bytes survive');
  assert.deepEqual(requests.sort(), [origin + files[0], origin + files[1]].sort());
  assert.equal(progress.at(-1).state, 'done');
  console.log('PWA_MUTABLE_BOOK_CORE_PASS refreshed source/controller; preserved immutable assets');
})().catch(error => { console.error(error); process.exitCode = 1; });

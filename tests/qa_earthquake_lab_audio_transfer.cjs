// Transport contract: metadata is not proof of complete, verified MP3 bytes.
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { create } = require('../labs/earthquake/v3/audio.js');
const sha = value => createHash('sha256').update(value).digest('hex');
const source = { contentVersion: 'transport-fixture', entries: [{ id: 'line', kind: 'result', zh: '一句话。', en: 'One line.', narrationNeeded: true, contentVersion: 'transport-fixture' }] };
const raw = JSON.stringify(source);
const bytes = Buffer.from([0x49, 0x44, 0x33, 0, 0xff, 0x80, 1, 2]);
const entry = lang => {
  const text = source.entries[0][lang];
  const segments = [{ role: 'narrator', sourceText: text, spokenText: text }];
  const id = `result-line-${lang}`;
  return { id, owner: 'lab', kind: 'result', itemId: 'line', lang, text, contentVersion: source.contentVersion, textSha256: sha(text), utteranceSha256: sha(JSON.stringify({ kind: 'result', id: 'line', lang, text, segments })), fileSha256: sha(bytes), output: `audio/${id}.mp3`, status: 'ready' };
};
const manifest = { schemaVersion: 2, owner: 'lab', contentVersion: source.contentVersion, sourceSha256: sha(raw), entries: ['zh', 'en'].map(entry) };
const defer = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
const full = (body = bytes, status = 200, range = null) => ({ ok: status >= 200 && status < 300, status, headers: new Headers(range ? { 'Content-Range': range } : {}), arrayBuffer: async () => Uint8Array.from(body).buffer });
class NativeStub {
  static instances = [];
  constructor(src) { this.src = src; this.paused = true; NativeStub.instances.push(this); }
  play() { this.paused = false; return Promise.resolve(); }
  pause() { this.paused = true; }
}
function fixture(transfer, customManifest = manifest) {
  const requests = [], statuses = [];
  const adapter = create({ manifestUrl: 'audio-manifest.json', contentVersion: source.contentVersion, baseUrl: 'https://fixture.test/labs/earthquake/', AudioClass: NativeStub,
    onStatus: status => statuses.push(status), fetcher: async (url, options) => {
      if (url === 'content.json') return { ok: true, text: async () => raw };
      if (url === 'audio-manifest.json') return { ok: true, text: async () => JSON.stringify(customManifest) };
      requests.push({ url, options }); return transfer(url, options);
    } });
  return { adapter, requests, statuses };
}
async function verifyTransfer() {
  const valid = fixture(() => full());
  await valid.adapter.ready;
  assert.equal(valid.requests.length, 0, 'loading metadata never prefetches MP3s without a click');
  assert.equal((await valid.adapter.play('result', 'line', 'zh')).ok, true);
  assert.equal(valid.requests.length, 1, 'a user play fully fetches its MP3 before native playback');
  assert.equal(new Headers(valid.requests[0].options?.headers).has('Range'), false, 'verification requests never ask for partial bytes');
  assert.equal(new URL(valid.requests[0].url).searchParams.get('v'), sha(bytes));
  assert.equal(NativeStub.instances.at(-1).src, valid.requests[0].url, 'native playback retains the exact versioned URL');
  valid.adapter.dispose();

  for (const [label, response] of [
    ['partial 206', full(bytes, 206, 'bytes 0-7/80')],
    ['partial header on 200', full(bytes, 200, 'bytes 0-7/80')],
    ['wrong full bytes', full(Buffer.from('wrong audio'))],
    ['offline unavailable', full(bytes, 504)]
  ]) {
    const failed = fixture(() => response), count = NativeStub.instances.length;
    await failed.adapter.ready;
    assert.equal((await failed.adapter.play('result', 'line', 'zh')).reason, 'unavailable', label);
    assert.equal(NativeStub.instances.length, count, label + ' never constructs a native player');
    assert.deepEqual(failed.statuses, ['unavailable'], label + ' emits one failure hint');
    failed.adapter.dispose();
  }

  const newerBytes = Buffer.from('regenerated binary clip');
  const changed = fixture(() => full(newerBytes), { ...manifest, entries: [{ ...entry('zh'), fileSha256: sha(newerBytes).toUpperCase() }] });
  await changed.adapter.ready;
  assert.equal((await changed.adapter.play('result', 'line', 'zh')).ok, true);
  assert.equal(new URL(NativeStub.instances.at(-1).src).searchParams.get('v'), sha(newerBytes), 'hash comparisons and URL identity accept uppercase manifest hashes');
  changed.adapter.dispose();

  const pendingFetch = defer(), fetchStarted = defer();
  const stopped = fixture((url, options) => { fetchStarted.resolve(options); return pendingFetch.promise; });
  await stopped.adapter.ready;
  const count = NativeStub.instances.length, play = stopped.adapter.play('result', 'line', 'zh');
  const fetchOptions = await fetchStarted.promise;
  stopped.adapter.stop();
  assert.equal(fetchOptions.signal.aborted, true, 'stop aborts the pending complete transfer');
  pendingFetch.resolve(full());
  assert.equal((await play).reason, 'cancelled');
  assert.equal(NativeStub.instances.length, count, 'late fetch completion cannot resurrect playback');
  assert.deepEqual(stopped.statuses, [], 'cancel is not reported as an unavailable clip');
  stopped.adapter.dispose();

  const pendingBody = defer(), bodyStarted = defer();
  const disposed = fixture(() => ({ ...full(), arrayBuffer: () => { bodyStarted.resolve(); return pendingBody.promise; } }));
  await disposed.adapter.ready;
  const reading = disposed.adapter.play('result', 'line', 'zh');
  await bodyStarted.promise;
  disposed.adapter.dispose();
  pendingBody.resolve(Uint8Array.from(bytes).buffer);
  assert.equal((await reading).reason, 'cancelled', 'dispose invalidates a pending body verification');
  assert.equal(NativeStub.instances.length, count);

  const firstTransfer = defer(), firstStarted = defer();
  const latest = fixture(url => { if (url.includes('-zh.mp3')) { firstStarted.resolve(); return firstTransfer.promise; } return full(); });
  await latest.adapter.ready;
  const oldPlay = latest.adapter.play('result', 'line', 'zh');
  await firstStarted.promise;
  assert.equal((await latest.adapter.play('result', 'line', 'en')).ok, true);
  const newest = NativeStub.instances.at(-1);
  firstTransfer.resolve(full());
  assert.equal((await oldPlay).reason, 'cancelled');
  assert.equal(newest.paused, false, 'old transfer cannot pause or replace the newer language');
  assert.equal(NativeStub.instances.filter(a => !a.paused).length, 1);
  latest.adapter.dispose();
  const metadata = defer();
  const beforeReady = create({ manifestUrl: 'audio-manifest.json', contentVersion: source.contentVersion, AudioClass: NativeStub, baseUrl: 'https://fixture.test/labs/earthquake/', fetcher: url => {
    if (url === 'content.json') return Promise.resolve({ ok: true, text: async () => raw });
    if (url === 'audio-manifest.json') return metadata.promise;
    return Promise.resolve(full());
  } });
  const firstReady = beforeReady.play('result', 'line', 'zh');
  const lastReady = beforeReady.play('result', 'line', 'en');
  metadata.resolve({ ok: true, text: async () => JSON.stringify(manifest) });
  assert.equal((await firstReady).reason, 'cancelled', 'latest click wins even while metadata is still pending');
  assert.equal((await lastReady).ok, true);
  assert.ok(NativeStub.instances.at(-1).src.includes('-en.mp3'));
  beforeReady.dispose();

  const nativeDigest = crypto.subtle.digest.bind(crypto.subtle);
  const hashing = defer(), hashStarted = defer();
  const duringHash = fixture(() => full());
  await duringHash.adapter.ready;
  const beforeHash = NativeStub.instances.length;
  crypto.subtle.digest = (algorithm, input) => {
    if (input.byteLength === bytes.length) { hashStarted.resolve(); return hashing.promise; }
    return nativeDigest(algorithm, input);
  };
  try {
    const pendingHashPlay = duringHash.adapter.play('result', 'line', 'zh');
    await hashStarted.promise;
    duringHash.adapter.stop();
    hashing.resolve(await nativeDigest('SHA-256', bytes));
    assert.equal((await pendingHashPlay).reason, 'cancelled', 'late digest completion never revives a stopped ticket');
    assert.equal(NativeStub.instances.length, beforeHash);
    assert.deepEqual(duringHash.statuses, []);
  } finally { crypto.subtle.digest = nativeDigest; duringHash.adapter.dispose(); }
  console.log('Earthquake audio complete-transfer, binary SHA, partial rejection, cancellation and latest-wins PASS');
}
module.exports = verifyTransfer;
if (require.main === module) verifyTransfer().catch(error => { console.error(error); process.exitCode = 1; });

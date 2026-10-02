// All frozen bilingual book clips must be reachable through the actual UI.
// Native Audio is observed, never mocked; both network and offline responses are hashed.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '..');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

async function observe(context) {
  await context.addInitScript(() => {
    const NativeAudio = window.Audio;
    window.__bookNativeAudio = [];
    window.Audio = function ObservedAudio(src) {
      const audio = new NativeAudio(src);
      window.__bookNativeAudio.push(audio);
      return audio;
    };
    window.Audio.prototype = NativeAudio.prototype;
  });
}

async function verify(page, base, offline) {
  const source = JSON.parse(fs.readFileSync(path.join(root, 'books/earthquake/story.json'), 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'books/earthquake/audio-manifest.json'), 'utf8'));
  assert.equal(manifest.contentVersion, source.scriptVersion);
  const clips = new Map(manifest.entries.map(entry => [entry.key, entry]));
  const reached = new Set();
  const played = [];
  async function play(kind, itemId, lang) {
    const key = 'book:' + kind + '-' + itemId + '-' + lang;
    if (reached.has(key)) return;
    const clip = clips.get(key);
    assert(clip && clip.status === 'ready', 'formal clip required: ' + key);
    const button = page.locator('.listen[data-kind="' + kind + '"][data-item-id="' + itemId + '"]').first();
    assert.equal(await button.count(), 1, 'actual UI control required: ' + key);
    const collapsed = button.locator('xpath=ancestor::details[not(@open)]/summary');
    while (await collapsed.count()) await collapsed.first().click();
    assert.equal(await button.isEnabled(), true, 'actual UI control enabled: ' + key);
    assert.equal(await button.evaluate(node => node.previousElementSibling.textContent), clip.text,
      'visible point-read text matches the formal clip: ' + key);
    const url = base + '/books/earthquake/' + clip.output + '?v=' + encodeURIComponent(source.scriptVersion);
    const before = await page.evaluate(() => __bookNativeAudio.length);
    const responseReady = page.waitForResponse(response => response.url() === url, { timeout: 20000 });
    await button.click();
    const response = await responseReady;
    assert.equal(response.status(), 200, 'whole MP3 response: ' + key);
    if (offline) assert.equal(response.fromServiceWorker(), true, 'offline clip is served by the real worker: ' + key);
    assert.equal(sha(await response.body()), clip.fileSha256, 'actual response bytes match the formal MP3: ' + key);
    await page.waitForFunction(count => {
      const audio = __bookNativeAudio.at(-1);
      return __bookNativeAudio.length > count && audio instanceof HTMLAudioElement && !audio.paused &&
        !audio.error && audio.readyState >= 2 && Number.isFinite(audio.duration) &&
        audio.duration > 0 && audio.currentTime > .12;
    }, before, { timeout: 20000 });
    const evidence = await page.evaluate(() => ({
      active: __bookNativeAudio.filter(audio => !audio.paused && !audio.ended).length,
      duration: __bookNativeAudio.at(-1).duration
    }));
    assert.equal(evidence.active, 1, 'one native narrator, no overlapping audio: ' + key);
    reached.add(key);
    played.push({ key, duration: evidence.duration, worker: response.fromServiceWorker() });
    await page.locator('#stop').click();
    await page.waitForFunction(() => __bookNativeAudio.every(audio => audio.paused || audio.ended));
  }
  for (const lang of ['zh', 'en']) {
    if ((await page.evaluate(() => EarthquakeBook.snapshot().lang)) !== lang) {
      const before = await page.evaluate(() => __bookNativeAudio.length);
      await page.locator('#language').click();
      await page.waitForFunction(() => __bookNativeAudio.every(audio => audio.paused || audio.ended));
      assert.equal(await page.evaluate(() => __bookNativeAudio.length), before, 'language change does not autoplay');
    }
    const closed = page.locator('details.why:not([open]) > summary');
    while (await closed.count()) await closed.first().click();
    for (const [kind, items] of [['scene', source.scenes], ['vocab', source.vocab]]) {
      for (const item of items.filter(item => item.narrationNeeded)) await play(kind, item.id, lang);
    }
    for (const chapter of ['fault-lab', 'wave-lab']) {
      const summary = page.locator('#' + chapter + ' details.tools:not([open]) > summary');
      if (await summary.count()) await summary.click();
    }
    await play('prompt', 'fault-predict', lang);
    await play('prompt', 'wave-predict', lang);
    await play('result', 'local-motion', lang);
    await play('result', 'exhibit-complete', lang);
    await page.locator('#fault-reset').click();
    for (let step = 0; step < 80; step++) {
      const id = await page.locator('#fault-lab .result .listen').getAttribute('data-item-id');
      await play('result', id, lang);
      if ((await page.evaluate(() => EarthquakeBook.snapshot().fault.phase)) === 'settled') break;
      await page.locator('#fault-step').click();
    }
    await page.locator('#wave-reset').click();
    for (let step = 0; step < 30; step++) {
      const id = await page.locator('#wave-lab .result .listen').getAttribute('data-item-id');
      await play('result', id, lang);
      if ((await page.evaluate(() => EarthquakeBook.snapshot().wave.phase)) === 'done') break;
      await page.locator('#wave-step').click();
    }
  }
  assert.deepEqual([...reached].sort(), [...clips.keys()].sort(),
    'every formal bilingual clip is reachable and actually played through the UI');
  assert.equal(reached.size, 74, 'v2 native coverage is exactly 74 book clips');
  console.log('EARTHQUAKE_BOOK_NATIVE_ALL_PASS ' + JSON.stringify({ offline, count: reached.size, played }));
}
module.exports = { observe, verify };

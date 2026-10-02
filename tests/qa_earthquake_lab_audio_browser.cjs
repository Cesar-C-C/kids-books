// Real MP3 decoding/playback through Chrome and the production Service Worker.
// Audio instrumentation only retains native elements; play/pause/fetch are not mocked.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

module.exports = async function verifyRealAudio(browser, base, setNetworkAvailable, transportRequests) {
  assert.ok(Array.isArray(transportRequests), 'audio QA requires the Range-aware server request journal');
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../labs/earthquake/audio-manifest.json'), 'utf8'));
  const contentRaw = fs.readFileSync(path.join(__dirname, '../labs/earthquake/content.json'), 'utf8');
  const source = JSON.parse(contentRaw);
  const narrated = source.entries.filter(item => item.narrationNeeded);
  assert.equal(manifest.contentVersion, source.contentVersion, 'formal audio belongs to the frozen teaching version');
  const sourceHash = createHash('sha256').update(contentRaw.normalize('NFC').replace(/\r\n/g, '\n')).digest('hex');
  assert.equal(manifest.sourceSha256, sourceHash, 'formal audio is bound to this exact current source');
  assert.equal(manifest.entries.filter(entry => entry.status === 'ready').length, narrated.length * 2, 'every current bilingual teaching item has a ready formal clip');
  const clips = ['zh', 'en'].map(lang => manifest.entries.find(entry => entry.itemId === 'result-initial' && entry.lang === lang));
  const clipUrl = clip => base + '/labs/earthquake/' + clip.output + '?v=' + clip.fileSha256.toLowerCase();
  const contexts = [];
  const evidence = [];
  async function openContext() {
    const context = await browser.newContext({ serviceWorkers: 'allow' });
    contexts.push(context);
    await context.addInitScript(() => {
      const NativeAudio = window.Audio;
      window.__nativeAudio = [];
      window.Audio = function ObservedAudio(src) {
        const element = new NativeAudio(src);
        window.__nativeAudio.push(element);
        return element;
      };
      window.Audio.prototype = NativeAudio.prototype;
    });
    const page = await context.newPage();
    await page.goto(base + '/labs/earthquake/index.html');
    await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 60000 });
    // The on-demand manifest may have landed after the shell inventory was generated.
    // Fetch through the real worker so the next offline navigation has current metadata.
    await page.evaluate(async () => {
      for (const url of ['content.json', 'audio-manifest.json']) await (await fetch(url)).text();
    });
    await page.waitForFunction(async () => !!(await caches.match(new URL('audio-manifest.json', location.href).href)));
    await page.locator('#listen').waitFor({ state: 'visible' });
    return { context, page };
  }
  async function play(page, lang, selector = '#listen') {
    const count = await page.evaluate(() => __nativeAudio.length);
    await page.locator(selector).click();
    await page.waitForFunction(({ count, lang }) => {
      const audio = __nativeAudio.at(-1);
      return __nativeAudio.length > count && audio instanceof HTMLAudioElement && !audio.paused && !audio.error
        && audio.readyState >= 2 && Number.isFinite(audio.duration) && audio.duration > 0
        && audio.currentTime > 0.15 && new URL(audio.src).pathname.endsWith('-' + lang + '.mp3');
    }, { count, lang }, { timeout: 15000 });
    const result = await page.evaluate(() => ({
      src: __nativeAudio.at(-1).src, duration: __nativeAudio.at(-1).duration,
      time: __nativeAudio.at(-1).currentTime,
      active: __nativeAudio.filter(audio => !audio.paused && !audio.ended).length
    }));
    assert.equal(result.active, 1, 'exactly one native narrator is playing');
    return result;
  }
  async function allStopped(page, label) {
    await page.waitForFunction(() => __nativeAudio.every(audio => audio.paused || audio.ended));
    assert.ok(await page.evaluate(() => __nativeAudio.every(audio => audio.paused || audio.ended)), label);
  }
  try {
    const warm = await openContext();
    const probeUrl = clipUrl(clips[0]) + '&qa-range-probe=1';
    const rangeProbe = await warm.page.evaluate(async url => {
      const response = await fetch(url, { headers: { Range: 'bytes=0-1023' } });
      return { status: response.status, range: response.headers.get('content-range'), size: (await response.arrayBuffer()).byteLength };
    }, probeUrl);
    const probeSize = fs.statSync(path.join(__dirname, '../labs/earthquake', clips[0].output)).size;
    assert.deepEqual(rangeProbe, { status: 206, range: `bytes 0-${Math.min(1023, probeSize - 1)}/${probeSize}`, size: Math.min(1024, probeSize) }, 'test hosting reproduces real partial media responses, not unconditional 200');
    assert.equal(await warm.page.evaluate(async url => !!(await caches.match(url)), probeUrl), false, 'partial responses never become full cached clips');
    assert.equal(await warm.page.evaluate(async urls => {
      let count = 0;
      for (const url of urls) if (await caches.match(url)) count++;
      return count;
    }, manifest.entries.filter(entry => entry.status === 'ready').map(clipUrl)), 0, 'metadata and a Range probe never warm versioned MP3s without a user play');
    evidence.push({ scenario: 'http-range-probe', ...rangeProbe });
    // Simulate an installed version with stale unversioned and previous-hash bytes.
    await warm.page.evaluate(async urls => {
      const cache = await caches.open('kb-asset-v1');
      for (const url of urls) {
        await cache.put(url, new Response('obsolete audio bytes', { headers: { 'Content-Type': 'audio/mpeg' } }));
        await cache.put(url + '?v=' + '0'.repeat(64), new Response('older version bytes', { headers: { 'Content-Type': 'audio/mpeg' } }));
      }
    }, clips.map(clip => base + '/labs/earthquake/' + clip.output));
    assert.ok(narrated.length > 0, 'current teaching source supplies the narration inventory');
    await warm.page.locator('#narration-open').click();
    assert.equal(await warm.page.evaluate(() => __nativeAudio.length), 0, 'opening the reading cards never autoplays');
    assert.equal(await warm.page.locator('[data-narration-id]').count(), narrated.length, 'every narrated item has an explicit reading control');
    let reachable = 0;
    for (const lang of ['zh', 'en']) {
      if (lang === 'en') {
        const beforeSwitch = await warm.page.evaluate(() => __nativeAudio.length);
        await warm.page.locator('#narration-language').click();
        await allStopped(warm.page, 'dialog language switch stops the playing line');
        assert.equal(await warm.page.evaluate(() => __nativeAudio.length), beforeSwitch, 'language switch never autoplays the new language');
      }
      for (let index = 0; index < narrated.length; index++) {
        const item = narrated[index];
        const selector = '[data-narration-id="' + item.id + '"]';
        const button = warm.page.locator(selector);
        assert.equal(await button.locator('.narration-text').textContent(), item[lang], 'reading button shows the exact current-language source text');
        assert.equal(await button.getAttribute('data-narration-lang'), lang);
        assert.equal(await button.isEnabled(), true);
        const played = await play(warm.page, lang, selector);
        const clip = manifest.entries.find(entry => entry.itemId === item.id && entry.lang === lang);
        assert.equal(played.src, clipUrl(clip), item.id + '/' + lang + ' plays its own verified MP3');
        reachable++;
        if (index < narrated.length - 1) {
          await warm.page.locator('#narration-stop').click();
          await allStopped(warm.page, 'explicit reading stop works for every item');
        }
      }
    }
    await warm.page.locator('#narration-close').click();
    await allStopped(warm.page, 'closing the reading cards stops the last line');
    assert.equal(reachable, narrated.length * 2, 'all current bilingual entries are reachable and actually decoded/played');
    for (const clip of manifest.entries.filter(entry => entry.status === 'ready')) {
      const expected = new URL(clipUrl(clip));
      const first = transportRequests.find(request => {
        const url = new URL(request.url, base);
        return url.pathname === expected.pathname && url.search === expected.search;
      });
      assert.ok(first, clip.id + ' has a recorded complete network transfer');
      assert.equal(first.range, null, clip.id + ' verifies a non-Range fetch before native playback');
      assert.equal(first.status, 200, clip.id + ' warms a full response, not 206');
    }
    evidence.push({ scenario: 'reading-cards', items: narrated.length, languages: 2, nativePlays: reachable });
    await warm.page.locator('#language').click();
    await warm.page.setViewportSize({ width: 390, height: 844 });
    await warm.page.locator('#narration-open').click();
    const dialog = await warm.page.locator('#narration-dialog').boundingBox();
    assert.ok(dialog && dialog.x >= 0 && dialog.y >= 0 && dialog.x + dialog.width <= 390 && dialog.y + dialog.height <= 844, 'reading dialog fits the phone viewport');
    assert.ok(await warm.page.evaluate(() => document.querySelector('#narration-dialog').scrollWidth <= document.querySelector('#narration-dialog').clientWidth + 1), 'reading cards have no horizontal overflow on a phone');
    if (process.env.EARTHQUAKE_SHOTS === '1') await warm.page.screenshot({ path: path.join(__dirname, '../.qa-labs/earthquake-reading-phone.png') });
    await warm.page.keyboard.press('Escape');
    assert.equal(await warm.page.locator('#narration-dialog').isVisible(), false, 'Escape closes the reading dialog');
    await warm.page.setViewportSize({ width: 1100, height: 760 });
    evidence.push({ scenario: 'online-zh', ...await play(warm.page, 'zh') });
    await warm.page.locator('#language').click();
    await allStopped(warm.page, 'language switch stops Chinese narration');
    evidence.push({ scenario: 'online-en', ...await play(warm.page, 'en') });
    await play(warm.page, 'en');
    assert.ok(await warm.page.evaluate(() => __nativeAudio.slice(0, -1).every(audio => audio.paused)), 'repeat click replaces the previous native player');
    await warm.page.locator('#controls-fault .time-tools summary').click();
    await warm.page.locator('#pause').click();
    await allStopped(warm.page, 'pause control stops narration');
    await play(warm.page, 'en');
    await warm.page.evaluate(() => window.dispatchEvent(new Event('blur')));
    await allStopped(warm.page, 'blur stops native playback');
    await play(warm.page, 'en');
    await warm.page.locator('#card-waves').click();
    await allStopped(warm.page, 'card change stops the old result narration');
    await play(warm.page, 'en');
    await warm.page.evaluate(() => {
      window.addEventListener('pagehide', () => {
        sessionStorage.setItem('earthquake-audio-left-stopped', String(__nativeAudio.every(audio => audio.paused)));
      }, { once: true });
    });
    await warm.page.goto(base + '/labs/earthquake/index.html');
    await warm.page.locator('#listen').waitFor({ state: 'visible' });
    assert.equal(await warm.page.evaluate(() => sessionStorage.getItem('earthquake-audio-left-stopped')), 'true', 'real navigation runs the pagehide handler and pauses every native player');
    // Verify entire cached MP3 bytes, not just an HTTP partial response or metadata.
    for (const clip of manifest.entries.filter(entry => entry.status === 'ready')) {
      const url = clipUrl(clip);
      await warm.page.waitForFunction(async url => !!(await caches.match(url)), url);
      const hash = await warm.page.evaluate(async url => {
        const response = await caches.match(url);
        if (response.status !== 200) return 'not-a-full-response';
        const digest = await crypto.subtle.digest('SHA-256', await response.arrayBuffer());
        return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
      }, url);
      assert.equal(hash, clip.fileSha256, 'warmed MP3 cache exactly matches the verified manifest');
      if (clips.some(original => original.id === clip.id)) {
        const staleBytes = await warm.page.evaluate(async url => (await caches.match(url)).text(), base + '/labs/earthquake/' + clip.output);
        assert.equal(staleBytes, 'obsolete audio bytes', 'new playback bypasses rather than reuses the old unversioned cache key');
      }
    }
    setNetworkAvailable(false);
    await warm.context.setOffline(true);
    await warm.page.goto(base + '/labs/earthquake/index.html');
    await warm.page.locator('#listen').waitFor({ state: 'visible' });
    const offlineResponses = [];
    warm.page.on('response', response => { if (new URL(response.url()).pathname.endsWith('.mp3')) offlineResponses.push({ status: response.status(), worker: response.fromServiceWorker() }); });
    evidence.push({ scenario: 'offline-warmed-zh', ...await play(warm.page, 'zh') });
    await warm.page.locator('#language').click();
    await allStopped(warm.page, 'offline language switch stops previous narration');
    evidence.push({ scenario: 'offline-warmed-en', ...await play(warm.page, 'en') });
    await warm.page.locator('#narration-open').click();
    let offlineReachable = 0;
    for (const lang of ['en', 'zh']) {
      if (lang === 'zh') {
        await warm.page.locator('#narration-language').click();
        await allStopped(warm.page, 'offline reading language switch stops the previous line');
      }
      for (const item of narrated) {
        const clip = manifest.entries.find(entry => entry.itemId === item.id && entry.lang === lang);
        const played = await play(warm.page, lang, '[data-narration-id="' + item.id + '"]');
        assert.equal(played.src, clipUrl(clip), item.id + '/' + lang + ' plays the exact complete cached clip offline');
        await warm.page.locator('#narration-stop').click();
        await allStopped(warm.page, 'offline stop works for every reading item');
        offlineReachable++;
      }
    }
    await warm.page.locator('#narration-close').click();
    assert.equal(offlineReachable, narrated.length * 2, 'every formal bilingual lab clip is natively playable with the server disconnected');
    evidence.push({ scenario: 'offline-all-reading-cards', nativePlays: offlineReachable });
    assert.ok(offlineResponses.length >= 2 && offlineResponses.every(response => response.worker && response.status === 200), 'offline native audio is served by the production Service Worker');
    console.log('Native online and warmed-offline playback passed: ' + JSON.stringify(evidence));

    setNetworkAvailable(true);
    const cold = await openContext();
    const cachedAudio = await cold.page.evaluate(async () => {
      const requests = (await Promise.all((await caches.keys()).map(async name => (await caches.open(name)).keys()))).flat();
      return requests.filter(request => request.url.includes('/labs/earthquake/audio/') && new URL(request.url).pathname.endsWith('.mp3')).length;
    });
    assert.equal(cachedAudio, 0, 'fresh context has no warmed lab MP3s');
    setNetworkAvailable(false);
    await cold.context.setOffline(true);
    await cold.page.reload();
    await cold.page.locator('#listen').waitFor({ state: 'visible' });
    await cold.page.locator('#listen').click();
    try {
      await cold.page.waitForFunction(() => document.querySelector('#audio-status').textContent.length > 0, null, { timeout: 10000 });
    } catch (error) {
      console.error('Unwarmed offline diagnostic: ' + JSON.stringify(await cold.page.evaluate(() => ({
        online: navigator.onLine, hint: document.querySelector('#audio-status').textContent,
        audio: __nativeAudio.map(a => ({ src: a.src, paused: a.paused, time: a.currentTime, readyState: a.readyState, networkState: a.networkState, error: a.error?.code }))
      }))));
      throw error;
    }
    await allStopped(cold.page, 'uncached offline media fails without an active player');
    assert.equal(await cold.page.evaluate(() => __nativeAudio.length), 0, 'an unavailable complete transfer never constructs a native player');
    assert.match(await cold.page.locator('#audio-status').textContent(), /录音暂时不可用/);
    assert.doesNotMatch(await cold.page.locator('#audio-status').textContent(), /待配音|尚未冻结/, 'a delivery/network error never masquerades as an unfinished teaching version');
    const zhFailure = await cold.page.locator('#audio-status').textContent();
    await cold.page.locator('#language').click();
    await cold.page.locator('#listen').press('Enter');
    await cold.page.waitForFunction(() => document.querySelector('#audio-status').textContent.includes('temporarily unavailable'));
    assert.equal(await cold.page.evaluate(() => __nativeAudio.length), 0, 'English keyboard play also rejects unwarmed offline bytes');
    const enFailure = await cold.page.locator('#audio-status').textContent();
    await cold.page.locator('#language').click();
    await cold.page.locator('#controls-fault .time-tools summary').click();
    await cold.page.locator('#step').click();
    assert.equal(await cold.page.evaluate(() => earthquakeLab.snapshot().model.tick), 1, 'model remains operable when uncached audio cannot play');
    evidence.push({ scenario: 'offline-unwarmed', hints: { zh: zhFailure, en: enFailure }, cachedAudio });
    setNetworkAvailable(true);
    await cold.context.setOffline(false);
    await cold.page.locator('#reset').click();
    await play(cold.page, 'zh');
    assert.equal(await cold.page.locator('#audio-status').textContent(), '', 'successful retry clears the old offline failure hint');
    console.log('Earthquake native audio evidence: ' + JSON.stringify(evidence));
  } finally {
    setNetworkAvailable(true);
    for (const context of contexts) await context.close();
  }
};

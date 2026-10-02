// Local candidate QA; no cache bypass is counted as installed-PWA upgrade proof.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const pw = require(process.env.PLAYWRIGHT_MODULE || '../.qa-deps/node_modules/playwright');
const nativeAudio = require('./qa_earthquake_book_native_audio.cjs');

const root = path.resolve(__dirname, '..');
let networkAvailable = true;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.webp': 'image/webp', '.png': 'image/png', '.mp3': 'audio/mpeg' };
const server = http.createServer((request, response) => {
  if (!networkAvailable) return request.socket.destroy();
  const pathname = decodeURIComponent(new URL(request.url, 'http://local').pathname);
  let file = path.resolve(root, '.' + pathname);
  if (file !== root && !file.startsWith(root + path.sep)) return response.writeHead(403).end();
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  response.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
  response.setHeader('Cache-Control', 'no-store');
  fs.readFile(file, (error, bytes) => error ? response.writeHead(404).end() : response.end(bytes));
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await pw.chromium.launch({ channel: 'chrome', headless: true });
    // An isolated Chrome profile can repeat the same complete gate against Pages.
    const base = (process.env.EARTHQUAKE_PUBLIC_BASE || ('http://127.0.0.1:' + server.address().port)).replace(/\/$/, '');
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await nativeAudio.observe(context);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '/books/earthquake/index.html?lang=zh#fault-lab');
    await page.waitForFunction(() => window.EarthquakeBook?.snapshot().fault);
    await page.waitForFunction(() => EarthquakeBook.snapshot().audioState === 'idle', null, { timeout: 15000 });
    await page.waitForFunction(() => document.querySelectorAll('.scene-art:not([hidden])').length === 4 &&
      [...document.querySelectorAll('.scene-art')].every(image => image.complete && image.naturalWidth > 0));
    assert.equal((await page.evaluate(() => EarthquakeBook.snapshot())).lang, 'zh');
    assert.equal(await page.locator('#fault-lab').count(), 1);
    assert.equal(await page.locator('#wave-lab').count(), 1);
    assert.equal(await page.locator('.scene-art:not([hidden])').count(), 4,
      'reviewed story art must load through the art manifest');

    await page.locator('#fault-lab details.tools summary').click();
    for (let i = 0; i < 70; i++) {
      const phase = await page.evaluate(() => EarthquakeBook.snapshot().fault.phase);
      if (phase === 'settled') break;
      await page.locator('#fault-step').click();
    }
    const settled = await page.evaluate(() => EarthquakeBook.snapshot().fault);
    assert.equal(settled.phase, 'settled');
    assert(settled.slipOffset > 0, 'slip leaves a permanent offset');
    const settledListen = page.locator('#fault-lab .result .listen');
    assert.equal(await settledListen.getAttribute('data-item-id'), 'fault-settled');
    assert.equal(await settledListen.isEnabled(), true);
    await settledListen.click();
    await page.waitForFunction(() => EarthquakeBook.snapshot().audioState === 'playing');
    assert.equal((await page.evaluate(() => EarthquakeBook.snapshot().fault)).phase, 'settled',
      'narrating the result must not reset the completed fault model');
    await page.locator('#stop').click();
    await page.locator('#fault-reset').click();
    await page.locator('#fault-drive').dispatchEvent('pointercancel', { pointerId: 1, button: 0 });
    const cancelled = await page.evaluate(() => EarthquakeBook.snapshot().fault);
    assert.equal(cancelled.driverActive, false);
    assert.equal(cancelled.paused, true);
    await page.locator('#language').click();
    assert.equal((await page.evaluate(() => EarthquakeBook.snapshot())).lang, 'en');
    const sceneListen = page.locator('.listen[data-kind="scene"][data-item-id="invitation"]');
    assert.equal(await sceneListen.isEnabled(), true, 'English scene narration must be available');
    await sceneListen.click();
    await page.waitForFunction(() => EarthquakeBook.snapshot().audioState === 'playing');
    await page.locator('#stop').click();
    await page.waitForFunction(() => EarthquakeBook.snapshot().audioState === 'stopped');
    const vocabListen = page.locator('.listen[data-kind="vocab"][data-item-id="fault"]');
    assert.equal(await vocabListen.isEnabled(), true, 'English vocabulary narration must be available');
    await vocabListen.click();
    await page.waitForFunction(() => EarthquakeBook.snapshot().audioState === 'ended', null, { timeout: 30000 });
    assert.equal(await page.locator('#exhibit-lab .cause-step').count(), 3);
    assert.equal((await page.evaluate(() => EarthquakeBook.snapshot().exhibit)).gated, false,
      'cause and effect can be read directly without a sorting-game gate');
    assert.equal(await page.locator('#exhibit-lab .cause-why summary').count(), 3);
    await page.locator('#exhibit-lab .cause-why summary').first().click();
    assert.equal(await page.locator('#exhibit-lab .cause-step .evidence-link').first().getAttribute('href'), '#fault-lab');
    const exhibitListen = page.locator('#exhibit-lab .result .listen');
    assert.equal(await exhibitListen.getAttribute('data-item-id'), 'exhibit-complete');
    await exhibitListen.click();
    await page.waitForFunction(() => EarthquakeBook.snapshot().audioState === 'playing');
    assert.equal(await exhibitListen.getAttribute('data-item-id'), 'exhibit-complete',
      'narrating the checked result must not turn it back into a hint');
    await page.locator('#stop').click();
    assert.match(await page.locator('#fault-lab .result').textContent(), /fault|marking|slip/i);
    assert.equal(await page.locator('#fault-lab .extension a').first().getAttribute('href'),
      '../../labs/earthquake/index.html?lang=en&from=earthquake-fault#elastic-rebound');
    assert.equal(await page.locator('#wave-lab .extension a').first().getAttribute('href'),
      '../../labs/earthquake/index.html?lang=en&from=earthquake-waves#waves');

    await page.locator('#wave-lab details.tools summary').click();
    for (const width of [320, 390, 820, 1024]) {
      await page.setViewportSize({ width, height: 844 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      assert(overflow <= 1, `book overflows ${width}px by ${overflow}px`);
      for (const id of ['fault-step', 'wave-step']) {
        const box = await page.locator('#' + id).boundingBox();
        assert(box && box.width >= 44 && box.height >= 44, `${id} hit area under 44px at ${width}`);
      }
      const smallListen = await page.locator('.listen:not([disabled])').evaluateAll(buttons => buttons
        .filter(button => button.getClientRects().length > 0)
        .filter(button => button.getBoundingClientRect().width < 44 || button.getBoundingClientRect().height < 44)
        .map(button => button.dataset.itemId));
      assert.deepEqual(smallListen, [], `narration hit area under 44px at ${width}`);
    }

    await page.setViewportSize({ width: 844, height: 390 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      'short landscape viewport must not overflow horizontally');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('#fault-step').click();
    assert((await page.evaluate(() => EarthquakeBook.snapshot().fault)).time > 0,
      'reduced-motion users retain a step-by-step model path');
    await page.emulateMedia({ reducedMotion: 'no-preference' });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('#fault-lab .extension a').first().click();
    await page.waitForURL(/\/labs\/earthquake\/index\.html\?lang=en&from=earthquake-fault#elastic-rebound$/);
    await page.waitForFunction(() => window.earthquakeLab?.snapshot().card === 'elastic-rebound');
    await page.locator('#card-waves').click();
    await page.locator('#language').click();
    await page.waitForFunction(() => document.querySelector('#back-book')?.getAttribute('href') === '../../books/earthquake/index.html?lang=zh#fault-lab');
    await page.locator('#back-book').click();
    await page.waitForURL(/\/books\/earthquake\/index\.html\?lang=zh#fault-lab$/);
    await page.waitForFunction(() => window.EarthquakeBook?.snapshot().lang === 'zh');

    await page.goto(base + '/books/earthquake/index.html?lang=en#wave-lab');
    await page.waitForFunction(() => window.EarthquakeBook?.snapshot().wave);
    await page.locator('#wave-lab .extension a').first().click();
    await page.waitForURL(/\/labs\/earthquake\/index\.html\?lang=en&from=earthquake-waves#waves$/);
    await page.waitForFunction(() => window.earthquakeLab?.snapshot().card === 'waves');
    await page.locator('#back-book').click();
    await page.waitForURL(/\/books\/earthquake\/index\.html\?lang=en#wave-lab$/);
    await page.waitForFunction(() => window.EarthquakeBook?.snapshot().lang === 'en');

    await page.goto(base + '/labs/earthquake/index.html?lang=xx&from=unknown&returnUrl=https%3A%2F%2Fevil.test%2F#wild-card');
    await page.waitForFunction(() => window.earthquakeLab?.snapshot().card === 'elastic-rebound');
    assert.equal((await page.evaluate(() => earthquakeLab.snapshot())).language, 'zh');
    await page.waitForFunction(() => document.querySelector('#back-book')?.getAttribute('href') === '../../books/earthquake/index.html?lang=zh');
    await page.locator('#back-book').click();
    await page.waitForURL(/\/books\/earthquake\/index\.html\?lang=zh$/);
    assert.notEqual(new URL(page.url()).host, 'evil.test');

    await page.goto(base + '/books/earthquake/index.html?lang=en#wave-lab');
    await page.waitForFunction(() => window.EarthquakeBook?.snapshot().lang === 'en');
    await nativeAudio.verify(page, base, false);
    if ((await page.evaluate(() => EarthquakeBook.snapshot().lang)) !== 'en') await page.locator('#language').click();
    await page.evaluate(async () => {
      for (const name of await caches.keys()) {
        if (!name.startsWith('kb-shell-')) continue;
        await (await caches.open(name)).delete(new URL('../../labs/earthquake/v3/app.js', location.href).href);
      }
    });

    networkAvailable = false;
    await context.setOffline(true);
    const before = page.url();
    await page.locator('#fault-lab .extension a').first().click();
    await page.waitForFunction(() => document.querySelector('#fault-lab .extension-status')?.textContent.includes('Connect to enter the lab'));
    assert.equal(page.url(), before, 'uncached lab must not navigate while offline');
    assert.match(await page.locator('#fault-lab .extension-status').textContent(), /Connect to enter the lab/);
    assert.equal(await page.locator('#fault-lab .extension a').nth(1).getAttribute('href'), '#after-fault');
    assert.deepEqual(errors, []);
    await context.close();
    networkAvailable = true;

    const installed = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await nativeAudio.observe(installed);
    const shelf = await installed.newPage();
    await shelf.goto(base + '/index.html');
    await shelf.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 90000 });
    await shelf.locator('#kbFab').click();
    await shelf.waitForFunction(() => document.querySelector('#obtn-earthquake')?.textContent === '下载', null, { timeout: 30000 });
    assert.doesNotMatch(await shelf.locator('#osize-earthquake').textContent(), /配音待交付/);
    await shelf.locator('#obtn-earthquake').click();
    await shelf.waitForFunction(() => document.querySelector('#obtn-earthquake')?.textContent === '删除', null, { timeout: 90000 });
    const cached = await shelf.evaluate(() => new Promise(resolve => {
      const channel = new MessageChannel();
      channel.port1.onmessage = event => { channel.port1.close(); resolve(event.data); };
      navigator.serviceWorker.controller.postMessage({ type: 'KB_STATUS' }, [channel.port2]);
    }));
    assert.equal(cached.books.earthquake.cached, cached.books.earthquake.total);
    const source = JSON.parse(fs.readFileSync(path.join(root, 'books/earthquake/story.json'), 'utf8'));
    const narratedCount = [...source.scenes, ...source.vocab, ...source.interactions]
      .filter(item => item.narrationNeeded).length * 2;
    assert.equal(narratedCount, 74, 'the frozen v2 story defines 74 bilingual clips');
    assert.equal(cached.books.earthquake.complete, true, 'all current ready narrations belong in the complete package');
    assert.equal(cached.books.earthquake.audioExpected, narratedCount);
    assert.equal(cached.books.earthquake.missingAudio, 0);
    networkAvailable = false;
    await installed.setOffline(true);
    const coldOfflineStatus = await shelf.evaluate(async () => {
      const url = new URL('books/earthquake/images/opening.webp', location.href);
      url.searchParams.set('qa-cold-offline', crypto.randomUUID());
      return (await fetch(url)).status;
    });
    assert.equal(coldOfflineStatus, 504, 'the real worker cannot fetch an uncached valid image while offline');
    await shelf.goto(base + '/books/earthquake/index.html?lang=en#fault-lab');
    await shelf.waitForFunction(() => document.querySelectorAll('.scene-art:not([hidden])').length === 4);
    await shelf.waitForFunction(() => EarthquakeBook.snapshot().audioState === 'idle');
    const offlineListen = shelf.locator('.listen[data-kind="scene"][data-item-id="invitation"]');
    assert.equal(await offlineListen.isEnabled(), true);
    await offlineListen.click();
    await shelf.waitForFunction(() => EarthquakeBook.snapshot().audioState === 'ended', null, { timeout: 45000 });
    await shelf.locator('#language').click();
    await shelf.waitForFunction(() => EarthquakeBook.snapshot().lang === 'zh');
    const offlineZhListen = shelf.locator('.listen[data-kind="vocab"][data-item-id="fault"]');
    await offlineZhListen.click();
    await shelf.waitForFunction(() => EarthquakeBook.snapshot().audioState === 'ended', null, { timeout: 30000 });
    await nativeAudio.verify(shelf, base, true);
    if ((await shelf.evaluate(() => EarthquakeBook.snapshot().lang)) !== 'zh') await shelf.locator('#language').click();
    assert.equal((await shelf.evaluate(() => KBOfflineLab.check('earthquake'))).ready, true,
      'current lab core shell should be offline-ready after full install');
    await shelf.evaluate(async version => {
      const cache = await caches.open('kb-shell-' + version);
      await cache.delete(new URL('../../labs/earthquake/v3/app.js', location.href).href);
    }, cached.version);
    assert.equal((await shelf.evaluate(() => KBOfflineLab.check('earthquake'))).ready, false,
      'removing one core asset must revoke lab readiness');
    const offlineBook = shelf.url();
    await shelf.locator('#fault-lab .extension a').first().click();
    await shelf.waitForFunction(() => document.querySelector('#fault-lab .extension-status')?.textContent.includes('联网后可进入实验室'));
    assert.equal(shelf.url(), offlineBook);
    console.log('EARTHQUAKE_BOOK_BROWSER_PASS routes/art/fault/cancel/lang/width/online-audio/offline-complete-audio');
    await installed.close();
  } finally {
    await browser?.close();
    server.closeAllConnections();
    server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

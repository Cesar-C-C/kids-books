const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '..');
assert.ok(fs.existsSync(path.join(root, 'labs/earthquake/index.html')), 'earthquake lab page exists');
let playwright;
try { playwright = require('playwright'); }
catch { playwright = require(process.env.PLAYWRIGHT_MODULE || '../.qa-deps/node_modules/playwright'); }
const { chromium } = playwright;

const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.mp3': 'audio/mpeg' };
let networkAvailable = true;
const server = http.createServer((req, res) => {
  if (!networkAvailable) return req.socket.destroy();
  let file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://local').pathname));
  if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'Content-Length': fs.statSync(file).size });
  fs.createReadStream(file).pipe(res);
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    if (process.env.EARTHQUAKE_AUDIO_ONLY === '1') {
      await require('./qa_earthquake_lab_audio_browser.cjs')(browser, `http://127.0.0.1:${server.address().port}`, available => { networkAvailable = available; });
      return;
    }
    const page = await browser.newPage({ viewport: { width: 1100, height: 760 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/labs/earthquake/`);
    await page.waitForFunction(() => window.earthquakeLab?.snapshot().card === 'elastic-rebound');
    if (process.env.EARTHQUAKE_PREVIEW === '1') await page.locator('#viewport').screenshot({ path: path.join(root, 'labs/earthquake/preview.png') });
    if (process.env.EARTHQUAKE_SHOTS === '1') {
      const output = path.join(root, '.qa-labs');
      fs.mkdirSync(output, { recursive: true });
      await page.screenshot({ path: path.join(output, 'earthquake-lab-desktop.png'), fullPage: true });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({ path: path.join(output, 'earthquake-lab-phone.png'), fullPage: true });
      await page.setViewportSize({ width: 1100, height: 760 });
    }
    let snapshot = await page.evaluate(() => earthquakeLab.snapshot());
    await page.locator('#listen').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#listen').count(), 1, 'verified formal narration is available');
    assert.equal(snapshot.language, 'zh');
    assert.equal(snapshot.model.slipOffset, 0);
    const samePhaseMutations = await page.evaluate(async () => {
      let changes = 0;
      const status = document.querySelector('#status');
      const observer = new MutationObserver(() => { changes++; });
      observer.observe(status, { childList: true, characterData: true, subtree: true });
      document.querySelector('#step').click();
      document.querySelector('#step').click();
      await Promise.resolve();
      observer.disconnect();
      return changes;
    });
    assert.ok(samePhaseMutations <= 1, 'status live region changes only when the phase changes, not on each locked tick');
    for (let i = 0; i < 1; i++) await page.locator('#step').click();
    snapshot = await page.evaluate(() => earthquakeLab.snapshot());
    assert.equal(snapshot.phase, 'locked');
    assert.ok(snapshot.model.elasticStrain > 0);
    assert.equal(snapshot.model.slipOffset, 0);
    await page.locator('#pause').click();
    const paused = await page.evaluate(() => earthquakeLab.snapshot().model.tick);
    await page.waitForTimeout(130);
    assert.equal(await page.evaluate(() => earthquakeLab.snapshot().model.tick), paused, 'pause freezes ticks');
    await page.locator('#step').click();
    assert.equal(await page.evaluate(() => earthquakeLab.snapshot().model.tick), paused + 1, 'single step advances one tick');
    for (let i = 0; i < 12; i++) await page.locator('#step').click();
    snapshot = await page.evaluate(() => earthquakeLab.snapshot());
    assert.ok(snapshot.model.slipOffset > 0, 'offset remains after driven slip');
    const modelBeforeView = snapshot.model;
    const beforeZoom = snapshot.view.distance;
    await page.locator('#zoom-in').click();
    assert.ok(await page.evaluate(() => earthquakeLab.snapshot().view.distance) < beforeZoom, 'zoom in changes only the camera');
    await page.locator('#zoom-out').click();
    assert.ok(await page.evaluate(() => earthquakeLab.snapshot().view.distance) >= beforeZoom - 0.01, 'zoom out restores the distance');
    await page.locator('#cutaway').click();
    await page.locator('#view-side').click();
    assert.deepEqual(await page.evaluate(() => earthquakeLab.snapshot().model), modelBeforeView, 'cutaway and view do not change physics');
    await page.locator('#card-waves').click();
    if (process.env.EARTHQUAKE_SHOTS === '1') await page.screenshot({ path: path.join(root, '.qa-labs/earthquake-lab-waves.png'), fullPage: true });
    assert.equal(await page.evaluate(() => earthquakeLab.snapshot().card), 'waves');
    await page.locator('#wave-step').click();
    assert.equal(await page.evaluate(() => earthquakeLab.snapshot().model.tick), 1);
    await page.locator('#wave-play').click();
    await page.waitForFunction(() => earthquakeLab.snapshot().model.tick >= 3);
    await page.locator('#wave-pause').click();
    const stoppedWave = await page.evaluate(() => earthquakeLab.snapshot().model);
    await page.waitForTimeout(240);
    assert.deepEqual(await page.evaluate(() => earthquakeLab.snapshot().model), stoppedWave, 'wave pause preserves tick, fronts and arrival state');
    assert.equal(await page.locator('#wave-pause').textContent(), '继续');
    await page.locator('#wave-pause').click();
    await page.waitForFunction(tick => earthquakeLab.snapshot().model.tick > tick, stoppedWave.tick);
    await page.locator('#wave-reset').click();
    await page.waitForTimeout(240);
    assert.equal(await page.evaluate(() => earthquakeLab.snapshot().model.tick), 0, 'reset cancels the resumed interval');
    assert.equal(await page.evaluate(() => earthquakeLab.snapshot().playing), false);
    assert.equal(await page.locator('#wave-pause').isDisabled(), true);
    await page.locator('#wave-step').click();
    await page.locator('#language').click();
    assert.equal(await page.evaluate(() => earthquakeLab.snapshot().language), 'en');
    assert.equal(await page.evaluate(() => earthquakeLab.snapshot().model.tick), 1, 'language change preserves model state');
    await page.locator('#card-fault-types').click();
    await page.locator('#type-normal').click();
    assert.equal(await page.evaluate(() => earthquakeLab.snapshot().view.type), 'normal');
    await page.locator('#card-focus-epicenter').click();
    if (process.env.EARTHQUAKE_SHOTS === '1') await page.screenshot({ path: path.join(root, '.qa-labs/earthquake-lab-focus.png'), fullPage: true });
    assert.equal(await page.evaluate(() => earthquakeLab.snapshot().cutaway), true, 'focus card opens the rock so the underground origin is inspectable');
    assert.equal(await page.locator('#surface-choices button').count(), 3, 'A/B/C are spatial choices on the model');
    assert.equal(await page.locator('#surface-choices').isVisible(), true);
    await page.waitForFunction(() => {
      const viewport = document.querySelector('#viewport').getBoundingClientRect();
      const boxes = ['left', 'correct', 'right'].map(id => document.querySelector('#surface-' + id).getBoundingClientRect());
      return boxes.every(box => box.left >= viewport.left && box.right <= viewport.right) && boxes[0].right < boxes[1].left && boxes[1].right < boxes[2].left;
    });
    const choiceBoxes = [];
    for (const id of ['left', 'correct', 'right']) {
      const box = await page.locator('#surface-' + id).boundingBox();
      const viewport = await page.locator('#viewport').boundingBox();
      assert.ok(box && box.x >= viewport.x && box.x + box.width <= viewport.x + viewport.width, id + ' is placed on the visible surface');
      choiceBoxes.push(box);
    }
    assert.ok(choiceBoxes[0].x + choiceBoxes[0].width < choiceBoxes[1].x && choiceBoxes[1].x + choiceBoxes[1].width < choiceBoxes[2].x, 'A/B/C remain visibly separated after changing from a side-view card');
    await page.locator('#guess-correct').click();
    assert.equal(await page.evaluate(() => earthquakeLab.snapshot().view.focusRevealed), true);
    const content = JSON.parse(fs.readFileSync(path.join(root, 'labs/earthquake/content.json'), 'utf8'));
    assert.ok(content.entries.length >= 20);
    for (const entry of content.entries) assert.ok(entry.id && entry.conceptId && entry.zh && entry.en && entry.contentVersion === content.contentVersion);
    assert.deepEqual(errors, [], 'no runtime exceptions');
    const fallbackPage = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    await fallbackPage.route('**/labs/shared/vendor/three.min.js', route => route.abort());
    await fallbackPage.goto(`http://127.0.0.1:${server.address().port}/labs/earthquake/`);
    await fallbackPage.waitForFunction(() => window.earthquakeLab?.snapshot().renderer === 'fallback');
    assert.equal(await fallbackPage.locator('.scene-corner').first().isVisible(), false, '3D-only corner labels do not overlap the SVG lesson');
    if (process.env.EARTHQUAKE_SHOTS === '1') await fallbackPage.screenshot({ path: path.join(root, '.qa-labs/earthquake-lab-fallback-phone.png'), fullPage: true });
    assert.equal(await fallbackPage.locator('#model-fallback svg').count(), 1, 'semantic SVG replaces failed WebGL');
    for (let i = 0; i < 3; i++) await fallbackPage.locator('#step').click();
    assert.equal(await fallbackPage.evaluate(() => earthquakeLab.snapshot().phase), 'locked');
    await fallbackPage.locator('#card-waves').click();
    assert.equal(await fallbackPage.evaluate(() => earthquakeLab.snapshot().cutaway), true);
    await fallbackPage.locator('#wave-step').click();
    assert.equal(await fallbackPage.evaluate(() => earthquakeLab.snapshot().model.tick), 1);
    const fallbackArrival = await fallbackPage.evaluate(() => {
      const arrival = earthquakeLab.snapshot().model.arrivalTicks.near.p;
      for (let i = 1; i < arrival; i++) document.querySelector('#wave-step').click();
      const circle = document.querySelector('#fallback-wave-p');
      const nearPath = document.querySelector('#fallback-flag-near path');
      const farPath = document.querySelector('#fallback-flag-far path');
      const x = path => Number(path.getAttribute('d').match(/^M([\d.]+)/)[1]);
      const distance = flagX => Math.hypot(flagX - Number(circle.getAttribute('cx')), 140 - Number(circle.getAttribute('cy')));
      return { radius: Number(circle.getAttribute('r')), nearDistance: distance(x(nearPath)), farDistance: distance(x(farPath)) };
    });
    assert.ok(fallbackArrival.radius >= fallbackArrival.nearDistance, 'SVG wavefront touches the near flag at its model arrival tick');
    assert.ok(fallbackArrival.radius < fallbackArrival.farDistance, 'far flag remains beyond this same wavefront');
    await fallbackPage.locator('.wave-advanced summary').click();
    await fallbackPage.locator('#wave-s').click();
    assert.equal(await fallbackPage.locator('#fallback-near-p').isVisible(), false, 'S-only view cannot show P arrival');
    assert.equal(await fallbackPage.locator('#fallback-near-s').isVisible(), false, 'S has not arrived at the P tick');
    await fallbackPage.locator('#wave-step').evaluate((button) => { for (let i = 0; i < 20; i++) button.click(); });
    assert.equal(await fallbackPage.locator('#fallback-near-s').isVisible(), true, 'S arrival appears only after its own tick');
    await fallbackPage.locator('#card-fault-types').click();
    await fallbackPage.locator('#type-strike-slip').click();
    assert.equal(await fallbackPage.locator('#fallback-hanging').getAttribute('transform'), 'translate(0 0)', 'strike-slip section does not open a false gap');
    assert.equal(await fallbackPage.locator('#fallback-strike-arrows').isVisible(), true, 'along-strike arrows explain out-of-plane motion');
    await fallbackPage.locator('#language').click();
    assert.match(await fallbackPage.locator('#fallback-note').textContent(), /3D is unavailable/, 'fallback note repaints in English');
    await fallbackPage.locator('#card-focus-epicenter').click();
    assert.equal(await fallbackPage.locator('#fallback-candidates').isVisible(), true, 'A/B/C locations appear in the cutaway');
    await fallbackPage.locator('#surface-correct').click();
    assert.equal(await fallbackPage.evaluate(() => earthquakeLab.snapshot().view.focusRevealed), true, 'model-space choice uses the same answer state');
    for (const width of [320, 390, 820, 1024]) {
      await fallbackPage.setViewportSize({ width, height: 720 });
      assert.ok(await fallbackPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${width}px has no horizontal overflow`);
    }
    await fallbackPage.close();
    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await mobile.goto(`http://127.0.0.1:${server.address().port}/labs/earthquake/`);
    await mobile.waitForFunction(() => window.earthquakeLab?.snapshot().renderer === 'webgl');
    for (const selector of ['#viewport', '#mobile-question', '#mobile-result', '#mobile-action']) {
      const box = await mobile.locator(selector).boundingBox();
      assert.ok(box && box.y >= 0 && box.y + box.height <= 844, selector + ' is in the first phone viewport');
    }
    assert.equal(await mobile.locator('#mobile-action').isVisible(), true, 'primary action remains with the model on a phone');
    const action = await mobile.locator('#mobile-action').boundingBox();
    await mobile.mouse.move(action.x + action.width / 2, action.y + action.height / 2);
    await mobile.mouse.down();
    await mobile.waitForTimeout(280);
    await mobile.mouse.up();
    const releasedTick = await mobile.evaluate(() => earthquakeLab.snapshot().model.tick);
    assert.ok(releasedTick >= 2, 'holding the model-side phone button drives multiple ticks');
    await mobile.waitForTimeout(250);
    assert.equal(await mobile.evaluate(() => earthquakeLab.snapshot().model.tick), releasedTick, 'pointer release stops driving');
    await mobile.locator('#step').click();
    await mobile.locator('#replay').click();
    await mobile.locator('#card-waves').click();
    assert.equal(await mobile.evaluate(() => earthquakeLab.snapshot().playing), false, 'card change cancels replay');
    await mobile.locator('#wave-play').click();
    await mobile.evaluate(() => window.dispatchEvent(new Event('blur')));
    assert.equal(await mobile.evaluate(() => earthquakeLab.snapshot().playing), false, 'blur stops wave playback');
    await mobile.locator('#wave-play').click();
    await mobile.evaluate(() => window.dispatchEvent(new Event('pagehide')));
    assert.equal(await mobile.evaluate(() => earthquakeLab.snapshot().playing), false, 'pagehide stops playback');
    await mobile.setViewportSize({ width: 700, height: 390 });
    assert.ok(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'short landscape viewport has no horizontal overflow');
    await mobile.close();
    const sourced = await browser.newPage();
    await sourced.goto(`http://127.0.0.1:${server.address().port}/labs/earthquake/?lang=zh&from=earthquake-waves#waves`);
    await sourced.waitForFunction(() => window.earthquakeLab?.snapshot().renderer === 'webgl');
    assert.equal(await sourced.evaluate(() => earthquakeLab.snapshot().card), 'waves');
    assert.equal(await sourced.evaluate(() => earthquakeLab.snapshot().source), 'earthquake-waves');
    await sourced.locator('#card-fault-types').click();
    await sourced.locator('#language').click();
    assert.ok((await sourced.locator('#back-book').getAttribute('href')).endsWith('?lang=en#wave-lab'), 'return uses fixed source and current language');
    await sourced.close();
    const invalid = await browser.newPage();
    await invalid.goto(`http://127.0.0.1:${server.address().port}/labs/earthquake/?lang=bad&from=https://bad.example&returnUrl=https://bad.example#bad-card`);
    await invalid.waitForFunction(() => window.earthquakeLab?.snapshot().renderer === 'webgl');
    assert.equal(await invalid.evaluate(() => earthquakeLab.snapshot().card), 'elastic-rebound');
    assert.equal(await invalid.evaluate(() => earthquakeLab.snapshot().source), null);
    assert.equal(await invalid.locator('#back-book').getAttribute('href'), '../../books/earthquake/index.html?lang=zh');
    await invalid.close();
    const contentRaw = fs.readFileSync(path.join(root, 'labs/earthquake/content.json'), 'utf8');
    const sourceData = JSON.parse(contentRaw);
    const narrated = sourceData.entries.find(entry => entry.id === 'result-initial');
    const sha = value => createHash('sha256').update(value.normalize('NFC').replace(/\r\n/g, '\n')).digest('hex');
    const audioId = 'result-result-initial-zh';
    const audioText = narrated.zh;
    const segments = [{ role: 'narrator', sourceText: audioText, spokenText: audioText }];
    const audioEntry = { id: audioId, key: `lab:${audioId}`, owner: 'lab', itemId: 'result-initial', kind: 'result', lang: 'zh', text: audioText, segments, contentVersion: sourceData.contentVersion, textSha256: sha(audioText), utteranceSha256: sha(JSON.stringify({ kind: 'result', id: 'result-initial', lang: 'zh', text: audioText, segments })), output: `audio/${audioId}.mp3`, status: 'ready', fileSha256: 'a'.repeat(64) };
    const manifest = { schemaVersion: 2, topicId: 'earthquake', owner: 'lab', contentVersion: sourceData.contentVersion, sourceSha256: sha(contentRaw), entries: [audioEntry] };
    const audioPage = await browser.newPage();
    await audioPage.addInitScript(() => {
      window.__audioLog = [];
      window.Audio = class {
        constructor(src) { this.src = src; window.__audioLog.push({ event: 'new', src }); }
        play() { window.__audioLog.push({ event: 'play', src: this.src }); return Promise.resolve(); }
        pause() { window.__audioLog.push({ event: 'pause', src: this.src }); }
      };
    });
    await audioPage.route('**/labs/earthquake/audio-manifest.json', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(manifest) }));
    await audioPage.goto(`http://127.0.0.1:${server.address().port}/labs/earthquake/`);
    await audioPage.locator('#listen').waitFor({ state: 'visible' });
    await audioPage.locator('#listen').click();
    assert.equal(await audioPage.evaluate(() => __audioLog.filter(item => item.event === 'play').length), 1, 'verified narration plays only on click');
    await audioPage.locator('#language').click();
    assert.equal(await audioPage.locator('#listen').isHidden(), true, 'partial manifest does not advertise English');
    assert.ok(await audioPage.evaluate(() => __audioLog.some(item => item.event === 'pause')), 'language change stops prior clip');
    await audioPage.close();
    for (const blocked of ['model.js', 'content.json']) {
      const failed = await browser.newPage();
      await failed.route(`**/labs/earthquake/${blocked === 'model.js' ? 'v3/' : ''}${blocked}`, route => route.abort());
      await failed.goto(`http://127.0.0.1:${server.address().port}/labs/earthquake/`);
      await failed.locator('#scene-error').waitFor({ state: 'visible' });
      assert.ok(await failed.locator('#scene-error a[href*="books/earthquake/index.html"]').isVisible(), `${blocked}: fixed book link remains`);
      await failed.close();
    }
    await require('./qa_earthquake_lab_audio_browser.cjs')(browser, `http://127.0.0.1:${server.address().port}`, available => { networkAvailable = available; });
    console.log('Earthquake lab browser: four cards, step/pause, view invariance, bilingual state, real online/offline audio PASS');
  } finally {
    await browser.close();
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

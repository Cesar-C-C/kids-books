const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const http = require('http');
const assert = require('assert/strict');

const root = __dirname;
const output = path.join(root, '.qa-labs');
fs.mkdirSync(output, { recursive: true });
const capture = process.env.STATION_TOUR_SHOTS === '1';
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  let file;
  try { file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname)); }
  catch { res.writeHead(400); return res.end(); }
  if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1360, height: 900 }, reducedMotion: 'reduce' });
    const errors = [], failures = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`); });
    await page.goto(`http://127.0.0.1:${server.address().port}/labs/station/`);
    await page.waitForFunction(() => window.stationLab?.snapshot().renderer.calls > 0);
    assert.equal(await page.locator('#load-error').isVisible(), false);
    const settle = () => page.waitForFunction(() => {
      const state = stationLab.snapshot(), stop = StationTour.stops[state.tourIndex];
      if (!stop) return false;
      const pose = StationTour.pose(stop), target = state.camera.target;
      return Math.abs(state.camera.distance - pose.distance) < .02 &&
        Math.abs(state.camera.yaw - pose.yaw) < .02 &&
        Math.abs(state.camera.pitch - pose.pitch) < .02 &&
        Math.hypot(target[0] - stop.look[0], target[1] - stop.look[1], target[2] - stop.look[2]) < .02;
    });

    await page.locator('#tour-start').click();
    await page.waitForFunction(() => stationLab.snapshot().tourIndex === 0);
    await settle();
    let state = await page.evaluate(() => stationLab.snapshot());
    assert.equal(state.detail, 'interior.racks');
    assert.equal(state.selected, 'interior');
    assert.equal(state.opening, 'station-cabin');
    assert.equal(state.mode, 'inside');
    assert.ok(state.camera.distance < 1.2, 'first stop is a close cabin view');
    assert.equal(await page.locator('#tour-controls').isVisible(), true);
    assert.equal(await page.locator('#tour-prev').isDisabled(), true);
    if (capture) {
      await page.screenshot({ path: path.join(output, 'station-tour-desktop.png') });
      await page.locator('#viewport').screenshot({ path: path.join(output, 'station-tour-stop-01.png') });
    }
    await page.locator('#language').click();
    assert.ok(!/[\u3400-\u9fff]/u.test(await page.locator('#tour-progress').textContent()), 'English mode has an English route label');
    assert.ok(!/[\u3400-\u9fff]/u.test(await page.locator('#part-tip').textContent()), 'English mode has an English observation cue');
    await page.locator('#language').click();
    const beforeZoom = state.camera.distance;
    await page.locator('#zoom-in').click();
    await page.waitForFunction(distance => stationLab.snapshot().camera.distance < distance - .05, beforeZoom, { timeout: 5000 });
    assert.ok(await page.evaluate(() => stationLab.snapshot().camera.distance) < beforeZoom, 'zoom in works from inside the cabin');

    await page.locator('#tour-next').click();
    await settle();
    if (capture) await page.locator('#viewport').screenshot({ path: path.join(output, 'station-tour-stop-02.png') });
    state = await page.evaluate(() => stationLab.snapshot());
    assert.equal(state.detail, 'interior.sleep');
    assert.equal(state.tourIndex, 1);
    await page.locator('#tour-prev').click();
    await settle();
    assert.equal(await page.evaluate(() => stationLab.snapshot().detail), 'interior.racks');
    for (let i = 0; i < 5; i++) {
      await page.locator('#tour-next').click(); await settle();
      if (capture && i > 0) await page.locator('#viewport').screenshot({ path: path.join(output, `station-tour-stop-0${i + 2}.png`) });
    }
    state = await page.evaluate(() => stationLab.snapshot());
    assert.equal(state.detail, 'interior.crystals');
    assert.equal(state.tourIndex, 5);
    assert.equal(await page.locator('#tour-next').isDisabled(), true);

    await page.setViewportSize({ width: 390, height: 844 });
    await settle();
    if (capture) await page.screenshot({ path: path.join(output, 'station-tour-mobile.png'), fullPage: true });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'phone has no horizontal overflow');
    const controls = await page.locator('#tour-controls').boundingBox();
    const viewport = await page.locator('#viewport').boundingBox();
    assert.ok(controls.x >= viewport.x && controls.x + controls.width <= viewport.x + viewport.width, 'tour controls fit phone stage');
    assert.equal(await page.locator('#tour-cue').isVisible(), true, 'phone keeps the observation cue beside the model');
    assert.ok((await page.locator('#tour-cue').textContent()).length > 8, 'phone route retains a useful cue');

    await page.locator('#back-view').click();
    state = await page.evaluate(() => stationLab.snapshot());
    assert.equal(state.tourIndex, 4, 'Back follows the guided route');
    assert.equal(state.detail, 'interior.plants', 'Back keeps the lesson aligned with the view');
    await page.locator('#tour-next').click();

    await page.locator('#tour-exit').click();
    state = await page.evaluate(() => stationLab.snapshot());
    assert.equal(state.tourIndex, -1);
    assert.equal(state.selected, null);
    assert.equal(await page.locator('#tour-controls').isVisible(), false);
    assert.equal(await page.locator('#tour-start').isVisible(), true);
    await page.locator('#tour-start').click();
    await page.locator('#back-view').click();
    assert.equal(await page.evaluate(() => stationLab.snapshot().tourIndex), -1, 'Back from the first stop exits the route');
    assert.equal(await page.evaluate(() => stationLab.snapshot().selected), null, 'Back from the first stop returns to the whole station');
    await page.locator('#tour-start').click();
    await page.locator('[data-part="solar"]').evaluate(button => button.click());
    assert.equal(await page.evaluate(() => stationLab.snapshot().tourIndex), -1, 'choosing another area leaves the route');
    assert.deepEqual(errors, [], 'no page errors');
    assert.deepEqual(failures, [], 'no failed requests');
    console.log('PASS station tour browser: inside route, six stops, exit, area switch, desktop and phone');
  } finally {
    await browser.close();
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

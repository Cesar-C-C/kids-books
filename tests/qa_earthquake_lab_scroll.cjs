// Real native gestures: page scrolling must remain independent of model orbiting.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
let playwright;
try { playwright = require('playwright'); }
catch { playwright = require(process.env.PLAYWRIGHT_MODULE || '../.qa-deps/node_modules/playwright'); }
const { chromium } = playwright;
const root = path.resolve(__dirname, '..');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  let file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://local').pathname));
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) return res.writeHead(404).end();
  res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
const failures = [];
const expect = (value, message) => { if (!value) failures.push(message); };
async function swipe(page, session, from, to) {
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [from] });
  for (let step = 1; step <= 12; step++) {
    const point = { x: from.x + (to.x - from.x) * step / 12, y: from.y + (to.y - from.y) * step / 12 };
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point] });
    await page.waitForTimeout(20);
  }
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(280);
}
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const url = `http://127.0.0.1:${server.address().port}/labs/earthquake/index.html`;
    for (const width of [820, 1100]) {
      const context = await browser.newContext({ viewport: { width, height: 720 }, serviceWorkers: 'block' });
      const page = await context.newPage();
      await page.goto(url);
      await page.waitForFunction(() => window.earthquakeLab?.snapshot().renderer === 'webgl');
      await page.mouse.move(width / 2, 400);
      await page.mouse.wheel(0, 420);
      await page.waitForTimeout(400);
      const metrics = await page.evaluate(() => ({ scrollY, overflow: getComputedStyle(document.body).overflow, height: document.documentElement.scrollHeight, window: innerHeight }));
      console.log('Wheel ' + width + 'px ' + JSON.stringify(metrics));
      expect(metrics.scrollY > 100, width + 'px wheel reaches content below the model');
      await page.mouse.wheel(0, -420);
      await page.waitForTimeout(400);
      expect(await page.evaluate(() => scrollY) < metrics.scrollY, width + 'px wheel scrolls back up');
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      const beforeMouse = await page.evaluate(() => earthquakeLab.snapshot().view);
      const canvas = await page.locator('#viewport canvas').boundingBox();
      const center = { x: canvas.x + canvas.width / 2, y: canvas.y + canvas.height / 2 };
      await page.mouse.move(center.x, center.y);
      await page.mouse.down();
      await page.mouse.move(center.x + 60, center.y + 40, { steps: 6 });
      await page.mouse.up();
      const afterMouse = await page.evaluate(() => earthquakeLab.snapshot().view);
      expect(Math.abs(afterMouse.yaw - beforeMouse.yaw) > 0.1 && Math.abs(afterMouse.pitch - beforeMouse.pitch) > 0.1, width + 'px mouse orbit keeps both axes');
      await context.close();
    }
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
    const page = await context.newPage();
    await page.goto(url);
    await page.waitForFunction(() => window.earthquakeLab?.snapshot().renderer === 'webgl');
    const session = await context.newCDPSession(page);
    const view = await page.evaluate(() => earthquakeLab.snapshot().view);
    await swipe(page, session, { x: 190, y: 520 }, { x: 190, y: 230 });
    let after = await page.evaluate(() => ({ scrollY, view: earthquakeLab.snapshot().view }));
    console.log('Vertical touch ' + JSON.stringify({ before: view, after }));
    expect(after.scrollY > 100, 'phone swipe over the canvas scrolls the page down');
    expect(Math.abs(after.view.yaw - view.yaw) < 1e-6 && Math.abs(after.view.pitch - view.pitch) < 1e-6, 'vertical page swipe never rotates the rock');
    await page.evaluate(() => window.scrollTo({ top: 200, behavior: 'instant' }));
    await swipe(page, session, { x: 190, y: 200 }, { x: 190, y: 430 });
    after = await page.evaluate(() => ({ scrollY, view: earthquakeLab.snapshot().view }));
    expect(after.scrollY < 200, 'phone swipe over the canvas scrolls the page back up');
    expect(Math.abs(after.view.yaw - view.yaw) < 1e-6 && Math.abs(after.view.pitch - view.pitch) < 1e-6, 'reverse vertical swipe keeps the camera stable');
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await swipe(page, session, { x: 190, y: 520 }, { x: 215, y: 230 });
    after = await page.evaluate(() => ({ scrollY, view: earthquakeLab.snapshot().view }));
    expect(after.scrollY > 100, 'mostly vertical diagonal swipe scrolls down');
    expect(Math.abs(after.view.yaw - view.yaw) < 1e-6 && Math.abs(after.view.pitch - view.pitch) < 1e-6, 'mostly vertical swipe keeps the camera stable');
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await swipe(page, session, { x: 100, y: 430 }, { x: 250, y: 430 });
    expect(Math.abs((await page.evaluate(() => earthquakeLab.snapshot().view.yaw)) - view.yaw) > 0.1, 'horizontal touch still rotates the rock');
    await page.locator('#narration-open').click();
    await swipe(page, session, { x: 190, y: 600 }, { x: 190, y: 260 });
    const dialogScroll = await page.locator('#narration-dialog').evaluate(dialog => dialog.scrollTop);
    expect(dialogScroll > 100, 'reading dialog scrolls down with native touch');
    await swipe(page, session, { x: 190, y: 260 }, { x: 190, y: 600 });
    expect(await page.locator('#narration-dialog').evaluate(dialog => dialog.scrollTop) < dialogScroll, 'reading dialog scrolls back up');
    await context.close();
    assert.deepEqual(failures, [], 'native scrolling regressions');
    console.log('Earthquake native scrolling: wheel, vertical pan, horizontal orbit, reading dialog PASS');
  } finally {
    await browser.close();
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

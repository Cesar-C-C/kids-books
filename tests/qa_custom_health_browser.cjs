const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function contentType(filePath) {
  return ({
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.mp3': 'audio/mpeg',
    '.webp': 'image/webp',
    '.webmanifest': 'application/manifest+json'
  })[path.extname(filePath)] || 'application/octet-stream';
}

function startServer() {
  const server = http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    let filePath = path.resolve(root, pathname.replace(/^\/+/, ''));
    if (!filePath.startsWith(root + path.sep) && filePath !== root) {
      response.writeHead(403).end();
      return;
    }
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) filePath = path.join(filePath, 'index.html');
    if (!fs.existsSync(filePath)) {
      response.writeHead(404).end();
      return;
    }
    response.setHeader('Content-Type', contentType(filePath));
    fs.createReadStream(filePath).pipe(response);
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

async function waitForImages(page, selector) {
  await page.locator(selector).first().waitFor();
  await page.locator(selector).evaluateAll(images => images.forEach(image => { image.loading = 'eager'; }));
  await page.waitForFunction(sel => {
    const images = [...document.querySelectorAll(sel)];
    return images.length > 0 && images.every(image => image.complete && image.naturalWidth > 0);
  }, selector);
}

async function assertViewport(page, url, viewport, readySelector) {
  await page.setViewportSize(viewport);
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.locator(readySelector).first().waitFor();
  const overflow = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth
  }));
  assert.ok(overflow.width <= overflow.client + 1,
    `${viewport.width}x${viewport.height} has no horizontal overflow (${overflow.width} > ${overflow.client})`);
}

async function verifyMyopia(page, base) {
  const url = `${base}/books/myopia/index.html`;
  await assertViewport(page, url, { width: 390, height: 844 }, '.scene-card');
  assert.equal(await page.locator('.scene-card').count(), 14, 'all 14 story scenes render');
  assert.ok(await page.locator('.scene-caption').evaluateAll(captions => captions.every(caption => caption.textContent.trim().length > 0)),
    'every myopia illustration has a visible scene label');
  assert.deepEqual(await page.locator('.scene-card').evaluateAll(cards =>
    cards.map(card => Number(card.dataset.pageIndex)).sort((a, b) => a - b)), [...Array(14).keys()]);
  await waitForImages(page, '.scene-card img');
  assert.equal(await page.locator('.scene-11 .scene-visual > #focus-model').count(), 1,
    'the focus model belongs to the illustrated whiteboard instead of a separate card');
  assert.ok(await page.locator('#corrective-lens').evaluate(button => button.getBoundingClientRect().height >= 44),
    'the whiteboard model keeps a touch-sized correction control on mobile');
  assert.equal(await page.locator('.scene-11 .whiteboard-display').count(), 1,
    'the eye diagram has a dedicated layer for the illustrated whiteboard');
  const mobileWhiteboardPlacement = await page.evaluate(() => {
    const image = document.querySelector('.scene-11 .scene-image').getBoundingClientRect();
    const display = document.querySelector('.scene-11 .whiteboard-display').getBoundingClientRect();
    return {
      left: (display.left - image.left) / image.width,
      top: (display.top - image.top) / image.height,
      right: (display.right - image.left) / image.width,
      bottom: (display.bottom - image.top) / image.height
    };
  });
  assert.ok(mobileWhiteboardPlacement.left >= 0.13 && mobileWhiteboardPlacement.left <= 0.24,
    `mobile diagram starts on the whiteboard, got left=${mobileWhiteboardPlacement.left}`);
  assert.ok(mobileWhiteboardPlacement.top >= 0.10 && mobileWhiteboardPlacement.top <= 0.23,
    `mobile diagram starts on the whiteboard, got top=${mobileWhiteboardPlacement.top}`);
  assert.ok(mobileWhiteboardPlacement.right >= 0.69 && mobileWhiteboardPlacement.right <= 0.82,
    `mobile diagram ends inside the whiteboard, got right=${mobileWhiteboardPlacement.right}`);
  assert.ok(mobileWhiteboardPlacement.bottom >= 0.61 && mobileWhiteboardPlacement.bottom <= 0.78,
    `mobile diagram ends inside the whiteboard, got bottom=${mobileWhiteboardPlacement.bottom}`);
  if (process.env.CUSTOM_HEALTH_VISUAL_DIR) {
    await page.locator('#focus-lab').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(process.env.CUSTOM_HEALTH_VISUAL_DIR, 'myopia-focus-mobile.png') });
  }

  assert.equal(await page.locator('body').getAttribute('data-language'), 'zh');
  await page.locator('#language').click();
  assert.equal(await page.locator('body').getAttribute('data-language'), 'en');
  assert.equal(await page.locator('html').getAttribute('lang'), 'en');

  const range = page.locator('#eye-growth');
  await range.evaluate(input => {
    input.value = '1';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await assertText(page.locator('#focus-status'), /front of the retina/);
  await page.locator('#corrective-lens').click();
  await assertText(page.locator('#focus-status'), /on the retina/);
  assert.equal(await page.locator('#corrective-lens').getAttribute('aria-pressed'), 'true');

  await assertViewport(page, url, { width: 1280, height: 800 }, '.scene-card');
  const whiteboardPlacement = await page.evaluate(() => {
    const image = document.querySelector('.scene-11 .scene-image').getBoundingClientRect();
    const model = document.querySelector('.scene-11 .whiteboard-display').getBoundingClientRect();
    return {
      left: (model.left - image.left) / image.width,
      top: (model.top - image.top) / image.height,
      right: (model.right - image.left) / image.width,
      bottom: (model.bottom - image.top) / image.height
    };
  });
  assert.ok(whiteboardPlacement.left >= 0.13 && whiteboardPlacement.left <= 0.24,
    `model starts on the whiteboard, got left=${whiteboardPlacement.left}`);
  assert.ok(whiteboardPlacement.top >= 0.10 && whiteboardPlacement.top <= 0.23,
    `model starts on the whiteboard, got top=${whiteboardPlacement.top}`);
  assert.ok(whiteboardPlacement.right >= 0.69 && whiteboardPlacement.right <= 0.82,
    `model ends inside the whiteboard, got right=${whiteboardPlacement.right}`);
  assert.ok(whiteboardPlacement.bottom >= 0.61 && whiteboardPlacement.bottom <= 0.76,
    `model ends inside the whiteboard, got bottom=${whiteboardPlacement.bottom}`);
  for (const width of [390, 820, 1024, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    const layers = await page.evaluate(() => {
      const stage = document.querySelector('.whiteboard-stage');
      const image = stage.querySelector('.scene-image').getBoundingClientRect();
      const diagram = stage.querySelector('.focus-diagram').getBoundingClientRect();
      const title = stage.querySelector('.lab-title').getBoundingClientRect();
      const controls = document.querySelector('.lab-controls').getBoundingClientRect();
      return {
        contentLeft: (Math.min(diagram.left, title.left) - image.left) / image.width,
        contentTop: (title.top - image.top) / image.height,
        contentRight: (Math.max(diagram.right, title.right) - image.left) / image.width,
        contentBottom: (diagram.bottom - image.top) / image.height,
        controlsBelow: controls.top >= image.bottom,
        foregroundAbove: +getComputedStyle(stage.querySelector('.whiteboard-foreground')).zIndex > +getComputedStyle(stage.querySelector('.whiteboard-display')).zIndex
      };
    });
    assert.ok(layers.contentLeft >= 360 / 1216 && layers.contentRight <= 908 / 1216,
      `${width}px: instructional content stays between the characters' hands`);
    assert.ok(layers.contentTop >= 174 / 832 && layers.contentBottom <= 616 / 832,
      `${width}px: title and diagram stay inside the physical board`);
    assert.ok(layers.controlsBelow && layers.foregroundAbove,
      `${width}px: controls below art and characters above board ink`);
  }
  if (process.env.CUSTOM_HEALTH_VISUAL_DIR) {
    await page.locator('.whiteboard-stage').screenshot({ path: path.join(process.env.CUSTOM_HEALTH_VISUAL_DIR, 'myopia-layered-board.png'), style: '.journey-bar, .chapter-rail { visibility: hidden !important; }' });
    await waitForImages(page, '.scene-card img');
    await page.screenshot({ path: path.join(process.env.CUSTOM_HEALTH_VISUAL_DIR, 'myopia-desktop.png'), fullPage: true });
    await page.locator('#focus-lab').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(process.env.CUSTOM_HEALTH_VISUAL_DIR, 'myopia-focus-lab.png') });
  }
}

async function assertText(locator, pattern) {
  assert.match(await locator.textContent(), pattern);
}

async function verifyCavities(page, base) {
  const url = `${base}/books/cavities/index.html`;
  await assertViewport(page, url, { width: 390, height: 844 }, '.story-card');
  assert.equal(await page.locator('.story-card').count(), 7, 'bedtime and action scenes render as story cards');
  assert.equal(await page.locator('.timeline-step').count(), 7, 'the investigation exposes seven decay stages');
  assert.ok(await page.locator('.timeline-step').evaluateAll(buttons => buttons.every(button => button.textContent.trim().length > 1)),
    'every decay stage has a meaningful label as well as its number');
  assert.deepEqual(await page.locator('[data-page-index]').evaluateAll(nodes =>
    [...new Set(nodes.map(node => Number(node.dataset.pageIndex)))].sort((a, b) => a - b)), [...Array(14).keys()]);
  await waitForImages(page, '.story-card img');
  await page.locator('.timeline-step').nth(3).click();
  assert.equal(await page.locator('.timeline-step').nth(3).getAttribute('aria-pressed'), 'true');
  await page.waitForFunction(() => {
    const image = document.querySelector('#city-image');
    return image && image.complete && image.naturalWidth > 0;
  });
  assert.ok(await page.locator('#city-image').evaluate(image => image.complete && image.naturalWidth > 0));

  const zones = page.locator('.brush-zone-button');
  assert.equal(await zones.count(), 3);
  for (let index = 0; index < 3; index += 1) await zones.nth(index).click();
  await assertText(page.locator('#brush-status'), /Every surface is brushed/);
  assert.deepEqual(await zones.evaluateAll(buttons => buttons.map(button => button.getAttribute('aria-pressed'))),
    ['true', 'true', 'true']);

  await page.locator('#timer-controls [data-action="start"]').click();
  await assertText(page.locator('#timer-status'), /Timer running/);
  await page.locator('#timer-controls [data-action="pause"]').click();
  await assertText(page.locator('#timer-status'), /Timer paused/);
  await page.locator('#timer-controls [data-action="resume"]').click();
  await assertText(page.locator('#timer-status'), /Timer running/);
  await page.locator('#timer-controls [data-action="reset"]').click();
  assert.equal(await page.locator('#brush-countdown').textContent(), '2:00');

  await page.locator('#language').click();
  assert.equal(await page.locator('body').getAttribute('data-language'), 'en');
  await assertViewport(page, url, { width: 1280, height: 800 }, '.story-card');
  if (process.env.CUSTOM_HEALTH_VISUAL_DIR) {
    await waitForImages(page, '.story-card img');
    await page.screenshot({ path: path.join(process.env.CUSTOM_HEALTH_VISUAL_DIR, 'cavities-desktop.png'), fullPage: true });
    await page.locator('#tooth-city').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(process.env.CUSTOM_HEALTH_VISUAL_DIR, 'cavities-tooth-city.png') });
    await page.locator('#brushing-route').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(process.env.CUSTOM_HEALTH_VISUAL_DIR, 'cavities-brushing-route.png') });
  }
}

(async () => {
  let playwright;
  try { playwright = require('playwright'); }
  catch { playwright = require('../.qa-deps/node_modules/playwright'); }
  const server = await startServer();
  const browser = await playwright.chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', error => consoleErrors.push(error.message));
  const base = (process.env.HEALTH_QA_BASE_URL || `http://127.0.0.1:${server.address().port}`).replace(/\/$/, '');
  try {
    if (process.env.CUSTOM_HEALTH_VISUAL_DIR) fs.mkdirSync(process.env.CUSTOM_HEALTH_VISUAL_DIR, { recursive: true });
    await verifyMyopia(page, base);
    await verifyCavities(page, base);
    assert.deepEqual(consoleErrors, [], `clean browser console: ${consoleErrors.join(' | ')}`);
    console.log('PASS custom health browser: both bespoke structures, all 14 pages, decoded art, bilingual switching, interactions, and responsive overflow');
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

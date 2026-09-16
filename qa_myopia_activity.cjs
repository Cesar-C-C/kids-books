const assert = require('node:assert/strict');
const { execFileSync, spawn } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const vm = require('node:vm');

const root = __dirname;
const api = require('./books/myopia/myopia.js');

assert.deepEqual(api.calculateFocusModel({ eyeGrowth: 0, lensCorrection: 0 }), {
  retinaX: 82,
  focusX: 82,
  isFocused: true
});
assert.equal(api.calculateFocusModel({ eyeGrowth: 1, lensCorrection: 0 }).isFocused, false);
assert.equal(api.calculateFocusModel({ eyeGrowth: 1, lensCorrection: 1 }).isFocused, true);
assert.equal(api.calculateFocusModel({ eyeGrowth: -3, lensCorrection: 9 }).retinaX, 82);

const dataContext = vm.createContext({ window: {}, Reader: { init() {} }, console });
vm.runInContext(fs.readFileSync(path.join(root, 'books/myopia/book.js'), 'utf8'), dataContext, {
  filename: 'books/myopia/book.js'
});

function findBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ].filter(Boolean);
  return candidates.find(candidate => fs.existsSync(candidate));
}

const browser = findBrowser();
assert.ok(browser, 'Chrome or Edge is available for DOM behavior checks');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qa-myopia-'));
try {
  const pagesMarkup = dataContext.window.PAGES.map((_, index) =>
    `<div class="page" data-page="${index}"><div class="art"></div><div class="text"></div></div>`
  ).join('');
  const scriptUrl = pathToFileURL(path.join(root, 'books/myopia/myopia.js')).href;
  const styleUrl = pathToFileURL(path.join(root, 'books/myopia/myopia.css')).href;
  const htmlPath = path.join(tempDir, 'fixture.html');
  const html = `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${styleUrl}"></head>
<body><main id="pages">${pagesMarkup}</main><pre id="result"></pre>
<script>window.PAGES=${JSON.stringify(dataContext.window.PAGES)};</script>
<script src="${scriptUrl}"></script>
<script>
  const checks = [];
  const check = (condition, message) => checks.push({ ok: Boolean(condition), message });
  const pages = document.querySelectorAll('#pages .page');
  MyopiaActivity.mountAll(document, window.PAGES);
  MyopiaActivity.mountAll(document, window.PAGES);

  check(pages[1].querySelectorAll('.myopia-kite-clue').length === 1, 'blurred kite number mounts once');
  check(pages[1].querySelector('.myopia-kite-number').textContent === '8', 'kite number stays editable text');
  check(pages[1].querySelector('.myopia-kite-clue').getAttribute('role') === 'img',
    'blurred visual clue has image semantics');
  const expectedEyeTargets = {
    4: [[371.73, 309.45], [459.11, 309.45], [759.75, 309.45], [637.89, 309.45]],
    5: [[371.73, 309.45], [459.11, 309.45], [762.15, 309.45], [762.15, 309.45]],
    6: [[277.13, 309.45], [379.75, 309.45], [859.15, 309.45], [652.32, 309.45]]
  };
  const expectedDiagramDescriptions = {
    4: '角膜、晶状体、视网膜、焦点：光线经过角膜和晶状体，焦点朝视网膜形成 / Cornea, Lens, Retina, Focus: light passes through the cornea and lens, with focus forming toward the retina',
    5: '角膜、晶状体、视网膜、焦点：焦点落在视网膜上 / Cornea, Lens, Retina, Focus: focus lands on the retina',
    6: '角膜、晶状体、视网膜、焦点：焦点落在视网膜前方 / Cornea, Lens, Retina, Focus: focus falls in front of the retina'
  };
  const near = (actual, expected) => Math.abs(Number(actual) - expected) < 0.06;
  for (const index of [4, 5, 6]) {
    const layer = pages[index].querySelector('.myopia-eye-labels');
    check(Boolean(layer), 'eye label SVG mounts on page ' + index);
    check(layer.getAttribute('role') === 'img', 'eye label SVG uses image semantics on page ' + index);
    check(layer.getAttribute('aria-label') === expectedDiagramDescriptions[index],
      'eye label SVG names all four labels and its focus relationship on page ' + index);
    check(['角膜', 'Cornea', '晶状体', 'Lens', '视网膜', 'Retina', '聚焦', 'Focus']
      .every(label => layer.textContent.includes(label)), 'all four bilingual labels appear on page ' + index);
    check(pages[index].querySelector('.myopia-scale-note').textContent.includes('原理示意，不按真实比例'),
      'bilingual scale notice appears on page ' + index);
    const targetLines = layer.querySelectorAll('.myopia-eye-label line');
    check(targetLines.length === 4 && expectedEyeTargets[index].every((target, labelIndex) =>
      near(targetLines[labelIndex].getAttribute('x2'), target[0]) &&
      near(targetLines[labelIndex].getAttribute('y2'), target[1])),
    'page-specific source targets map through contained image geometry on page ' + index);
    const labelBoxes = [...layer.querySelectorAll('text')].map(label => label.getBBox());
    check(labelBoxes.every(box => box.x >= 0 && box.y >= 0 && box.x + box.width <= 1000 && box.y + box.height <= 667),
      'all editable labels remain inside the page overlay on page ' + index);
  }

  const activity = pages[11].querySelector('.myopia-focus');
  check(pages[11].querySelectorAll('.myopia-focus').length === 1, 'focus model mounts once');
  check(activity.getAttribute('aria-label') === '光线聚焦模型 / Focus model', 'focus model has its bilingual name');
  const range = activity.querySelector('input[type="range"]');
  const rangeLabel = activity.querySelector('label');
  const correction = activity.querySelector('button');
  const status = activity.querySelector('[role="status"]');
  check(rangeLabel.htmlFor === range.id, 'eye growth label is associated with its range');
  check(correction.getAttribute('aria-pressed') === 'false', 'correction starts off');
  check(['cornea', 'lens', 'retina', 'focus'].every(part => activity.querySelector('[data-part="' + part + '"]')),
    'diagram exposes cornea, lens, retina and focus');
  check(status.textContent.includes('焦点落在视网膜上') && status.textContent.includes('Focus lands on the retina.'),
    'initial focus status is bilingual and focused');
  check(activity.querySelector('.myopia-disclaimer').textContent ===
    '原理示意，不是视力测试 / Explanation only — not a vision test.', 'non-diagnostic note is permanent');

  const retina = activity.querySelector('[data-part="retina"]');
  const focus = activity.querySelector('[data-part="focus"]');
  const rays = [...activity.querySelectorAll('.myopia-ray')];
  range.value = '0.4';
  range.dispatchEvent(new Event('input', { bubbles: true }));
  check(retina.getAttribute('x1') === '86' && retina.getAttribute('x2') === '86',
    'intermediate eye growth moves the retina to x=86');
  check(focus.getAttribute('cx') === '82', 'uncorrected intermediate growth keeps focus at x=82');
  check(JSON.stringify(rays.map(ray => ray.getAttribute('d'))) === JSON.stringify([
    'M3 17 L29 17 L82 26 L86 35',
    'M3 26 L82 26 L86 26',
    'M3 35 L29 35 L82 26 L86 17'
  ]), 'uncorrected intermediate rays cross at x=82 before the retina');
  correction.click();
  check(focus.getAttribute('cx') === '86', 'corrected intermediate growth moves focus to x=86');
  check(JSON.stringify(rays.map(ray => ray.getAttribute('d'))) === JSON.stringify([
    'M3 17 L29 17 L86 26 L86 35',
    'M3 26 L86 26 L86 26',
    'M3 35 L29 35 L86 26 L86 17'
  ]), 'corrected intermediate rays meet on the retina');
  correction.click();
  range.value = '1';
  range.dispatchEvent(new Event('input', { bubbles: true }));
  check(status.textContent.includes('焦点落在视网膜前方'), 'eye growth moves focus in front of the retina');
  correction.click();
  check(correction.getAttribute('aria-pressed') === 'true', 'correction button reports pressed state');
  check(status.textContent.includes('焦点落在视网膜上'), 'correction brings focus to the retina');
  range.value = '0.4';
  range.dispatchEvent(new Event('input', { bubbles: true }));
  check(status.textContent.includes('焦点落在视网膜上'), 'correction follows the selected eye growth');
  check(parseFloat(getComputedStyle(range).height) >= 44, 'range has a 44px touch target');
  check(parseFloat(getComputedStyle(correction).minHeight) >= 44, 'button has a 44px touch target');
  check(getComputedStyle(activity.querySelector('.myopia-focus-point')).transitionDuration === '0s',
    'reduced motion disables focus movement transitions');
  let escapedTouch = 0;
  let escapedArrow = 0;
  document.getElementById('pages').addEventListener('touchstart', () => escapedTouch++);
  document.addEventListener('keydown', event => { if (event.key === 'ArrowRight') escapedArrow++; });
  range.dispatchEvent(new Event('touchstart', { bubbles: true }));
  range.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  check(escapedTouch === 0, 'model touch gestures do not turn the reader page');
  check(escapedArrow === 0, 'range arrow keys do not turn the reader page');

  document.getElementById('result').textContent = JSON.stringify(checks);
</script></body></html>`;
  fs.writeFileSync(htmlPath, html, 'utf8');
  const output = execFileSync(browser, [
    '--headless=new',
    '--no-sandbox',
    '--single-process',
    '--disable-gpu',
    '--disable-extensions',
    '--disable-sync',
    '--incognito',
    '--log-level=3',
    '--no-first-run',
    '--force-prefers-reduced-motion=reduce',
    '--allow-file-access-from-files',
    '--virtual-time-budget=1000',
    '--dump-dom',
    pathToFileURL(htmlPath).href
  ], { encoding: 'utf8', windowsHide: true });
  const resultMatch = output.match(/<pre id="result">([^<]*)<\/pre>/);
  assert.ok(resultMatch, `browser activity checks produced a result; dump length ${output.length}: ${output.slice(0, 240)}`);
  const checks = JSON.parse(resultMatch[1].replaceAll('&quot;', '"').replaceAll('&amp;', '&'));
  assert.deepEqual(checks.filter(check => !check.ok), []);
} finally {
  if (!process.env.KEEP_MYOPIA_FIXTURE) fs.rmSync(tempDir, { recursive: true, force: true });
}

function delay(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function connectCdpPipe(writeStream, readStream) {
  let nextId = 1;
  const pending = new Map();
  let buffer = Buffer.alloc(0);
  readStream.on('data', chunk => {
    buffer = Buffer.concat([buffer, chunk]);
    let separator;
    while ((separator = buffer.indexOf(0)) !== -1) {
      const raw = buffer.subarray(0, separator).toString('utf8');
      buffer = buffer.subarray(separator + 1);
      if (!raw) continue;
      try {
        const message = JSON.parse(raw);
        if (!message.id || !pending.has(message.id)) continue;
        const { resolve, reject, timeout } = pending.get(message.id);
        clearTimeout(timeout);
        pending.delete(message.id);
        if (message.error) reject(new Error(`${message.error.code}: ${message.error.message}`));
        else resolve(message.result);
      } catch (error) {
        for (const { reject, timeout } of pending.values()) {
          clearTimeout(timeout);
          reject(error);
        }
        pending.clear();
      }
    }
  });
  readStream.on('close', () => {
    for (const { reject, timeout } of pending.values()) {
      clearTimeout(timeout);
      reject(new Error('CDP pipe closed'));
    }
    pending.clear();
  });
  return {
    send(method, params = {}, sessionId) {
      const id = nextId++;
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          pending.delete(id);
          reject(new Error(`CDP command timed out: ${method}`));
        }, 5000);
        pending.set(id, { resolve, reject, timeout });
        writeStream.write(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }) + '\0');
      });
    },
    close() {
      writeStream.end();
      readStream.destroy();
    }
  };
}

async function verifyTrustedReaderInput() {
  const chrome = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
  ].filter(Boolean).find(candidate => fs.existsSync(candidate));
  assert.ok(chrome, 'Chrome is available for trusted reader input checks');
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'qa-myopia-cdp-'));
  const server = http.createServer((request, response) => {
    const relativePath = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname).replace(/^\/+/, '');
    let filePath = path.resolve(root, relativePath);
    if (!filePath.startsWith(root + path.sep)) {
      response.writeHead(403).end();
      return;
    }
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) filePath = path.join(filePath, 'index.html');
    if (!fs.existsSync(filePath)) {
      response.writeHead(404).end();
      return;
    }
    const contentType = {
      '.css': 'text/css; charset=utf-8',
      '.html': 'text/html; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
      '.webp': 'image/webp',
      '.webmanifest': 'application/manifest+json'
    }[path.extname(filePath)] || 'application/octet-stream';
    response.setHeader('Content-Type', contentType);
    fs.createReadStream(filePath).pipe(response);
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const indexUrl = `http://127.0.0.1:${server.address().port}/books/myopia/index.html`;
  const child = spawn(chrome, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-extensions',
    '--disable-sync',
    '--incognito',
    '--log-level=3',
    '--no-first-run',
    '--password-store=basic',
    '--remote-debugging-pipe',
    '--window-size=900,900',
    `--user-data-dir=${userData}`,
    indexUrl
  ], { stdio: ['ignore', 'ignore', 'pipe', 'pipe', 'pipe'], windowsHide: true });
  let stderr = '';
  let cdp;
  try {
    child.stderr.on('data', chunk => { stderr += chunk; });
    cdp = connectCdpPipe(child.stdio[3], child.stdio[4]);
    let target;
    for (let attempt = 0; attempt < 50; attempt++) {
      const { targetInfos } = await cdp.send('Target.getTargets');
      target = targetInfos.find(item => item.type === 'page' && item.url.includes('/books/myopia/index.html'));
      if (target) break;
      await delay(100);
    }
    assert.ok(target?.targetId, 'myopia reader target is available over CDP');
    const attachment = await cdp.send('Target.attachToTarget', { targetId: target.targetId, flatten: true });
    const sessionId = attachment.sessionId;
    const send = (method, params) => cdp.send(method, params, sessionId);
    await send('Runtime.enable');
    await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390, height: 844, deviceScaleFactor: 1, mobile: true
    });
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
    async function evaluate(expression) {
      const result = await send('Runtime.evaluate', {
        expression,
        awaitPromise: true,
        returnByValue: true
      });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'browser evaluation failed');
      return result.result.value;
    }
    let ready = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      try {
        ready = await evaluate("Boolean(window.MyopiaActivity && document.querySelectorAll('#pages .page').length === 14)");
      } catch {}
      if (ready) break;
      await delay(100);
    }
    assert.equal(ready, true, 'full reader mounted the myopia activity');
    await evaluate(`(() => {
      document.querySelectorAll('.dot')[11].click();
      const range = document.querySelector('.myopia-growth-range');
      range.value = '0';
      range.dispatchEvent(new Event('input', { bubbles: true }));
      window.__myopiaTrusted = [];
      range.addEventListener('keydown', event => __myopiaTrusted.push({ type: 'keydown', trusted: event.isTrusted }));
      range.addEventListener('input', event => __myopiaTrusted.push({ type: 'input', trusted: event.isTrusted }));
      range.focus();
    })()`);
    await send('Input.dispatchKeyEvent', {
      type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39, nativeVirtualKeyCode: 39
    });
    await send('Input.dispatchKeyEvent', {
      type: 'keyUp', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39, nativeVirtualKeyCode: 39
    });
    const keyboard = await evaluate(`(() => ({
      value: document.querySelector('.myopia-growth-range').value,
      page: [...document.querySelectorAll('#pages .page')].findIndex(page => page.classList.contains('active')),
      events: window.__myopiaTrusted
    }))()`);
    assert.equal(keyboard.value, '0.1', 'trusted ArrowRight preserves the range native step');
    assert.equal(keyboard.page, 11, 'trusted range key does not navigate the reader');
    assert.ok(keyboard.events.some(event => event.type === 'keydown' && event.trusted), 'range receives a trusted key event');
    assert.ok(keyboard.events.some(event => event.type === 'input' && event.trusted), 'range emits trusted native keyboard input');

    await evaluate(`(() => {
      const range = document.querySelector('.myopia-growth-range');
      range.value = '0';
      range.dispatchEvent(new Event('input', { bubbles: true }));
      range.scrollIntoView({ block: 'center' });
      window.__myopiaTrusted = [];
      range.addEventListener('touchstart', event => __myopiaTrusted.push({ type: 'touchstart', trusted: event.isTrusted }), { once: true });
    })()`);
    const rect = await evaluate(`(() => {
      const rect = document.querySelector('.myopia-growth-range').getBoundingClientRect();
      return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
    })()`);
    const touchY = rect.top + rect.height / 2;
    await send('Input.dispatchTouchEvent', {
      type: 'touchStart', touchPoints: [{ x: rect.left + 4, y: touchY, id: 0, force: 1 }]
    });
    await send('Input.dispatchTouchEvent', {
      type: 'touchMove', touchPoints: [{ x: rect.left + rect.width * 0.72, y: touchY, id: 0, force: 1 }]
    });
    await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    const touch = await evaluate(`(() => ({
      value: Number(document.querySelector('.myopia-growth-range').value),
      page: [...document.querySelectorAll('#pages .page')].findIndex(page => page.classList.contains('active')),
      events: window.__myopiaTrusted
    }))()`);
    assert.ok(touch.value >= 0.6, `trusted touch changes the native range, got ${touch.value}`);
    assert.equal(touch.page, 11, 'trusted range touch does not navigate the reader');
    assert.ok(touch.events.some(event => event.type === 'touchstart' && event.trusted), 'range receives trusted touch input');
    assert.ok(touch.events.some(event => event.type === 'input' && event.trusted), 'range emits trusted native touch input');

    await evaluate("document.querySelector('.myopia-growth-range').blur(); document.body.tabIndex = -1; document.body.focus()");
    await send('Input.dispatchKeyEvent', {
      type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39, nativeVirtualKeyCode: 39
    });
    await send('Input.dispatchKeyEvent', {
      type: 'keyUp', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39, nativeVirtualKeyCode: 39
    });
    assert.equal(await evaluate("[...document.querySelectorAll('#pages .page')].findIndex(page => page.classList.contains('active'))"),
      12, 'trusted ArrowRight still navigates the reader outside the model');
    await send('Input.dispatchKeyEvent', {
      type: 'keyDown', key: 'ArrowLeft', code: 'ArrowLeft', windowsVirtualKeyCode: 37, nativeVirtualKeyCode: 37
    });
    await send('Input.dispatchKeyEvent', {
      type: 'keyUp', key: 'ArrowLeft', code: 'ArrowLeft', windowsVirtualKeyCode: 37, nativeVirtualKeyCode: 37
    });
    assert.equal(await evaluate("[...document.querySelectorAll('#pages .page')].findIndex(page => page.classList.contains('active'))"),
      11, 'trusted ArrowLeft returns to the activity page');

    if (process.env.MYOPIA_VISUAL_DIR) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: 1100, height: 900, deviceScaleFactor: 1, mobile: false
      });
      for (const pageIndex of [4, 5, 6]) {
        const clip = await evaluate(`(async () => {
          document.querySelectorAll('.dot')[${pageIndex}].click();
          const page = document.querySelectorAll('#pages .page')[${pageIndex}];
          const image = page.querySelector('.base');
          await new Promise(resolve => {
            image.onload = resolve;
            image.onerror = resolve;
            image.src = '/books/myopia/' + window.PAGES[${pageIndex}].img;
            if (image.complete) resolve();
          });
          const art = page.querySelector('.art');
          art.scrollIntoView({ block: 'start' });
          await new Promise(resolve => setTimeout(resolve, 500));
          const rect = art.getBoundingClientRect();
          return { x: rect.left + scrollX, y: rect.top + scrollY, width: rect.width, height: rect.height, scale: 2 };
        })()`);
        const screenshot = await send('Page.captureScreenshot', {
          format: 'png',
          fromSurface: true,
          captureBeyondViewport: true,
          clip
        });
        fs.writeFileSync(
          path.join(process.env.MYOPIA_VISUAL_DIR, `task-4-fix1-page-${pageIndex}.png`),
          Buffer.from(screenshot.data, 'base64')
        );
      }
    }
  } catch (error) {
    throw new Error(`${error.message}; chromeExit=${child.exitCode}; ${stderr.slice(-800)}`, { cause: error });
  } finally {
    if (cdp) {
      cdp.close();
    }
    if (child.exitCode === null) child.kill();
    server.close();
    await delay(300);
    for (let attempt = 0; attempt < 10; attempt++) {
      try {
        fs.rmSync(userData, { recursive: true, force: true });
        break;
      } catch {
        await delay(100);
      }
    }
  }
}

const keepAlive = setInterval(() => {}, 1000);
verifyTrustedReaderInput()
  .then(() => console.log('myopia activity: OK'))
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => clearInterval(keepAlive));

const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const vm = require('node:vm');

const root = __dirname;
const playwright = require('./.qa-deps/node_modules/playwright');
const outputDir = path.join(root, '.qa-labs', 'myopia');
fs.mkdirSync(outputDir, { recursive: true });

const data = vm.createContext({ window: {}, Reader: { init() {} }, console });
vm.runInContext(fs.readFileSync(path.join(root, 'books/myopia/book.js'), 'utf8'), data, {
  filename: 'books/myopia/book.js'
});
const { PAGES } = data.window;
const glossarySlugs = ['cornea', 'lens', 'retina', 'focus', 'myopia', 'glasses'];
const audioFiles = [
  ...PAGES.flatMap((_, index) => ['en', 'zh'].map(lang => `page_${String(index).padStart(2, '0')}_${lang}.mp3`)),
  ...glossarySlugs.flatMap(slug => ['en', 'zh'].map(lang => `word_${slug}_${lang}.mp3`))
];
assert.equal(audioFiles.length, 40, 'the browser decoder receives the complete 40-file contract');

const mime = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json',
  '.webp': 'image/webp'
};

const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  let target = path.resolve(root, `.${pathname}`);
  if (target !== root && !target.startsWith(`${root}${path.sep}`)) {
    response.writeHead(403);
    response.end();
    return;
  }
  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
  if (!fs.existsSync(target)) {
    response.writeHead(404);
    response.end();
    return;
  }
  response.setHeader('Content-Type', mime[path.extname(target)] || 'application/octet-stream');
  fs.createReadStream(target).pipe(response);
});

async function waitForAllImages(page) {
  await page.waitForFunction(() => {
    const images = [...document.querySelectorAll('#pages img.base')];
    return images.length === 14 && images.every(image => image.complete && image.naturalWidth > 0);
  });
}

async function goToPage(page, index) {
  const current = Number((await page.locator('#pager').textContent()).split('/')[0].trim()) - 1;
  const button = index >= current ? '#next' : '#prev';
  for (let cursor = current; cursor !== index; cursor += index >= current ? 1 : -1) {
    await page.locator(button).click();
  }
  assert.equal(await page.locator('#pager').textContent(), `${index + 1} / 14`);
}

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await playwright.chromium.launch({ channel: 'chrome', headless: true });
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      serviceWorkers: 'block'
    });
    await context.addInitScript(() => {
      localStorage.setItem('kidsbook_myopia_settings', JSON.stringify({
        speed: 1,
        autoNarrate: false,
        autoPage: false,
        primary: 'en',
        muted: false
      }));
      window.__mediaProbe = { plays: [], pauses: 0, playing: false };
      HTMLMediaElement.prototype.play = function () {
        window.__mediaProbe.plays.push(this.src);
        window.__mediaProbe.playing = true;
        return Promise.resolve();
      };
      HTMLMediaElement.prototype.pause = function () {
        window.__mediaProbe.pauses += 1;
        window.__mediaProbe.playing = false;
      };
    });
    await context.route('**/shared/pwa.js', route => route.fulfill({
      contentType: 'application/javascript',
      body: ''
    }));
    await context.route(/https:\/\/.*\/books\/myopia\/assets\/.+\.webp.*/, async route => {
      const marker = '/books/myopia/';
      const url = new URL(route.request().url());
      const relative = decodeURIComponent(url.pathname.slice(url.pathname.indexOf(marker) + marker.length));
      const target = path.join(root, 'books/myopia', relative);
      await route.fulfill({ path: target, contentType: 'image/webp' });
    });

    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', error => pageErrors.push(error.message));

    await page.goto(base);
    await page.locator('a.book-card[href="books/myopia/index.html"]').click();
    await page.waitForURL(/\/books\/myopia\/index\.html$/);
    assert.match(page.url(), /\/books\/myopia\/index\.html$/, 'shelf card opens the real myopia reader');
    await waitForAllImages(page);

    const decodedImages = await page.locator('#pages img.base').evaluateAll(images =>
      images.map(image => ({ width: image.naturalWidth, src: image.currentSrc }))
    );
    assert.equal(decodedImages.length, 14);
    assert.ok(decodedImages.every(image => image.width > 0), 'all 14 illustrations decode');

    const bilingual = await page.locator('#pages .page').evaluateAll(pages => pages.map(pageElement => {
      const en = pageElement.querySelector('.lang-block.en')?.textContent || pageElement.querySelector('.cover-text h1')?.textContent;
      const zh = pageElement.querySelector('.lang-block.zh')?.textContent || pageElement.querySelector('.cover-text .sub-zh')?.textContent;
      return Boolean(en && zh);
    }));
    assert.deepEqual(bilingual, Array(14).fill(true), 'every rendered page exposes Chinese and English copy');

    await page.locator('#next').click();
    assert.equal(await page.locator('#pager').textContent(), '2 / 14', 'next button advances');
    await page.locator('#prev').click();
    assert.equal(await page.locator('#pager').textContent(), '1 / 14', 'previous button returns');
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('#pager').textContent(), '2 / 14', 'right arrow advances');
    await page.keyboard.press('ArrowLeft');
    assert.equal(await page.locator('#pager').textContent(), '1 / 14', 'left arrow returns');

    await goToPage(page, 1);
    await page.locator('.page.active .speak').click();
    assert.match((await page.evaluate(() => window.__mediaProbe.plays.at(-1))), /page_01_en\.mp3\?v=4$/,
      'page narration requests the active English recording');
    await page.locator('.page.active .lang-block.zh').click();
    assert.match((await page.evaluate(() => window.__mediaProbe.plays.at(-1))), /page_01_zh\.mp3\?v=4$/,
      'Chinese text requests the Chinese recording');

    await page.locator('#gearBtn').click();
    await page.locator('#primarySeg button[data-lang="zh"]').click();
    await page.locator('#closeSettings').click();
    assert.ok(await page.locator('.page.active').evaluate(element => element.classList.contains('primary-zh')),
      'language selection makes Chinese primary');
    await page.locator('#gearBtn').click();
    await page.locator('#primarySeg button[data-lang="en"]').click();
    await page.locator('#closeSettings').click();

    await goToPage(page, 11);
    const clippedFocusLabels = await page.locator('.page.active .myopia-focus-diagram text').evaluateAll(labels =>
      labels.filter(label => {
        const box = label.getBBox();
        return box.x < 0 || box.x + box.width > 100 || box.y < 0 || box.y + box.height > 52;
      }).map(label => label.textContent)
    );
    assert.deepEqual(clippedFocusLabels, [], 'focus-model labels remain fully inside the SVG viewBox');
    const accessibleDiagramDescriptions = await page.locator('.myopia-eye-labels').evaluateAll(diagrams =>
      diagrams.map(diagram => diagram.getAttribute('aria-label'))
    );
    assert.deepEqual(accessibleDiagramDescriptions, [
      '光线经过角膜和晶状体 / Light enters through the cornea and lens',
      '焦点落在视网膜上 / Focus lands on the retina',
      '焦点落在视网膜前方 / Focus falls in front of the retina'
    ], 'static teaching diagrams expose their distinct focus relationships to assistive technology');

    const slider = page.locator('.page.active .myopia-growth-range');
    const correction = page.locator('.page.active .myopia-correction');
    await slider.focus();
    await page.keyboard.press('End');
    assert.equal(await page.locator('#pager').textContent(), '12 / 14', 'slider arrows do not turn the page');
    assert.match(await page.locator('.page.active .myopia-focus-status').textContent(), /视网膜前方.*front of the retina/s,
      'eye growth separates focus from retina and updates the live status');
    const separated = await page.locator('.page.active .myopia-focus-diagram').evaluate(svg => ({
      retina: Number(svg.querySelector('[data-part="retina"]').getAttribute('x1')),
      focus: Number(svg.querySelector('[data-part="focus"]').getAttribute('cx'))
    }));
    assert.ok(Math.abs(separated.retina - separated.focus) >= 9.9, 'diagram visibly separates focus and retina');

    await page.keyboard.press('Tab');
    assert.equal(await correction.evaluate(element => document.activeElement === element), true,
      'keyboard tab reaches the corrective-lens control');
    const focusStyle = await correction.evaluate(element => {
      const style = getComputedStyle(element);
      return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) };
    });
    assert.equal(focusStyle.style, 'solid');
    assert.ok(focusStyle.width >= 4, 'corrective-lens control has a visible keyboard focus ring');
    await page.keyboard.press('Enter');
    assert.equal(await correction.getAttribute('aria-pressed'), 'true', 'keyboard activates corrective lenses');
    assert.match(await page.locator('.page.active .myopia-focus-status').textContent(), /视网膜上.*on the retina/s,
      'corrective lenses return focus to the retina');
    const corrected = await page.locator('.page.active .myopia-focus-diagram').evaluate(svg => ({
      retina: Number(svg.querySelector('[data-part="retina"]').getAttribute('x1')),
      focus: Number(svg.querySelector('[data-part="focus"]').getAttribute('cx'))
    }));
    assert.equal(corrected.retina, corrected.focus);

    await page.locator('.page.active .speak').click();
    assert.equal(await page.evaluate(() => window.__mediaProbe.playing), true);
    const pausesBeforeLeave = await page.evaluate(() => window.__mediaProbe.pauses);
    await page.locator('#next').click();
    assert.equal(await page.locator('#pager').textContent(), '13 / 14');
    assert.equal(await page.locator('.page.active .myopia-focus-status').count(), 0, 'activity status is not stale on the next page');
    assert.equal(await page.evaluate(() => window.__mediaProbe.playing), false, 'page exit stops current narration');
    assert.ok(await page.evaluate(() => window.__mediaProbe.pauses) > pausesBeforeLeave, 'page exit pauses the shared audio element');

    const decodedAudio = await page.evaluate(async files => {
      const context = new AudioContext();
      const durations = [];
      try {
        for (const file of files) {
          const response = await fetch(`audio/${file}?v=4`);
          if (!response.ok) throw new Error(`${file}: HTTP ${response.status}`);
          const buffer = await context.decodeAudioData(await response.arrayBuffer());
          if (!(buffer.duration > 0)) throw new Error(`${file}: empty decoded audio`);
          durations.push(buffer.duration);
        }
      } finally {
        await context.close();
      }
      return durations;
    }, audioFiles);
    assert.equal(decodedAudio.length, 40);
    assert.ok(decodedAudio.every(duration => duration > 0), 'all 40 MP3 files decode with positive duration');

    for (const viewport of [{ width: 1024, height: 768 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      await goToPage(page, 11);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `${viewport.width}x${viewport.height} has no horizontal overflow`);
      await page.screenshot({
        path: path.join(outputDir, `reader-${viewport.width}x${viewport.height}.png`),
        fullPage: true
      });
    }

    assert.deepEqual(consoleErrors, [], `console errors: ${consoleErrors.join(' | ')}`);
    assert.deepEqual(pageErrors, [], `page errors: ${pageErrors.join(' | ')}`);
    console.log('PASS myopia browser: shelf navigation, 14 decoded images, bilingual pages, navigation/language/narration, accessible focus model, 40 decoded MP3s, responsive layouts, clean console');
    console.log(`Evidence: ${path.relative(root, outputDir)}\\reader-1024x768.png, ${path.relative(root, outputDir)}\\reader-390x844.png`);
  } finally {
    await browser.close();
    server.close();
  }
})().catch(error => {
  console.error(error);
  server.close();
  process.exitCode = 1;
});

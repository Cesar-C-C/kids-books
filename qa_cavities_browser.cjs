const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const vm = require('node:vm');

const root = __dirname;
let playwright;
try {
  playwright = require('playwright');
} catch {
  playwright = require('./.qa-deps/node_modules/playwright');
}

const outputDir = path.join(root, '.qa-labs', 'cavities');
fs.mkdirSync(outputDir, { recursive: true });

const data = vm.createContext({ window: {}, Reader: { init() {} }, console });
vm.runInContext(fs.readFileSync(path.join(root, 'books/cavities/book.js'), 'utf8'), data, {
  filename: 'books/cavities/book.js'
});
const { PAGES } = data.window;
const glossarySlugs = ['bacteria', 'plaque', 'acid', 'enamel', 'fluoride', 'cavity'];
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

async function timerProbe(page) {
  return page.evaluate(() => ({
    active: window.__intervalProbe.active.size,
    created: window.__intervalProbe.created,
    cleared: window.__intervalProbe.cleared
  }));
}

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await playwright.chromium.launch({ channel: 'chrome', headless: true });
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      serviceWorkers: 'block',
      hasTouch: true
    });
    await context.addInitScript(() => {
      localStorage.setItem('kidsbook_cavities_settings', JSON.stringify({
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

      const nativeSetInterval = window.setInterval.bind(window);
      const nativeClearInterval = window.clearInterval.bind(window);
      window.__intervalProbe = { active: new Set(), created: 0, cleared: 0 };
      window.setInterval = function (callback, delay) {
        let id;
        id = nativeSetInterval(function () {
          callback();
        }, delay);
        window.__intervalProbe.active.add(id);
        window.__intervalProbe.created += 1;
        return id;
      };
      window.clearInterval = function (id) {
        if (window.__intervalProbe.active.delete(id)) window.__intervalProbe.cleared += 1;
        return nativeClearInterval(id);
      };

      let hidden = false;
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
      window.__setDocumentHidden = value => {
        hidden = value;
        document.dispatchEvent(new Event('visibilitychange'));
      };
    });
    await context.route('**/shared/pwa.js', route => route.fulfill({
      contentType: 'application/javascript',
      body: ''
    }));
    await context.route(/https:\/\/.*\/books\/cavities\/assets\/.+\.webp.*/, async route => {
      const marker = '/books/cavities/';
      const url = new URL(route.request().url());
      const relative = decodeURIComponent(url.pathname.slice(url.pathname.indexOf(marker) + marker.length));
      await route.fulfill({ path: path.join(root, 'books/cavities', relative), contentType: 'image/webp' });
    });

    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', error => pageErrors.push(error.message));

    await page.goto(base);
    assert.equal(await page.locator('a.book-card[href="books/cavities/index.html"] h3').textContent(),
      'The Little Hole in a Tooth', 'shelf uses the stable English title');
    await page.locator('a.book-card[href="books/cavities/index.html"]').click();
    await page.waitForURL(/\/books\/cavities\/index\.html$/);
    assert.match(page.url(), /\/books\/cavities\/index\.html$/, 'shelf card opens the real cavities reader');
    assert.equal(await page.title(), '牙齿里的小洞洞 · The Little Hole in a Tooth');
    await waitForAllImages(page);

    const decodedImages = await page.locator('#pages img.base').evaluateAll(images =>
      images.map(image => ({ width: image.naturalWidth, height: image.naturalHeight, src: image.currentSrc }))
    );
    assert.equal(decodedImages.length, 14);
    assert.ok(decodedImages.every(image => image.width > 0 && image.height > 0), 'all 14 illustrations decode');

    const bilingual = await page.locator('#pages .page').evaluateAll(pages => pages.map(pageElement => {
      const en = pageElement.querySelector('.lang-block.en')?.textContent || pageElement.querySelector('.cover-text h1')?.textContent;
      const zh = pageElement.querySelector('.lang-block.zh')?.textContent || pageElement.querySelector('.cover-text .sub-zh')?.textContent;
      return Boolean(en && zh);
    }));
    assert.deepEqual(bilingual, Array(14).fill(true), 'every rendered page exposes Chinese and English copy');
    const storyText = await page.locator('#pages').textContent();
    assert.doesNotMatch(storyText, /蛀牙虫|tooth worms?/i,
      'the story never introduces a tooth-worm explanation, even as a negation');
    assert.doesNotMatch(storyText, /所有细菌(?:都)?(?:是)?坏|all bacteria (?:are )?bad/i,
      'the story never describes all bacteria as bad');
    assert.match(storyText, /不能修复已经形成的洞|cannot repair a hole that has already formed/i,
      'both languages preserve the boundary that brushing cannot repair an established cavity');

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
    assert.match(await page.evaluate(() => window.__mediaProbe.plays.at(-1)), /page_01_en\.mp3\?v=4$/,
      'page narration requests the active English recording');
    await page.locator('.page.active .lang-block.zh').click();
    assert.match(await page.evaluate(() => window.__mediaProbe.plays.at(-1)), /page_01_zh\.mp3\?v=4$/,
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
    const zoneButtons = page.locator('.page.active .brush-zone-button');
    assert.equal(await zoneButtons.count(), 3, 'the activity exposes exactly three tooth-surface buttons');
    assert.deepEqual(await zoneButtons.evaluateAll(buttons => buttons.map(button => button.dataset.zone)),
      ['outer', 'inner', 'chewing']);
    await zoneButtons.nth(1).focus();
    await page.keyboard.press('Shift+Tab');
    assert.equal(await zoneButtons.nth(0).evaluate(button => document.activeElement === button), true,
      'keyboard tab reaches the first tooth-surface control');
    const zoneFocus = await zoneButtons.nth(0).evaluate(button => {
      const style = getComputedStyle(button);
      return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) };
    });
    assert.equal(zoneFocus.style, 'solid', 'zone control exposes a visible keyboard focus ring');
    assert.ok(zoneFocus.width >= 4, 'zone control keyboard focus ring is at least four pixels');
    await page.keyboard.press('Enter');
    assert.equal(await zoneButtons.nth(0).getAttribute('aria-pressed'), 'true', 'Enter activates a zone button');
    assert.match(await page.locator('.page.active .cavities-live').textContent(), /外侧.*Outer/s,
      'the live region announces bilingual progress');
    await zoneButtons.nth(0).click();
    assert.equal(await page.locator('.page.active .brush-zone-button[aria-pressed="true"]').count(), 1,
      'repeating a completed zone does not inflate progress');
    await zoneButtons.nth(1).focus();
    await page.keyboard.press('Space');
    await zoneButtons.nth(2).click();
    assert.equal(await page.locator('.page.active .brush-zone-button[aria-pressed="true"]').count(), 3);
    assert.match(await page.locator('.page.active .cavities-live').textContent(),
      /每个牙面都刷到了.*Every surface is brushed/s, 'all zones produce the bilingual completion message');

    const beforeTouchPage = await page.locator('#pager').textContent();
    await zoneButtons.nth(2).dispatchEvent('touchstart', {
      touches: [{ identifier: 1, target: null, clientX: 20, clientY: 20 }]
    });
    await zoneButtons.nth(2).dispatchEvent('touchend', {
      changedTouches: [{ identifier: 1, target: null, clientX: 20, clientY: 20 }]
    });
    assert.equal(await page.locator('#pager').textContent(), beforeTouchPage,
      'touching an activity control does not trigger reader navigation');

    await goToPage(page, 12);
    const timer = page.locator('.page.active .brush-timer');
    const start = timer.locator('[data-action="start"]');
    const pause = timer.locator('[data-action="pause"]');
    const resume = timer.locator('[data-action="resume"]');
    const reset = timer.locator('[data-action="reset"]');
    assert.equal(await timer.getAttribute('data-timer-status'), 'idle');
    const initialProbe = await timerProbe(page);
    await start.click();
    assert.equal(await timer.getAttribute('data-timer-status'), 'running');
    assert.deepEqual(await timerProbe(page), { active: 1, created: initialProbe.created + 1, cleared: initialProbe.cleared },
      'start creates exactly one interval');
    await pause.click();
    assert.equal(await timer.getAttribute('data-timer-status'), 'paused');
    assert.deepEqual(await timerProbe(page), { active: 0, created: initialProbe.created + 1, cleared: initialProbe.cleared + 1 },
      'pause clears exactly one interval');
    await resume.click();
    assert.equal(await timer.getAttribute('data-timer-status'), 'running');
    assert.deepEqual(await timerProbe(page), { active: 1, created: initialProbe.created + 2, cleared: initialProbe.cleared + 1 },
      'resume creates exactly one interval');
    await reset.click();
    assert.equal(await timer.getAttribute('data-timer-status'), 'idle');
    assert.equal(await timer.locator('.brush-countdown').textContent(), '2:00');
    assert.deepEqual(await timerProbe(page), { active: 0, created: initialProbe.created + 2, cleared: initialProbe.cleared + 2 },
      'reset clears exactly one interval');

    await start.click();
    await page.locator('#next').click();
    await page.waitForFunction(() => window.__intervalProbe.active.size === 0);
    assert.equal((await timerProbe(page)).active, 0, 'leaving the timer page stops its interval');
    await page.locator('#prev').click();
    assert.equal(await timer.getAttribute('data-timer-status'), 'paused', 'returning preserves the suspended timer');
    await resume.click();
    assert.equal((await timerProbe(page)).active, 1, 'returning resumes one interval without duplication');
    await page.evaluate(() => window.__setDocumentHidden(true));
    assert.equal((await timerProbe(page)).active, 0, 'visibility hiding stops the interval');
    await page.evaluate(() => window.__setDocumentHidden(false));
    await resume.click();
    assert.equal((await timerProbe(page)).active, 1, 'the paused timer resumes once after visibility returns');
    await reset.click();

    const pureZero = await page.evaluate(() => ({
      remaining: window.CavitiesActivity.remainingMs(0, 120001, 120000),
      immediate: (() => {
        const controller = window.CavitiesActivity.createTimerController({ durationMs: 0 });
        controller.start();
        return controller.getState();
      })()
    }));
    assert.equal(pureZero.remaining, 0, 'pure remaining-time API clamps at zero without a two-minute wait');
    assert.deepEqual(pureZero.immediate, { status: 'finished', remaining: 0 },
      'zero-duration controller finishes synchronously without owning an interval');

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

    const layoutResults = [];
    for (const viewport of [{ width: 1024, height: 768 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      for (let pageIndex = 0; pageIndex < PAGES.length; pageIndex += 1) {
        await goToPage(page, pageIndex);
        await page.locator('#pages .page.active').evaluate(element =>
          Promise.all(element.getAnimations().map(animation => animation.finished))
        );
        const result = await page.evaluate(index => {
          const rootElement = document.documentElement;
          const activePage = document.querySelector('#pages .page.active');
          const rect = activePage.getBoundingClientRect();
          const controls = [...document.querySelectorAll('button:not([hidden]), a:not([hidden])')]
            .filter(control => {
              const box = control.getBoundingClientRect();
              return box.width > 0 && box.height > 0;
            })
            .map(control => {
              const box = control.getBoundingClientRect();
              return { label: control.textContent.trim() || control.getAttribute('aria-label') || control.id, width: box.width, height: box.height };
            });
          return {
            viewportWidth: innerWidth,
            pageIndex: index,
            documentClientWidth: rootElement.clientWidth,
            documentScrollWidth: rootElement.scrollWidth,
            activeClientWidth: activePage.clientWidth,
            activeScrollWidth: activePage.scrollWidth,
            activeLeft: rect.left,
            activeRight: rect.right,
            undersizedControls: controls.filter(control => control.width < 44 || control.height < 44)
          };
        }, pageIndex);
        layoutResults.push(result);
        assert.ok(result.documentScrollWidth <= result.documentClientWidth,
          `${viewport.width}x${viewport.height} page ${pageIndex + 1}: document has no horizontal overflow`);
        assert.ok(result.activeScrollWidth <= result.activeClientWidth,
          `${viewport.width}x${viewport.height} page ${pageIndex + 1}: active page has no internal horizontal overflow`);
        assert.ok(result.activeLeft >= -0.5 && result.activeRight <= result.viewportWidth + 0.5,
          `${viewport.width}x${viewport.height} page ${pageIndex + 1}: active page remains inside the viewport`);
        assert.deepEqual(result.undersizedControls, [],
          `${viewport.width}x${viewport.height} page ${pageIndex + 1}: visible controls are at least 44x44`);
      }
      await goToPage(page, 12);
      await page.screenshot({ path: path.join(outputDir, `reader-${viewport.width}x${viewport.height}.png`), fullPage: true });
    }
    assert.equal(layoutResults.length, 28, 'both responsive viewports check all 14 pages');
    fs.writeFileSync(path.join(outputDir, 'layout-results.json'), `${JSON.stringify(layoutResults, null, 2)}\n`);

    assert.deepEqual(consoleErrors, [], `console errors: ${consoleErrors.join(' | ')}`);
    assert.deepEqual(pageErrors, [], `page errors: ${pageErrors.join(' | ')}`);
    console.log('PASS cavities browser: shelf navigation, 14 decoded images/bilingual pages, navigation/language/narration, brush zones, timer lifecycle, 40 decoded MP3s, 28 responsive page checks, touch/focus and clean console');
    console.log(`Evidence: ${path.relative(root, outputDir)}\\layout-results.json, ${path.relative(root, outputDir)}\\reader-1024x768.png, ${path.relative(root, outputDir)}\\reader-390x844.png`);
  } finally {
    await browser.close();
    server.close();
  }
})().catch(error => {
  console.error(error);
  server.close();
  process.exitCode = 1;
});

const assert = require('node:assert');
const path = require('node:path');

const api = require(path.join(__dirname, 'books/cavities/cavities.js'));

assert.deepEqual(api.BRUSH_ZONES, ['outer', 'inner', 'chewing']);
const empty = {completed: []};
const one = api.markZone(empty, 'outer');
assert.deepEqual(empty, {completed: []});
assert.deepEqual(one, {completed: ['outer']});
assert.deepEqual(api.markZone(one, 'outer'), one);
assert.throws(() => api.markZone(one, 'tongue'), /Unknown brush zone/);
assert.equal(api.remainingMs(1000, 1000, 120000), 120000);
assert.equal(api.remainingMs(1000, 61000, 120000), 60000);
assert.equal(api.remainingMs(1000, 130000, 120000), 0);

function makeClock(initialNow = 1000) {
  let currentNow = initialNow;
  let nextId = 1;
  const active = new Map();
  return {
    now: () => currentNow,
    advance(ms) { currentNow += ms; },
    setInterval(callback) {
      const id = nextId++;
      active.set(id, callback);
      return id;
    },
    clearInterval(id) { active.delete(id); },
    tick() { for (const callback of [...active.values()]) callback(); },
    activeCount: () => active.size
  };
}

{
  const clock = makeClock();
  const timer = api.createTimerController({
    durationMs: 0,
    now: clock.now,
    setInterval: clock.setInterval,
    clearInterval: clock.clearInterval,
    onTick() {}
  });
  assert.deepEqual(timer.getState(), {status: 'idle', remaining: 0},
    'an explicit zero duration is distinct from the omitted 120000ms default');
  timer.start();
  assert.deepEqual(timer.getState(), {status: 'finished', remaining: 0});
  assert.equal(clock.activeCount(), 0);
}

{
  const clock = makeClock();
  const updates = [];
  const timer = api.createTimerController({
    durationMs: 120000,
    now: clock.now,
    setInterval: clock.setInterval,
    clearInterval: clock.clearInterval,
    onTick: state => updates.push(state)
  });

  assert.deepEqual(timer.getState(), {status: 'idle', remaining: 120000});
  timer.start();
  timer.start();
  assert.equal(clock.activeCount(), 1, 'repeated starts never create duplicate intervals');
  clock.advance(60000);
  clock.tick();
  assert.deepEqual(timer.getState(), {status: 'running', remaining: 60000});

  timer.pause();
  assert.equal(clock.activeCount(), 0, 'pause clears the active interval');
  clock.advance(10000);
  timer.resume();
  assert.equal(clock.activeCount(), 1, 'resume creates one interval');
  clock.advance(60000);
  clock.tick();
  assert.deepEqual(timer.getState(), {status: 'finished', remaining: 0});
  assert.equal(clock.activeCount(), 0, 'completion clears the interval');
  assert.ok(updates.some(state => state.status === 'finished'));
}

{
  const clock = makeClock();
  const timer = api.createTimerController({
    now: clock.now,
    setInterval: clock.setInterval,
    clearInterval: clock.clearInterval,
    onTick() {}
  });
  timer.start();
  clock.advance(30000);
  clock.tick();
  timer.suspend();
  assert.deepEqual(timer.getState(), {status: 'paused', remaining: 90000});
  assert.equal(clock.activeCount(), 0, 'page exit or visibility suspension clears the interval');
  timer.reset();
  assert.deepEqual(timer.getState(), {status: 'idle', remaining: 120000});
}

async function runDomLifecycleChecks() {
  let playwright;
  try {
    playwright = require('playwright');
  } catch {
    playwright = require('./.qa-deps/node_modules/playwright');
  }
  const browser = await playwright.chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage();
    const pageMarkup = Array.from({ length: 14 }, (_, index) =>
      `<div class="page${index === 0 ? ' active' : ''}" data-page="${index}"><div class="text"></div></div>`
    ).join('');
    await page.setContent(`<main id="pages">${pageMarkup}</main>`);
    await page.evaluate(() => {
      const nativeSetInterval = window.setInterval.bind(window);
      const nativeClearInterval = window.clearInterval.bind(window);
      window.__cavitiesIntervals = new Set();
      window.setInterval = (callback, delay) => {
        const id = nativeSetInterval(callback, delay);
        window.__cavitiesIntervals.add(id);
        return id;
      };
      window.clearInterval = id => {
        window.__cavitiesIntervals.delete(id);
        nativeClearInterval(id);
      };
      window.PAGES = Array.from({ length: 14 }, () => ({}));
      window.PAGES[11] = { activity: { type: 'brush-zones' } };
      window.PAGES[12] = { activity: { type: 'brush-timer' } };
    });
    await page.addScriptTag({ path: path.join(__dirname, 'books/cavities/cavities.js') });

    assert.equal(await page.locator('.brush-zones').count(), 1);
    assert.equal(await page.locator('.brush-timer').count(), 1);
    assert.equal(await page.locator('[data-page="11"] > .text > .brush-zones').count(), 1,
      'mountAll targets only the brush-zones activity page');
    assert.equal(await page.locator('[data-page="12"] > .text > .brush-timer').count(), 1,
      'mountAll targets only the timer activity page');
    assert.equal(await page.evaluate(() => window.CavitiesActivity.mountAll(document, window.PAGES)), 0,
      'remounting is idempotent');

    const outer = page.locator('.brush-zone-button[data-zone="outer"]');
    assert.equal(await outer.evaluate(button => `${button.tagName}:${button.type}:${button.getAttribute('aria-pressed')}`),
      'BUTTON:button:false');
    await outer.focus();
    await outer.press('Enter');
    assert.equal(await outer.getAttribute('aria-pressed'), 'true', 'native keyboard activation updates ARIA state');
    await page.locator('.brush-zone-button[data-zone="inner"]').click();
    await page.locator('.brush-zone-button[data-zone="chewing"]').click();
    assert.deepEqual(await page.locator('.brush-zone-button').evaluateAll(buttons =>
      buttons.map(button => button.getAttribute('aria-pressed'))), ['true', 'true', 'true']);
    assert.equal(await page.locator('.brush-zones .cavities-status-zh').textContent(), '每个牙面都刷到了');
    assert.equal(await page.locator('.brush-zones .cavities-status-en').textContent(), 'Every surface is brushed');

    assert.equal(await page.locator('.brush-countdown').getAttribute('role'), 'timer');
    assert.deepEqual(await page.locator('.brush-timer-controls button').evaluateAll(buttons =>
      buttons.map(button => `${button.tagName}:${button.type}:${button.dataset.action}`)), [
      'BUTTON:button:start',
      'BUTTON:button:pause',
      'BUTTON:button:resume',
      'BUTTON:button:reset'
    ]);

    await page.evaluate(() => {
      document.querySelectorAll('.page').forEach(pageElement => pageElement.classList.remove('active'));
      document.querySelector('[data-page="12"]').classList.add('active');
    });
    await page.locator('.brush-timer [data-action="start"]').click();
    assert.equal(await page.evaluate(() => window.__cavitiesIntervals.size), 1);

    await page.evaluate(() => {
      document.querySelector('[data-page="12"]').classList.remove('active');
      document.querySelector('[data-page="0"]').classList.add('active');
    });
    await page.waitForFunction(() => window.__cavitiesIntervals.size === 0);
    assert.equal(await page.locator('.brush-timer').getAttribute('data-timer-status'), 'paused');

    await page.evaluate(() => {
      document.querySelector('[data-page="0"]').classList.remove('active');
      document.querySelector('[data-page="12"]').classList.add('active');
    });
    await page.locator('.brush-timer [data-action="resume"]').click();
    assert.equal(await page.evaluate(() => window.__cavitiesIntervals.size), 1);
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
    assert.equal(await page.evaluate(() => window.__cavitiesIntervals.size), 0);
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
    await page.locator('.brush-timer [data-action="resume"]').click();
    assert.equal(await page.evaluate(() => window.__cavitiesIntervals.size), 1);

    await page.evaluate(() => {
      document.querySelector('[data-page="12"]').classList.remove('active');
      document.querySelector('[data-page="0"]').classList.add('active');
    });
    await page.waitForFunction(() => window.__cavitiesIntervals.size === 0, null, { timeout: 1000 });

    await page.evaluate(() => {
      document.querySelector('[data-page="0"]').classList.remove('active');
      document.querySelector('[data-page="12"]').classList.add('active');
    });
    await page.locator('.brush-timer [data-action="resume"]').click();
    assert.equal(await page.evaluate(() => window.__cavitiesIntervals.size), 1);
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    assert.equal(await page.evaluate(() => window.__cavitiesIntervals.size), 0,
      'visibility cleanup clears the timer interval');
  } finally {
    await browser.close();
  }
}

runDomLifecycleChecks().then(() => {
  console.log('cavities activity: OK');
}).catch(error => {
  console.error(error);
  process.exitCode = 1;
});

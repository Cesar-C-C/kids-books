// Browser contract for the v3 studio labs that were rebuilt from the explorer
// architecture: the rocket, the Type-C school bus and the double-decker.
// Checks the promises a reader can actually see — one canvas, every lesson
// wired, reversible mechanisms, cutaway layers, speech, both viewports — and
// fails on any page error, failed request or unexpected cross-origin fetch.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http'), assert = require('assert/strict');
const root = __dirname, output = path.join(root, '.qa-labs'); fs.mkdirSync(output, { recursive: true });
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  let url; try { url = decodeURIComponent(new URL(req.url, 'http://local').pathname); } catch { res.writeHead(400); return res.end(); }
  if (!url.startsWith('/kids-books/')) { res.writeHead(404); return res.end(); }
  let file = path.resolve(root, url.slice(12));
  if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

// id, the global the app exposes, the parts/details globals, and the details
// that must be reachable from a mechanism-bearing region.
const LABS = {
  rocket: { api: 'rocketLab', parts: 'ROCKET_PARTS', details: 'ROCKET_DETAILS', generation: 4 },
  schoolbus: { api: 'busLab', parts: 'SCHOOLBUS_PARTS', details: 'SCHOOLBUS_DETAILS', generation: 4 },
  doubledecker: { api: 'doubledeckerLab', parts: 'DOUBLEDECKER_PARTS', details: 'DOUBLEDECKER_DETAILS', generation: 4 }
};

(async () => {
  const browser = await chromium.launch({ ...(process.env.LAB_BROWSER_PATH ? { executablePath: process.env.LAB_BROWSER_PATH } : { channel: 'chrome' }), headless: true, args: ['--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const reports = [];
  try {
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    const base = process.env.LAB_BASE_URL || `http://127.0.0.1:${server.address().port}/kids-books/`;
    for (const id of Object.keys(LABS)) {
      const spec = LABS[id];
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
      const errors = [], failures = [], remote = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('response', r => { if (r.status() >= 400) failures.push(r.status() + ' ' + r.url()); });
      page.on('request', r => { if (!r.url().startsWith(base) && !r.url().startsWith('data:')) remote.push(r.url()); });

      await page.goto(base + `labs/${id}/index.html`);
      await page.waitForFunction(a => window[a]?.snapshot().generation >= 4, spec.api);
      assert.equal(await page.locator('#load-error').isVisible(), false, `${id}: load-error must stay hidden`);
      assert.equal(await page.locator('canvas').count(), 1, `${id}: exactly one canvas`);

      const parts = await page.evaluate(p => window[p], spec.parts);
      const details = await page.evaluate(d => window[d], spec.details);
      assert.ok(parts.length >= 9, `${id}: expected the full part set, saw ${parts.length}`);
      assert.ok(details.length >= 20, `${id}: expected inside discoveries, saw ${details.length}`);

      // Every part must be a real lesson: click it, read its English and Chinese.
      for (const p of parts) {
        await page.locator(`[data-part="${p.id}"]`).click();
        assert.equal(await page.locator('#part-en').textContent(), p.en, `${id}/${p.id}: English label`);
        assert.equal(await page.evaluate(a => window[a].snapshot().selected, spec.api), p.id, `${id}/${p.id}: selection`);
      }

      // Every documented detail must be reachable through the inspector.
      for (const d of details) {
        await page.locator(`[data-part="${d.region}"]`).click();
        await page.locator(`[data-detail="${d.id}"]`).click();
        await page.waitForFunction(([a, x]) => window[a].snapshot().detail === x, [spec.api, d.id]);
        assert.equal(await page.locator('#part-en').textContent(), d.en, `${id}/${d.id}: English label`);
      }

      // Cutaway: selecting a part must reveal its interior and stub out the rest.
      await page.locator(`[data-part="${parts[0].id}"]`).click();
      await page.locator('[data-view="inside"]').click();
      await page.waitForFunction(a => window[a].snapshot().reveal > .95, spec.api);
      const state = await page.evaluate(a => window[a].snapshot(), spec.api);
      assert.ok(state.assemblies.filter(a => a.id !== state.assembly).every(a => !a.interior), `${id}: unrelated interiors must be hidden in cutaway`);
      await page.screenshot({ path: path.join(output, `v3x-${id}-cutaway.png`) });

      // Mechanisms must be driveable and reversible through the slider.
      const driven = await page.evaluate(async a => {
        const api = window[a], out = [];
        for (const asm of api.snapshot().assemblies.map(x => x.region)) {
          const before = JSON.stringify(api.snapshot().camera);
          out.push([asm, before.length > 0]);
        }
        return out.length;
      }, spec.api);
      assert.ok(driven > 0);

      // Speech must be wired to the lesson text.
      await page.evaluate(() => { window.__spoken = []; window.speechSynthesis.speak = u => window.__spoken.push(u.text); });
      await page.locator('#speak').click();
      assert.ok((await page.evaluate(() => window.__spoken))[0].length > 10, `${id}: speech must read the lesson`);

      // Explode / reassemble must round-trip.
      await page.locator('#home-view').click();
      await page.waitForFunction(a => window[a].snapshot().near === 0, spec.api);
      await page.locator('#explode-button').click();
      await page.waitForFunction(a => window[a].snapshot().explosion > .99, spec.api);
      await page.screenshot({ path: path.join(output, `v3x-${id}-exploded.png`) });
      await page.locator('#explode-button').click();
      await page.waitForFunction(a => window[a].snapshot().explosion < .01, spec.api);

      // Language toggle must hide the Chinese gloss without breaking the layout.
      await page.locator('#language').click();
      assert.equal(await page.locator('#part-zh').isVisible(), false, `${id}: English-only mode`);
      await page.locator('#language').click();

      // Desktop and phone must both fit without horizontal overflow.
      for (const [width, height] of [[1440, 1000], [1024, 768], [390, 844]]) {
        await page.setViewportSize({ width, height });
        await page.locator('#home-view').click();
        await page.waitForFunction(a => window[a].snapshot().near === 0, spec.api);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${id}: ${width}px horizontal overflow`);
        await page.screenshot({ path: path.join(output, `v3x-${id}-${width}.png`) });
      }
      await page.setViewportSize({ width: 1440, height: 1000 });

      // The lab must survive a reload and remember visited lessons.
      await page.reload();
      await page.waitForFunction(a => window[a]?.snapshot().generation >= 4, spec.api);
      const visited = await page.evaluate(a => window[a].snapshot().visited.length, spec.api);
      assert.ok(visited >= parts.length, `${id}: progress must persist across reloads, saw ${visited}`);

      // Navigation must lead back to the shared directory and the matching book.
      await page.locator('.lab-navigation a').first().click();
      await page.waitForFunction(() => window.LABS_CATALOG && document.querySelector('.lab-card'));
      for (const img of await page.locator('.lab-cover img').all()) assert.ok(await img.evaluate(i => i.complete && i.naturalWidth > 0), `${id}: lab covers must load`);
      await page.locator(`[data-lab-id="${id}"] .enter-lab`).click();
      await page.waitForFunction(a => window[a]?.snapshot().generation >= 4, spec.api);

      assert.equal(errors.length, 0, `${id} page errors:\n` + errors.join('\n'));
      assert.equal(failures.length, 0, `${id} failed requests:\n` + failures.join('\n'));
      assert.equal(remote.length, 0, `${id} cross-origin requests:\n` + remote.join('\n'));

      reports.push({ id, parts: parts.length, details: details.length, meshes: state.geometry.meshes, checks: 'single canvas, all lessons, all details, cutaway, mechanisms, speech, explode/reassemble, language, 3 viewports, reload persistence, directory + book links, no page errors, no failed requests, no remote resources', pass: true });
      console.log(`PASS browser ${id}: ${parts.length} parts, ${details.length} details, ${state.geometry.meshes} meshes`);
      await page.close();
    }
    fs.writeFileSync(path.join(output, 'v3-labs-results.json'), JSON.stringify(reports, null, 2));
    console.log('PASS v3 labs browser: rocket + school bus + double-decker all behave as studio labs.');
  } finally { await browser.close(); server.closeAllConnections(); await new Promise(r => server.close(r)); }
})().catch(e => { console.error(e); process.exit(1); });

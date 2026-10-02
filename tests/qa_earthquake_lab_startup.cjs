// Cold teaching-content delay must never erase the validated return route.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const pw = require(process.env.PLAYWRIGHT_MODULE || '../.qa-deps/node_modules/playwright');
const { serveFile } = require('./qa_earthquake_lab_audio_http.cjs');
const root = path.resolve(__dirname, '..');
const server = http.createServer((request, response) => {
  let file = path.resolve(root, '.' + decodeURIComponent(new URL(request.url, 'http://local').pathname));
  if (file !== root && !file.startsWith(root + path.sep)) return response.writeHead(403).end();
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) return response.writeHead(404).end();
  serveFile(request, response, file);
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await pw.chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const [query, expected, lang, chapter] of [
      ['?lang=en&from=earthquake-waves#waves', '?lang=en#wave-lab', 'en', 'wave'],
      ['?lang=zh&from=earthquake-fault#elastic-rebound', '?lang=zh#fault-lab', 'zh', 'fault'],
      ['?lang=en&from=unknown#waves', '?lang=en', 'en', 'wave']
    ]) {
      // Blocking service workers here only isolates the content-delay fixture.
      // Formal worker/offline acceptance remains in the other release tests.
      const context = await browser.newContext({ serviceWorkers: 'block' });
      const page = await context.newPage();
      let delayedContent = 0;
      await page.route('**/labs/earthquake/content.json', () => { delayedContent++; });
      const base = 'http://127.0.0.1:' + server.address().port;
      await page.goto(base + '/labs/earthquake/index.html' + query, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => !!window.earthquakeLab);
      assert.equal(delayedContent, 1, 'the teaching source is still held by the fixture');
      assert.equal(await page.evaluate(() => earthquakeLab.snapshot().contentVersion), undefined);
      assert.equal(await page.locator('#back-book').getAttribute('href'), '../../books/earthquake/index.html' + expected,
        'the return link is correct before any teaching content has loaded');
      await page.locator('#back-book').click();
      await page.waitForURL(base + '/books/earthquake/index.html' + expected, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(({ lang, chapter }) => window.EarthquakeBook?.snapshot().lang === lang &&
        !!EarthquakeBook.snapshot()[chapter], { lang, chapter });
      await context.close();
    }
    console.log('EARTHQUAKE_COLD_RETURN_PASS preserved language/chapter and rejected unknown source before content loads');
  } finally {
    await browser.close(); server.closeAllConnections(); server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

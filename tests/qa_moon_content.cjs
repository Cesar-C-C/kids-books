// Content-to-UI and Audio URL contract only; fake Audio does not prove real playback.
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const story = JSON.parse(fs.readFileSync(path.join(root, 'books/moon/story.json')));
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'books/moon/audio-manifest.json')));
let pw;
try { pw = require('playwright'); }
catch { pw = require(process.env.PLAYWRIGHT_MODULE || '../../first-batch-books/.qa-deps/node_modules/playwright'); }
const server = http.createServer((req, res) => {
  let file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://local').pathname));
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) return res.writeHead(404).end();
  const types = {'.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.webp':'image/webp'};
  res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await pw.chromium.launch({channel:'chrome', headless:true});
  try {
    const page = await browser.newPage();
    await page.addInitScript(() => {
      window.requestedAudio = [];
      window.Audio = class {
        constructor(url) { window.requestedAudio.push(url); }
        play() { this.onplaying?.(); return Promise.resolve(); }
        pause() {}
        removeAttribute() {}
        load() {}
      };
    });
    await page.goto(`http://127.0.0.1:${server.address().port}/books/moon/`);
    await page.locator('#angle').waitFor();
    for (const lang of ['zh', 'en']) {
      if (lang === 'en') await page.locator('#language').click();
      assert.equal(await page.locator('h1').textContent(), story.title[lang]);
      assert.equal(await page.locator('[data-scene-id]').count(), story.scenes.length);
      for (const item of story.scenes) {
        const container = page.locator(`[data-scene-id="${item.id}"]`);
        assert.equal(await container.count(), 1, `unique ${item.id}`);
        if (item.act === 'album') {
          const index = story.scenes.filter(s => s.act === 'album').findIndex(s => s.id === item.id);
          let current = await page.evaluate(() => MoonBook.getState().album);
          while (current > index) { await page.locator('.album-nav button').first().click(); current--; }
          while (current < index) { await page.locator('.album-nav button').last().click(); current++; }
        }
        const displayed = await container.locator('p').allTextContents();
        assert(displayed.includes(item[lang]), `exact visible prose ${item.id}/${lang}`);
        await container.getByRole('button', {name:lang === 'zh' ? '▶ 听这一段' : '▶ Listen', exact:true}).first().click();
        assert.equal(await page.evaluate(() => requestedAudio.at(-1)), `audio/scene-${item.id}-${lang}.mp3?v=1`);
      }
      for (const word of story.vocab) {
        await page.getByRole('button', {name:`${word.zh} · ${word.en} ▶`, exact:true}).click();
        assert.equal(await page.evaluate(() => requestedAudio.at(-1)), `audio/vocab-${word.id}-${lang}.mp3?v=1`);
      }
    }
    const actual = await page.evaluate(() => requestedAudio.map(s => s.split('?')[0]).sort());
    assert.deepEqual(actual, manifest.entries.map(e => e.output).sort());
    await page.locator('#stop').click();
    console.log(`PASS: ${story.scenes.length * 2} exact bilingual story segments and ${manifest.entries.length} UI-to-audio URL mappings; playback mocked, not verified`);
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });

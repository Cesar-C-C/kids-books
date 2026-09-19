// Real service worker + HTTP + disconnected browser; never substitutes device speech for audio.
const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const assert = require('node:assert/strict');
let pw; try { pw = require('playwright'); } catch { pw = require(process.env.PLAYWRIGHT_MODULE || '../.qa-deps/node_modules/playwright'); }
const root = path.resolve(__dirname, '..'), out = path.join(root, '.qa-labs/moon-offline');
const parse = source => JSON.parse(source.slice(source.indexOf('{'), source.lastIndexOf('}') + 1));
const current = parse(fs.readFileSync(path.join(root, 'pwa-assets.js'), 'utf8'));
// Simulate an installed pre-Moon catalog without depending on the checkout's HEAD.
const priorCatalog = JSON.parse(JSON.stringify(current));
delete priorCatalog.books.moon;
priorCatalog.shell = priorCatalog.shell.filter(f => !f.startsWith('books/moon/'));
priorCatalog.version = 'before-moon-test';
const previous = 'self.KB_ASSETS = ' + JSON.stringify(priorCatalog) + ';';
let upgraded = false;
const server = http.createServer((req, res) => {
  const name = new URL(req.url, 'http://local').pathname;
  let file = path.resolve(root, '.' + decodeURIComponent(name));
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', ({'.html':'text/html', '.js':'text/javascript', '.json':'application/json', '.css':'text/css', '.webp':'image/webp', '.mp3':'audio/mpeg'})[path.extname(file)] || 'application/octet-stream');
  if (name === '/pwa-assets.js' && !upgraded) return res.end(previous);
  if (name === '/sw.js') return res.end(fs.readFileSync(file, 'utf8') + '\n// local upgrade probe ' + upgraded);
  fs.readFile(file, (err, data) => err ? res.writeHead(404).end() : res.end(data));
});
async function message(page, type, bookId) {
  return page.evaluate(({type, bookId}) => new Promise((resolve, reject) => {
    const ch = new MessageChannel();
    const timer = setTimeout(() => reject(Error('worker timeout: ' + type)), 60000);
    ch.port1.onmessage = ({data}) => {
      if (data.type === 'KB_PROGRESS' && data.state === 'running') return;
      clearTimeout(timer); ch.port1.close(); resolve(data);
    };
    navigator.serviceWorker.controller.postMessage({type, bookId}, [ch.port2]);
  }), {type, bookId});
}
(async () => {
  fs.mkdirSync(out, {recursive: true});
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const browser = await pw.chromium.launch({channel:'chrome', headless:true});
  const context = await browser.newContext({viewport:{width:390,height:844}});
  const page = await context.newPage(), errors = [], evidence = [];
  page.on('pageerror', e => errors.push(e.message));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    await page.goto(base + '/index.html');
    await page.waitForFunction(() => !!navigator.serviceWorker.controller, {timeout:60000});
    const oldStatus = await message(page, 'KB_STATUS');
    assert(!oldStatus.books.moon);
    assert.equal((await message(page, 'KB_DOWNLOAD', 'airplane')).state, 'done');
    evidence.push('Simulated pre-Moon catalog in a real worker: existing airplane package downloaded');
    upgraded = true;
    await page.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); await r.update(); });
    await page.evaluate(version => new Promise((resolve, reject) => {
      const timer = setTimeout(() => { cleanup(); reject(Error('upgrade timeout')); }, 60000);
      function cleanup() { clearTimeout(timer); navigator.serviceWorker.removeEventListener('controllerchange', check); }
      function check() {
        const ch = new MessageChannel();
        ch.port1.onmessage = e => { ch.port1.close(); if (e.data.version === version) { cleanup(); resolve(); } };
        navigator.serviceWorker.controller.postMessage({type:'KB_STATUS'}, [ch.port2]);
      }
      navigator.serviceWorker.addEventListener('controllerchange', check); check();
    }), current.version);
    const fresh = await message(page, 'KB_STATUS');
    console.log('UPGRADE', oldStatus.version, fresh.version, current.version, Object.keys(fresh.books));
    assert.equal(fresh.books.airplane.cached, fresh.books.airplane.total);
    assert.equal(fresh.books.moon.missingAudio, current.books.moon.missingAudio.length);
    assert.equal(fresh.books.moon.complete, current.books.moon.complete);
    evidence.push('Old worker upgrades to new manifest; prior airplane download retained');
    await page.locator('#kbFab').click();
    await page.locator('#obtn-moon').waitFor({state:'visible'});
    const pending = current.books.moon.complete === false;
    assert.equal(await page.locator('#obtn-moon').innerText(), pending ? '下载图文' : '下载');
    await page.locator('#obtn-moon').click();
    await page.waitForFunction(() => document.querySelector('#obtn-moon').textContent === '删除', {timeout:60000});
    assert.equal(await page.locator('#orow-moon').evaluate(e => e.classList.contains('done')), !pending);
    if (pending) assert((await page.locator('#osize-moon').innerText()).includes('配音待交付'));
    await page.screenshot({path:path.join(out,'download-state.png')});
    const stored = await message(page, 'KB_STATUS');
    assert.equal(stored.books.moon.cached, stored.books.moon.total);
    evidence.push(pending ? 'Visual download remains partial, not complete audio book' : 'Complete package downloaded (playback not assessed by this test)');
    // A stale unversioned data copy in the long-lived asset cache must not beat fresh shell JSON.
    await page.evaluate(async () => (await caches.open('kb-asset-v1')).put('/books/moon/story.json', new Response('{"stale":true}')));
    await context.setOffline(true);
    await page.reload();
    const card = page.locator('a.book-card[href="books/moon/index.html"]');
    await card.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector('a[href="books/moon/index.html"] img')?.naturalWidth > 0);
    assert.equal(await card.locator('h3').innerText(), 'Why Does the Moon Change Shape?');
    assert.equal(await card.locator('.zh').innerText(), '月亮怎么少了一块？');
    await card.click();
    await page.locator('#angle').waitFor();
    assert.equal(await page.evaluate(() => MoonBook.getState().angle), 90);
    await page.getByRole('button',{name:'下一张 →',exact:true}).click();
    assert.equal(await page.evaluate(() => MoonBook.getState().album), 1);
    await page.locator('#language').click();
    await page.evaluate(() => MoonBook.setAngle(180));
    assert.equal(await page.locator('#angle').inputValue(), '180');
    const files = current.books.moon.files.filter(f => !f.includes('/audio/'));
    const resources = await page.evaluate(async files => Promise.all(files.map(async f => {
      const r = await fetch('/' + f); return {file:f,status:r.status,bytes:(await r.arrayBuffer()).byteLength};
    })), files);
    assert(resources.every(r => r.status === 200 && r.bytes > 0));
    await page.locator('.art img').evaluateAll(xs => xs.forEach(x => x.loading='eager'));
    await page.waitForFunction(() => [...document.querySelectorAll('.art img')].every(x => x.complete && x.naturalWidth));
    await page.screenshot({path:path.join(out,'offline-reader.png')});
    evidence.push('Disconnected: shelf cover, bilingual title, entry, JSON, all seven images, styles and interaction scripts load; language/album/orbit work');
    // Verify one real legacy audio still plays after upgrade, not device speech.
    const legacyAudio = current.books.airplane.files.find(f => /page_01_en\.mp3/.test(f));
    const played = await page.evaluate(src => new Promise((resolve,reject) => {
      const audio = new Audio('/' + src), timer = setTimeout(() => reject(Error('audio timeout')),15000);
      audio.onerror = () => reject(Error('media error'));
      audio.ontimeupdate = () => { if (audio.currentTime > .15) { clearTimeout(timer); audio.pause(); resolve(audio.currentTime); } };
      audio.play().catch(reject);
    }), legacyAudio);
    assert(played > .15); evidence.push('Existing airplane native MP3 plays disconnected after worker upgrade');
    await page.locator('#kbFab').click();
    await page.screenshot({path:path.join(out,'offline-reader-panel.png')});
    await page.locator('#obtn-moon').click();
    await page.waitForFunction(() => document.querySelector('#obtn-moon').textContent !== '删除');
    assert.equal((await message(page,'KB_STATUS')).books.moon.cached, 0);
    evidence.push('Downloaded package can be deleted from reader offline panel');
    const deleted = await message(page,'KB_STATUS');
    assert.equal(deleted.books.airplane.cached, deleted.books.airplane.total);
    await context.setOffline(false);
    const again = await message(page,'KB_DOWNLOAD','moon');
    assert.equal(again.state, pending ? 'partial' : 'done');
    assert.equal(again.books.moon.cached, again.books.moon.total);
    const restoredAudio = current.books.moon.files.filter(f => f.includes('/audio/'));
    const restoredHashes = await page.evaluate(async files => {
      const cache = await caches.open('kb-asset-v1');
      return Promise.all(files.map(async file => {
        const response = await cache.match('/' + file); if (!response) throw Error('Not restored: ' + file);
        const hash = await crypto.subtle.digest('SHA-256',await response.arrayBuffer());
        return {file,sha256:[...new Uint8Array(hash)].map(n=>n.toString(16).padStart(2,'0')).join('')};
      }));
    },restoredAudio);
    for (const item of restoredHashes) assert.equal(item.sha256, require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(root,item.file.split('?')[0]))).digest('hex'));
    await context.setOffline(true);
    if (!pending) {
      for (const lang of ['zh','en']) {
        const url = restoredAudio.find(f => f.includes('scene-gift-' + lang + '.mp3'));
        await page.evaluate(src => new Promise((resolve,reject) => {
          const audio = new Audio('/'+src), timer = setTimeout(()=>reject(Error('Redownload audio timeout')),20000);
          audio.playbackRate=4; audio.onerror=()=>{clearTimeout(timer);reject(Error('Redownload media error'));};
          audio.onended=()=>{clearTimeout(timer);resolve();}; audio.play().catch(reject);
        }),url);
      }
    }
    evidence.push('Delete preserves airplane; redownload restores every audio hash; zh/en replay to ended offline');
    assert.deepEqual(errors, []);
    const report = {version:current.version, evidence, resources, restoredHashes, errors, missingAudio:current.books.moon.missingAudio,
      formalMoonAudio:pending ? 'PENDING: no formal audio playback acceptance' : 'Files present; full playback coverage is tested separately in qa_moon_audio_offline.cjs'};
    fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify(report,null,2));
  } finally { await context.close(); await browser.close(); await new Promise(r=>server.close(r)); }
})().catch(e => {console.error(e); process.exitCode=1; server.close();});

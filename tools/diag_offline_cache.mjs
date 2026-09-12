/* ============================================================
   tools/diag_offline_cache.mjs — 诊断「离线包明明下载了，打开书还是要等」

   症状（家长反馈）：点了「缓存全部绘本」，进度跑到 100%，
   但隔一会儿在线打开某本书，插图仍要转一会儿才出来。

   本脚本用真实 Chrome 抓一条证据链：
     1. 下载某本书的离线包，等 SW 报 done
     2. 列出 kb-asset-v1 里这本书的 key（缓存里到底存的是什么 URL）
     3. 问页面：KBCDN 给这张图排的候选顺序是什么（在线时会先请求哪个 URL）
     4. 真的打开这本书，逐条记录每个插图请求的 URL 与来源
        （fromServiceWorker / fromDiskCache / 真实下载字节数）
     5. 判定：缓存的键 与 实际请求的键 是否是同一个

   用法：
     node tools/diag_offline_cache.mjs
     node tools/diag_offline_cache.mjs --book=bus --port=8231

   退出码：0 = 缓存键与实际请求一致（命中）；1 = 对不上（缓存白下）。
   ============================================================ */
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.dirname(HERE);

const arg = (name, def) => {
  const hit = process.argv.find((a) => a.startsWith('--' + name + '='));
  return hit ? hit.split('=').slice(1).join('=') : def;
};
const BOOK_ID = arg('book', 'bigbang');   // 4.6MB，最小的一本，跑得快
const PORT = Number(arg('port', '0'));

const CHROME_CANDIDATES = [
  arg('chrome', ''),
  process.env.CHROME_PATH || '',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome-stable', '/usr/bin/google-chrome', '/usr/bin/chromium',
  '/usr/bin/chromium-browser', '/snap/bin/chromium',
].filter(Boolean);
const CHROME_EXTRA_FLAGS =
  process.platform === 'linux' ? ['--no-sandbox', '--disable-dev-shm-usage'] : [];

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

const log = (...a) => console.log(...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function startServer() {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://127.0.0.1');
      let p = decodeURIComponent(url.pathname);
      if (p.endsWith('/')) p += 'index.html';
      const file = path.join(REPO, p);
      if (!file.startsWith(REPO)) { res.writeHead(403).end('forbidden'); return; }
      const buf = await readFile(file);
      res.writeHead(200, {
        'content-type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
        'content-length': buf.length, 'cache-control': 'no-cache',
        'service-worker-allowed': '/',
      });
      res.end(buf);
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('not found');
    }
  });
  return new Promise((resolve) => server.listen(PORT, '127.0.0.1', () => resolve(server)));
}

class CDP {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.waiting = new Map(); this.handlers = new Map();
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.waiting.has(msg.id)) {
        const { resolve, reject } = this.waiting.get(msg.id);
        this.waiting.delete(msg.id);
        msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
      }
      if (msg.method && this.handlers.has(msg.method)) {
        for (const fn of this.handlers.get(msg.method)) fn(msg.params);
      }
    });
  }
  static async connect(url) {
    const ws = new WebSocket(url);
    await new Promise((res, rej) => {
      ws.addEventListener('open', res, { once: true });
      ws.addEventListener('error', rej, { once: true });
    });
    return new CDP(ws);
  }
  on(method, cb) {
    if (!this.handlers.has(method)) this.handlers.set(method, []);
    this.handlers.get(method).push(cb);
  }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.waiting.set(id, { resolve, reject }));
  }
  async eval(expression, awaitPromise = true) {
    const r = await this.send('Runtime.evaluate', { expression, awaitPromise, returnByValue: true });
    if (r.exceptionDetails) {
      throw new Error('页面异常: ' + JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails));
    }
    return r.result.value;
  }
  close() { try { this.ws.close(); } catch {} }
}

async function waitFor(cdp, expression, { timeout = 20000, interval = 400 } = {}) {
  const deadline = Date.now() + timeout;
  let last;
  while (Date.now() < deadline) {
    last = await cdp.eval(expression);
    if (last && last.ok) return last;
    await sleep(interval);
  }
  return last || { ok: false };
}

async function fetchJson(url, tries = 60) {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(url); if (r.ok) return await r.json(); } catch {}
    await sleep(250);
  }
  throw new Error('无法连接调试端口：' + url);
}

async function readDevToolsPort(profileDir, tries = 80) {
  const f = path.join(profileDir, 'DevToolsActivePort');
  for (let i = 0; i < tries; i++) {
    try {
      const port = parseInt((await readFile(f, 'utf8')).split('\n')[0], 10);
      if (Number.isInteger(port) && port > 0) return port;
    } catch {}
    await sleep(150);
  }
  throw new Error('浏览器没有写出 DevToolsActivePort');
}

/* ---------------- 主流程 ---------------- */
async function main() {
  const chrome = CHROME_CANDIDATES.find((p) => existsSync(p));
  if (!chrome) throw new Error('找不到 Chrome/Edge，可用 --chrome=... 指定');

  const server = await startServer();
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}/`;
  log(`静态服务器 ${base}（仓库 ${REPO}）`);

  const profile = await mkdtemp(path.join(tmpdir(), 'kb-diag-'));
  const child = spawn(chrome, [
    '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check', '--disable-extensions',
    '--disable-gpu', '--window-size=1280,900', '--hide-scrollbars',
    ...CHROME_EXTRA_FLAGS, 'about:blank',
  ], { stdio: 'ignore' });

  let cdp;
  const netEvents = [];      // 导航后的请求记录
  let collect = false;
  const reqById = new Map();

  try {
    const dbgPort = await readDevToolsPort(profile);
    const targets = await fetchJson(`http://127.0.0.1:${dbgPort}/json/list`);
    const page = targets.find((t) => t.type === 'page');
    cdp = await CDP.connect(page.webSocketDebuggerUrl);

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Network.enable');

    cdp.on('Network.requestWillBeSent', (p) => {
      reqById.set(p.requestId, { url: p.request.url, type: p.type, ts: p.timestamp });
      if (collect && p.type === 'Image') {
        netEvents.push({ requestId: p.requestId, url: p.request.url, type: p.type });
      }
    });
    cdp.on('Network.responseReceived', (p) => {
      const rec = netEvents.find((e) => e.requestId === p.requestId);
      if (!rec) return;
      rec.status = p.response.status;
      rec.fromSW = !!p.response.fromServiceWorker;
      rec.fromDisk = !!p.response.fromDiskCache;
      rec.mime = p.response.mimeType;
    });
    cdp.on('Network.loadingFinished', (p) => {
      const rec = netEvents.find((e) => e.requestId === p.requestId);
      if (rec) rec.bytes = p.encodedDataLength;
    });

    /* --- 1. 打开书架，等 SW 接管 --- */
    await cdp.send('Page.navigate', { url: base + 'index.html' });
    await sleep(2500);
    const reg = await cdp.eval(`(async () => {
      const r = await navigator.serviceWorker.ready.catch(e => ({ error: String(e) }));
      return { ok: !!(r && r.active), scope: r.scope || null };
    })()`);
    log(`Service Worker：${reg.ok ? '已接管' : '未接管'}（scope ${reg.scope}）`);
    if (!reg.ok) throw new Error('Service Worker 没有就绪');

    /* --- 2. 下载这本书的离线包 --- */
    log(`\n下载 ${BOOK_ID} 的离线包 …`);
    const dl = await cdp.eval(`(async () => {
      const ctl = navigator.serviceWorker.controller;
      if (!ctl) return { ok: false, why: 'controller 为空' };
      return await new Promise((resolve) => {
        const ch = new MessageChannel();
        const t = setTimeout(() => resolve({ ok: false, why: '超时' }), 120000);
        ch.port1.onmessage = (e) => {
          const m = e.data || {};
          if (m.type === 'KB_PROGRESS' && (m.state === 'done' || m.state === 'error')) {
            clearTimeout(t); resolve({ ok: true, state: m.state, done: m.done, total: m.total, failed: m.failed, bytes: m.bytes });
          }
        };
        ctl.postMessage({ type: 'KB_DOWNLOAD', bookId: '${BOOK_ID}' }, [ch.port2]);
      });
    })()`);
    log(`下载结果：${JSON.stringify(dl)}`);
    if (!dl.ok || dl.state !== 'done') throw new Error('离线包没下完，无法继续诊断');

    /* --- 3. 缓存里存的是什么键 --- */
    const cached = await cdp.eval(`(async () => {
      const c = await caches.open('kb-asset-v1');
      const keys = (await c.keys()).map(r => r.url);
      const mine = keys.filter(u => u.includes('/books/${BOOK_ID}/assets/'));
      return { total: keys.length, mine: mine.length, sample: mine.slice(0, 4),
               sampleAudio: keys.filter(u => u.includes('/books/${BOOK_ID}/audio/')).slice(0, 2) };
    })()`);
    log(`\n【缓存里实际存下的键】kb-asset-v1 共 ${cached.total} 条，其中 ${BOOK_ID} 插图 ${cached.mine} 张`);
    cached.sample.forEach((u) => log('   ' + u));
    cached.sampleAudio.forEach((u) => log('   ' + u));

    /* --- 4. 页面在线时会请求什么 URL ---
       候选顺序由 KBCDN.order() 决定，与具体是哪张图无关；这里随便取一本
       book.js 里真实引用的第一张图作为样本，只是为了让打印出来的 URL 可信。 */
    const bjSrc = await readFile(path.join(REPO, 'books', BOOK_ID, 'book.js'), 'utf8');
    const firstAsset = (bjSrc.match(/assets\/[\w.-]+\.webp/i) || ['assets/cover.webp'])[0];
    const plan = await cdp.eval(`(() => {
      if (!window.KBCDN) return { err: 'KBCDN 未加载' };
      const rel = 'books/${BOOK_ID}/${firstAsset}';
      return { order: KBCDN.order(), cands: KBCDN.candidates(rel) };
    })()`);
    log(`\n【页面在线请求的候选顺序】${JSON.stringify(plan.order)}`);
    (plan.cands || []).forEach((u, i) => log(`   ${i}. ${u}`));

    /* --- 5. 真打开这本书，测量请求打到哪 ---
       跑两轮：
         第 1 轮 = 页面自己挑的候选顺序（本机同源 127.0.0.1 必然最快 → 同源优先）
         第 2 轮 = 强制 CDN 优先，复现国内真实环境（github.io 慢 → probe 判 CDN 快）

       ⚠️ 为什么必须跑第 2 轮：本地静态服务器的同源地址在局域网内，永远比
       跨境 CDN 快，probe() 必然把同源排第一 —— 于是本地测多少遍都是
       「全部命中」，那个真实存在的缺陷永远照不出来。这正是它逃过前面
       31 项离线断言的原因：测试环境本身把问题遮蔽掉了。
       cdn.js 的 probe() 开头就 `if (sessionStorage.getItem(STORE_KEY)) return;`，
       所以事先写好顺序，就没有东西会覆盖它。 */
    async function openBook(cdnFirst) {
      if (cdnFirst) {
        await cdp.send('Page.navigate', { url: base + 'index.html' });
        await sleep(1200);
        await cdp.eval(`(() => { sessionStorage.setItem('kb_cdn_order_v1', JSON.stringify(
          ['gcore.jsdelivr.net','testingcf.jsdelivr.net','cdn.jsdelivr.net','*'])); return true; })()`);
      }
      netEvents.length = 0;
      collect = true;
      await cdp.send('Page.navigate', { url: `${base}books/${BOOK_ID}/index.html` });
      await waitFor(cdp, `(() => {
        const imgs = [...document.querySelectorAll('img')];
        const done = imgs.filter(i => i.complete).length;
        return { ok: imgs.length > 0 && done >= imgs.length, total: imgs.length, done };
      })()`, { timeout: 45000 });
      await sleep(1200);
      collect = false;

      const list = netEvents.filter((e) => /\.(webp|png|jpe?g)$/i.test(e.url));
      const byHost = {};
      const bySource = { sw: 0, disk: 0, net: 0, unknown: 0 };
      list.forEach((e) => {
        let host = '(?)';
        try { host = new URL(e.url).host; } catch {}
        byHost[host] = (byHost[host] || 0) + 1;
        if (e.fromSW) bySource.sw++;
        else if (e.fromDisk) bySource.disk++;
        else if (e.status) bySource.net++;
        else bySource.unknown++;
      });
      const order = await cdp.eval(`(() => (window.KBCDN ? KBCDN.order() : null))()`);
      return { imgs: list, byHost, bySource, order,
               realBytes: list.reduce((s, e) => s + (e.bytes || 0), 0) };
    }

    function report(tag, r) {
      log(`\n【${tag}】候选顺序 ${JSON.stringify(r.order)}`);
      log(`   插图请求 ${r.imgs.length} 条，按主机分：`);
      Object.entries(r.byHost).sort((a, b) => b[1] - a[1])
        .forEach(([h, n]) => log(`     ${h}  × ${n}`));
      log(`   来源：SW 缓存 ${r.bySource.sw} / 磁盘缓存 ${r.bySource.disk} / 真实网络 ${r.bySource.net} / 未完成 ${r.bySource.unknown}`);
      log(`   真实下载 ${(r.realBytes / 1024 / 1024).toFixed(2)} MB`);
      r.imgs.slice(0, 4).forEach((e) => {
        log(`     ${e.status || '-'} ${e.fromSW ? '[SW]  ' : e.fromDisk ? '[disk]' : '[net] '} ${String(Math.round((e.bytes || 0) / 1024)).padStart(5)}KB  ${e.url.slice(0, 100)}`);
      });
    }

    const r1 = await openBook(false);
    report('第 1 轮 · 页面自选（本机同源快）', r1);

    const r2 = await openBook(true);
    report('第 2 轮 · 强制 CDN 优先（模拟国内真实环境）', r2);

    /* --- 6. 判定 --- */
    const cachedSameOrigin = cached.mine > 0 && cached.sample.every((u) => u.startsWith(base));
    const cdnHosts = Object.keys(r2.byHost).filter((h) => h.includes('jsdelivr'));
    const hitRate = r2.imgs.length ? r2.bySource.sw / r2.imgs.length : 1;

    log('\n' + '='.repeat(74));
    log('判定');
    log('='.repeat(74));
    log(`  缓存里存的是【同源】URL          : ${cachedSameOrigin ? '是' : '否'}`);
    log(`  第 1 轮（同源优先）命中 SW 缓存  : ${r1.bySource.sw} / ${r1.imgs.length}，真实下载 ${(r1.realBytes / 1024 / 1024).toFixed(2)} MB`);
    log(`  第 2 轮（CDN 优先）命中 SW 缓存  : ${r2.bySource.sw} / ${r2.imgs.length}，真实下载 ${(r2.realBytes / 1024 / 1024).toFixed(2)} MB`);
    log(`  第 2 轮打到 jsDelivr 的主机      : ${cdnHosts.join(', ') || '（无）'}`);

    const hit = hitRate >= 0.99;
    if (hit) {
      log('\n结论：两轮都命中，离线包在两种顺序下都有效。');
    } else {
      log('\n结论：**缓存的键与实际请求的键对不上** —— 离线包下到本地了，');
      log('      但在线打开时，只要 KBCDN 把 CDN 排在前面，就一张也用不上。');
      log('      根因：sw.js 对跨域请求直接 return（不介入），jsDelivr 的 URL');
      log('      永远不会去查 Cache Storage；而缓存里存的全是同源 URL。');
    }
    process.exitCode = hit ? 0 : 1;
  } finally {
    try { await cdp?.send('Browser.close'); } catch {}
    cdp?.close();
    await sleep(400);
    try { child.kill('SIGKILL'); } catch {}
    server.close();
    await rm(profile, { recursive: true, force: true }).catch(() => {});
  }
}

main().catch((e) => { console.error('诊断失败：', e); process.exit(1); });

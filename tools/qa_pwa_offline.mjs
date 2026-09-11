/* ============================================================
   tools/qa_pwa_offline.mjs — 用真实 Chrome 验证 PWA 离线能力（零依赖）

   为什么不用 Playwright：本机 .qa-deps 里没有 Playwright，而 Chrome 自带
   CDP 已经能做完这件事。Node 22 原生带 WebSocket 与 fetch，不需要装包。

   流程：
     1. 起一个本地静态服务器（正确的 MIME，尤其 .webmanifest）
     2. 启一个独立的 headless Chrome（临时 profile，不碰用户正在用的浏览器）
     3. 打开书架页 → 确认 Service Worker 注册并接管
     4. 下载一本绘本的离线包 → 等它报 done
     5. 把网络切成完全离线 → 重新加载书架页 + 打开那本书
     6. 断言：书架的 12 张卡片还在、书页插图有真实像素、音频能命中缓存
     7. 截图存档，供人眼复核

   用法：
     node tools/qa_pwa_offline.mjs                  # 默认用 airplane（3.3MB，最快）
     node tools/qa_pwa_offline.mjs --book=bus
     node tools/qa_pwa_offline.mjs --port=8137 --chrome="C:/.../chrome.exe"

   浏览器定位顺序：--chrome= 参数 > 环境变量 CHROME_PATH > 各平台常见安装路径。
   Linux（含 CI 容器）会自动补 --no-sandbox。
   ============================================================ */
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFile, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.dirname(HERE);

const arg = (name, def) => {
  const hit = process.argv.find((a) => a.startsWith('--' + name + '='));
  return hit ? hit.split('=').slice(1).join('=') : def;
};
const PORT = Number(arg('port', '8137'));
const BOOK = arg('book', 'airplane');
const KEEP = process.argv.includes('--keep-screenshots');
const OUT_DIR = arg('out', path.join(HERE, '..', 'preview_pwa'));

/* 跨平台探测：--chrome= 优先，其次 CHROME_PATH，再按平台常见安装位置找。
   CI（ubuntu-latest）自带 google-chrome-stable，Linux 分支就是为它准备的。 */
const CHROME_CANDIDATES = [
  arg('chrome', ''),
  process.env.CHROME_PATH || '',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/snap/bin/chromium',
].filter(Boolean);

/* 以 root 跑 Chrome（容器/CI）必须关沙箱，否则起不来 */
const CHROME_EXTRA_FLAGS =
  process.platform === 'linux' ? ['--no-sandbox', '--disable-dev-shm-usage'] : [];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

const log = (...a) => console.log(...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
function check(name, pass, detail = '') {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
  if (!pass) failures++;
}

/* ---------------- 静态服务器 ---------------- */
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
        'content-length': buf.length,
        'cache-control': 'no-cache',
        'service-worker-allowed': '/',
      });
      res.end(buf);
    } catch (e) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('not found');
    }
  });
  return new Promise((resolve) => server.listen(PORT, '127.0.0.1', () => resolve(server)));
}

/* ---------------- 极简 CDP 客户端 ---------------- */
class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.waiting = new Map();
    this.handlers = new Map();
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
    const r = await this.send('Runtime.evaluate', {
      expression, awaitPromise, returnByValue: true,
    });
    if (r.exceptionDetails) throw new Error('页面异常: ' + JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails));
    return r.result.value;
  }
  close() { try { this.ws.close(); } catch {} }
}

/* 轮询直到条件为真；返回最后一次取到的值 */
async function waitFor(cdp, expression, { timeout = 12000, interval = 400 } = {}) {
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
    try {
      const r = await fetch(url);
      if (r.ok) return await r.json();
    } catch {}
    await sleep(250);
  }
  throw new Error('无法连接调试端口：' + url);
}

/* ---------------- 主流程 ---------------- */
async function main() {
  const chrome = CHROME_CANDIDATES.find((p) => existsSync(p));
  if (!chrome) throw new Error('找不到 Chrome/Edge，可用 --chrome=... 指定');

  const profile = await mkdtemp(path.join(tmpdir(), 'kb-pwa-'));
  let server = await startServer();
  const dbgPort = PORT + 1000;
  log(`静态服务器 http://127.0.0.1:${PORT}/  （仓库：${REPO}）`);
  log(`浏览器 ${chrome}`);

  const child = spawn(chrome, [
    '--headless=new',
    `--remote-debugging-port=${dbgPort}`,
    `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check', '--disable-extensions',
    '--disable-gpu', '--window-size=430,932', '--hide-scrollbars',
    ...CHROME_EXTRA_FLAGS,
    'about:blank',
  ], { stdio: 'ignore' });

  let cdp;
  try {
    const version = await fetchJson(`http://127.0.0.1:${dbgPort}/json/version`);
    log(`浏览器版本 ${version.Browser}`);
    const targets = await fetchJson(`http://127.0.0.1:${dbgPort}/json/list`);
    const page = targets.find((t) => t.type === 'page');
    cdp = await CDP.connect(page.webSocketDebuggerUrl);
    /* 页面里的 JS 报错必须让测试失败，否则「静默坏掉」会被漏过去 */
    const pageErrors = [];
    const netErrors = [];
    cdp.on('Runtime.exceptionThrown', (p) => {
      pageErrors.push(p.exceptionDetails?.exception?.description || JSON.stringify(p.exceptionDetails));
    });
    cdp.on('Log.entryAdded', (p) => {
      const e = p.entry || {};
      if (e.level !== 'error') return;
      const line = (e.url ? e.url + ' → ' : '') + e.text;
      /* 断网时资源加载失败是预期行为，不算 JS 缺陷，单独归一类 */
      if (e.source === 'network') netErrors.push(line); else pageErrors.push(line);
    });
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Network.enable');
    await cdp.send('Log.enable').catch(() => {});

    const base = `http://127.0.0.1:${PORT}/`;

    /* --- 1. 首次访问：注册 SW --- */
    await cdp.send('Page.navigate', { url: base + 'index.html' });
    await sleep(2500);
    const reg = await cdp.eval(`(async () => {
      const r = await navigator.serviceWorker.ready.catch(e => ({ error: String(e) }));
      return { ready: !!r, scope: r.scope || null, active: !!(r.active) };
    })()`);
    check('Service Worker 注册并激活', reg.ready && reg.active, `scope=${reg.scope}`);

    const cachesAtStart = await cdp.eval(`(async () => (await caches.keys()))()`);
    check('外壳缓存已建立', cachesAtStart.some((n) => n.startsWith('kb-shell-')), cachesAtStart.join(', '));

    const shellCount = await cdp.eval(`(async () => {
      const n = (await caches.keys()).find(x => x.startsWith('kb-shell-'));
      const c = await caches.open(n);
      return (await c.keys()).length;
    })()`);
    check('外壳缓存文件数合理（>80）', shellCount > 80, `${shellCount} 个`);

    /* --- 2. 面板就绪 --- */
    const panel = await cdp.eval(`(() => {
      const rows = document.querySelectorAll('.offline-row');
      return { rows: rows.length, cards: document.querySelectorAll('.book-card').length,
               note: (document.getElementById('offlineNote')||{}).textContent || '' };
    })()`);
    check('书架页渲染出离线面板', panel.cards === 12 && panel.rows === 12, `卡片 ${panel.cards} / 面板行 ${panel.rows}`);

    /* 封面用了 loading=lazy：要先滚到底把它们唤起来 */
    await cdp.eval(`window.scrollTo(0, document.body.scrollHeight); true`);
    const covers = await waitFor(cdp, `(() => {
      const imgs = [...document.querySelectorAll('img.cover')];
      const loaded = imgs.filter(i => i.complete && i.naturalWidth > 0).length;
      return { ok: loaded >= 12, total: imgs.length,
               withSrc: imgs.filter(i => i.getAttribute('src')).length, loaded,
               first: imgs[0] ? imgs[0].getAttribute('src') : null };
    })()`, { timeout: 25000 });
    check('12 张封面都拿到了候选地址', covers.withSrc === 12, covers.first || '');
    check('封面在线时全部加载成功', covers.loaded === 12, `${covers.loaded}/12 张`);
    await cdp.eval(`window.scrollTo(0, 0); true`);

    const panelStates = await waitFor(cdp, `(() => {
      const rows = [...document.querySelectorAll('.offline-row')];
      const btns = rows.map(r => r.querySelector('button').textContent);
      return { ok: btns.every(t => t === '下载'), states: btns.slice(0, 3),
               note: (document.getElementById('offlineNote')||{}).textContent || '' };
    })()`, { timeout: 12000 });
    check('状态返回后各书都显示「下载」（未下载的一律不该显示「删除」）',
      panelStates.states && panelStates.states.every((t) => t === '下载'), `按钮：${panelStates.states}`);

    /* --- 3. 下载离线包 --- */
    log(`\n下载《${BOOK}》离线包…`);
    const dl = await cdp.eval(`(async () => {
      const reg = await navigator.serviceWorker.ready;
      const ch = new MessageChannel();
      const done = new Promise(res => {
        let last = null;
        ch.port1.onmessage = e => {
          const d = e.data || {};
          if (d.state === 'running') { last = d; return; }
          if (d.state) res({ state: d.state, failed: d.failed || 0, last });
        };
      });
      reg.active.postMessage({ type: 'KB_DOWNLOAD', bookId: ${JSON.stringify(BOOK)} }, [ch.port2]);
      const r = await Promise.race([done, new Promise(res => setTimeout(() => res({ state: 'timeout' }), 120000))]);
      return r;
    })()`);
    check('离线包下载完成', dl.state === 'done', `state=${dl.state} failed=${dl.failed || 0}`);

    const size = await cdp.eval(`(async () => {
      const st = await new Promise(res => {
        navigator.serviceWorker.ready.then(reg => {
          const ch = new MessageChannel();
          ch.port1.onmessage = e => res(e.data);
          reg.active.postMessage({ type: 'KB_STATUS' }, [ch.port2]);
        });
      });
      const b = (st.books || {})[${JSON.stringify(BOOK)}] || {};
      return { total: b.total, cached: b.cached, mb: +(b.bytes / 1048576).toFixed(2) };
    })()`);
    check('离线包内容完整落盘', size.total > 0 && size.cached === size.total,
      `${size.cached}/${size.total} 个文件，${size.mb} MB`);

    const est = await cdp.eval(`(async () => {
      const e = await navigator.storage.estimate();
      return { usage: e.usage, quota: e.quota };
    })()`);
    check('浏览器配额够用', est.quota > 200 * 1048576,
      `已用 ${(est.usage / 1048576).toFixed(1)}MB / 配额 ${(est.quota / 1073741824).toFixed(1)}GB`);

    /* --- 4. 断网 ---
       两个一起做才算真断：
         · CDP 的网络模拟 —— 掐掉一切外网（jsDelivr 等）
         · 直接关掉本地静态服务器 —— 模拟器对 127.0.0.1 是放行的，
           只做网络模拟的话，同源资源还会从本地服务器网络照常取到，
           所谓「离线通过」就是假的。 */
    log('\n切换离线：掐外网 + 关掉本地服务器…');
    await cdp.send('Network.emulateNetworkConditions', {
      offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0,
    });
    server.closeAllConnections?.();
    await new Promise((r) => server.close(r));
    log('  本地服务器已关闭');

    const online = await cdp.eval(`navigator.onLine`);
    check('浏览器已进入离线状态', online === false, `navigator.onLine=${online}`);

    /* 先证明「离线」是真的：一个没被缓存的同源文件必须取不到 */
    const blocked = await cdp.eval(`(async () => {
      try {
        const r = await fetch('tools/gen_pwa_icons.py', { cache: 'no-store' });
        return { threw: false, status: r.status };
      } catch (e) { return { threw: true, error: String(e).slice(0, 60) }; }
    })()`);
    check('离线确实拦住了未缓存的资源', blocked.threw === true || blocked.status === 504,
      blocked.threw ? '网络层直接失败' : `SW 兜底 HTTP ${blocked.status}`);

    /* 书架页离线重载 */
    await cdp.send('Page.reload', { ignoreCache: false });
    await sleep(3000);
    const offlineShelf = await cdp.eval(`(() => {
      const cards = document.querySelectorAll('.book-card');
      const imgs = [...document.querySelectorAll('img.cover')];
      const bad = imgs.filter(i => !(i.complete && i.naturalWidth > 0));
      return { title: document.title, cards: cards.length,
               imgsWithPixels: imgs.length - bad.length,
               missing: bad.map(i => (i.getAttribute('data-kbc') || i.src || '?')
                 .replace(/^.*?\\/books\\//, '').replace(/^books\\//, '')),
               panelRows: document.querySelectorAll('.offline-row').length };
    })()`);
    check('离线时书架页仍能打开', offlineShelf.cards === 12, `title=${offlineShelf.title}`);
    check('离线时面板仍可用', offlineShelf.panelRows === 12);
    check('离线时 12 张封面全部有真实像素', offlineShelf.imgsWithPixels === 12,
      `${offlineShelf.imgsWithPixels}/12 张` +
      (offlineShelf.missing && offlineShelf.missing.length
        ? `；缺 ${offlineShelf.missing.join(',')}` : ''));

    const offlinePanel = await waitFor(cdp, `(() => {
      const rows = [...document.querySelectorAll('.offline-row')];
      const map = {};
      rows.forEach(r => { map[r.id.replace('orow-','')] = r.querySelector('button').textContent; });
      const notDone = Object.keys(map).filter(k => map[k] === '下载').length;
      return { ok: Object.keys(map).length === 12 && notDone === 11, map, notDone,
               note: (document.getElementById('offlineNote')||{}).textContent || '' };
    })()`, { timeout: 12000 });
    check('离线时能正确区分已存/未存（1 本已存，11 本未存）',
      offlinePanel.map && offlinePanel.map[BOOK] === '删除' && offlinePanel.notDone === 11,
      `已存那本显示「${offlinePanel.map ? offlinePanel.map[BOOK] : '?'}」，未存 ${offlinePanel.notDone} 本；${offlinePanel.note}`);

    /* 离线状态下 Service Worker 自己的脚本与清单是否还能起来 —— 起不来就会
       出现「缓存里明明有文件，界面却显示没下载」这种诡异现象 */
    const diag = await cdp.eval(`(async () => {
      const names = await caches.keys();
      const st = await new Promise(res => {
        navigator.serviceWorker.ready.then(reg => {
          if (!reg.active) return res({ error: 'no active sw' });
          const ch = new MessageChannel();
          ch.port1.onmessage = e => res(e.data);
          reg.active.postMessage({ type: 'KB_STATUS' }, [ch.port2]);
          setTimeout(() => res({ error: 'no reply' }), 4000);
        }).catch(e => res({ error: String(e) }));
      });
      return { caches: names, swVersion: st.version || null,
               bookKeys: st.books ? Object.keys(st.books).length : 0,
               plane: (st.books && st.books[${JSON.stringify(BOOK)}]) || null, err: st.error || null };
    })()`);
    log('  离线诊断：' + JSON.stringify(diag));
    check('离线时 SW 仍能正确读到清单',
      diag.err === null && diag.bookKeys === 12 && diag.plane && diag.plane.cached === diag.plane.total,
      `swVersion=${diag.swVersion} 缓存=${(diag.caches || []).join(',')} 已存=${diag.plane ? diag.plane.cached + '/' + diag.plane.total : 'n/a'}`);

    await saveShot(cdp, `shelf-offline.png`);
    await saveShot(cdp, `shelf-offline-full.png`, true);

    /* 打开那本书 */
    await cdp.send('Page.navigate', { url: `${base}books/${BOOK}/index.html` });
    await sleep(3500);
    const offlineBook = await cdp.eval(`(() => {
      const pages = document.querySelectorAll('#pages .page');
      const art = [...document.querySelectorAll('#pages .page img.base')];
      const ov = document.querySelectorAll('#pages .page .ovwrap svg');
      const ps = [...document.querySelectorAll('#pages .page .text p')].map(p => p.textContent.trim()).filter(Boolean);
      return { title: document.title, pages: pages.length,
               artLoaded: art.filter(i => i.complete && i.naturalWidth > 0).length, artTotal: art.length,
               overlays: ov.length, textCount: ps.length, sample: ps[0] || '' };
    })()`);
    check('离线时绘本页正常渲染', offlineBook.pages > 5 && offlineBook.overlays > 0,
      `${offlineBook.pages} 页 / ${offlineBook.overlays} 个 SVG 浮层`);
    check('离线时插图有真实像素', offlineBook.artLoaded >= 1,
      `${offlineBook.artLoaded}/${offlineBook.artTotal} 张（含未预加载的后续页）`);
    check('离线时正文文字存在', offlineBook.textCount > 0,
      `${offlineBook.textCount} 段，样例「${offlineBook.sample.slice(0, 24)}」`);

    const audio = await cdp.eval(`(async () => {
      /* 以书籍页自身为基准解析路径，别再手写 ../ 以免重复层级 */
      const url = new URL('audio/page_01_en.mp3?v=4', location.href).href;
      try {
        const r = await fetch(url);
        return { url, ok: r.ok, status: r.status, bytes: (await r.arrayBuffer()).byteLength };
      } catch (e) { return { url, ok: false, status: 0, error: String(e).slice(0, 60) }; }
    })()`);
    check('离线时音频能命中缓存', audio.ok && audio.bytes > 1000,
      `HTTP ${audio.status}, ${audio.bytes} 字节  ${audio.url}`);

    await saveShot(cdp, `book-${BOOK}-offline.png`);

    /* --- 5. 恢复在线，确认还能更新 --- */
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1,
    });
    server = await startServer();          // 把刚才关掉的本地服务器重新拉起来
    log('  本地服务器已重启');
    await cdp.send('Page.navigate', { url: base + 'index.html' });
    await sleep(2500);
    const backOnline = await cdp.eval(`(() => {
      const imgs = [...document.querySelectorAll('img.cover')];
      return { online: navigator.onLine, loaded: imgs.filter(i => i.complete && i.naturalWidth > 0).length };
    })()`);
    check('恢复联网后一切正常', backOnline.online === true && backOnline.loaded >= 10,
      `${backOnline.loaded}/12 张封面`);

    check('全程没有 JS 异常', pageErrors.length === 0,
      pageErrors.slice(0, 2).join(' | ').slice(0, 200));
    log(`  （断网期间的资源加载失败 ${netErrors.length} 条，属预期）`);

    log(`\n截图目录：${path.resolve(OUT_DIR)}`);
  } finally {
    if (cdp) cdp.close();
    if (child && !child.killed) child.kill();
    server.close();
    if (!KEEP) { await sleep(300); await rm(profile, { recursive: true, force: true }).catch(() => {}); }
  }

  console.log(failures ? `\n${failures} 项未通过` : '\n全部通过');
  process.exit(failures ? 1 : 0);
}

/* 截图存档供人眼复核。full=true 抓整页——首屏截图看不见书架卡片区，
   「离线时封面是不是空白」这种问题只在整页图里才看得出来。 */
async function saveShot(cdp, name, full = false) {
  try {
    const { data } = await cdp.send('Page.captureScreenshot',
      full ? { format: 'png', captureBeyondViewport: true } : { format: 'png' });
    const { mkdir } = await import('node:fs/promises');
    await mkdir(OUT_DIR, { recursive: true });
    await writeFile(path.join(OUT_DIR, name), Buffer.from(data, 'base64'));
    log(`  截图 ${name}${full ? '（整页）' : ''}`);
  } catch (e) { log('  截图失败：' + e.message); }
}

main().catch((e) => { console.error('运行失败：', e); process.exit(1); });

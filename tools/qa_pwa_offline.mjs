/* ============================================================
   tools/qa_pwa_offline.mjs — 用真实 Chrome 验证 PWA 离线能力（零依赖）

   为什么不用 Playwright：本机 .qa-deps 里没有 Playwright，而 Chrome 自带
   CDP 已经能做完这件事。Node 22 原生带 WebSocket 与 fetch，不需要装包。

   流程：
     1. 起一个本地静态服务器（正确的 MIME，尤其 .webmanifest）
     2. 启一个独立的 headless Chrome（临时 profile，不碰用户正在用的浏览器）
     3. 打开书架页 → 确认 Service Worker 注册并接管
     4. 确认角落小按钮 / 二级菜单可用，且「点安装一定有反馈」
        （headless 里 Chrome 也会发 beforeinstallprompt，但 JS 触发的点击
        没有用户手势，prompt() 必定失败 —— 正好覆盖那条没人愿意测的
        失败分支；再用合成事件验证成功路径确实调用了 prompt()）
     5. 下载一本绘本的离线包 → 等它报 done
     6. 把网络切成完全离线 → 重新加载书架页 + 打开那本书
     7. 断言：书架的 12 张卡片还在、书页插图有真实像素、音频能命中缓存
     8. 截图存档，供人眼复核

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
/* 视口尺寸。默认手机竖屏（家长最常用的场景）；--size=1280x900 可看桌面版，
   二级菜单在桌面会变成居中弹窗，与手机上的底部抽屉是两套布局，都得看一眼。 */
const SIZE = arg('size', '430x932');
/* --live=<url>：只对已部署的站点做在线体检，跳过本地服务器与断网阶段。
   为什么要单独一条：本地静态服务器的 MIME 映射是我们自己写的，与
   GitHub Pages 实际返回的 Content-Type 并不一样 —— manifest.webmanifest
   若被 Pages 用错 MIME，浏览器会直接忽略清单，PWA 可安装性悄悄失效，
   而本地测试永远发现不了。 */
const LIVE = arg('live', '');
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

/* 读 Chrome 自己写的调试端口（配合 --remote-debugging-port=0 使用） */
async function readDevToolsPort(profileDir, tries = 80) {
  const f = path.join(profileDir, 'DevToolsActivePort');
  for (let i = 0; i < tries; i++) {
    try {
      const port = parseInt((await readFile(f, 'utf8')).split('\n')[0], 10);
      if (Number.isInteger(port) && port > 0) return port;
    } catch {}
    await sleep(150);
  }
  throw new Error('浏览器没有写出 DevToolsActivePort，无法连接调试端口');
}

/* ---------------- 主流程 ---------------- */
/* ============================================================
   线上体检（--live=<url>）：验证已部署站点的真实行为与响应头。

   与本地测试互补：本地静态服务器的 MIME 映射是我们自己写的，Pages 返回的
   不一定一样。manifest.webmanifest 若拿到非 JSON 的 content-type，浏览器会
   直接忽略清单，PWA 可安装性悄悄失效 —— 而本地测试永远发现不了。
   ============================================================ */
async function liveCheck(cdp, live, pageErrors) {
  const base = live.endsWith('/') ? live : live + '/';

  await cdp.send('Page.navigate', { url: base + 'index.html' });
  await sleep(3500);

  /* 1. Service Worker：HTTPS 是前提，github.io 天然满足 */
  const reg = await cdp.eval(`(async () => {
    try {
      const r = await navigator.serviceWorker.ready;
      return { ok: true, scope: r.scope, active: !!r.active };
    } catch (e) { return { ok: false, error: String(e) }; }
  })()`);
  check('线上 Service Worker 注册并激活', !!reg.ok && !!reg.active,
    `scope=${reg.scope || reg.error}`);

  /* 2. 外壳缓存：真装上了才说明预缓存清单可用 */
  const shell = await cdp.eval(`(async () => {
    const n = (await caches.keys()).find(x => x.startsWith('kb-shell-'));
    if (!n) return { name: null, count: 0, covers: 0 };
    const c = await caches.open(n);
    const keys = await c.keys();
    return { name: n, count: keys.length,
             covers: keys.filter(r => /_card480\\.webp$/.test(r.url)).length };
  })()`);
  check('线上外壳缓存已建立', !!shell.name, shell.name || '无');
  check('线上外壳缓存文件数合理（>80）', shell.count > 80, `${shell.count} 个`);
  check('12 张封面在外壳缓存里', shell.covers === 12, `${shell.covers}/12`);

  /* 3. manifest 的 MIME —— 这正是本地测不到的东西 */
  const man = await cdp.eval(`(async () => {
    const r = await fetch('manifest.webmanifest', { cache: 'no-store' });
    const text = await r.text();
    let json = null;
    try { json = JSON.parse(text); } catch (e) {}
    return { status: r.status, type: r.headers.get('content-type'), len: text.length,
             name: json && json.name, display: json && json.display,
             start: json && json.start_url, icons: (json && json.icons) || [] };
  })()`);
  check('manifest 可取到且是合法 JSON', man.status === 200 && !!man.name,
    `HTTP ${man.status}  content-type=${man.type}`);
  check('manifest 是 JSON 类型（否则浏览器会忽略清单）',
    /manifest\+json|application\/json/i.test(man.type || ''), man.type || '(空)');
  check('manifest display 可安装', man.display === 'standalone', String(man.display));

  const iconBad = await cdp.eval(`(async () => {
    const icons = ${JSON.stringify(man.icons || [])};
    const bad = [];
    for (const ic of icons) {
      const r = await fetch(ic.src, { cache: 'no-store' });
      if (r.status !== 200) bad.push(ic.src + ' HTTP ' + r.status);
    }
    return bad;
  })()`);
  check('manifest 里的图标全部可取', iconBad.length === 0, iconBad.join(', ') || '全部 200');

  /* 4. 脚本 MIME：不是 JavaScript 类型浏览器会拒绝执行 */
  const scriptMime = await cdp.eval(`(async () => {
    const out = {};
    for (const p of ['sw.js', 'shared/cdn.js', 'shared/pwa.js']) {
      const r = await fetch(p, { cache: 'no-store' });
      out[p] = r.status + ' ' + (r.headers.get('content-type') || '(空)');
    }
    return out;
  })()`);
  const badScript = Object.entries(scriptMime).filter(([, v]) => !/^\d+ .*javascript/i.test(v));
  check('线上脚本的 content-type 都是 JavaScript', badScript.length === 0,
    badScript.length ? JSON.stringify(badScript) : Object.values(scriptMime).join(' | '));

  /* 5. 首页渲染：滚到底再数，理由同离线测试（loading="lazy"） */
  await cdp.eval(`(async () => {
    const step = Math.round(window.innerHeight * 0.8);
    for (let y = 0; y <= document.body.scrollHeight; y += step) {
      window.scrollTo(0, y); await new Promise(r => setTimeout(r, 220));
    }
    window.scrollTo(0, 0); await new Promise(r => setTimeout(r, 400));
    return true;
  })()`);
  await sleep(1200);
  const shelf = await cdp.eval(`(() => {
    const imgs = [...document.querySelectorAll('img.cover')];
    const origin = location.origin;
    const fab = document.getElementById('kbFab');
    return { cards: document.querySelectorAll('.book-card').length,
             ok: imgs.filter(i => i.complete && i.naturalWidth > 0).length,
             originCover: imgs.filter(i => (i.currentSrc || i.src || '').startsWith(origin)).length,
             fab: !!fab,
             fabInFlow: !!document.querySelector('.shelf > .kb-fab'),
             panelRows: document.querySelectorAll('#offlineList .offline-row').length };
  })()`);
  check('线上首页渲染 12 张书卡', shelf.cards === 12, `${shelf.cards} 张`);
  check('线上 12 张封面都加载出像素', shelf.ok === 12, `${shelf.ok}/12`);
  check('线上封面走同源（外壳缓存可直接供离线用）', shelf.originCover === 12,
    `同源 ${shelf.originCover}/12`);
  check('线上角落小按钮就位，且不插进页面流', shelf.fab && !shelf.fabInFlow);
  check('线上离线清单就绪', shelf.panelRows === 12, `${shelf.panelRows} 行`);

  /* 二级菜单在线上也要能开：它是纯前端 DOM，但依赖 /shared/pwa.js 与
     /shared/pwa.css 都被正确发布 —— 少发一个文件，点开就是一片空白 */
  const liveMenu = await cdp.eval(`(async () => {
    document.getElementById('kbFab').click();
    await new Promise(r => setTimeout(r, 400));
    const s = document.getElementById('kbSheet');
    const o = { open: s.classList.contains('open'),
                rows: s.querySelectorAll('.offline-row').length,
                install: !!document.getElementById('kiBtn'),
                fabText: document.getElementById('kbFabTxt').textContent.trim() };
    return o;
  })()`);
  check('线上二级菜单能打开（安装区 + 12 本清单都在）',
    liveMenu.open && liveMenu.rows === 12 && liveMenu.install,
    `小按钮显示「${liveMenu.fabText}」`);
  await sleep(300);
  await saveShot(cdp, 'kb-menu-live.png');
  await cdp.eval(`document.getElementById('kbClose').click(); true`);
  check('线上首页无 JS 异常', pageErrors.length === 0, pageErrors.slice(0, 2).join(' | '));
}

async function main() {
  const chrome = CHROME_CANDIDATES.find((p) => existsSync(p));
  if (!chrome) throw new Error('找不到 Chrome/Edge，可用 --chrome=... 指定');

  let server = LIVE ? null : await startServer();

  if (LIVE) log(`线上体检：${LIVE}（不起本地服务器、不做断网）`);
  else log(`静态服务器 http://127.0.0.1:${PORT}/  （仓库：${REPO}）`);
  log(`浏览器 ${chrome}`);

  /* 临时 profile 在真正开浏览器之前才创建：中途抛错时不会留下一个
     再也没人清理的目录（之前一次失败就漏一个，攒了 30 多个） */
  const profile = await mkdtemp(path.join(tmpdir(), 'kb-pwa-'));

  /* 用 --remote-debugging-port=0 让 Chrome 自己挑空闲端口，端口号写在
     <profile>/DevToolsActivePort 里。
     为什么要这么做：固定端口时，上一次运行残留的浏览器会占着端口，
     新实例绑定失败直接退出，而 CDP 探测却**静默连上那个残留实例** ——
     于是本轮跑在上一轮的状态里（缓存里已经有书了），
     「已下载那本显示删除」这种假失败就是这么来的。总共浪费过一次排查。
     顺带给它一个独立的空 profile，绝不碰你日常在用的浏览器。 */
  const child = spawn(chrome, [
    '--headless=new',
    '--remote-debugging-port=0',
    `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check', '--disable-extensions',
    '--disable-gpu', `--window-size=${SIZE.replace('x', ',')}`, '--hide-scrollbars',
    ...CHROME_EXTRA_FLAGS,
    'about:blank',
  ], { stdio: 'ignore' });

  const dbgPort = await readDevToolsPort(profile);

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

    if (LIVE) {
      await liveCheck(cdp, LIVE, pageErrors);
      console.log(failures ? `\n${failures} 项未通过` : '\n全部通过');
      process.exit(failures ? 1 : 0);
    }

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
    check('书架页渲染出离线清单（二级菜单内，12 行）', panel.cards === 12 && panel.rows === 12, `卡片 ${panel.cards} / 清单行 ${panel.rows}`);

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

    /* --- 2b. 角落小按钮 + 二级菜单 ---
       安装入口与离线清单都收进弹层，书架页不再被设置项占版面。
       这里同时守住「点安装没反应」那个回归：headless 里没有
       beforeinstallprompt，点按钮必须给出该浏览器的具体步骤，
       而不是像旧版那样 `if (!pendingPrompt) return;` 静默返回。 */
    const fabIdle = await cdp.eval(`(() => {
      const f = document.getElementById('kbFab');
      const s = document.getElementById('kbSheet');
      return { exists: !!f, text: f ? f.textContent.trim() : '',
               inFlow: !!document.querySelector('.shelf > .kb-sheet'),
               sheetOpen: s ? s.classList.contains('open') : null,
               rowsInDom: document.querySelectorAll('#offlineList .offline-row').length };
    })()`);
    check('书架页只多一个角落小按钮，设置项不在页面流里占版面',
      fabIdle.exists && !fabIdle.sheetOpen && !fabIdle.inFlow && fabIdle.rowsInDom === 12,
      `按钮「${fabIdle.text}」清单 ${fabIdle.rowsInDom} 行（弹层未展开）`);

    const menuOpen = await cdp.eval(`(() => {
      document.getElementById('kbFab').click();
      const s = document.getElementById('kbSheet');
      return { open: s.classList.contains('open'),
               rows: s.querySelectorAll('.offline-row').length,
               hasInstall: !!document.getElementById('kiBtn'),
               locked: document.documentElement.classList.contains('kb-lock') };
    })()`);
    check('点小按钮弹出二级菜单（含安装区 + 12 本清单）',
      menuOpen.open && menuOpen.rows === 12 && menuOpen.hasInstall, JSON.stringify(menuOpen));
    await sleep(300);
    await saveShot(cdp, 'kb-menu-open.png');

    /* 「点了没反应」的回归守卫。
       实测 Chrome 152 headless 也会发 beforeinstallprompt，但 JS 触发的
       .click() 没有用户手势，prompt() 会返回一个被拒绝的 Promise —— 正好
       压到最容易出事的失败分支：旧版就是在这里静默卡死（按钮变禁用、
       什么都不弹），家长看到的就是「点了没反应」。现在必须展开步骤。 */
    /* 用轮询而不是固定 sleep：prompt() 的拒绝是异步落到界面上的，
       机器一忙（比如同时跑两个浏览器）500ms 就可能不够，会偶发假失败。 */
    const clicked = await cdp.eval(`(() => {
      const btn = document.getElementById('kiBtn');
      const label = btn.textContent.trim();
      btn.click();
      return { label };
    })()`);
    const feedback = await waitFor(cdp, `(() => {
      const g = document.getElementById('kiGuide');
      const b = document.getElementById('kiBtn');
      const steps = g.querySelectorAll('ol li').length;
      return { ok: !g.hidden && steps >= 3, shown: !g.hidden, steps, disabled: b.disabled,
               label: b.textContent.trim() };
    })()`, { timeout: 10000 });
    check('安装弹窗失败/不可用时，点按钮会展开具体步骤（不是静默无反应）',
      feedback.shown && feedback.steps >= 3 && !feedback.disabled,
      `按钮当时写着「${clicked.label}」，展开 ${feedback.steps} 步，按钮可再点=${!feedback.disabled}`);
    await sleep(300);
    await saveShot(cdp, 'kb-install-guide.png');

    const promptPath = await cdp.eval(`(() => {
      let called = 0;
      const ev = new Event('beforeinstallprompt');
      Object.defineProperty(ev, 'prompt', { value: () => { called++; } });
      Object.defineProperty(ev, 'userChoice', { value: Promise.resolve({ outcome: 'accepted' }) });
      window.dispatchEvent(ev);
      const btn = document.getElementById('kiBtn');
      const label = btn.textContent.trim();
      const dot = !document.getElementById('kbFabDot').hidden;
      btn.click();
      return { called, label, dot };
    })()`);
    check('浏览器给出安装机会时，按钮变「安装到桌面」且点击确实调用了 prompt()',
      promptPath.label === '安装到桌面' && promptPath.called === 1 && promptPath.dot,
      `按钮「${promptPath.label}」，prompt() 调用 ${promptPath.called} 次，小按钮角标=${promptPath.dot}`);

    const menuClose = await cdp.eval(`(() => {
      const s = document.getElementById('kbSheet');
      document.getElementById('kbClose').click();
      const byX = { open: s.classList.contains('open'),
                    locked: document.documentElement.classList.contains('kb-lock') };
      document.getElementById('kbFab').click();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      const byEsc = { open: s.classList.contains('open'),
                      locked: document.documentElement.classList.contains('kb-lock') };
      return { byX, byEsc };
    })()`);
    check('二级菜单能用 ✕ 和 Esc 关掉，关闭后页面恢复滚动',
      !menuClose.byX.open && !menuClose.byX.locked && !menuClose.byEsc.open && !menuClose.byEsc.locked,
      JSON.stringify(menuClose));

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

    /* 关键：先把书架滚到底再数封面。
       封面是 loading="lazy" 的，视口外的图压根不会发起请求，
       不滚就数等于在测 Chrome 的懒加载启发式（离线时它会收紧预加载距离），
       而不是在测「封面有没有被缓存」。滚一遍才是家长真实的浏览动作。 */
    await cdp.eval(`(async () => {
      const step = Math.round(window.innerHeight * 0.8);
      for (let y = 0; y <= document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 220));
      }
      window.scrollTo(0, 0);
      await new Promise(r => setTimeout(r, 400));
      return true;
    })()`);
    await sleep(1500);

    const offlineShelf = await cdp.eval(`(() => {
      const cards = document.querySelectorAll('.book-card');
      const imgs = [...document.querySelectorAll('img.cover')];
      const bad = imgs.filter(i => !(i.complete && i.naturalWidth > 0));
      const origin = location.origin;
      const first = imgs[0];
      const rel = first && first.getAttribute('data-kbc');
      return { title: document.title, cards: cards.length,
               imgsWithPixels: imgs.length - bad.length,
               fromCache: imgs.filter(i => (i.currentSrc || i.src || '').startsWith(origin)).length,
               crossOrigin: imgs.filter(i => !(i.currentSrc || i.src || '').startsWith(origin)).length,
               onLine: navigator.onLine,
               swControlled: !!navigator.serviceWorker.controller,
               orderNow: window.KBCDN ? window.KBCDN.candidates(rel)[0] : null,
               firstSrc: first ? (first.getAttribute('src') || '') : '',
               missing: bad.map(i => (i.getAttribute('data-kbc') || i.src || '?')
                 .replace(/^.*?\\/books\\//, '').replace(/^books\\//, '')),
               panelRows: document.querySelectorAll('.offline-row').length };
    })()`);
    log(`  诊断：onLine=${offlineShelf.onLine} SW接管=${offlineShelf.swControlled} ` +
        `此刻候选首选=${offlineShelf.orderNow}`);
    check('离线时书架页仍能打开', offlineShelf.cards === 12, `title=${offlineShelf.title}`);
    check('离线时面板仍可用', offlineShelf.panelRows === 12);
    check('离线时 12 张封面全部有真实像素', offlineShelf.imgsWithPixels === 12,
      `${offlineShelf.imgsWithPixels}/12 张（同源取自缓存 ${offlineShelf.fromCache} 张、跨域 ${offlineShelf.crossOrigin} 张）` +
      (offlineShelf.missing && offlineShelf.missing.length
        ? `；缺 ${offlineShelf.missing.join(',')}` : ''));
    /* 离线时封面必须由同源缓存提供 —— 若还有跨域 src，说明 cdn.js 没切到同源，
       这次能显示只是浏览器磁盘缓存的残留，换个用户/换个滚动位置就会空白 */
    check('离线时封面全部走同源缓存（不靠跨域残留）', offlineShelf.crossOrigin === 0,
      `跨域 ${offlineShelf.crossOrigin} 张`);

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

    /* 弹层是纯本地 DOM，断网也必须能开 —— 否则离线时家长连「哪几本存过」都看不到 */
    const offlineMenu = await cdp.eval(`(() => {
      document.getElementById('kbFab').click();
      const s = document.getElementById('kbSheet');
      const open = s.classList.contains('open');
      const rows = s.querySelectorAll('.offline-row').length;
      const fabText = document.getElementById('kbFabTxt').textContent.trim();
      document.getElementById('kbClose').click();
      return { open, rows, fabText, closed: !s.classList.contains('open') };
    })()`);
    check('离线时二级菜单照常打开（并显示已存本数）',
      offlineMenu.open && offlineMenu.rows === 12 && offlineMenu.closed,
      `小按钮显示「${offlineMenu.fabText}」`);

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
    /* 先请浏览器自己体面退出，再兜底强杀 —— 只 kill 进程树在 Windows 上
       不保证能杀掉真正持有端口的那个进程，会留下残骸影响下一次运行 */
    if (cdp) {
      try { await cdp.send('Browser.close'); } catch {}
      cdp.close();
    }
    if (child && !child.killed) {
      await new Promise((r) => { const t = setTimeout(r, 4000); child.once('exit', () => { clearTimeout(t); r(); }); });
      if (child.exitCode === null && child.signalCode === null) {
        try { child.kill(); } catch {}
        await sleep(500);
      }
    }
    if (server) server.close();
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

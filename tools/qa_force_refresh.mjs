/* ============================================================
   tools/qa_force_refresh.mjs — 验证「服务器改了内容，页面却不变」以及强制刷新

   为什么要有这个测试：navigate() 是「缓存优先 + 后台刷新」，
   服务器内容改了之后第一次打开拿到的仍是旧页面（后台悄悄更新，第二次才见效）。
   维护者改完内容刷新发现没变，很容易误判成「部署失败」——
   这个测试把那条行为钉住，同时守住「强制重新加载」这个出口。

   做法：本地服务器对 index.html 注入一个 <script>window.__BUILD="v1|v2"</script>，
   用一个开关切换。然后：
     1. 冷启动，SW 预缓存 → 页面是 v1
     2. 把服务器切到 v2
     3. 普通刷新       → 断言仍然是 v1（**复现**「服务器改了、页面不变」）
     4. 点「强制重新加载」→ 断言变成 v2（一次到位）

   用法：node tools/qa_force_refresh.mjs
   退出码 0 = 行为符合预期。
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

const CHROME_CANDIDATES = [
  arg('chrome', ''), process.env.CHROME_PATH || '',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome-stable', '/usr/bin/google-chrome', '/usr/bin/chromium',
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
let failures = 0;
function check(name, pass, detail = '') {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
  if (!pass) failures++;
}

/* 服务器侧的可切换开关：模拟「服务器内容已经改了」 */
let flip = false;

function startServer() {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://127.0.0.1');
      let p = decodeURIComponent(url.pathname);
      if (p.endsWith('/')) p += 'index.html';
      const file = path.join(REPO, p);
      if (!file.startsWith(REPO)) { res.writeHead(403).end('forbidden'); return; }
      let buf = await readFile(file);
      if (p.endsWith('index.html')) {
        const tag = flip ? 'v2' : 'v1';
        const src = buf.toString('utf8')
          .replace('</head>', `<script>window.__BUILD="${tag}";</script></head>`);
        buf = Buffer.from(src, 'utf8');
      }
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
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
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

/* 导航途中 evaluate 会短暂失败（执行上下文被销毁），吞掉即可 */
async function softEval(cdp, expr) {
  try { return await cdp.eval(expr); } catch { return undefined; }
}

async function waitBuild(cdp, expect, timeout = 20000) {
  const deadline = Date.now() + timeout;
  let last;
  while (Date.now() < deadline) {
    last = await softEval(cdp, `window.__BUILD || '(none)'`);
    if (last === expect) return last;
    await sleep(200);
  }
  return last;
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

async function main() {
  const chrome = CHROME_CANDIDATES.find((p) => existsSync(p));
  if (!chrome) throw new Error('找不到 Chrome/Edge，可用 --chrome=... 指定');

  const server = await startServer();
  const base = `http://127.0.0.1:${server.address().port}/`;
  log(`静态服务器 ${base}`);

  const profile = await mkdtemp(path.join(tmpdir(), 'kb-refresh-'));
  const child = spawn(chrome, [
    '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check', '--disable-extensions',
    '--disable-gpu', '--window-size=430,932', '--hide-scrollbars',
    ...CHROME_EXTRA_FLAGS, 'about:blank',
  ], { stdio: 'ignore' });

  let cdp;
  try {
    const dbgPort = await readDevToolsPort(profile);
    const targets = await fetchJson(`http://127.0.0.1:${dbgPort}/json/list`);
    cdp = await CDP.connect(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    /* --- 1. 冷启动：SW 预缓存，页面是 v1 --- */
    await cdp.send('Page.navigate', { url: base + 'index.html' });
    const ctrl = await (async () => {
      const deadline = Date.now() + 15000;
      let v;
      while (Date.now() < deadline) {
        v = await softEval(cdp, `!!navigator.serviceWorker.controller`);
        if (v === true) return true;
        await sleep(300);
      }
      return false;
    })();
    check('Service Worker 已接管页面（强制刷新依赖它）', ctrl === true);
    const v1 = await waitBuild(cdp, 'v1');
    check('首次打开拿到 v1', v1 === 'v1', `实际 ${v1}`);

    /* --- 2. 服务器内容改成 v2 --- */
    flip = true;
    log('  （服务器内容已切换为 v2）');

    /* --- 3. 普通刷新：缓存优先，仍是 v1 --- */
    await cdp.send('Page.reload', { ignoreCache: false });
    const afterReload = await waitBuild(cdp, 'v1', 8000);
    check('服务器改了内容后，普通刷新看到的仍是旧页面（复现用户反馈的现象）',
      afterReload === 'v1', `实际 ${afterReload}`);

    /* --- 4. 点「强制重新加载」：一次到位拿到 v2 --- */
    const hasBtn = await softEval(cdp, `!!document.getElementById('kbRefresh')`);
    check('二级菜单里有「强制重新加载」入口', hasBtn === true);

    await softEval(cdp, `document.getElementById('kbFab').click(); true`);
    await sleep(300);
    await softEval(cdp, `document.getElementById('kbRefresh').click(); true`);

    const afterForced = await waitBuild(cdp, 'v2', 30000);
    check('点「强制重新加载」后一次就拿到最新内容 v2',
      afterForced === 'v2', `实际 ${afterForced}`);

    /* --- 5. 离线包不受影响 --- */
    const caches = await softEval(cdp, `(async () => (await caches.keys()))()`);
    check('强制刷新没有动离线包缓存（kb-asset-* 仍在）',
      Array.isArray(caches) && caches.some((n) => n.indexOf('kb-asset') === 0),
      (caches || []).join(', '));

    console.log(failures ? `\n${failures} 项未通过` : '\n全部通过');
  } finally {
    try { await cdp?.send('Browser.close'); } catch {}
    cdp?.close();
    await sleep(400);
    try { child.kill('SIGKILL'); } catch {}
    server.close();
    await rm(profile, { recursive: true, force: true }).catch(() => {});
  }
  process.exit(failures ? 1 : 0);
}

main().catch((e) => { console.error('测试失败：', e); process.exit(1); });

/* ============================================================
   sw.js — Service Worker（站点根目录，作用域 = 整个绘本站）

   两层缓存，用途完全不同：
     1) SHELL 缓存（kb-shell-<内容指纹>）
        页面 / CSS / JS / 图标。每次部署内容一变，指纹就变，
        自动换一个新缓存并删掉旧的 —— 保证家长拿到的是最新版代码。
     2) ASSET 缓存（kb-asset-v1，不随版本走）
        图片与 mp3。项目铁律「图片绝不复用文件名」「音频目录名带版本」
        让这些文件天然不可变，缓存可以长期保留。
        ★ 不随版本清空，是因为家长辛苦下载的离线绘本不该被一次改版抹掉。

   路由策略：
     · 跨域请求（jsDelivr 等）一律放行不拦 —— 跨域响应在 Cache Storage 里
       是不透明响应，配额统计严重虚高且无法校验，交给浏览器自身的 HTTP 缓存。
     · 页面导航：缓存优先 + 后台刷新（断网立刻出页面）
     · 图片/音频：缓存优先（离线包命中这里）
     · 其它同源静态文件：缓存优先，缺了再取网络

   与页面的通信（shared/pwa.js）：
     KB_STATUS    → 回一份各本书的缓存状态
     KB_DOWNLOAD  → 下载指定书的全部资产，过程中回报进度
     KB_CANCEL    → 取消正在进行的下载
     KB_DELETE    → 删除指定书的离线资产
     KB_SKIP_WAITING → 立刻接管（版本更新时由页面触发）
   ============================================================ */
/* global self, caches, clients, fetch, Response, URL, Request */

importScripts('./pwa-assets.js');

var KB = self.KB_ASSETS || { version: 'dev', shell: [], books: {} };
var VERSION = KB.version || 'dev';
var SHELL_CACHE = 'kb-shell-' + VERSION;
var ASSET_CACHE = 'kb-asset-v1';          // 故意不带版本号：离线包要跨版本存活
var KB_PREFIX = 'kb-';
var OFFLINE_PAGE = 'offline.html';

var ROOT_URL = new URL('./', self.location);
function abs(p) { return new URL(p, ROOT_URL).href; }
function isSameOrigin(url) { return url.origin === self.location.origin; }
function isCacheableAsset(pathname) {
  return /\.(webp|png|jpe?g|gif|svg|avif|mp3|m4a|ogg|woff2?|ttf|ico)$/i.test(pathname);
}
/* 把 /kids-books/ 和 /kids-books 都归一化成 /kids-books/index.html，
   否则「根路径」和「根路径下的 index.html」会被当成两个不同的键而漏缓存。 */
function shellKey(url) {
  var u = new URL(url);
  u.hash = '';
  u.search = '';
  if (u.pathname.slice(-1) === '/') u.pathname += 'index.html';
  return u.href;
}

/* ============================================================
   安装：预缓存外壳
   ============================================================ */
self.addEventListener('install', function (event) {
  event.waitUntil((async function () {
    var cache = await caches.open(SHELL_CACHE);
    var results = await Promise.allSettled(KB.shell.map(async function (p) {
      var res = await fetch(new Request(abs(p), { cache: 'no-cache' }));
      if (!res || res.status !== 200) throw new Error(p + ' -> ' + (res && res.status));
      await cache.put(abs(p), res.clone());
      /* 目录别名：/books/bus/ 也要能命中 books/bus/index.html */
      if (/index\.html$/.test(p)) {
        var dir = abs(p.replace(/index\.html$/, ''));
        await cache.put(dir, res.clone());
      }
    }));
    var bad = results.filter(function (r) { return r.status === 'rejected'; });
    if (bad.length) console.warn('[sw] 外壳预缓存部分失败：', bad.map(function (b) { return String(b.reason); }));
  })());
});

/* ============================================================
   激活：清掉旧外壳缓存（保留离线包），并立刻接管页面
   ============================================================ */
self.addEventListener('activate', function (event) {
  event.waitUntil((async function () {
    var names = await caches.keys();
    await Promise.all(names.map(function (n) {
      if (n.indexOf('kb-shell-') === 0 && n !== SHELL_CACHE) return caches.delete(n);
      return null;
    }));
    if (self.registration.navigationPreload) {
      try { await self.registration.navigationPreload.disable(); } catch (e) {}
    }
    await self.clients.claim();
  })());
});

self.addEventListener('message', function (event) {
  var msg = event.data || {};
  var port = event.ports && event.ports[0];
  if (msg.type === 'KB_SKIP_WAITING') { self.skipWaiting(); return; }

  if (msg.type === 'KB_STATUS') {
    event.waitUntil(status().then(function (s) { reply(port, event, s); }));
    return;
  }
  if (msg.type === 'KB_DOWNLOAD') {
    event.waitUntil(downloadBook(msg.bookId, port));
    return;
  }
  if (msg.type === 'KB_CANCEL') {
    if (cancels[msg.bookId]) cancels[msg.bookId] = true;
    else cancels['*'] = true;
    return;
  }
  if (msg.type === 'KB_DELETE') {
    event.waitUntil(deleteBook(msg.bookId).then(function () { return status(); }).then(function (s) {
      reply(port, event, s);
    }));
  }
});

function reply(port, event, data) {
  if (port) { try { port.postMessage(data); return; } catch (e) {} }
  if (event.source && event.source.postMessage) event.source.postMessage(data);
}

/* ============================================================
   状态查询（各本书已缓存了多少文件）
   ============================================================ */
async function status() {
  var cache = await caches.open(ASSET_CACHE);
  var keys = await cache.keys();
  var have = {};
  keys.forEach(function (r) {
    var u = new URL(r.url);
    have[u.pathname + u.search] = true;
  });
  var out = {};
  Object.keys(KB.books).forEach(function (id) {
    var b = KB.books[id];
    var hit = 0;
    b.files.forEach(function (f) { if (have[urlPath(f)]) hit++; });
    out[id] = { total: b.files.length, cached: hit, bytes: b.bytes };
  });
  return { type: 'KB_STATUS', version: VERSION, books: out };
}
function urlPath(p) {
  var u = new URL(abs(p));
  return u.pathname + u.search;
}

/* ============================================================
   按本下载离线包
   ============================================================ */
var cancels = {};
var CONCURRENCY = 4;
var PROGRESS_MIN_GAP = 120;      // 进度节流，别把主线程刷爆

async function downloadBook(bookId, port) {
  var book = KB.books[bookId];
  var post = function (data) { if (port) { try { port.postMessage(data); } catch (e) {} } };
  if (!book) { post({ type: 'KB_PROGRESS', bookId: bookId, state: 'error' }); return; }

  cancels[bookId] = false;
  var cache = await caches.open(ASSET_CACHE);
  var files = book.files;
  var done = 0, bytes = 0, failed = 0;
  var lastPost = 0;
  var totalBytes = book.bytes;

  post({ type: 'KB_PROGRESS', bookId: bookId, state: 'running', done: 0, total: files.length, bytes: 0, totalBytes: totalBytes });

  var idx = 0;
  async function worker() {
    while (idx < files.length) {
      if (cancels[bookId]) return;
      var rel = files[idx++];
      var url = abs(rel);
      try {
        var hit = await cache.match(url);
        if (!hit) {
          var res = await fetch(new Request(url, { cache: 'no-store' }));
          /* 206 不能进 Cache Storage（Cache API 会直接拒绝），
             离线包这边发的是不带 Range 的整包请求，正常应拿到 200 */
          if (res && res.status === 200) {
            bytes += parseInt(res.headers.get('content-length') || '0', 10) || 0;
            await cache.put(url, res.clone());
          } else failed++;
        }
      } catch (e) { failed++; }
      done++;
      var now = Date.now();
      if (now - lastPost > PROGRESS_MIN_GAP) {
        lastPost = now;
        post({ type: 'KB_PROGRESS', bookId: bookId, state: 'running', done: done, total: files.length, bytes: bytes, totalBytes: totalBytes });
      }
    }
  }
  await Promise.all(new Array(CONCURRENCY).fill(0).map(worker));

  if (cancels[bookId]) { delete cancels[bookId]; post({ type: 'KB_PROGRESS', bookId: bookId, state: 'cancelled' }); return; }
  delete cancels[bookId];
  /* 用真实落盘情况重算一次，避免「显示完成但其实有失败」 */
  var st = await status();
  post({
    type: 'KB_PROGRESS', bookId: bookId,
    state: failed ? 'error' : 'done',
    done: done, total: files.length, bytes: bytes, totalBytes: totalBytes,
    books: st.books, failed: failed
  });
}

/* ============================================================
   删除某本书的离线资产
   ============================================================ */
async function deleteBook(bookId) {
  var book = KB.books[bookId];
  if (!book) return;
  var cache = await caches.open(ASSET_CACHE);
  var wanted = {};
  book.files.forEach(function (f) { wanted[urlPath(f)] = true; });
  var keys = await cache.keys();
  await Promise.all(keys.map(function (r) {
    var u = new URL(r.url);
    /* 同一路径可能存过多个 ?v= 版本，一起清掉 */
    return wanted[u.pathname + u.search] ? cache.delete(r) : null;
  }));
}

/* ============================================================
   请求拦截
   ============================================================ */
self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);

  /* 跨域（jsDelivr 图片等）：不介入。
     页面侧的多节点级联已经处理了可用性，浏览器 HTTP 缓存处理重复访问。 */
  if (!isSameOrigin(url)) return;
  /* Service Worker 自身与清单：永远走网络，避免自锁 */
  if (url.pathname.indexOf('/sw.js') >= 0 || url.pathname.indexOf('/pwa-assets.js') >= 0) return;

  if (req.mode === 'navigate') { event.respondWith(navigate(req)); return; }
  event.respondWith(serve(req, url));
});

/* 页面：缓存优先 + 后台刷新 */
async function navigate(req) {
  var cache = await caches.open(SHELL_CACHE);
  var key = shellKey(req.url);
  var cached = await cache.match(key);

  var refresh = fetch(req).then(function (res) {
    if (res && res.status === 200 && res.type !== 'opaque') {
      cache.put(key, res.clone()).catch(function () {});
    }
    return res;
  }).catch(function () { return null; });

  if (cached) return cached;
  var fresh = await refresh;
  if (fresh) return fresh;
  var off = await cache.match(abs(OFFLINE_PAGE));
  if (off) return off;
  return new Response('离线', { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } });
}

/* 其它同源静态资源：缓存优先，缺了取网络并回填 */
async function serve(req, url) {
  var asset = isCacheableAsset(url.pathname);
  var cacheName = asset ? ASSET_CACHE : SHELL_CACHE;
  var cache = await caches.open(cacheName);

  var hit = await cache.match(req);
  if (hit) return hit;

  try {
    var res = await fetch(req);
    /* 只回填完整 200；206 分片响应不能进 Cache Storage */
    if (res && res.status === 200 && res.type !== 'opaque') {
      cache.put(req, res.clone()).catch(function () {});
    }
    return res;
  } catch (e) {
    if (asset) return new Response('', { status: 504, statusText: 'offline' });
    return new Response('离线', { status: 504, headers: { 'content-type': 'text/plain; charset=utf-8' } });
  }
}

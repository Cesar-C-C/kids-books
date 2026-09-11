/* ============================================================
   shared/pwa.js — PWA 客户端：注册 Service Worker + 安装引导 + 离线包面板

   设计要点
   · 站点根路径由本脚本自身 URL 推算（document.currentScript），
     因此同一个文件在 /index.html 和 /books/<id>/index.html 都能直接用。
   · 只在 HTTPS 或 localhost 下生效（Service Worker 的硬性前提）；
     其余环境（含微信内置浏览器、file://）静默跳过，不影响原有功能。
   · 书架页由 DOM 里的 .book-card 反推书单，不在 JS 里再维护一份书名，
     避免以后加书忘了改这里。
   · 离线包走「同源」URL 下载，而不是 jsDelivr：跨域响应在 Cache Storage
     里是不透明响应（opaque），配额统计会严重虚高，也不可校验。
   ============================================================ */
(function () {
  'use strict';

  var SELF = document.currentScript;
  var ROOT = SELF && SELF.src
    ? SELF.src.replace(/\/shared\/pwa\.js.*$/, '')
    : location.origin + location.pathname.replace(/\/[^\/]*$/, '');

  var isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  var supported = 'serviceWorker' in navigator && (location.protocol === 'https:' || isLocal);

  var DISMISS_KEY = 'kb_install_dismissed_v1';
  var reg = null;
  var pendingPrompt = null;

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  function human(bytes) {
    if (!bytes) return '0 KB';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return (bytes / 1048576).toFixed(bytes < 10 * 1048576 ? 1 : 0) + ' MB';
  }

  /* ---------- 与 Service Worker 通信（MessageChannel，回复与进度互不串味） ---------- */
  function call(msg, onMessage) {
    var target = (reg && (reg.active || reg.waiting)) || navigator.serviceWorker.controller;
    if (!target) {
      /* 首次访问时 SW 还没激活，等它就绪后重试一次，别让面板卡在「正在检查」 */
      navigator.serviceWorker.ready.then(function (r) { reg = r; call(msg, onMessage); }).catch(function () {});
      return false;
    }
    var ch = new MessageChannel();
    if (onMessage) ch.port1.onmessage = function (e) { onMessage(e.data); };
    target.postMessage(msg, [ch.port2]);
    return true;
  }

  /* ============================================================
     一、注册 Service Worker
     ============================================================ */
  function registerSW() {
    if (!supported) return;
    navigator.serviceWorker.register(ROOT + '/sw.js', { scope: ROOT + '/' }).then(function (r) {
      reg = r;
      buildPanel();
      /* 有新版本：让它立刻接管，家长不需要做任何动作 */
      r.addEventListener('updatefound', function () {
        var nw = r.installing;
        if (!nw) return;
        nw.addEventListener('statechange', function () {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) {
            nw.postMessage({ type: 'KB_SKIP_WAITING' });
          }
        });
      });
    }).catch(function (err) {
      /* 注册失败（比如被浏览器策略拦下）不应该影响阅读 */
      console.warn('[pwa] Service Worker 注册失败：', err && err.message);
    });
  }

  /* ============================================================
     二、安装引导条
     ============================================================ */
  function isStandalone() {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      window.navigator.standalone === true;
  }
  function isIOS() {
    var ua = navigator.userAgent;
    return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }
  function dismissed() {
    try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch (e) { return false; }
  }

  function buildInstallBar() {
    var shelf = document.querySelector('.shelf');
    if (!shelf || isStandalone() || dismissed()) return;

    var bar = document.createElement('div');
    bar.className = 'install-bar';
    bar.hidden = true;
    bar.innerHTML =
      '<span class="ib-face">📲</span>' +
      '<div class="ib-text"><b>装到桌面，像 App 一样打开</b>' +
      '<span id="ibHint">放到主屏幕后不用再找链接，没网也能看已经下载的绘本。</span></div>' +
      '<div class="ib-actions">' +
      '<button id="ibInstall" hidden>安装到桌面</button>' +
      '<button class="ghost" id="ibClose" title="以后再说">以后</button>' +
      '</div>';

    var host = shelf.querySelector('.shelf-head');
    if (host && host.nextSibling) shelf.insertBefore(bar, host.nextSibling);
    else shelf.insertBefore(bar, shelf.firstChild);

    var btn = bar.querySelector('#ibInstall');

    if (isIOS()) {
      /* iOS 没有安装 API，只能把步骤写清楚 */
      var det = document.createElement('details');
      det.innerHTML =
        '<summary>iPhone / iPad 添加步骤</summary><ol>' +
        '<li>用 <b>Safari</b> 打开本页（微信里打开的不行）</li>' +
        '<li>点底部中间的 <b>分享</b> 按钮 ⬆️</li>' +
        '<li>在菜单里选 <b>「添加到主屏幕」</b></li>' +
        '<li>点右上角 <b>添加</b>，桌面就多了一个图标</li></ol>';
      bar.appendChild(det);
      bar.hidden = false;
    }

    btn.addEventListener('click', function () {
      if (!pendingPrompt) return;
      btn.disabled = true;
      pendingPrompt.prompt();
      pendingPrompt.userChoice.then(function () {
        pendingPrompt = null;
        bar.hidden = true;
      });
    });

    bar.querySelector('#ibClose').addEventListener('click', function () {
      bar.hidden = true;
      try { localStorage.setItem(DISMISS_KEY, '1'); } catch (e) {}
    });

    /* 安卓/桌面 Chrome：浏览器给出安装机会后才显示按钮 */
    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      pendingPrompt = e;
      if (dismissed() || isStandalone()) return;
      btn.hidden = false;
      bar.hidden = false;
    });

    window.addEventListener('appinstalled', function () {
      bar.hidden = true;
      try { localStorage.setItem(DISMISS_KEY, '1'); } catch (e) {}
    });
  }

  /* ============================================================
     三、离线包面板（只在书架页存在 .book-card 时构建）
     ============================================================ */
  var panelState = { books: [], sizes: null, busy: null, pending: {} };

  function readShelf() {
    var cards = document.querySelectorAll('.book-card');
    var out = [];
    for (var i = 0; i < cards.length; i++) {
      var a = cards[i];
      var href = a.getAttribute('href') || '';
      var m = href.match(/books\/([^\/]+)\/index\.html/);
      if (!m) continue;
      var en = a.querySelector('h3');
      var zh = a.querySelector('.zh');
      out.push({
        id: m[1],
        name: (zh && zh.textContent.trim()) || (en && en.textContent.trim()) || m[1],
        en: (en && en.textContent.trim()) || ''
      });
    }
    return out;
  }

  function buildPanel() {
    if (!supported) return;
    var shelf = document.querySelector('.shelf');
    if (!shelf || document.getElementById('offlinePanel')) return;
    panelState.books = readShelf();
    if (!panelState.books.length) return;

    var panel = document.createElement('section');
    panel.className = 'offline-panel';
    panel.id = 'offlinePanel';
    panel.hidden = false;
    panel.innerHTML =
      '<h2>没网也能看</h2>' +
      '<p class="op-sub">把绘本存进这台设备，出门、坐车、回老家都能翻页听朗读。<br>' +
      '建议在 WiFi 下先下载，存好后图标会变成「已存好」。</p>' +
      '<div class="offline-list" id="offlineList"></div>' +
      '<div class="offline-foot">' +
      '<span class="of-note" id="offlineNote">正在检查已存内容…</span>' +
      '<span><button id="offlineAll" class="ghost">全部下载</button></span>' +
      '</div>';

    /* 放在书单标题之前：滚到书架页就能看到，且不打断「3D 实验室」入口的视觉次序 */
    var title = shelf.querySelector('.shelf-section-title');
    var nav = shelf.querySelector('.library-nav');
    var anchor = title || (nav && nav.nextSibling) || shelf.firstChild;
    shelf.insertBefore(panel, anchor);

    document.getElementById('offlineAll').addEventListener('click', function () {
      var todo = panelState.books.filter(function (b) {
        return !(panelState.sizes && panelState.sizes[b.id] && panelState.sizes[b.id].cached >= panelState.sizes[b.id].total);
      });
      downloadQueue(todo.map(function (b) { return b.id; }));
    });

    renderRows();
    loadStatus();
    /* 让浏览器把这份缓存当作「重要数据」，别在空间紧张时清掉 */
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {});
  }

  /* 向 Service Worker 要一次各本书的缓存状态。
     这一步不能省：不主动问，界面永远停在「未下载」。 */
  function loadStatus() {
    call({ type: 'KB_STATUS' }, function (data) {
      if (!data || data.type !== 'KB_STATUS') return;
      panelState.sizes = data.books || {};
      refreshStatus();
    });
  }

  function renderRows() {
    var list = document.getElementById('offlineList');
    if (!list) return;
    list.innerHTML = '';
    panelState.books.forEach(function (b) {
      var row = document.createElement('div');
      row.className = 'offline-row';
      row.id = 'orow-' + b.id;
      row.innerHTML =
        '<div class="or-info">' +
        '<div class="or-name" title="' + b.name + '">' + b.name + '</div>' +
        '<div class="or-size" id="osize-' + b.id + '">计算中…</div>' +
        '</div>' +
        '<button id="obtn-' + b.id + '">下载</button>' +
        '<div class="or-bar"><i id="obar-' + b.id + '"></i></div>';
      list.appendChild(row);
      (function (id) {
        row.querySelector('button').addEventListener('click', function () { onRowButton(id); });
      })(b.id);
    });
  }

  function onRowButton(id) {
    /* 正在下载这本：再点一次就是取消 */
    if (panelState.busy === id) {
      call({ type: 'KB_CANCEL', bookId: id });
      var btn = document.getElementById('obtn-' + id);
      if (btn) { btn.disabled = true; btn.textContent = '取消中…'; }
      return;
    }
    if (panelState.busy) return;      // 正在下载别的：不排队，避免误触
    if (isDone(id)) call({ type: 'KB_DELETE', bookId: id }, function (data) {
      if (data && data.type === 'KB_STATUS') { panelState.sizes = data.books; refreshStatus(); }
    });
    else downloadQueue([id]);
  }

  function isDone(id) {
    var st = panelState.sizes && panelState.sizes[id];
    /* 必须要求 total > 0：否则「状态还没拿到」会被算成 0>=0 = 已下载，
       整列按钮全变成「删除」，家长会以为早就存好了 */
    return !!(st && st.total > 0 && st.cached >= st.total);
  }

  function setRow(id, mode, pct, text) {
    var btn = document.getElementById('obtn-' + id);
    var bar = document.getElementById('obar-' + id);
    var size = document.getElementById('osize-' + id);
    var row = document.getElementById('orow-' + id);
    if (!btn) return;

    var st = panelState.sizes && panelState.sizes[id];
    if (size && text) size.textContent = text;

    if (mode === 'idle') {
      if (!st) {
        /* 状态未到位：禁用按钮，等 KB_STATUS 回来再定 */
        row.classList.remove('done');
        btn.className = ''; btn.textContent = '下载'; btn.disabled = true;
        if (size) size.textContent = '读取中…';
        if (bar) bar.style.width = '0%';
        return;
      }
      var done = st.total > 0 && st.cached >= st.total;
      row.classList.toggle('done', done);
      btn.className = done ? '' : 'go';
      btn.textContent = done ? '删除' : '下载';
      btn.disabled = false;
      if (bar) bar.style.width = done ? '100%' : '0%';
    } else if (mode === 'busy') {
      btn.className = ''; btn.textContent = '取消'; btn.disabled = false;
      if (bar) bar.style.width = (pct || 0) + '%';
    } else if (mode === 'lock') {
      btn.textContent = '等待中'; btn.disabled = true;
      if (bar) bar.style.width = '0%';
    }
  }

  function refreshStatus() {
    var s = panelState.sizes;
    var cachedBooks = 0, bytes = 0;
    panelState.books.forEach(function (b) {
      /* 排队中/下载中的行由进度回调负责刷新，别被这里覆盖掉 */
      if (panelState.pending[b.id]) return;
      var st = s && s[b.id];
      if (!st) { setRow(b.id, 'idle', 0); return; }
      var done = st.total > 0 && st.cached >= st.total;
      if (done) { cachedBooks++; bytes += st.bytes; }
      setRow(b.id, 'idle', done ? 100 : 0,
        done ? '已存好 · ' + human(st.bytes) : human(st.bytes) + ' · 未下载');
    });
    var note = document.getElementById('offlineNote');
    if (note) {
      note.dataset.base = cachedBooks
        ? '已存好 ' + cachedBooks + ' 本（约 ' + human(bytes) + '），断网也能看'
        : '还没有下载任何绘本';
      note.textContent = note.dataset.base;
    }
    updateStorageNote();
  }

  /* 配额信息是异步拿的，必须基于 base 重新拼，
     否则每刷新一次就会在提示后面再粘一段「本机已用 …」 */
  function updateStorageNote() {
    if (!(navigator.storage && navigator.storage.estimate)) return;
    navigator.storage.estimate().then(function (e) {
      var note = document.getElementById('offlineNote');
      if (!note || !e.quota) return;
      note.textContent = (note.dataset.base || '') +
        '　｜　本机已用 ' + human(e.usage || 0) + ' / ' + human(e.quota);
    }).catch(function () {});
  }

  /* 逐本下载：一次只跑一本，避免把家里带宽占满 */
  function downloadQueue(ids) {
    if (!ids.length) return;
    if (panelState.busy) return;
    panelState.busy = ids[0];
    var rest = ids.slice(1);
    ids.forEach(function (id) { panelState.pending[id] = true; });
    rest.forEach(function (id) { setRow(id, 'lock'); });
    setRow(ids[0], 'busy', 0, '准备中…');

    call({ type: 'KB_DOWNLOAD', bookId: ids[0] }, function (msg) {
      if (!msg || msg.type !== 'KB_PROGRESS') return;
      var id = msg.bookId;
      if (msg.state === 'running') {
        var pct = msg.total ? Math.round(msg.done / msg.total * 100) : 0;
        setRow(id, 'busy', pct, '下载中 ' + pct + '%　' + human(msg.bytes) + ' / ' + human(msg.totalBytes));
      } else if (msg.state === 'done') {
        delete panelState.pending[id];
        panelState.sizes = msg.books || panelState.sizes;
        panelState.busy = null;
        refreshStatus();
        if (rest.length) downloadQueue(rest);
      } else {
        delete panelState.pending[id];
        panelState.busy = null;
        setRow(id, 'idle', 0, msg.state === 'cancelled' ? '已取消' : '下载失败，稍后再试');
        if (rest.length) downloadQueue(rest);
      }
    });
    refreshStatus();
  }

  /* ============================================================
     四、启动
     ============================================================ */
  ready(function () {
    buildInstallBar();
    if (!supported) {
      /* 不支持就明确告诉用户为什么没有离线功能，而不是装作无事发生 */
      var panel = document.getElementById('offlinePanel');
      if (panel) panel.hidden = true;
      return;
    }
    registerSW();
  });
})();

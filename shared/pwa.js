/* ============================================================
   shared/pwa.js — PWA 客户端：注册 Service Worker + 安装引导 + 离线包

   设计要点
   · 站点根路径由本脚本自身 URL 推算（document.currentScript），
     因此同一个文件在 /index.html 和 /books/<id>/index.html 都能直接用。
   · 只在 HTTPS 或 localhost 下注册 Service Worker（硬性前提）；
     其余环境（含微信内置浏览器、file://）静默跳过，不影响原有功能。
   · 书架页由 DOM 里的 .book-card 反推书单，不在 JS 里再维护一份书名，
     避免以后加书忘了改这里。
   · 离线包走「同源」URL 下载，而不是 jsDelivr：跨域响应在 Cache Storage
     里是不透明响应（opaque），配额统计会严重虚高，也不可校验。
   · 界面上只留一个角落小按钮，安装与缓存都收进二级菜单（弹层）。
     书架页首屏是给孩子看的，不该被家长用的设置项占版面。

   安装为什么要写这么多分支
   · 只有 Chrome / Edge（安卓 + 桌面）会发 beforeinstallprompt，拿到它才能
     调 prompt() 弹出系统的安装框；Safari / Firefox / 微信一律没有。
   · 「点安装没反应」几乎都出在两条静默路径上，两条都要堵死：
       ① 没有该事件 —— 旧版是 `if (!pendingPrompt) return;` 直接返回；
       ② prompt() 失败 —— 而它失败走的是**返回一个被拒绝的 Promise**，
          不是同步抛异常。旧版没有接 promise 拒绝，于是按钮被置灰后
          永久沉默，家长看到的就是「点了没反应」。
     现在任何一条路径都以「就地展开该浏览器的具体步骤」收尾。
   ============================================================ */
(function () {
  'use strict';

  var SELF = document.currentScript;
  var ROOT = SELF && SELF.src
    ? SELF.src.replace(/\/shared\/pwa\.js.*$/, '')
    : location.origin + location.pathname.replace(/\/[^\/]*$/, '');

  var isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  var supported = 'serviceWorker' in navigator && (location.protocol === 'https:' || isLocal);

  var reg = null;
  var pendingPrompt = null;      // 浏览器给出的安装机会，用过即作废
  var ui = {};                   // 元素引用

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
      loadStatus();               // 缓存状态与界面无关，尽早问一次，点开菜单就是最新的
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
     二、环境识别
     ============================================================ */
  function isStandalone() {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      window.navigator.standalone === true;
  }
  function isIOS() {
    var ua = navigator.userAgent;
    return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }
  function isWeChat() { return /MicroMessenger/i.test(navigator.userAgent); }

  function platformOf() {
    var ua = navigator.userAgent;
    if (isWeChat()) return 'wechat';
    if (isIOS()) return 'ios';
    if (/Android/i.test(ua)) return /EdgA?\//.test(ua) ? 'edge-android' : 'android';
    if (/Edg\//.test(ua)) return 'edge-desktop';
    if (/OPR\//.test(ua)) return 'opera-desktop';
    if (/Firefox\//.test(ua)) return 'firefox';
    if (/Chrome\//.test(ua) || /Chromium\//.test(ua)) return 'chrome-desktop';
    if (/Safari\//.test(ua)) return 'safari-mac';
    return 'other';
  }
  function platformName() {
    return {
      wechat: '微信内置浏览器', ios: 'iPhone / iPad 的 Safari', android: '安卓浏览器',
      'edge-android': '安卓 Edge', 'edge-desktop': '桌面 Edge', 'opera-desktop': 'Opera',
      firefox: 'Firefox', 'chrome-desktop': '桌面 Chrome', 'safari-mac': 'macOS Safari',
      other: '当前浏览器',
    }[platformOf()] || '当前浏览器';
  }

  /* 各浏览器「怎么把网页装成 App」的具体步骤 —— 没有安装 API 时靠它兜底 */
  function guideHTML(why) {
    var p = platformOf();
    var steps, tip = '';
    if (p === 'wechat') {
      steps = ['点右上角 <b>···</b>，选「<b>在浏览器打开</b>」',
        '在手机浏览器里再点一次本页的安装按钮（Safari 用「分享 → 添加到主屏幕」）',
        '装好后桌面会出现「小小探索家」图标'];
      tip = '微信里也能看绘本，但离线缓存要等你在浏览器里打开才行。';
    } else if (p === 'ios') {
      steps = ['必须用 <b>Safari</b> 打开本页（微信、Chrome for iOS 都不行）',
        '点底部中间的 <b>分享</b> 按钮 <b>⬆</b>',
        '在菜单里向下找，选「<b>添加到主屏幕</b>」',
        '点右上角「<b>添加</b>」，桌面就多了一个图标'];
      tip = 'iPhone / iPad 不提供自动安装接口，只能手动添加，这是苹果的限制。';
    } else if (p === 'android' || p === 'edge-android') {
      steps = ['点浏览器右上角的 <b>⋮</b>（更多）',
        '选「<b>添加到主屏幕</b>」或「<b>安装应用</b>」',
        '确认后桌面会出现「小小探索家」图标'];
    } else if (p === 'edge-desktop') {
      steps = ['看地址栏右侧有没有 <b>⋯</b> 或安装图标',
        '点它 → 「<b>应用</b>」→「<b>将此站点作为应用安装</b>」',
        '没有图标就按 F12 里的提示，或从「设置 → 应用」里安装'];
      tip = '装好后可以从开始菜单直接打开，像普通软件一样。';
    } else if (p === 'chrome-desktop') {
      steps = ['看地址栏<b>右侧</b>有没有安装图标（<b>⊕</b> 或小显示器形状）',
        '没有就点右上角 <b>⋮</b> → 「<b>投放、保存和分享</b>」→「<b>安装页面</b>」',
        '也可以点 ⋮ → 「<b>保存并分享</b>」→「<b>安装页面为应用</b>」'];
      tip = '如果这里看不到安装选项，通常是这个站点还没满足浏览器的安装条件，' +
        '或者刚才已经装过一次了。';
    } else if (p === 'safari-mac') {
      steps = ['在菜单栏点「<b>文件</b>」',
        '选「<b>添加到程序坞</b>」（macOS 14 / Safari 17 及以上）',
        '确认后就能从程序坞直接打开'];
      tip = '旧版 macOS 的 Safari 不支持安装网页应用，可以改用 Chrome 或 Edge。';
    } else if (p === 'firefox') {
      steps = ['Firefox 目前不支持把网页装成桌面应用',
        '换用 <b>Chrome</b> / <b>Edge</b> / <b>Safari</b> 打开本页，再点安装',
        '手机上的 Firefox 也一样，系统「添加到主屏幕」只能建快捷方式'];
      tip = '离线阅读本身不受影响：用当前浏览器也能下载绘本、断网查看。';
    } else {
      steps = ['点浏览器菜单（通常是右上角的 <b>⋮</b> 或 <b>···</b>）',
        '找「<b>安装应用</b>」/「<b>添加到主屏幕</b>」这类选项',
        '确认后桌面会出现「小小探索家」图标'];
    }
    return (why ? '<p class="kg-why">' + why + '</p>' : '') +
      '<ol><li>' + steps.join('</li><li>') + '</li></ol>' +
      (tip ? '<p class="kg-tip">' + tip + '</p>' : '');
  }

  /* ============================================================
     三、小按钮 + 二级菜单
     ============================================================ */
  var SVG_TRAY = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">' +
    '<path d="M12 3.6v9.2m0 0 3.9-3.9M12 12.8 8.1 8.9" fill="none" stroke="currentColor" ' +
    'stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M4.2 16.4v2.4c0 1 .8 1.8 1.8 1.8h12c1 0 1.8-.8 1.8-1.8v-2.4" fill="none" ' +
    'stroke="currentColor" stroke-width="2.1" stroke-linecap="round"/></svg>';

  function buildLauncher() {
    var shelf = document.querySelector('.shelf');
    if (!shelf || document.getElementById('kbFab')) return;

    var fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'kb-fab';
    fab.id = 'kbFab';
    fab.setAttribute('aria-haspopup', 'dialog');
    fab.setAttribute('aria-controls', 'kbSheet');
    fab.innerHTML = '<span class="kb-fab-ico">' + SVG_TRAY + '</span>' +
      '<span class="kb-fab-txt" id="kbFabTxt">离线与安装</span>' +
      '<span class="kb-fab-dot" id="kbFabDot" hidden aria-hidden="true"></span>';

    var sheet = document.createElement('div');
    sheet.className = 'kb-sheet';
    sheet.id = 'kbSheet';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.setAttribute('aria-labelledby', 'kbSheetTitle');
    sheet.innerHTML =
      '<div class="kb-backdrop" data-kb-close></div>' +
      '<div class="kb-panel" id="kbPanel" tabindex="-1">' +
      '  <div class="kb-head">' +
      '    <h2 id="kbSheetTitle">离线与安装</h2>' +
      '    <button class="kb-x" id="kbClose" type="button" aria-label="关闭" data-kb-close>&#10005;</button>' +
      '  </div>' +
      '  <section class="kb-sec kb-install">' +
      '    <div class="ki-text">' +
      '      <b id="kiTitle">装到桌面，像 App 一样打开</b>' +
      '      <span id="kiNote">放到主屏幕后不用再找链接，点开就能看。</span>' +
      '    </div>' +
      '    <button type="button" id="kiBtn">安装到桌面</button>' +
      '  </section>' +
      '  <div class="kb-guide" id="kiGuide" hidden></div>' +
      '  <section class="kb-sec kb-offline">' +
      '    <div class="kb-sub" id="kbOfflineTop">' +
      '      <b>把绘本存到本机</b>' +
      '      <span id="kbLead">建议在 WiFi 下先下载，出门、坐车、回老家都能翻页听朗读。</span>' +
      '    </div>' +
      '    <div class="offline-list" id="offlineList"></div>' +
      '    <div class="kb-foot">' +
      '      <span class="of-note" id="offlineNote">正在检查已存内容…</span>' +
      '      <button type="button" id="offlineAll" class="kb-ghost">全部下载</button>' +
      '    </div>' +
      '  </section>' +
      '</div>';

    document.body.appendChild(fab);
    document.body.appendChild(sheet);
    document.body.classList.add('kb-has-fab');

    ui = {
      fab: fab, fabTxt: fab.querySelector('#kbFabTxt'), fabDot: fab.querySelector('#kbFabDot'),
      sheet: sheet, panel: sheet.querySelector('#kbPanel'),
      close: sheet.querySelector('#kbClose'),
      guide: sheet.querySelector('#kiGuide'),
      installBtn: sheet.querySelector('#kiBtn'),
      installTitle: sheet.querySelector('#kiTitle'),
      installNote: sheet.querySelector('#kiNote'),
      lead: sheet.querySelector('#kbLead'),
    };

    /* 没有 Service Worker 就说明白原因，并且不摆出一排点了没用的按钮
       （微信内置浏览器是典型场景：能看绘本，但缓存不了） */
    if (!supported) {
      ui.lead.textContent = isWeChat()
        ? '微信内置浏览器不支持离线缓存。点右上角 ··· → 在浏览器打开，就能把绘本存到本机。'
        : '当前环境不支持离线缓存（需要 HTTPS 打开；本地文件双击打开也不行）。';
      var list = document.getElementById('offlineList');
      var foot = sheet.querySelector('.kb-foot');
      if (list) list.hidden = true;
      if (foot) foot.hidden = true;
    }

    fab.addEventListener('click', openSheet);
    sheet.addEventListener('click', function (e) {
      if (e.target.closest('[data-kb-close]')) closeSheet();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && sheet.classList.contains('open')) closeSheet();
    });
    /* 焦点留在弹层里，Tab 不会跑到背后的书架上去 */
    sheet.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var f = sheet.querySelectorAll('button:not([hidden]):not(:disabled), a[href], [tabindex="0"]');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    ui.installBtn.addEventListener('click', function () {
      if (pendingPrompt) installNow();
      else toggleGuide();
    });

    document.getElementById('offlineAll').addEventListener('click', function () {
      var todo = panelState.books.filter(function (b) { return !isDone(b.id); });
      if (!todo.length) return;
      downloadQueue(todo.map(function (b) { return b.id; }));
    });

    renderRows();
    setInstallUI();

    /* 安卓/桌面 Chrome：浏览器给出安装机会后，按钮变成真正能弹系统框的入口 */
    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      pendingPrompt = e;
      setInstallUI();
    });
    window.addEventListener('appinstalled', function () {
      pendingPrompt = null;
      setInstallUI();
      if (ui.guide) ui.guide.hidden = true;
    });

    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {});
  }

  function openSheet() {
    if (!ui.sheet) return;
    ui.sheet.classList.add('open');
    document.documentElement.classList.add('kb-lock');
    loadStatus();
    if (ui.panel) ui.panel.focus();
  }
  function closeSheet() {
    if (!ui.sheet) return;
    ui.sheet.classList.remove('open');
    document.documentElement.classList.remove('kb-lock');
    if (ui.fab) ui.fab.focus();
  }

  /* ---------- 安装区 ---------- */
  function setInstallUI() {
    if (!ui.installBtn) return;
    if (isStandalone()) {
      ui.installTitle.textContent = '已经装到桌面了 ✓';
      ui.installNote.textContent = '现在就是从桌面图标打开的，可以离线看已下载的绘本。';
      ui.installBtn.hidden = true;
      ui.fabDot.hidden = true;
      return;
    }
    if (pendingPrompt) {
      ui.installTitle.textContent = '装到桌面，像 App 一样打开';
      ui.installNote.textContent = '点下面的按钮，浏览器会弹出确认框。';
      ui.installBtn.hidden = false;
      ui.installBtn.textContent = '安装到桌面';
      ui.installBtn.disabled = false;
      ui.installBtn.classList.add('go');
      if (ui.fabDot) ui.fabDot.hidden = false;      // 可装时小按钮上亮一个点
      return;
    }
    ui.installTitle.textContent = '装到桌面，像 App 一样打开';
    var guideOpen = ui.guide && !ui.guide.hidden;
    ui.installNote.textContent = guideOpen
      ? '按下面的步骤就能装到桌面。'
      : '当前是' + platformName() +
        (platformOf() === 'firefox' ? '，不支持自动安装。' : '，需要手动添加，点右边看步骤。');
    ui.installBtn.hidden = false;
    ui.installBtn.textContent = guideOpen ? '收起步骤' : '看安装步骤';
    ui.installBtn.disabled = false;
    ui.installBtn.classList.remove('go');
    if (ui.fabDot) ui.fabDot.hidden = true;
  }

  /* 手动步骤也能收起：按钮在「看安装步骤 / 收起步骤」之间切换 */
  function toggleGuide() {
    if (ui.guide && !ui.guide.hidden) {
      ui.guide.hidden = true;
      setInstallUI();
    } else {
      showGuide();
    }
  }

  function installNow() {
    var p = pendingPrompt;
    /* 同一个事件只能 prompt() 一次，用过立刻作废；浏览器之后会再给新机会 */
    pendingPrompt = null;
    ui.installBtn.disabled = true;

    var settled = false;
    function settle(why, accepted) {
      if (settled) return;
      settled = true;
      /* 先定步骤区的状态，再刷新按钮文案 —— 反了的话按钮会写成「看安装步骤」
         而步骤其实已经展开，看着像没反应 */
      if (accepted) { if (ui.guide) ui.guide.hidden = true; }
      else showGuide(why);
      setInstallUI();
    }

    /* prompt() 有两种失败方式，必须都接住，否则按钮会静默卡在禁用态：
       · 同步抛异常
       · 返回一个被拒绝的 Promise（Chrome 在没有用户手势、或安装机会
         已经过期时会这样 —— 实战里最容易出现的就是这一种） */
    var pr;
    try {
      pr = p.prompt();
    } catch (err) {
      settle('浏览器这次没有弹出安装窗口，可以按下面的步骤手动添加。');
      return;
    }
    var noDialog = '浏览器这次没有弹出安装窗口（多半是刚才那次安装机会已经用过了），' +
      '可以按下面的步骤手动添加。';
    Promise.resolve(pr).then(function () {
      if (p.userChoice && p.userChoice.then) {
        p.userChoice.then(function (res) {
          settle('刚才的安装框被关掉了，也可以按下面的步骤手动添加。',
            res && res.outcome === 'accepted');
        }).catch(function () { settle(noDialog); });
      } else {
        settle(null, true);
      }
    }, function () {
      settle(noDialog);
    });
  }

  function showGuide(why) {
    if (!ui.guide) return;
    ui.guide.innerHTML = guideHTML(why || '');
    ui.guide.hidden = false;
  }

  /* ============================================================
     四、离线包列表
     ============================================================ */
  var panelState = { books: [], sizes: null, busy: null, pending: {}, pct: 0 };

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

  function renderRows() {
    var list = document.getElementById('offlineList');
    if (!list) return;
    panelState.books = readShelf();
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
        '<button type="button" id="obtn-' + b.id + '">下载</button>' +
        '<div class="or-bar"><i id="obar-' + b.id + '"></i></div>';
      list.appendChild(row);
      (function (id) {
        row.querySelector('button').addEventListener('click', function () { onRowButton(id); });
      })(b.id);
    });
  }

  /* 向 Service Worker 要一次各本书的缓存状态。
     这一步不能省：不主动问，界面永远停在「未下载」。 */
  function loadStatus() {
    if (!supported) return;
    call({ type: 'KB_STATUS' }, function (data) {
      if (!data || data.type !== 'KB_STATUS') return;
      panelState.sizes = data.books || {};
      refreshStatus();
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
        if (row) row.classList.remove('done');
        btn.className = ''; btn.textContent = '下载'; btn.disabled = true;
        if (size) size.textContent = '读取中…';
        if (bar) bar.style.width = '0%';
        return;
      }
      var done = st.total > 0 && st.cached >= st.total;
      if (row) row.classList.toggle('done', done);
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
    updateFab(cachedBooks);
    updateStorageNote();
  }

  /* 小按钮上的字随状态变：下载中给进度，存好了报本数，其余保持中性 */
  function updateFab(cachedBooks) {
    if (!ui.fabTxt) return;
    if (panelState.busy) {
      ui.fabTxt.textContent = '下载中 ' + (panelState.pct || 0) + '%';
      ui.fab.classList.add('busy');
    } else {
      ui.fab.classList.remove('busy');
      ui.fabTxt.textContent = cachedBooks ? '离线 · 已存 ' + cachedBooks + ' 本' : '离线与安装';
    }
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
        panelState.pct = pct;
        setRow(id, 'busy', pct, '下载中 ' + pct + '%　' + human(msg.bytes) + ' / ' + human(msg.totalBytes));
        updateFab();
      } else if (msg.state === 'done') {
        delete panelState.pending[id];
        panelState.sizes = msg.books || panelState.sizes;
        panelState.busy = null;
        panelState.pct = 0;
        refreshStatus();
        if (rest.length) downloadQueue(rest);
      } else {
        delete panelState.pending[id];
        panelState.busy = null;
        panelState.pct = 0;
        setRow(id, 'idle', 0, msg.state === 'cancelled' ? '已取消' : '下载失败，稍后再试');
        updateFab();
        if (rest.length) downloadQueue(rest);
      }
    });
    refreshStatus();
  }

  /* ============================================================
     五、启动
     ============================================================ */
  ready(function () {
    buildLauncher();
    registerSW();
  });
})();

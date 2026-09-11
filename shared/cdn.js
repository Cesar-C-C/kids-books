/* ============================================================
   shared/cdn.js — 静态资源多节点 CDN 级联（唯一真源）

   背景：绘本图片走 jsDelivr 镜像 GitHub 仓库，音频走同源 Pages。
   2026-09-12 实测发现默认节点 cdn.jsdelivr.net 在国内会 301 跳到
   raw.githubusercontent.com（266KB 封面总耗时 10.9s），实测数据：

     gcore.jsdelivr.net       0.62s  (0.585/0.644/0.616)  方差最小
     testingcf.jsdelivr.net   0.75s  (0.738/0.944/0.753)
     cdn.jsdelivr.net        10.94s  301 → raw.githubusercontent.com
     同源 github.io           0.52s  (0.396/1.255/0.523)  有 1.26s 尖峰

   因此改为：多节点级联 + 单节点超时换源 + 同源兜底。
     · 候选顺序默认 gcore → testingcf → cdn → 同源
     · 任一节点 2.5s 内没出结果就换下一个（避免卡在慢节点上白屏）
     · 首访后台探测一次「CDN vs 同源」谁快，结果写入 sessionStorage，
       供本次会话的后续页面使用（不阻塞当前页渲染）

   为什么同源也进候选：国内网络对 github.io 的可达性时好时坏，
   同一个用户在 WiFi / 4G 下最优节点可能不同，靠实测而不是猜。
   ============================================================ */
(function () {
  'use strict';
  if (window.KBCDN) return;

  var GH_PATH = '/gh/Cesar-C-C/kids-books@main/';
  var HOSTS = ['gcore.jsdelivr.net', 'testingcf.jsdelivr.net', 'cdn.jsdelivr.net'];
  var ORIGIN = '*';                 // 哨兵：同源
  var DEFAULT_ORDER = HOSTS.concat([ORIGIN]);

  /* 单节点等待上限。
     别调太小：书架一屏 12 张封面是并发加载的，各自分到的带宽有限，
     实测并发时单张可能要 2–4s。超时太紧会导致「还没加载完就换源」，
     12 张图在几个节点之间来回重下，越换越慢。
     6s 足够容忍并发慢，又明显短于默认节点实际卡住的 10.9s。 */
  var NODE_TIMEOUT = 6000;
  var PROBE_TIMEOUT = 1400;         // 探测单次上限
  var PROBE_MARGIN = 250;           // 同源要赢 CDN 至少这么多毫秒才改序
  var STORE_KEY = 'kb_cdn_order_v1';
  var PROBE_ASSET = 'index.html';   // 仓库里必然存在的小文件

  /* ---------- 站点根路径 ----------
     以本脚本自身的 URL 推算，不依赖页面深度（book 页在 /books/<id>/）。
     例：https://host/kids-books/shared/cdn.js → https://host/kids-books */
  var SELF = document.currentScript;
  var ROOT = SELF && SELF.src
    ? SELF.src.replace(/\/shared\/cdn\.js.*$/, '')
    : location.origin + location.pathname.replace(/\/[^\/]*$/, '');

  function urlFor(node, rel) {
    return node === ORIGIN ? (ROOT + '/' + rel) : ('https://' + node + GH_PATH + rel);
  }

  /* ---------- 会话内生效的顺序（首次使用时冻结） ---------- */
  var frozen = null;
  function order() {
    if (frozen) return frozen;
    /* 断网时直接走同源（由 Service Worker 从缓存里取），
       省掉三次注定失败的跨境 DNS 查询 */
    if (navigator.onLine === false) { frozen = [ORIGIN]; return frozen; }
    var saved = null;
    try { saved = JSON.parse(sessionStorage.getItem(STORE_KEY)); } catch (e) {}
    if (Array.isArray(saved) && saved.length) {
      /* 只接受已知节点，防止手动改坏 sessionStorage 后拼出奇怪 URL */
      var clean = saved.filter(function (n) { return n === ORIGIN || HOSTS.indexOf(n) >= 0; });
      frozen = clean.length ? clean : DEFAULT_ORDER.slice();
    } else {
      frozen = DEFAULT_ORDER.slice();
    }
    return frozen;
  }
  function candidates(rel) {
    return order().map(function (n) { return urlFor(n, rel); });
  }

  /* ---------- 超时换源 ---------- */
  function arm(img) {
    clearTimeout(img.__kbTimer);
    img.__kbTimer = setTimeout(function () {
      /* complete 为 true 说明已有结果（成功或失败），失败路径已由 error 处理 */
      if (!img.complete || img.naturalWidth === 0) retry(img);
    }, NODE_TIMEOUT);
  }

  function retry(img) {
    clearTimeout(img.__kbTimer);
    var rel = img.getAttribute('data-kbc');
    if (!rel) { img.onerror = null; return; }
    var list = candidates(rel);
    var i = (parseInt(img.getAttribute('data-kbi'), 10) || 0) + 1;
    if (i < list.length) {
      img.setAttribute('data-kbi', String(i));
      img.src = list[i];
      arm(img);
    } else {
      /* 所有节点都不行：停止递归，避免无限换源风暴 */
      img.onerror = null;
    }
  }

  /* ---------- 给 img 生成属性串 ----------
     调用点在模板里写作 src="${KBCDN.attrs(rel)}"，因此返回值必须：
       以「候选 URL + 一个双引号（闭合 src）」开头，
       属性值一律用单引号，最后由模板自己的双引号闭合最后一个属性。 */
  function attrs(rel) {
    var list = candidates(rel);
    return list[0] + '" data-kbc=\'' + rel + '\' data-kbi=\'0\' onerror="KBCDN.retry(this)';
  }

  /* ---------- 自动挂超时：观察后续插入的图片 ---------- */
  /* 静态 HTML 里的封面只写 data-kbc 不写 src，由这里按「本会话实测出的顺序」
     补上地址；这样换节点只改 cdn.js 一处，页面 HTML 里不再散落 CDN 域名。 */
  function hydrate(img) {
    if (img.getAttribute('src')) return;
    var rel = img.getAttribute('data-kbc');
    if (!rel) return;
    img.setAttribute('data-kbi', '0');
    img.src = candidates(rel)[0];
  }

  function watch(root) {
    var target = root || document.body;
    if (!target || !window.MutationObserver) return;
    target.addEventListener('load', function (e) {
      var t = e.target;
      if (t && t.tagName === 'IMG' && t.hasAttribute('data-kbc')) clearTimeout(t.__kbTimer);
    }, true);
    new MutationObserver(function (muts) {
      for (var m = 0; m < muts.length; m++) {
        var added = muts[m].addedNodes;
        for (var i = 0; i < added.length; i++) {
          var el = added[i];
          if (!el || el.nodeType !== 1) continue;
          if (el.tagName === 'IMG' && el.hasAttribute('data-kbc')) { hydrate(el); arm(el); }
          else if (el.querySelectorAll) {
            var imgs = el.querySelectorAll('img[data-kbc]');
            for (var j = 0; j < imgs.length; j++) { hydrate(imgs[j]); arm(imgs[j]); }
          }
        }
      }
    }).observe(target, { childList: true, subtree: true });
    /* 静态 HTML 里已有的图（书架封面） */
    var now = document.querySelectorAll('img[data-kbc]');
    for (var k = 0; k < now.length; k++) { hydrate(now[k]); arm(now[k]); }
  }

  /* ---------- 首访后台探测：只影响后续页面，不阻塞当前页 ---------- */
  function timed(u) {
    var t0 = (window.performance && performance.now) ? performance.now() : Date.now();
    var done = false;
    return new Promise(function (resolve) {
      var timer = setTimeout(function () { if (!done) { done = true; resolve(null); } }, PROBE_TIMEOUT);
      fetch(u, { mode: 'no-cors', cache: 'no-store' }).then(function () {
        if (done) return; done = true; clearTimeout(timer);
        resolve(((window.performance && performance.now) ? performance.now() : Date.now()) - t0);
      }).catch(function () {
        if (done) return; done = true; clearTimeout(timer);
        resolve(null);
      });
    });
  }

  function probe() {
    /* 已经测过就别重复打请求 */
    try { if (sessionStorage.getItem(STORE_KEY)) return; } catch (e) {}
    Promise.all([
      timed('https://' + HOSTS[0] + GH_PATH + PROBE_ASSET),
      timed(ROOT + '/' + PROBE_ASSET)
    ]).then(function (r) {
      var cdn = r[0], origin = r[1];
      if (cdn == null && origin == null) return;
      var next;
      if (origin != null && (cdn == null || origin + PROBE_MARGIN < cdn)) {
        next = [ORIGIN].concat(HOSTS);            // 同源明显更快：同源优先
      } else {
        next = HOSTS.concat([ORIGIN]);            // 默认：CDN 优先，同源兜底
      }
      try { sessionStorage.setItem(STORE_KEY, JSON.stringify(next)); } catch (e) {}
    });
  }

  window.KBCDN = {
    hosts: HOSTS,
    path: GH_PATH,
    root: ROOT,
    origin: ORIGIN,
    retry: retry,
    attrs: attrs,
    watch: watch,
    probe: probe,
    order: order,
    /* 调试用：列出某个资源的候选顺序 */
    candidates: candidates,
    /* 网页里 fire-and-forget 调用，失败也不影响任何东西 */
    reset: function () { try { sessionStorage.removeItem(STORE_KEY); } catch (e) {} frozen = null; }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { watch(); probe(); });
  } else {
    watch(); probe();
  }
})();

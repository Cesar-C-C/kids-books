/* Shared layout for data-driven 3D labs. Subject files load first. */
(() => {
  const c=window.LAB_CONFIG,parts=window.LAB_PARTS;
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const sources=(c.sources||[]).filter(s=>/^https?:\/\//.test(s.url)).map(s=>'<a href="'+esc(s.url)+'" target="_blank" rel="noreferrer">'+esc(s.label)+' ↗</a>').join(' ');
  document.title=c.title+' · 小小探索家';
  document.body.insertAdjacentHTML('afterbegin',`
  <header class="topbar">
    <a class="brand" href="../index.html" aria-label="返回 3D 实验室目录"><span class="brand-icon">${esc(c.icon)}</span><span>${esc(c.brand)}<small>${esc(c.brandZh)}</small></span></a>
    <div class="header-right"><span class="age">适合 4–8 岁</span><button id="language" class="quiet" aria-pressed="true">中英双语</button></div>
  </header>
  <nav class="lab-navigation" data-lab-id="${esc(c.id)}" aria-label="实验室导航"></nav>
  <main>
    <section class="intro"><div><p class="eyebrow">${esc(c.eyebrow)}</p><h1>认识${esc(c.modelName)}，<span>藏着多少小秘密？</span></h1><p class="subtitle">${esc(c.subtitle)}</p></div><div class="progress"><span class="progress-star">✦</span><div><strong id="progress-text">0 / ${parts.length}</strong><small>已探索的部件</small></div></div></section>
    <div class="workspace">
      <section class="model-panel" aria-label="${esc(c.modelName)}三维模型交互区域">
        <div class="stage-heading"><span class="live-dot"></span> YOUR ${esc(c.englishName)} <span class="stage-mode" id="stage-mode">整机观察</span></div>
        <div id="viewport" tabindex="0" role="img" aria-label="可旋转${esc(c.modelName)}模型。拖动旋转，滚轮缩放。也可以使用下方视角按钮和右侧部件按钮。">
          <div class="stage-watermark" aria-hidden="true">HELLO,<br> ${esc(c.englishName)}.</div>
          <div id="labels" aria-label="模型上的部件标签"></div>
          <div id="load-error" hidden>3D 模型暂时无法显示。请使用支持 WebGL 的 Chrome 或 Edge 浏览器，并开启图形加速。右侧英文学习卡仍可使用。</div>
        </div>
        <div class="view-tools" aria-label="视角控制"><button id="home-view" title="回到初始视角" aria-label="回到初始视角">⌂</button><button id="top-view">俯视</button><button id="side-view">侧视</button><span></span><button id="zoom-out" aria-label="缩小">−</button><button id="zoom-in" aria-label="放大">＋</button><button id="auto-rotate" aria-pressed="false" aria-label="自动旋转">↻</button></div>
        <p class="gesture"><span>↔ 拖动旋转</span><span>⊕ 滚轮 / 双指缩放</span><span>☝ 点击部件</span></p>
        <div class="assembly-controls"><div class="assembly-title"><span class="control-icon">◈</span><div><strong>看看${esc(c.modelName)}里面的秘密</strong><small>EXPLORE EVERY LITTLE PART</small></div><output id="explode-value" for="explode">0%</output></div><div class="slider-row"><span>合体</span><input id="explode" type="range" min="0" max="100" value="0" aria-label="${esc(c.modelName)}拆解程度"><span>拆解</span></div><div class="assembly-actions"><button id="explode-button" class="primary">◈ 一键拆解</button><button id="assemble" class="secondary">↺ 重新组装</button><button id="toggle-labels" class="label-toggle" aria-pressed="false">Aa 部件名称</button></div></div>
      </section>
      <aside class="learning-panel">
        <div class="lesson-top"><span class="eyebrow">MEET THE PARTS</span><span id="part-number">01 / ${parts.length}</span></div>
        <div id="part-list" class="part-list" aria-label="选择${esc(c.modelName)}部件"></div>
        <article class="lesson" aria-live="polite"><div class="lesson-kicker"><span id="part-symbol">01</span><span id="part-category">${esc(parts[0].category)}</span><span id="visited-tag">已探索 ✓</span></div><h2 id="part-name">${esc(parts[0].name)}</h2><p class="chinese-name" id="part-zh-name">${esc(parts[0].zhName)}</p><p class="english" id="part-en"></p><p class="translation" id="part-zh"></p><button id="speak" class="speak"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15 8a6 6 0 0 1 0 8M18 4a11 11 0 0 1 0 16"/></svg><span>听英文 · Listen</span></button><p id="speech-status" class="speech-status" role="status"></p><div class="try-card"><span>✦</span><div><strong>小小观察员</strong><p id="part-tip"></p></div></div></article>
        <div class="lesson-nav"><button id="prev-part" aria-label="上一个部件">←</button><span>每个部件，都有自己的任务</span><button id="next-part" aria-label="下一个部件">→</button></div>
      </aside>
    </div>
    <section class="challenge-strip"><span class="challenge-icon">☆</span><div><strong>准备好当一名小小${esc(c.modelName)}专家了吗？</strong><p>听一听，找一找，看看你认识了多少部件。</p></div><button id="quiz" class="secondary">找部件挑战 <span>→</span></button></section>
    <footer><span>MADE FOR CURIOUS LITTLE MINDS</span><span>${esc(c.modelNote || "教学示意模型 · 拆解仅用于展示部件关系")} ${sources}</span></footer>
  </main>
  <dialog id="quiz-dialog"><form method="dialog"><button class="dialog-close" aria-label="关闭挑战">×</button></form><p class="eyebrow">LITTLE EXPLORER CHALLENGE</p><h2>找到它，你就是小专家！</h2><p id="quiz-count"></p><p id="quiz-question" class="quiz-question"></p><button id="quiz-speak" class="secondary">听题目 ♪</button><div id="quiz-options"></div><p id="quiz-feedback" role="status"></p><button id="quiz-next" class="primary" hidden>下一题 →</button></dialog>

`);
})();

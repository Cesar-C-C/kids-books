/* ============================================================
   Unified Bilingual Reader Engine
   Consumes globals: BOOK, PAGES, OVL  (defined per book)
   Features: bilingual display + primary-lang toggle, tap-to-read
   (zh & en), interactive hotspots, page flip + progress dots +
   swipe, parent settings (speed / auto-narrate / auto-page /
   primary lang), pre-generated MP3 with CDN + same-origin fallback (no TTS).
   ============================================================ */
window.Reader = {
  init(){
    // Resolve book globals that may be declared either as `window.X` (old books)
    // or as top-level `const X` (new books). Top-level `const` is a global lexical
    // binding and is NOT attached to `window`, so read it explicitly.
    const gv = (name)=>{
      if (typeof window !== 'undefined' && window[name] !== undefined) return window[name];
      try { return (new Function('return ' + name + ';'))(); } catch(e){ return undefined; }
    };
    const BOOK = gv('BOOK');
    const PAGES = gv('PAGES');
    const OVL = gv('OVL') || {};
    if(!BOOK || !PAGES){ console.error('Book data missing'); return; }

    /* ---------- settings (persisted) ---------- */
    const SETTINGS_KEY = 'kidsbook_' + (BOOK.id||'book') + '_settings';
    const settings = { speed:1.0, autoNarrate:true, autoPage:false, primary:'en', muted:false };
    try{ const s = JSON.parse(localStorage.getItem(SETTINGS_KEY)); if(s) Object.assign(settings, s); }catch(e){}
    const saveSettings = ()=>{ try{ localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }catch(e){} };

    /* ---------- build UI ---------- */
    const reader = document.getElementById('reader');
    reader.innerHTML = `
      <div id="book">
        <div id="pages"></div>
        <div id="dots"></div>
        <div id="controls">
          <button class="btn" id="prev">◀ 上一页</button>
          <span id="pager">1 / 1</span>
          <button class="btn primary" id="next">下一页 ▶</button>
          <button class="btn toggle on" id="langBtn" title="切换主导语言">中 / EN</button>
          <button class="btn toggle" id="autoBtn" title="声音开关：点击静音 / 取消静音">🔊</button>
        </div>
        <p class="hint">点文字听朗读 · 点发光小点认识部件 · 左右滑动翻页</p>
      </div>

      <div class="modal-mask" id="settingsMask">
        <div class="modal">
          <h2>家长设置</h2>
          <p class="mh-sub">调整朗读与翻页，设置会自动记住</p>
          <div class="set-row">
            <div class="lab">朗读语速 <small>调快或调慢</small></div>
            <div style="display:flex;align-items:center;gap:8px">
              <input type="range" id="speed" min="0.5" max="1.5" step="0.1" value="1">
              <span class="val" id="speedVal">1.0×</span>
            </div>
          </div>
          <div class="set-row">
            <div class="lab">自动朗读 <small>翻到每页自动读出来</small></div>
            <label class="switch"><input type="checkbox" id="autoNarrate"><span class="slider"></span></label>
          </div>
          <div class="set-row">
            <div class="lab">自动翻页 <small>每 8 秒自动翻到下一页</small></div>
            <label class="switch"><input type="checkbox" id="autoPage"><span class="slider"></span></label>
          </div>
          <div class="set-row">
            <div class="lab">主导语言 <small>哪种语言更显眼、先朗读</small></div>
            <div class="seg" id="primarySeg">
              <button data-lang="en" class="on">English</button>
              <button data-lang="zh">中文</button>
            </div>
          </div>
          <button class="close-btn" id="closeSettings">完成</button>
        </div>
      </div>`;

    const pagesEl = document.getElementById('pages');
    const dotsEl  = document.getElementById('dots');
    const pager   = document.getElementById('pager');
    const titleEl = document.getElementById('bookTitle');
    if(titleEl) titleEl.textContent = BOOK.title + (BOOK.titleZh ? ' · ' + BOOK.titleZh : '');

    /* single shared speech bubble: lives inside #book (position:relative, NOT
       overflow-clipped) so it can render above OR below the art without being
       cut off by the frame. showBubble() positions it per hotspot. */
    const bookEl = document.getElementById('book');
    const bubbleEl = document.createElement('div');
    bubbleEl.id = 'bubble'; bubbleEl.className = 'bubble';
    bubbleEl.innerHTML = '<div class="b-name"></div><div class="b-line-zh"></div><div class="b-line-en"></div><div class="b-fact"></div>';
    bookEl.appendChild(bubbleEl);

    /* ---------- audio engine ---------- */
    const audioEl = new Audio();
    audioEl.preload = 'auto';
    const pad2 = n => String(n).padStart(2,'0');
    const sanitize = s => (s||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');

    /* ---------- CDN acceleration (jsDelivr mirrors GitHub repo) ----------
       国内访问 github.io 较慢（无国内节点+偶发限速），jsDelivr 在国内有 CDN 节点。
       资源 URL 改造规则：book.js 里所有相对路径（assets/xx.webp, audio/xx.mp3）
       拼成 CDN_BASE + 'books/' + BOOK.id + '/' + 相对路径。
       绝对 URL 原样透传（万一以后要切回或者用混合来源）。
       注意：jsDelivr 缓存是按 URL 永久缓存（直到 purge），文件名变了天然绕开缓存
       —— 所以 PNG->WebP 改名后自动用新文件，不会撞 CDN 老缓存。
       CDN 失败回退：若 CDN 边缘偶发不可达（401/网络抖动），自动回退到同源
       GitHub Pages（相对路径），保证阅读器永不因 CDN 抽风而白屏。 */
    const CDN_BASE = 'https://cdn.jsdelivr.net/gh/Cesar-C-C/kids-books@main/';
    /* Same-origin base: book pages live at /<repo>/books/<id>/index.html, so a
       bare relative "books/<id>/..." would resolve against the PAGE url and
       DOUBLE UP (/books/<id>/books/<id>/... -> 404). Compute the repo root from
       the current path so every same-origin URL is root-relative and correct
       from any nested page (also works at a custom domain where /books/ is at
       the site root). */
    const REPO_BASE = (location.pathname.match(/^(.*?)\/books\//) || [, ''])[1];
    const sameOrigin = p => (REPO_BASE + '/books/' + BOOK.id + '/' + p);
    const fallbackUrl = p => sameOrigin(p);
    /* AUDIO is served SAME-ORIGIN (GitHub Pages), NOT via jsDelivr.
       Lesson from the field: jsDelivr caches gh files by PATH and IGNORES the
       ?v=N query bust, so any in-place audio content change (e.g. the
       apostrophe-truncation fix that turned a 8640-byte clip into a 22896-byte
       one) stayed stale on the CDN forever and users kept hearing only "I".
       Same-origin URLs always reflect the latest committed bytes, so audio is
       always correct. Images keep the CDN (large files, speed matters, and
       they bust via filename rename per project convention). */
    const abs = p => {
      if (/^https?:\/\//i.test(p)) return p;
      if (/\.mp3$/i.test(p)) return sameOrigin(p);                 // audio: same-origin (root-relative)
      return CDN_BASE + 'books/' + BOOK.id + '/' + p;             // images: CDN
    };
    const absWithFallback = p => {
      const url = abs(p);
      const fb = fallbackUrl(p);
      if (/^https?:\/\//i.test(p)) return url;   // absolute: no fallback possible
      return `${url}" onerror="this.onerror=null;this.src='${fb}'`;
    };

    const pageUrl  = (i,lang) => aUrl(`${BOOK.audioDir}/page_${pad2(i)}_${lang}.mp3`);
    const wordUrl  = (name,lang) => aUrl(`${BOOK.audioDir}/word_${sanitize(name)}_${lang}.mp3`);
    /* audio content was once silently truncated by a parser bug; after fixing we
       must bust the browser/CDN cache for the (same-named) files, otherwise users
       keep hearing the stale cached clip. Bump AUDIO_VER whenever audio content
       changes — it appends ?v=N so every client re-fetches fresh. */
    const AUDIO_VER = 4;
    const aUrl = p => abs(p) + '?v=' + AUDIO_VER;

    function playAudio(url, lang, onDone){ if(settings.muted){ if(onDone) onDone(); return; }
      audioEl.playbackRate = settings.speed;
      audioEl.onerror = ()=>{ audioEl.onerror=null;
        // CDN 失败 → 回退同源根相对路径（仍是预制 MP3，绝不回退 TTS）
        if(url.indexOf(CDN_BASE)===0){
          const rel = url.slice(CDN_BASE.length + ('books/'+BOOK.id+'/').length);
          audioEl.onerror = ()=>{ audioEl.onerror=null; if(onDone) onDone(); };
          audioEl.src = sameOrigin(rel);
          const p2 = audioEl.play(); if(p2 && p2.catch) p2.catch(()=>{ if(onDone) onDone(); });
        } else { if(onDone) onDone(); }
      };
      audioEl.onended = onDone || null;
      audioEl.pause();
      audioEl.src = url;
      const p = audioEl.play();
      if(p && p.catch) p.catch(()=>{ if(onDone) onDone(); });
    }
    function stopAudio(){ try{ audioEl.pause(); audioEl.currentTime=0; }catch(e){} }

    /* Web Speech (TTS) has been removed entirely — every narration / word / line
       clip is a pre-generated MP3. We only keep a cancel helper so a manual mute
       or page flip can stop any stray OS speech that might still be queued. */
    function cancelSpeech(){ if(window.speechSynthesis) speechSynthesis.cancel(); }
    function playPage(i, lang){
      const p=PAGES[i]; if(!p) return;
      const text = lang==='zh' ? p.zh : p.en;
      if(!text) return;
      stopAudio();
      playAudio(pageUrl(i,lang), lang);
    }
    function playWord(name, nameZh, lang, onDone){
      stopAudio();
      playAudio(wordUrl(name,lang), lang, onDone);
    }
    /* play a bubble hotspot: name mp3 first, then the line mp3 (by unique key).
       Pure pre-generated MP3 — no TTS fallback. */
    function playBubbleAudio(part, lang){
      playWord(part.dataset.name, part.dataset.namezh, lang, ()=>{
        const key = part.dataset.linekey;
        if(key){
          const url = aUrl(`${BOOK.audioDir}/line_${key}_${lang}.mp3`);
          playAudio(url, lang);
        }
      });
    }
    /* ---------- preloading (smoother browsing) ----------
       Warm the browser cache for the current + next page's audio (page narration,
       hotspot name + line clips) and the next page's illustration, so taps and
       page-flips play instantly instead of waiting on the network. */
    function preload(urls){
      if(!urls.length) return;
      if(typeof fetch !== 'function') return;   // jsdom / very old browsers: skip silently
      const CONC = 6; let i = 0, inFlight = 0;
      function next(){
        while(i < urls.length && inFlight < CONC){
          const u = urls[i++]; inFlight++;
          fetch(u, {mode:'no-cors', cache:'force-cache'}).catch(()=>{}).finally(()=>{ inFlight--; next(); });
        }
      }
      next();
    }
    function preloadPageMedia(idx){
      const langs = ['en','zh'];
      const urls = new Set();
      [idx, idx+1].forEach(k=>{
        const p = PAGES[k]; if(!p) return;
        langs.forEach(l => urls.add(pageUrl(k, l)));
        if(p.img){ const im = new Image(); im.src = abs(p.img); }
        const pe = pagesEl.children[k];
        if(pe) pe.querySelectorAll('.part').forEach(part=>{
          const nm = part.dataset.name, lk = part.dataset.linekey;
          langs.forEach(l => { if(nm) urls.add(wordUrl(nm, l)); if(lk) urls.add(aUrl(`${BOOK.audioDir}/line_${lk}_${l}.mp3`)); });
        });
      });
      preload([...urls]);
    }

    /* ---------- render pages ---------- */
    function renderPages(){
      pagesEl.innerHTML='';
      PAGES.forEach((p,i)=>{
        const div=document.createElement('div');
        div.className='page'+(i===0?' active':'');
        const ovSVG = (p.ov && OVL[p.ov]) ? OVL[p.ov]() : '';
        if(p.cover){
          div.innerHTML = `<div class="art"><img class="base" src="${absWithFallback(BOOK.coverImg)}" alt=""></div>
            <div class="cover-text">
              <h1>${BOOK.title}</h1>
              <p class="sub-zh" style="font-size:22px; margin:6px 0 0;">${BOOK.titleZh||''}</p>
              <p class="sub">${BOOK.subtitle||''}</p>
              <p class="sub-zh">${BOOK.subtitleZh||''}</p>
              <p class="age">${BOOK.age||'4-8 岁'} · 点击开始阅读</p>
            </div>`;
        } else if(p.glossary){
          const cards=p.glossary.map(g=>`<div class="gcard" data-name="${g.en}" data-namezh="${g.zh||''}" data-fact="${g.def||''}" data-factzh="${g.defZh||''}"><b>${g.en}</b><span class="gzh">${g.zh||''}</span><span>${g.def||''}</span></div>`).join('');
          const art = p.img?`<div class="art"><img class="base" src="${absWithFallback(p.img)}" alt=""><div class="ovwrap">${ovSVG}</div></div>`:`<div class="art"><div class="ovwrap">${ovSVG}</div></div>`;
          div.innerHTML = art + `<div class="text">
              <button class="speak" title="朗读">🔊</button>
              <p class="lang-block en" data-lang="en">${p.en}</p>
              <p class="lang-block zh" data-lang="zh">${p.zh}</p>
              <div class="glossary">${cards}</div>
            </div>`;
        } else {
          const art = p.img?`<div class="art"><img class="base" src="${absWithFallback(p.img)}" alt=""><div class="ovwrap">${ovSVG}</div></div>`:`<div class="art"><div class="ovwrap">${ovSVG}</div></div>`;
          const info = p.interactive?`<div class="info">点一点发光的小点，认识它的名字！🌟</div>`:'';
          div.innerHTML = art + info + `<div class="text">
              <button class="speak" title="朗读">🔊</button>
              <p class="lang-block en" data-lang="en">${p.en}</p>
              <p class="lang-block zh" data-lang="zh">${p.zh}</p>
            </div>`;
        }
        pagesEl.appendChild(div);
      });
    }

    /* ---------- bubble hotspots (opt-in: only when part has data-line) ---------- */
    let bubbleTimer = null;
    function clearBubble(){
      document.querySelectorAll('.bubble.show').forEach(b => { b.classList.remove('show'); b.classList.remove('on-light'); });
      if (bubbleTimer) { clearTimeout(bubbleTimer); bubbleTimer = null; }
    }
    function showBubble(part){
      const bubble = document.getElementById('bubble');
      if (!bubble) return;
      const book = document.getElementById('book');
      const hot = part.closest('.hot');
      const page = part.closest('.page');
      if (page) page.querySelectorAll('.hot.sel').forEach(h => h.classList.remove('sel'));
      if (hot)  hot.classList.add('sel');
      // Fill text (primary language first, the other as a soft line)
      const lang = settings.primary;
      const name   = (lang === 'zh' ? (part.dataset.namezh || part.dataset.name) : part.dataset.name) || '';
      const lineEn = part.dataset.line    || '';
      const lineZh = part.dataset.linezh  || '';
      /* ADAPTIVE BUBBLE: choose the theme that stays legible against the
         illustration behind this hotspot. bg:'light' -> dark navy bubble
         (white text) for bright backgrounds; otherwise the default cream
         bubble (dark text). Computed at authoring time from the image. */
      bubble.classList.toggle('on-light', part.dataset.bg === 'light');
      bubble.querySelector('.b-name').innerHTML     = `<b>${name}</b>`;
      bubble.querySelector('.b-line-en').textContent = lineEn;
      bubble.querySelector('.b-line-zh').textContent = lineZh;
      // educational fact line (kept from the original v1 hotspots)
      const factZh2 = part.dataset.factzh || '';
      const fact2   = part.dataset.fact   || '';
      const factText = (lang === 'zh' && factZh2) ? factZh2 : (fact2 || factZh2);
      bubble.querySelector('.b-fact').textContent = factText;
      // Position relative to #book (which is position:relative and NOT clipped).
      // Flip the bubble BELOW the dot when the hotspot sits in the upper part of
      // the picture, so it can never be cut off by the top of the frame.
      const r = part.getBoundingClientRect();
      const b = book.getBoundingClientRect();
      let cx = r.left + r.width/2 - b.left;
      let cy = r.top  + r.height/2 - b.top;
      const below = (cy < b.height * 0.45);
      bubble.classList.toggle('below', below);
      // keep the (centered) bubble inside the frame given its own width
      const bw = bubble.offsetWidth || 200;
      const pad = 6;
      cx = Math.min(b.width - bw/2 - pad, Math.max(bw/2 + pad, cx));
      bubble.style.left = cx + 'px';
      bubble.style.top  = cy + 'px';
      // Bounce animation on the hot dot
      if (hot) {
        hot.classList.remove('play-pop');
        void hot.getBoundingClientRect();
        hot.classList.add('play-pop');
        setTimeout(() => hot.classList.remove('play-pop'), 900);
      }
      // force reflow so the show transition replays cleanly on every tap
      void bubble.offsetWidth;
      bubble.classList.add('show');
      // Read the line in the active primary language — pre-generated MP3 only
      // (name then line); no TTS fallback.
      playBubbleAudio(part, lang);
      // Auto-hide after ~12.6s (3x the original 4.2s) so the speech bubble
      // stays long enough for the (often longer) line audio to finish.
      clearTimeout(bubbleTimer);
      bubbleTimer = setTimeout(() => bubble.classList.remove('show'), 12600);
    }

    /* ---------- navigation ---------- */
    let cur=0; const total=PAGES.length;
    let autoPageTimer=null;
    function stopAutoPage(){ if(autoPageTimer){ clearInterval(autoPageTimer); autoPageTimer=null; } }
    function startAutoPage(){ stopAutoPage(); if(!settings.autoPage) return;
      autoPageTimer=setInterval(()=>{ show((cur+1)%total); }, 8000); }

    function applyPrimary(){
      document.querySelectorAll('.page').forEach(el=>el.classList.toggle('primary-zh', settings.primary==='zh'));
      clearBubble();
    }
    function updateLangBtn(){ const b=document.getElementById('langBtn'); if(b) b.classList.toggle('on', true); }
    function show(i){
      cur=Math.max(0, Math.min(total-1, i));
      document.querySelectorAll('.page').forEach((el,idx)=>el.classList.toggle('active', idx===cur));
      applyPrimary();
      pager.textContent=(cur+1)+' / '+total;
      document.querySelectorAll('#dots .dot').forEach((d,idx)=>d.classList.toggle('active', idx===cur));
      stopAudio();
      cancelSpeech();
      clearBubble();
      preloadPageMedia(cur);
      const p=PAGES[cur];
      if(p && p.en && settings.autoNarrate){
        setTimeout(()=>{ if(cur===i) playPage(cur, settings.primary); }, 450);
      }
      if(settings.autoPage) startAutoPage();
    }

    document.getElementById('next').onclick=()=>show(cur+1);
    document.getElementById('prev').onclick=()=>show(cur-1);
    document.addEventListener('keydown', e=>{
      if(e.key==='ArrowRight') show(cur+1);
      if(e.key==='ArrowLeft') show(cur-1);
    });

    /* swipe */
    let touchX=null;
    pagesEl.addEventListener('touchstart', e=>{ touchX=e.changedTouches[0].clientX; }, {passive:true});
    pagesEl.addEventListener('touchend', e=>{
      if(touchX===null) return;
      const dx=e.changedTouches[0].clientX-touchX;
      if(Math.abs(dx)>50){ if(dx<0) show(cur+1); else show(cur-1); }
      touchX=null;
    });

    /* ---------- interaction ---------- */
    function showFact(target, name, nameZh, fact, factZh){
      const page=target.closest('.page');
      let info=page.querySelector('.info');
      if(!info){ info=document.createElement('div'); info.className='info'; const t=page.querySelector('.text'); if(t) t.prepend(info); }
      const nm = settings.primary==='zh' && nameZh ? nameZh : name;
      const f  = settings.primary==='zh' && factZh ? factZh : fact;
      const other = settings.primary==='zh' ? fact : factZh;
      info.innerHTML = `<b>${nm}</b>：${f}` + (other?`<span class="zh">${other}</span>`:'');
    }
    pagesEl.addEventListener('click', e=>{
      const part=e.target.closest('.part');
      if(part){
        // BUBBLE mode (opt-in via data-line, e.g. double-decker bus book):
        // pop a speech bubble next to the dot and read the line. Falls
        // back to the legacy info-bar mode for all other books so the
        // change is fully backward-compatible.
        if(part.dataset.line){ showBubble(part); return; }
        const page=part.closest('.page');
        if(page){
          page.querySelectorAll('.part').forEach(p=>p.classList.remove('sel'));
          part.classList.add('sel');
          showFact(part, part.dataset.name, part.dataset.namezh, part.dataset.fact, part.dataset.factzh);
        }
        playWord(part.dataset.name, part.dataset.namezh, settings.primary);
        return;
      }
      const gc=e.target.closest('.gcard');
      if(gc){
        const page=gc.closest('.page');
        if(page) page.querySelectorAll('.gcard').forEach(c=>c.classList.remove('sel'));
        gc.classList.add('sel');
        showFact(gc, gc.dataset.name, gc.dataset.namezh, gc.dataset.fact, gc.dataset.factzh);
        playWord(gc.dataset.name, gc.dataset.namezh, settings.primary);
        return;
      }
      const page=e.target.closest('.page');
      if(!page || !page.classList.contains('active')) return;
      const langEl=e.target.closest('.lang-block');
      if(langEl){ playPage(cur, langEl.dataset.lang); return; }
      if(e.target.closest('.speak')){ playPage(cur, settings.primary); }
    });

    /* ---------- tap outside bubble → dismiss immediately ----------
       When a speech bubble is showing, a tap anywhere that is NOT the bubble
       itself and NOT a hotspot (which switches to another bubble) closes it
       right away, instead of waiting for the auto-hide countdown. */
    document.addEventListener('click', e=>{
      const b = document.getElementById('bubble');
      if (!b || !b.classList.contains('show')) return;
      if (e.target.closest('.bubble') || e.target.closest('.part')) return;
      clearBubble();
    }, true);

    /* ---------- dots ---------- */
    function buildDots(){
      dotsEl.innerHTML='';
      PAGES.forEach((p,i)=>{
        const b=document.createElement('button');
        b.className='dot'+(p.cover?' cover':'')+(p.glossary?' glossary':'');
        b.title=(i+1)+' / '+total;
        b.onclick=()=>show(i);
        dotsEl.appendChild(b);
      });
    }

    /* ---------- settings modal ---------- */
    const mask=document.getElementById('settingsMask');
    const gearBtn=document.getElementById('gearBtn');
    if(gearBtn) gearBtn.onclick=()=>{ mask.classList.add('show'); };
    document.getElementById('closeSettings').onclick=()=>{ mask.classList.remove('show'); };
    mask.addEventListener('click', e=>{ if(e.target===mask) mask.classList.remove('show'); });

    const speed=document.getElementById('speed');
    const speedVal=document.getElementById('speedVal');
    const autoNarrateCb=document.getElementById('autoNarrate');
    const autoPageCb=document.getElementById('autoPage');
    const primarySeg=document.getElementById('primarySeg');

    speed.value=settings.speed; speedVal.textContent=Number(settings.speed).toFixed(1)+'×';
    autoNarrateCb.checked=settings.autoNarrate;
    autoPageCb.checked=settings.autoPage;
    primarySeg.querySelectorAll('button').forEach(b=>b.classList.toggle('on', b.dataset.lang===settings.primary));

    speed.oninput=()=>{ settings.speed=parseFloat(speed.value); speedVal.textContent=settings.speed.toFixed(1)+'×'; saveSettings(); };
    autoNarrateCb.onchange=()=>{ settings.autoNarrate=autoNarrateCb.checked; saveSettings(); if(!settings.autoNarrate){ stopAudio(); if(window.speechSynthesis) speechSynthesis.cancel(); } };
    autoPageCb.onchange=()=>{ settings.autoPage=autoPageCb.checked; saveSettings(); if(settings.autoPage) startAutoPage(); else stopAutoPage(); };
    primarySeg.querySelectorAll('button').forEach(b=>{
      b.onclick=()=>{
        settings.primary=b.dataset.lang; saveSettings();
        primarySeg.querySelectorAll('button').forEach(x=>x.classList.toggle('on', x.dataset.lang===settings.primary));
        applyPrimary();
        const lb=document.getElementById('langBtn'); if(lb) lb.textContent = settings.primary==='zh' ? 'EN / 中' : '中 / EN';
      };
    });
    const langBtn=document.getElementById('langBtn');
    if(langBtn) langBtn.onclick=()=>{
      settings.primary = settings.primary==='en' ? 'zh' : 'en';
      saveSettings();
      primarySeg.querySelectorAll('button').forEach(x=>x.classList.toggle('on', x.dataset.lang===settings.primary));
      applyPrimary();
      langBtn.textContent = settings.primary==='zh' ? 'EN / 中' : '中 / EN';
    };

    /* ---------- sound toggle (mute) ---------- */
    const autoBtn=document.getElementById('autoBtn');
    function updateAutoBtn(){
      if(!autoBtn) return;
      autoBtn.textContent = settings.muted ? '🔇' : '🔊';
      autoBtn.classList.toggle('on', !settings.muted);
    }
    if(autoBtn){
      autoBtn.onclick=()=>{
        settings.muted = !settings.muted; saveSettings();
        updateAutoBtn();
        if(settings.muted){ stopAudio(); cancelSpeech(); }
      };
    }

    /* ---------- go ---------- */
    renderPages();
    buildDots();
    applyPrimary();
    if(langBtn) langBtn.textContent = settings.primary==='zh' ? 'EN / 中' : '中 / EN';
    updateAutoBtn();
    show(0);
  }
};

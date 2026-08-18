/* ============================================================
   Unified Bilingual Reader Engine
   Consumes globals: BOOK, PAGES, OVL  (defined per book)
   Features: bilingual display + primary-lang toggle, tap-to-read
   (zh & en), interactive hotspots, page flip + progress dots +
   swipe, parent settings (speed / auto-narrate / auto-page /
   primary lang), Edge TTS mp3 primary + Web Speech fallback.
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
    const fallbackUrl = p => ('books/' + BOOK.id + '/' + p);
    const abs = p => (/^https?:\/\//i.test(p) ? p : (CDN_BASE + 'books/' + BOOK.id + '/' + p));
    const absWithFallback = p => {
      const url = abs(p);
      const fb = fallbackUrl(p);
      if (/^https?:\/\//i.test(p)) return url;   // absolute: no fallback possible
      return `${url}" onerror="this.onerror=null;this.src='${fb}'`;
    };

    const pageUrl  = (i,lang) => abs(`${BOOK.audioDir}/page_${pad2(i)}_${lang}.mp3`);
    const wordUrl  = (name,lang) => abs(`${BOOK.audioDir}/word_${sanitize(name)}_${lang}.mp3`);

    function playAudio(url, lang, fallbackText){ if(settings.muted) return;
      audioEl.playbackRate = settings.speed;
      audioEl.onerror = ()=>{ audioEl.onerror=null;
        // CDN 失败 → 回退同源相对路径；再失败 → Web Speech 兜底
        if(url.indexOf(CDN_BASE)===0){
          const rel = url.slice(CDN_BASE.length + ('books/'+BOOK.id+'/').length);
          audioEl.onerror = ()=>{ audioEl.onerror=null; webSpeak(fallbackText, lang); };
          audioEl.src = 'books/' + BOOK.id + '/' + rel;
          const p2 = audioEl.play(); if(p2 && p2.catch) p2.catch(()=>{ webSpeak(fallbackText, lang); });
        } else webSpeak(fallbackText, lang);
      };
      audioEl.pause();
      audioEl.src = url;
      const p = audioEl.play();
      if(p && p.catch) p.catch(()=>{ webSpeak(fallbackText, lang); });
    }
    function stopAudio(){ try{ audioEl.pause(); audioEl.currentTime=0; }catch(e){} }

    let voices = [];
    function loadVoices(){ voices = (window.speechSynthesis ? speechSynthesis.getVoices() : []) || []; }
    if(window.speechSynthesis){ loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
    function pickVoice(lang){
      if(!voices.length) return null;
      const target = lang==='zh' ? 'zh' : 'en';
      const same = voices.filter(v=>v.lang && v.lang.toLowerCase().startsWith(target));
      if(!same.length) return null;
      if(target==='en'){
        const quality=['Natural','Neural','Premium','Enhanced','Online'];
        const names=['Aria','Jenny','Ana','Ryan','Samantha','Google US English','Google UK English','Zira','David','Alex','Victoria','Tessa'];
        const score=v=>{ let s=(v.lang.toLowerCase()==='en-us')?100:50;
          const q=quality.findIndex(q=>v.name.includes(q)); if(q>=0)s+=(10-q)*10;
          const i=names.findIndex(n=>v.name.includes(n)); if(i>=0)s+=(20-i)*2; return s; };
        return same.slice().sort((a,b)=>score(b)-score(a))[0];
      } else {
        const names=['Xiaoxiao','Huihui','Yaoyao','Kangkang','Ting-Ting','Mei','Chinese','普通话'];
        const score=v=>{ let s=0; const i=names.findIndex(n=>v.name.includes(n)); if(i>=0)s+=(20-i)*3; if(v.lang.toLowerCase()==='zh-cn')s+=30; return s; };
        return same.slice().sort((a,b)=>score(b)-score(a))[0];
      }
    }
    function webSpeak(raw, lang){
      if(settings.muted) return;
      if(!window.speechSynthesis) return;
      speechSynthesis.cancel();
      let text=(raw||'').toString().replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
      if(lang==='en') text=text.replace(/\b[A-Z]{2,}\b/g, m=>m.toLowerCase());
      const u=new SpeechSynthesisUtterance(text);
      u.lang = lang==='zh' ? 'zh-CN' : 'en-US';
      u.rate = settings.speed; u.pitch=1.0; u.volume=1;
      const v=pickVoice(lang); if(v) u.voice=v;
      speechSynthesis.speak(u);
    }
    function playPage(i, lang){
      const p=PAGES[i]; if(!p) return;
      const text = lang==='zh' ? p.zh : p.en;
      if(!text) return;
      stopAudio();
      playAudio(pageUrl(i,lang), lang, text);
    }
    function playWord(name, nameZh, lang){
      const fallback = lang==='zh' ? (nameZh||name) : name;
      stopAudio();
      playAudio(wordUrl(name,lang), lang, fallback);
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
          const bubbleHtml = `<div class="bubble"><div class="b-name"></div><div class="b-line-zh"></div><div class="b-line-en"></div></div>`;
          const art = p.img?`<div class="art"><img class="base" src="${absWithFallback(p.img)}" alt=""><div class="ovwrap">${ovSVG}</div>${bubbleHtml}</div>`:`<div class="art"><div class="ovwrap">${ovSVG}</div>${bubbleHtml}</div>`;
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
      document.querySelectorAll('.bubble.show').forEach(b => b.classList.remove('show'));
      if (bubbleTimer) { clearTimeout(bubbleTimer); bubbleTimer = null; }
    }
    function showBubble(part){
      const page = part.closest('.page');
      const art  = part.closest('.art');
      const bubble = art && art.querySelector('.bubble');
      if (!bubble) return;
      // The whole visible dot group is the <g class="hot"> ancestor; animate
      // and highlight it as one unit.
      const hot = part.closest('.hot');
      if (page) page.querySelectorAll('.hot.sel').forEach(h => h.classList.remove('sel'));
      if (hot)  hot.classList.add('sel');
      // Fill text
      const lang = settings.primary;
      const name   = (lang === 'zh' ? (part.dataset.namezh || part.dataset.name) : part.dataset.name) || '';
      const lineEn = part.dataset.line    || '';
      const lineZh = part.dataset.linezh  || '';
      bubble.querySelector('.b-name').innerHTML     = `<b>${name}</b>`;
      bubble.querySelector('.b-line-en').textContent = lineEn;
      bubble.querySelector('.b-line-zh').textContent = lineZh;
      // Position by the part's center, clamped within art bounds so the bubble
      // never overflows. SVG coords are stretched to fill .art (preserveAspectRatio=none)
      // so the percent math maps the dot's screen rect directly.
      const r = part.getBoundingClientRect();
      const w = art.getBoundingClientRect();
      let left = ((r.left + r.width/2 - w.left) / w.width)  * 100;
      let top  = ((r.top  + r.height/2 - w.top ) / w.height) * 100;
      left = Math.min(86, Math.max(14, left));
      top  = Math.min(68, Math.max(26, top));
      bubble.style.left = left + '%';
      bubble.style.top  = top  + '%';
      bubble.classList.add('show');
      // Bounce animation on the hot dot
      if (hot) {
        hot.classList.remove('play-pop');
        void hot.getBoundingClientRect();
        hot.classList.add('play-pop');
        setTimeout(() => hot.classList.remove('play-pop'), 900);
      }
      // Read the line in the active primary language (Web Speech; no per-line mp3 needed)
      const line = lang === 'zh' ? (lineZh || lineEn) : (lineEn || lineZh);
      webSpeak(line, lang);
      // Auto-hide after 4.2s
      clearTimeout(bubbleTimer);
      bubbleTimer = setTimeout(() => bubble.classList.remove('show'), 4200);
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
      if(window.speechSynthesis) speechSynthesis.cancel();
      clearBubble();
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
        if(settings.muted){ stopAudio(); if(window.speechSynthesis) speechSynthesis.cancel(); }
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

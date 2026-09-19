(function (root) {
  'use strict';

  const GROUPS = Object.freeze({
    'bedtime-story': Object.freeze([0, 1, 2]),
    'tooth-city': Object.freeze([3, 4, 5, 6, 7, 8, 9]),
    'brushing-route': Object.freeze([10, 11, 12, 13])
  });
  const SECTIONS = Object.freeze(Object.keys(GROUPS));
  const SCENE_LABELS = Object.freeze([
    ['牙齿里的小洞洞', 'The Little Hole in a Tooth'], ['今晚能不刷牙吗？', 'Can I skip brushing?'], ['午夜酸雨警报', 'Midnight acid alarm'],
    ['微生物社区', 'Microbe community'], ['糖和淀粉留下来', 'Sugar and starch remain'], ['细菌产生酸', 'Bacteria make acid'],
    ['牙釉质失去矿物质', 'Enamel loses minerals'], ['唾液和氟化物帮忙', 'Saliva and fluoride help'], ['小洞形成', 'A cavity forms'],
    ['牙医来修补', 'The dentist repairs'], ['豌豆大小牙膏', 'Pea-sized toothpaste'], ['刷到每一个牙面', 'Brush every surface'],
    ['每天两次，每次两分钟', 'Twice a day for two minutes'], ['疼痛就告诉大人', 'Tell a grown-up about pain']
  ]);
  const STORAGE_KEY = 'kb-cavities-castle-v2';
  const AUDIO_VER = 6;
  const ZONE_LABELS = Object.freeze({
    outer: ['外侧', 'Outer'],
    inner: ['内侧', 'Inner'],
    chewing: ['咀嚼面', 'Chewing']
  });

  function flattenGroups() {
    return Object.values(GROUPS).flat().sort((a, b) => a - b);
  }

  function normalizeSection(hash) {
    const id = String(hash || '').replace(/^#/, '');
    return SECTIONS.includes(id) ? id : 'bedtime-story';
  }

  function pad2(value) {
    return String(value).padStart(2, '0');
  }

  function makeElement(doc, name, className, text) {
    const element = doc.createElement(name);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function getSaved(storage) {
    try {
      const value = JSON.parse(storage.getItem(STORAGE_KEY) || '{}');
      return { language: value.language === 'en' ? 'en' : 'zh' };
    } catch {
      return { language: 'zh' };
    }
  }

  function save(storage, state) {
    try { storage.setItem(STORAGE_KEY, JSON.stringify({ language: state.language })); } catch {}
  }

  function createNarrator(win, status) {
    let audio = null;
    let token = 0;
    function stop() {
      token += 1;
      if (audio) { audio.pause(); audio.removeAttribute('src'); audio.load(); audio = null; }
      if (win.speechSynthesis) win.speechSynthesis.cancel();
      status.textContent = '';
    }
    function play(index, language, text, onDone) {
      stop();
      const playToken = token;
      let usedFallback = false;
      const finish = function () {
        if (playToken !== token) return;
        status.textContent = '';
        audio = null;
        if (onDone) onDone();
      };
      const fallback = function () {
        if (playToken !== token || usedFallback) return;
        usedFallback = true;
        if (audio) { audio.onerror = null; audio.pause(); audio = null; }
        if (!win.speechSynthesis || typeof win.SpeechSynthesisUtterance !== 'function') {
          status.textContent = language === 'zh' ? '当前设备不支持语音，可阅读文字。' : 'Speech unavailable; read the text.';
          return;
        }
        const utterance = new win.SpeechSynthesisUtterance(text);
        utterance.lang = language === 'zh' ? 'zh-CN' : 'en-US';
        utterance.rate = language === 'zh' ? 0.86 : 0.88;
        utterance.onend = finish;
        utterance.onerror = finish;
        win.speechSynthesis.speak(utterance);
        status.textContent = language === 'zh' ? '设备语音' : 'Device voice';
      };
      // Revised copy must not replay the older recording. Device speech reads
      // the current text until replacement bilingual recordings are supplied.
      if (root.PAGES[index].narrationNeedsUpdate) { fallback(); return; }
      audio = new win.Audio(`audio/page_${pad2(index)}_${language}.mp3?v=${AUDIO_VER}`);
      audio.onended = finish;
      audio.onerror = fallback;
      audio.onplaying = function () { if (playToken === token) status.textContent = ''; };
      status.textContent = language === 'zh' ? '正在加载声音…' : 'Loading audio…';
      audio.play().catch(fallback);
    }
    return { play, stop };
  }

  function sceneText(page, language) {
    return language === 'zh' ? page.zh : page.en;
  }

  function mountImage(win, figure, page, index, language) {
    const img = makeElement(win.document, 'img', 'story-image');
    img.loading = index === 0 ? 'eager' : 'lazy';
    img.decoding = 'async';
    img.src = page.img;
    img.alt = language === 'zh' ? (page.altZh || page.title || '') : (page.alt || page.titleEn || '');
    img.dataset.kbc = page.img;
    img.dataset.kbi = '0';
    const error = makeElement(win.document, 'div', 'image-error');
    error.hidden = true;
    error.appendChild(makeElement(win.document, 'p', '', '图片暂未加载，故事文字仍可阅读。 / Image unavailable; the story remains readable.'));
    const retry = makeElement(win.document, 'button', '', '重新加载 / Retry');
    retry.type = 'button';
    retry.addEventListener('click', function () {
      error.hidden = true;
      img.dataset.kbi = '0';
      img.src = page.img.split('?')[0] + `?retry=${Date.now()}`;
    });
    error.appendChild(retry);
    img.addEventListener('load', function () { error.hidden = true; });
    img.addEventListener('error', function () {
      if (root.KBCDN && img.dataset.kbi === '0') root.KBCDN.retry(img);
      else error.hidden = false;
    });
    figure.append(img, error);
    return img;
  }

  function createStoryCard(win, page, index, state, narrator) {
    const doc = win.document;
    const article = makeElement(doc, 'article', 'story-card');
    article.dataset.pageIndex = String(index);
    const figure = makeElement(doc, 'figure', 'story-visual');
    const img = mountImage(win, figure, page, index, state.language);
    const caption = makeElement(doc, 'figcaption', 'story-caption');
    const label = SCENE_LABELS[index];
    caption.append(makeElement(doc, 'strong', 'copy-zh', page.title || label[0]), makeElement(doc, 'span', 'copy-en', page.titleEn || label[1]));
    figure.appendChild(caption);
    const copy = makeElement(doc, 'div', 'story-copy-panel');
    copy.append(
      makeElement(doc, 'p', 'story-copy copy-zh', page.zh || ''),
      makeElement(doc, 'p', 'story-copy copy-en', page.en || '')
    );
    const listen = makeElement(doc, 'button', 'story-listen', '▶ 听这一段 / Listen');
    listen.type = 'button';
    listen.addEventListener('click', function () { narrator.play(index, state.language, sceneText(page, state.language)); });
    copy.appendChild(listen);
    if (page.factZh || page.factEn) {
      const details = makeElement(doc, 'details', 'science-note');
      const summary = makeElement(doc, 'summary', '', state.language === 'zh' ? (page.why || '为什么？') : (page.whyEn || 'Why?'));
      details.append(summary, makeElement(doc, 'p', 'copy-zh', page.factZh || ''), makeElement(doc, 'p', 'copy-en', page.factEn || ''));
      copy.appendChild(details);
    }
    article.append(figure, copy);
    article.__refreshLanguage = function () {
      img.alt = state.language === 'zh' ? (page.altZh || page.title || '') : (page.alt || page.titleEn || '');
      const summary = article.querySelector('summary');
      if (summary) summary.textContent = state.language === 'zh' ? (page.why || '为什么？') : (page.whyEn || 'Why?');
    };
    return article;
  }

  function mountCity(win, state, narrator) {
    const doc = win.document;
    const indices = GROUPS['tooth-city'];
    const timeline = doc.getElementById('decay-timeline');
    const image = doc.getElementById('city-image');
    const caption = doc.getElementById('city-caption');
    const detail = doc.getElementById('city-detail');
    const error = doc.getElementById('city-image-error');
    let current = indices[0];

    function render(index) {
      current = index;
      const page = root.PAGES[index];
      image.src = page.img;
      image.alt = state.language === 'zh' ? (page.altZh || page.title || '') : (page.alt || page.titleEn || '');
      image.dataset.kbc = page.img;
      image.dataset.kbi = '0';
      const label = SCENE_LABELS[index];
      caption.textContent = state.language === 'zh' ? (page.title || label[0]) : (page.titleEn || label[1]);
      detail.replaceChildren(
        makeElement(doc, 'p', 'copy-zh', page.zh || ''),
        makeElement(doc, 'p', 'copy-en', page.en || ''),
        makeElement(doc, 'p', 'city-fact copy-zh', page.factZh || ''),
        makeElement(doc, 'p', 'city-fact copy-en', page.factEn || '')
      );
      const listen = makeElement(doc, 'button', 'story-listen', '▶ 听这一段 / Listen');
      listen.type = 'button';
      listen.addEventListener('click', function () { narrator.play(index, state.language, sceneText(page, state.language)); });
      detail.appendChild(listen);
      timeline.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.pageIndex) === index)));
      error.hidden = true;
    }

    indices.forEach(function (index, order) {
      const page = root.PAGES[index];
      const label = SCENE_LABELS[index];
      const button = makeElement(doc, 'button', 'timeline-step');
      button.type = 'button';
      button.dataset.pageIndex = String(index);
      button.setAttribute('role', 'listitem');
      button.setAttribute('aria-pressed', 'false');
      button.append(makeElement(doc, 'span', '', String(order + 1)), makeElement(doc, 'b', 'copy-zh', page.title || label[0]), makeElement(doc, 'b', 'copy-en', page.titleEn || label[1]));
      button.addEventListener('click', function () { narrator.stop(); render(index); });
      timeline.appendChild(button);
    });
    image.addEventListener('load', function () { error.hidden = true; });
    image.addEventListener('error', function () {
      if (root.KBCDN && image.dataset.kbi === '0') root.KBCDN.retry(image);
      else error.hidden = false;
    });
    error.querySelector('button').addEventListener('click', function () {
      image.dataset.kbi = '0';
      image.src = root.PAGES[current].img.split('?')[0] + `?retry=${Date.now()}`;
    });
    render(current);
    return { refresh: function () { render(current); } };
  }

  function mountBrushPractice(win) {
    const doc = win.document;
    const controls = doc.getElementById('brush-zone-controls');
    const status = doc.getElementById('brush-status');
    let state = { completed: [] };
    root.CavitiesActivity.BRUSH_ZONES.forEach(function (zone) {
      const label = ZONE_LABELS[zone];
      const button = makeElement(doc, 'button', 'brush-zone-button', `${label[0]} / ${label[1]}`);
      button.type = 'button';
      button.dataset.zone = zone;
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', function () {
        state = root.CavitiesActivity.markZone(state, zone);
        button.setAttribute('aria-pressed', 'true');
        status.textContent = state.completed.length === root.CavitiesActivity.BRUSH_ZONES.length
          ? '每个牙面都刷到了。 / Every surface is brushed.'
          : `${label[0]}已刷到。 / ${label[1]} surfaces brushed.`;
      });
      controls.appendChild(button);
    });
  }

  function mountTimer(win) {
    const doc = win.document;
    const countdown = doc.getElementById('brush-countdown');
    const status = doc.getElementById('timer-status');
    const buttons = Object.fromEntries(Array.from(doc.querySelectorAll('#timer-controls [data-action]')).map(button => [button.dataset.action, button]));
    function format(milliseconds) {
      const seconds = Math.ceil(milliseconds / 1000);
      return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
    }
    function render(state) {
      countdown.textContent = format(state.remaining);
      buttons.start.disabled = state.status === 'running' || state.status === 'paused';
      buttons.pause.disabled = state.status !== 'running';
      buttons.resume.disabled = state.status !== 'paused';
      status.textContent = {
        idle: '准备好后再开始。 / Start when you are ready.',
        running: '计时进行中，可以放下设备。 / Timer running; you may put the device down.',
        paused: '计时已暂停。 / Timer paused.',
        finished: '两分钟到了，请让大人帮忙检查。 / Two minutes are up; ask a grown-up to check.'
      }[state.status];
    }
    const timer = root.CavitiesActivity.createTimerController({ onTick: render });
    buttons.start.addEventListener('click', timer.start);
    buttons.pause.addEventListener('click', timer.pause);
    buttons.resume.addEventListener('click', timer.resume);
    buttons.reset.addEventListener('click', timer.reset);
    doc.addEventListener('visibilitychange', function () { if (doc.hidden) timer.suspend(); });
    win.addEventListener('pagehide', timer.suspend);
    if (typeof win.IntersectionObserver === 'function') {
      const observer = new win.IntersectionObserver(entries => {
        if (entries[0] && !entries[0].isIntersecting) timer.suspend();
      }, { threshold: .08 });
      observer.observe(doc.getElementById('brushing-route'));
    }
    render(timer.getState());
    return timer;
  }

  function mount(win) {
    const doc = win.document;
    if (!doc.getElementById('experience') || !Array.isArray(root.PAGES)) return false;
    const state = getSaved(win.localStorage);
    const narrator = createNarrator(win, doc.getElementById('audio-status'));
    const cards = [];
    for (const sectionId of ['bedtime-story', 'brushing-route']) {
      const container = doc.querySelector(`[data-group="${sectionId}"]`);
      for (const index of GROUPS[sectionId]) {
        const card = createStoryCard(win, root.PAGES[index], index, state, narrator);
        cards.push(card);
        container.appendChild(card);
      }
    }
    const city = mountCity(win, state, narrator);
    mountBrushPractice(win);
    const timer = mountTimer(win);

    function applyLanguage() {
      doc.body.dataset.language = state.language;
      doc.documentElement.lang = state.language === 'zh' ? 'zh-CN' : 'en';
      doc.getElementById('language').textContent = state.language === 'zh' ? 'EN' : '中文';
      cards.forEach(card => card.__refreshLanguage());
      city.refresh();
      save(win.localStorage, state);
      narrator.stop();
    }
    doc.getElementById('language').addEventListener('click', function () {
      state.language = state.language === 'zh' ? 'en' : 'zh';
      applyLanguage();
    });
    const sectionButton = doc.getElementById('narrate-section');
    sectionButton.addEventListener('click', function () {
      const section = normalizeSection(win.location.hash);
      const indices = GROUPS[section];
      let cursor = 0;
      sectionButton.setAttribute('aria-pressed', 'true');
      const next = function () {
        if (cursor >= indices.length) { sectionButton.setAttribute('aria-pressed', 'false'); return; }
        const index = indices[cursor++];
        narrator.play(index, state.language, sceneText(root.PAGES[index], state.language), next);
      };
      next();
    });
    function setActive(sectionId) {
      doc.querySelectorAll('[data-section-link]').forEach(link => {
        if (link.dataset.sectionLink === sectionId) link.setAttribute('aria-current', 'step');
        else link.removeAttribute('aria-current');
      });
    }
    setActive(normalizeSection(win.location.hash));
    if (typeof win.IntersectionObserver === 'function') {
      const observer = new win.IntersectionObserver(entries => {
        const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      }, { threshold: [0.25, 0.5, 0.75] });
      SECTIONS.forEach(id => observer.observe(doc.getElementById(id)));
    }
    win.addEventListener('hashchange', function () { narrator.stop(); timer.suspend(); setActive(normalizeSection(win.location.hash)); });
    doc.addEventListener('visibilitychange', function () { if (doc.hidden) narrator.stop(); });
    win.addEventListener('pagehide', narrator.stop);
    applyLanguage();
    return true;
  }

  const api = { GROUPS, flattenGroups, normalizeSection, mount };
  root.CavitiesJourney = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root.document) {
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', function () { mount(root); });
    else mount(root);
  }
})(typeof window !== 'undefined' ? window : globalThis);

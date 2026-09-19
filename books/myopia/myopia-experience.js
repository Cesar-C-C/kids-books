(function (root) {
  'use strict';

  const GROUPS = Object.freeze({
    discover: Object.freeze([0, 1, 2, 3]),
    'follow-light': Object.freeze([4, 5, 6, 7]),
    'focus-lab': Object.freeze([11]),
    'take-action': Object.freeze([8, 9, 10, 12, 13])
  });
  const CHAPTERS = Object.freeze(Object.keys(GROUPS));
  const SCENE_LABELS = Object.freeze([
    ['风筝节', 'Kite festival'], ['模糊的号码', 'A blurry number'], ['告诉大人', 'Tell a grown-up'], ['眼睛检查', 'Eye exam'],
    ['光进入眼睛', 'Light enters the eye'], ['焦点落在视网膜', 'Focus on the retina'], ['近视的焦点', 'Myopic focus'], ['眼镜来帮忙', 'Glasses help'],
    ['不是谁的错', 'Nobody’s fault'], ['到户外去', 'Go outdoors'], ['看远休息', 'Distance break'], ['聚焦模型', 'Focus model'],
    ['及时求助', 'Ask for help'], ['清楚地再出发', 'Ready to see clearly']
  ]);
  const STORAGE_KEY = 'kb-myopia-journey-v2';
  const AUDIO_VER = 6;

  function flattenGroups() {
    return Object.values(GROUPS).flat().sort((a, b) => a - b);
  }

  function normalizeChapter(hash) {
    const id = String(hash || '').replace(/^#/, '');
    return CHAPTERS.includes(id) ? id : 'discover';
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
      if (audio) {
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
        audio = null;
      }
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

  function mountImage(win, figure, page, index, language) {
    const img = makeElement(win.document, 'img', 'scene-image');
    img.loading = index === 0 ? 'eager' : 'lazy';
    img.decoding = 'async';
    img.src = page.img;
    img.alt = language === 'zh' ? (page.altZh || page.title || '') : (page.alt || page.titleEn || '');
    img.dataset.kbc = page.img;
    img.dataset.kbi = '0';
    const error = makeElement(win.document, 'div', 'image-error');
    error.hidden = true;
    const message = makeElement(win.document, 'p', '', '图片暂未加载，故事文字仍可阅读。 / Image unavailable; the story remains readable.');
    const retry = makeElement(win.document, 'button', '', '重新加载 / Retry');
    retry.type = 'button';
    retry.addEventListener('click', function () {
      error.hidden = true;
      img.dataset.kbi = '0';
      img.src = page.img.split('?')[0] + `?retry=${Date.now()}`;
    });
    error.append(message, retry);
    img.addEventListener('load', function () { error.hidden = true; });
    img.addEventListener('error', function () {
      if (root.KBCDN && img.dataset.kbi === '0') root.KBCDN.retry(img);
      else error.hidden = false;
    });
    figure.append(img, error);
    return img;
  }

  function sceneText(page, language) {
    return language === 'zh' ? page.zh : page.en;
  }

  function createScene(win, page, index, state, narrator) {
    const doc = win.document;
    const article = makeElement(doc, 'article', `scene-card scene-${index}`);
    article.dataset.pageIndex = String(index);
    const figure = makeElement(doc, 'figure', 'scene-visual');
    const img = mountImage(win, figure, page, index, state.language);
    const caption = makeElement(doc, 'figcaption', 'scene-caption');
    const label = SCENE_LABELS[index];
    caption.append(
      makeElement(doc, 'strong', 'copy-zh', page.title || label[0]),
      makeElement(doc, 'span', 'copy-en', page.titleEn || label[1])
    );
    figure.appendChild(caption);

    const copy = makeElement(doc, 'div', 'scene-copy');
    const eyebrow = makeElement(doc, 'span', 'scene-number', `0${index + 1}`.slice(-2));
    const zh = makeElement(doc, 'p', 'story-copy copy-zh', page.zh || '');
    const en = makeElement(doc, 'p', 'story-copy copy-en', page.en || '');
    en.lang = 'en';
    const listen = makeElement(doc, 'button', 'scene-listen', '▶ 听这一段 / Listen');
    listen.type = 'button';
    listen.addEventListener('click', function () {
      narrator.play(index, state.language, sceneText(page, state.language));
    });
    copy.append(eyebrow, zh, en, listen);
    if (page.factZh || page.factEn) {
      const details = makeElement(doc, 'details', 'science-note');
      const summary = makeElement(doc, 'summary', '', state.language === 'zh' ? (page.why || '为什么？') : (page.whyEn || 'Why?'));
      details.append(
        summary,
        makeElement(doc, 'p', 'copy-zh', page.factZh || ''),
        makeElement(doc, 'p', 'copy-en', page.factEn || '')
      );
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

  function updateFocusModel(doc) {
    const range = doc.getElementById('eye-growth');
    const correction = doc.getElementById('corrective-lens');
    const corrected = correction.getAttribute('aria-pressed') === 'true';
    const model = root.MyopiaActivity.calculateFocusModel({
      eyeGrowth: range.value,
      lensCorrection: corrected ? range.value : 0
    });
    const retinaX = String(model.retinaX);
    const focusX = String(model.focusX);
    doc.querySelector('[data-eye-body]').setAttribute('d', `M28 8 C54 2 ${retinaX} 8 ${retinaX} 27 C${retinaX} 46 54 52 28 46`);
    const retina = doc.querySelector('[data-retina]');
    retina.setAttribute('x1', retinaX); retina.setAttribute('x2', retinaX);
    doc.querySelector('[data-focus]').setAttribute('cx', focusX);
    doc.querySelector('[data-ray="upper"]').setAttribute('d', `M3 18 L29 18 L${focusX} 27 L${retinaX} 36`);
    doc.querySelector('[data-ray="middle"]').setAttribute('d', `M3 27 L${focusX} 27 L${retinaX} 27`);
    doc.querySelector('[data-ray="lower"]').setAttribute('d', `M3 36 L29 36 L${focusX} 27 L${retinaX} 18`);
    const status = doc.getElementById('focus-status');
    status.textContent = model.isFocused
      ? '焦点落在视网膜上。 / Focus lands on the retina.'
      : '焦点落在视网膜前方。 / Focus falls in front of the retina.';
    doc.getElementById('focus-model').dataset.focused = String(model.isFocused);
  }

  function mount(win) {
    const doc = win.document;
    if (!doc.getElementById('experience') || !Array.isArray(root.PAGES)) return false;
    const state = getSaved(win.localStorage);
    const audioStatus = doc.getElementById('audio-status');
    const narrator = createNarrator(win, audioStatus);
    const sceneElements = [];

    for (const [chapterId, indices] of Object.entries(GROUPS)) {
      const container = doc.querySelector(`[data-group="${chapterId}"]`);
      for (const index of indices) {
        const scene = createScene(win, root.PAGES[index], index, state, narrator);
        sceneElements.push(scene);
        container.appendChild(scene);
      }
    }

    const focusVisual = doc.querySelector('.scene-11 .scene-visual');
    const focusModel = doc.getElementById('focus-model');
    if (focusVisual && focusModel) {
      focusVisual.classList.add('has-whiteboard-model');
      const stage = makeElement(doc, 'div', 'whiteboard-stage');
      const sceneImage = focusVisual.querySelector('.scene-image');
      focusVisual.insertBefore(stage, sceneImage);
      stage.appendChild(sceneImage);
      stage.appendChild(focusModel.querySelector('.whiteboard-display'));
      // All layers share the original 1216 x 832 coordinate system. The
      // foreground keeps the wooden frame and both characters above the ink.
      const foreground = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
      foreground.setAttribute('viewBox', '0 0 1216 832');
      foreground.setAttribute('class', 'whiteboard-foreground');
      foreground.setAttribute('aria-hidden', 'true');
      foreground.innerHTML = '<defs><clipPath id="board-foreground-mask"><path clip-rule="evenodd" d="M0 0H1216V832H0Z M242 174H968Q980 174 980 188V604Q980 616 966 616H240Q228 616 228 602V188Q228 174 242 174Z"/><path d="M0 280H226L251 340L249 376L292 365L318 350L360 350V412L266 458L262 832H0Z"/><path d="M908 306H1216V832H980V366H912Z"/></clipPath></defs><image width="1216" height="832" clip-path="url(#board-foreground-mask)"/>';
      foreground.querySelector('image').setAttribute('href', sceneImage.getAttribute('src'));
      stage.appendChild(foreground);
      focusVisual.appendChild(focusModel);
    }

    function applyLanguage() {
      doc.body.dataset.language = state.language;
      doc.documentElement.lang = state.language === 'zh' ? 'zh-CN' : 'en';
      doc.getElementById('language').textContent = state.language === 'zh' ? 'EN' : '中文';
      sceneElements.forEach(scene => scene.__refreshLanguage());
      save(win.localStorage, state);
      narrator.stop();
    }

    doc.getElementById('language').addEventListener('click', function () {
      state.language = state.language === 'zh' ? 'en' : 'zh';
      applyLanguage();
    });

    const chapterButton = doc.getElementById('narrate-chapter');
    chapterButton.addEventListener('click', function () {
      const chapter = normalizeChapter(win.location.hash);
      const indices = GROUPS[chapter];
      let cursor = 0;
      chapterButton.setAttribute('aria-pressed', 'true');
      const next = function () {
        if (cursor >= indices.length) {
          chapterButton.setAttribute('aria-pressed', 'false');
          return;
        }
        const index = indices[cursor++];
        narrator.play(index, state.language, sceneText(root.PAGES[index], state.language), next);
      };
      next();
    });

    const range = doc.getElementById('eye-growth');
    const correction = doc.getElementById('corrective-lens');
    range.addEventListener('input', function () { updateFocusModel(doc); });
    correction.addEventListener('click', function () {
      const pressed = correction.getAttribute('aria-pressed') !== 'true';
      correction.setAttribute('aria-pressed', String(pressed));
      correction.textContent = pressed
        ? '摘下矫正眼镜 / Remove corrective lenses'
        : '戴上矫正眼镜 / Add corrective lenses';
      updateFocusModel(doc);
    });

    function setActiveChapter(chapterId) {
      doc.querySelectorAll('[data-chapter-link]').forEach(link => {
        if (link.dataset.chapterLink === chapterId) link.setAttribute('aria-current', 'step');
        else link.removeAttribute('aria-current');
      });
    }
    setActiveChapter(normalizeChapter(win.location.hash));
    if (typeof win.IntersectionObserver === 'function') {
      const observer = new win.IntersectionObserver(entries => {
        const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveChapter(visible.target.id);
      }, { threshold: [0.25, 0.5, 0.75] });
      CHAPTERS.forEach(id => observer.observe(doc.getElementById(id)));
    }
    win.addEventListener('hashchange', function () { narrator.stop(); setActiveChapter(normalizeChapter(win.location.hash)); });
    doc.addEventListener('visibilitychange', function () { if (doc.hidden) narrator.stop(); });
    win.addEventListener('pagehide', narrator.stop);
    applyLanguage();
    updateFocusModel(doc);
    return true;
  }

  const api = { GROUPS, flattenGroups, normalizeChapter, mount };
  root.MyopiaJourney = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root.document) {
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', function () { mount(root); });
    else mount(root);
  }
})(typeof window !== 'undefined' ? window : globalThis);

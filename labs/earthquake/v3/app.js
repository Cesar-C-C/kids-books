(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const model = window.EarthquakeModel;
  const THREE = window.THREE;
  const route = window.EarthquakeRoute;
  const cards = ['elastic-rebound', 'fault-types', 'focus-epicenter', 'waves'];
  const entry = route.parse(location.search, location.hash);
  let language = entry.lang;
  let card = entry.card;
  const source = entry.from;
  let fault = model && model.createFault();
  let wave = model && model.createWave();
  let selectedType = 'reverse';
  let focusRevealed = false;
  let cutaway = card === 'focus-epicenter' || card === 'waves';
  let paused = false;
  let driveTimer = null;
  let waveTimer = null;
  let waveStarted = false;
  let replayTimer = null;
  let faultHistory = fault ? [fault] : [];
  let content = new Map();
  let geology;
  let fallback;
  let audio;
  let renderer;
  let camera;
  let scene;
  let rendererKind = 'unavailable';
  const view = { yaw: 0.55, pitch: 0.32, distance: 11.6, type: selectedType, focusRevealed };
  const target = { x: 0, y: -1.1, z: 0 };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  const t = id => content.get(id)?.[language] || id;
  const narrationGroups = [
    { title: { zh: '开始探索', en: 'Start exploring' }, ids: ['lab-title', 'lab-subtitle'] },
    { card: 'elastic-rebound', ids: ['card-elastic-rebound', 'question-elastic-rebound', 'fault-plane', 'marker-line', 'result-initial', 'result-locked', 'result-slipped', 'result-settled'] },
    { card: 'fault-types', ids: ['card-fault-types', 'question-fault-types', 'result-fault-types'] },
    { card: 'focus-epicenter', ids: ['card-focus-epicenter', 'question-focus-epicenter', 'focus', 'epicenter', 'result-focus-hint', 'result-focus-correct'] },
    { card: 'waves', ids: ['card-waves', 'question-waves', 'wavefront', 'particle', 'result-waves', 'result-arrival'] }
  ];
  function buildNarration() {
    const host = $('narration-items');
    for (const group of narrationGroups) {
      const section = document.createElement('section');
      section.dataset.narrationGroup = group.card || 'intro';
      const heading = document.createElement('h3');
      section.appendChild(heading);
      for (const id of group.ids) {
        if (!content.get(id)?.narrationNeeded) continue;
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.narrationId = id;
        const icon = document.createElement('span');
        icon.textContent = '▶';
        icon.setAttribute('aria-hidden', 'true');
        const text = document.createElement('span');
        text.className = 'narration-text';
        button.append(icon, text);
        button.addEventListener('click', () => playNarration(id));
        section.appendChild(button);
      }
      host.appendChild(section);
    }
  }
  function paintNarration() {
    const zh = language === 'zh';
    $('narration-open').textContent = zh ? '点读' : 'Listen';
    $('narration-heading').textContent = zh ? '点读小卡' : 'Listen & explore';
    $('narration-help').textContent = zh ? '点一句，听一句。可以先听问题，再回模型找线索。' : 'Choose a line to hear it. Listen to a question, then return to the model to find clues.';
    $('narration-close').textContent = zh ? '关闭' : 'Close';
    for (const id of ['audio-stop', 'narration-stop']) $(id).textContent = zh ? '停止朗读' : 'Stop narration';
    for (const group of narrationGroups) {
      const section = document.querySelector('[data-narration-group="' + (group.card || 'intro') + '"]');
      if (!section) continue;
      section.querySelector('h3').textContent = group.title ? group.title[language] : t('card-' + group.card);
      for (const button of section.querySelectorAll('[data-narration-id]')) {
        const item = content.get(button.dataset.narrationId);
        button.querySelector('.narration-text').textContent = item[language];
        button.setAttribute('aria-label', t('listen') + ': ' + item[language]);
        button.dataset.narrationLang = language;
        button.disabled = !(audio && audio.available(item.kind, item.id, language));
      }
    }
  }
  function audioStatus(status) {
    const message = status === 'unavailable' ? t('audio-unavailable') : '';
    $('audio-status').textContent = message;
    $('narration-status').textContent = message;
  }
  async function playNarration(id) {
    const item = content.get(id);
    if (!audio || !item?.narrationNeeded) return;
    stopMotion();
    audioStatus('loading');
    const result = await audio.play(item.kind, item.id, language);
    if (!result.ok && result.reason !== 'cancelled') audioStatus('unavailable');
  }
  function stopMotion() {
    for (const timer of [driveTimer, waveTimer, replayTimer]) if (timer) clearInterval(timer);
    driveTimer = waveTimer = replayTimer = null;
    if (audio) audio.stop();
    updateWavePause();
  }
  function updateWavePause() {
    $('wave-pause').disabled = !waveStarted || !wave || wave.tick >= 82;
    $('wave-pause').textContent = t(waveTimer || !waveStarted ? 'pause' : 'resume');
  }
  function startWave() {
    stopMotion();
    if (wave.tick >= 82) return;
    waveStarted = true;
    waveTimer = setInterval(waveStep, reduced.matches ? 240 : 80);
    updateWavePause();
  }
  function reportError(message) {
    const box = $('scene-error');
    box.hidden = false;
    box.firstChild.textContent = message + ' ';
    box.querySelector('a').href = `../../books/earthquake/index.html?lang=${language}`;
  }
  function setCamera() {
    if (!camera) return;
    const d = view.distance;
    camera.position.set(target.x + d * Math.cos(view.pitch) * Math.sin(view.yaw), target.y + d * Math.sin(view.pitch), target.z + d * Math.cos(view.pitch) * Math.cos(view.yaw));
    camera.lookAt(target.x, target.y, target.z);
    camera.updateProjectionMatrix();
  }
  function setPreset(name) {
    if (name === 'side') { view.yaw = Math.PI / 2; view.pitch = 0.08; view.distance = 10.3; }
    else if (name === 'top') { view.yaw = 0; view.pitch = 1.43; view.distance = 10.6; }
    else { view.yaw = 0.55; view.pitch = 0.32; view.distance = 11.6; }
    setCamera();
  }
  function faultResult() { return `result-${fault.phase}`; }
  function resultId() {
    if (card === 'elastic-rebound') return faultResult();
    if (card === 'fault-types') return 'result-fault-types';
    if (card === 'focus-epicenter') return focusRevealed ? 'result-focus-correct' : 'result-focus-hint';
    return wave.mode === 'combined' && wave.tick >= wave.arrivalTicks.near.s ? 'result-arrival' : 'result-waves';
  }
  function paintScene() {
    if (fallback) { fallback.render({ card, model: card === 'waves' ? wave : fault, view, cutaway, language }); return; }
    if (!geology) return;
    geology.setCard(card);
    geology.renderFocus(card === 'focus-epicenter' && focusRevealed ? 'epicenter' : null);
    if (card === 'elastic-rebound') geology.renderFault(fault);
    else if (card === 'fault-types') geology.renderType(selectedType, 0.64);
    else geology.renderType('reverse', 0);
    geology.renderWave(card === 'waves' ? wave : model.createWave());
  }
  function paintText() {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
    document.title = `${t('lab-title')} · 3D Lab`;
    for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
    $('question').textContent = t(`question-${card}`);
    $('result').textContent = t(resultId());
    const status = card === 'elastic-rebound' ? t(faultResult()) : `${String(cards.indexOf(card) + 1).padStart(2, '0')} / 04`;
    if ($('status').textContent !== status) $('status').textContent = status;
    $('mobile-question').textContent = $('question').textContent;
    $('mobile-result').textContent = $('result').textContent;
    $('mobile-action').hidden = !['elastic-rebound', 'waves'].includes(card);
    $('mobile-action').textContent = t(card === 'waves' ? 'wave-play' : 'drive');
    $('surface-choices').hidden = card !== 'focus-epicenter';
    $('caveat').textContent = t(card === 'waves' ? 'wave-caveat' : 'toy-caveat');
    $('pause').textContent = t(paused ? 'resume' : 'pause');
    const spoken = content.get(resultId());
    $('listen').hidden = !(audio && spoken && audio.available(spoken.kind, spoken.id, language));
    $('back-book').href = route.bookHref({ lang: language, from: source });
    $('scene-mode').textContent = card === 'waves' ? 'P / S WAVES' : card === 'fault-types' ? selectedType.toUpperCase() : 'REVERSE FAULT';
    $('lesson-number').textContent = `${String(cards.indexOf(card) + 1).padStart(2, '0')} — 04`;
    for (const id of cards) $('card-' + id).setAttribute('aria-current', id === card ? 'step' : 'false');
    for (const [id, name] of [['controls-fault', 'elastic-rebound'], ['controls-types', 'fault-types'], ['controls-focus', 'focus-epicenter'], ['controls-waves', 'waves']]) $(id).hidden = card !== name;
    for (const id of ['normal', 'reverse', 'strike-slip']) $('type-' + id).setAttribute('aria-pressed', String(id === selectedType));
    for (const id of ['combined', 'p', 's']) $('wave-' + id).setAttribute('aria-pressed', String(id === wave.mode));
    for (const [id, label] of [['left', 'A'], ['correct', 'B'], ['right', 'C']]) $('surface-' + id).setAttribute('aria-label', `${t('guess-' + id)} ${label}`);
    paintNarration();
    updateWavePause();
  }
  function paint() { paintScene(); paintText(); positionChoices(); }
  function faultStep() {
    fault = model.stepFault(fault, { drive: true });
    faultHistory.push(fault);
    paint();
    if (fault.phase === 'settled') stopMotion();
  }
  function waveStep() {
    if (wave.tick >= 82) { stopMotion(); return; }
    wave = model.stepWave(wave);
    paint();
  }
  function switchCard(next) {
    if (!cards.includes(next) || next === card) return;
    stopMotion();
    paused = false;
    card = next;
    cutaway = card === 'focus-epicenter' || card === 'waves';
    if (geology) geology.setCutaway(cutaway);
    $('cutaway').setAttribute('aria-pressed', String(cutaway));
    if (card === 'elastic-rebound') { fault = model.createFault(); faultHistory = [fault]; }
    if (card === 'waves') { wave = model.createWave(); waveStarted = false; }
    if (card === 'fault-types') selectedType = 'reverse';
    if (card === 'focus-epicenter') focusRevealed = false;
    if (card === 'focus-epicenter' || card === 'waves') setPreset('home');
    view.type = selectedType;
    view.focusRevealed = focusRevealed;
    history.replaceState(null, '', `#${card}`);
    paint();
  }
  function snapshot() {
    const current = card === 'waves' ? wave : fault;
    return {
      card, language, phase: card === 'elastic-rebound' ? fault.phase : card === 'waves' ? 'travelling' : 'observing',
      model: JSON.parse(JSON.stringify(current)), view: { ...view }, cutaway,
      playing: !!(driveTimer || waveTimer || replayTimer), source, renderer: rendererKind
    };
  }
  window.earthquakeLab = { snapshot };

  function positionChoices() {
    if (card !== 'focus-epicenter') return;
    const viewport = $('viewport').getBoundingClientRect();
    const positions = [['left', -1.5], ['correct', model.EPICENTER.x], ['right', 3]];
    for (const [id, x] of positions) {
      let px, py;
      if (fallback) {
        const svg = $('model-fallback').querySelector('svg').getBoundingClientRect();
        px = svg.left + (400 + 80 * x) / 800 * svg.width;
        py = svg.top + 140 / 480 * svg.height;
      } else if (camera) {
        const projected = new THREE.Vector3(x, 0.24, 0).project(camera);
        px = viewport.left + (projected.x + 1) * viewport.width / 2;
        py = viewport.top + (1 - projected.y) * viewport.height / 2;
      } else continue;
      const button = $('surface-' + id);
      button.style.left = `${px - viewport.left}px`;
      button.style.top = `${py - viewport.top}px`;
    }
  }

  function bindControls() {
    for (const id of cards) $('card-' + id).addEventListener('click', () => switchCard(id));
    $('step').addEventListener('click', faultStep);
    const startDrive = event => {
      if (event.button !== 0 || card !== 'elastic-rebound' || paused) return;
      stopMotion();
      faultStep();
      driveTimer = setInterval(faultStep, reduced.matches ? 350 : 120);
      event.currentTarget.setPointerCapture(event.pointerId);
    };
    for (const button of [$('drive'), $('mobile-action')]) {
      button.addEventListener('pointerdown', startDrive);
      for (const eventName of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(eventName, stopMotion);
      button.addEventListener('click', event => { if (event.detail === 0 && card === 'elastic-rebound') faultStep(); });
    }
    $('mobile-action').addEventListener('click', () => { if (card === 'waves') $('wave-play').click(); });
    $('pause').addEventListener('click', () => { paused = !paused; stopMotion(); paintText(); });
    $('replay').addEventListener('click', () => {
      stopMotion();
      if (faultHistory.length < 2) return;
      let index = 0;
      replayTimer = setInterval(() => {
        fault = faultHistory[index++];
        paint();
        if (index >= faultHistory.length) stopMotion();
      }, reduced.matches ? 480 : 250);
    });
    $('reset').addEventListener('click', () => { stopMotion(); fault = model.createFault(); faultHistory = [fault]; paused = false; paint(); });
    $('wave-step').addEventListener('click', () => { stopMotion(); waveStep(); });
    $('wave-play').addEventListener('click', startWave);
    $('wave-pause').addEventListener('click', () => { if (waveTimer) stopMotion(); else startWave(); });
    $('wave-reset').addEventListener('click', () => { stopMotion(); wave = model.createWave({ mode: wave.mode }); waveStarted = false; paint(); });
    for (const mode of ['combined', 'p', 's']) $('wave-' + mode).addEventListener('click', () => { stopMotion(); wave = { ...wave, mode }; paint(); });
    for (const type of ['normal', 'reverse', 'strike-slip']) $('type-' + type).addEventListener('click', () => {
      stopMotion(); selectedType = type; view.type = type;
      if (type === 'strike-slip') setPreset('top');
      else setPreset('side');
      paint();
    });
    for (const id of ['left', 'right', 'correct']) for (const prefix of ['guess-', 'surface-']) $(prefix + id).addEventListener('click', () => { focusRevealed = id === 'correct'; view.focusRevealed = focusRevealed; paint(); });
    const switchLanguage = () => { stopMotion(); language = language === 'zh' ? 'en' : 'zh'; audioStatus('stopped'); paint(); };
    $('language').addEventListener('click', switchLanguage);
    $('narration-language').addEventListener('click', switchLanguage);
    $('listen').addEventListener('click', () => playNarration(resultId()));
    $('narration-open').addEventListener('click', () => { stopMotion(); paintNarration(); $('narration-dialog').showModal(); });
    $('narration-close').addEventListener('click', () => $('narration-dialog').close());
    $('narration-dialog').addEventListener('close', stopMotion);
    for (const id of ['audio-stop', 'narration-stop']) $(id).addEventListener('click', stopMotion);
    $('view-reset').addEventListener('click', () => setPreset('home'));
    $('view-side').addEventListener('click', () => setPreset('side'));
    $('view-top').addEventListener('click', () => setPreset('top'));
    $('zoom-in').addEventListener('click', () => { view.distance = Math.max(6, view.distance - 1.2); setCamera(); });
    $('zoom-out').addEventListener('click', () => { view.distance = Math.min(18, view.distance + 1.2); setCamera(); });
    $('cutaway').addEventListener('click', () => { cutaway = !cutaway; if (geology) geology.setCutaway(cutaway); $('cutaway').setAttribute('aria-pressed', String(cutaway)); paintScene(); });
    const stage = $('viewport');
    let start = null;
    stage.addEventListener('pointerdown', event => { if (event.target !== stage && event.target.tagName !== 'CANVAS') return; start = { x: event.clientX, y: event.clientY, yaw: view.yaw, pitch: view.pitch }; });
    stage.addEventListener('pointermove', event => {
      if (!start || !(event.buttons & 1)) return;
      view.yaw = start.yaw - (event.clientX - start.x) * 0.006;
      view.pitch = Math.max(-0.12, Math.min(1.48, start.pitch + (event.clientY - start.y) * 0.005));
      setCamera();
    });
    for (const name of ['pointerup', 'pointercancel', 'pointerleave']) stage.addEventListener(name, () => { start = null; });
    window.addEventListener('blur', stopMotion);
    window.addEventListener('pagehide', stopMotion);
    document.addEventListener('visibilitychange', () => { if (document.hidden) stopMotion(); });
  }

  function initScene() {
    if (!THREE || !model || !window.EarthquakeGeometry) throw new Error('Required model resource is unavailable');
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1c3038);
    scene.add(new THREE.HemisphereLight(0xcbe8e4, 0x815b48, 2));
    const sun = new THREE.DirectionalLight(0xffe7c8, 2.1);
    sun.position.set(-3, 7, 8);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0x82bed1, 0.7);
    fill.position.set(5, 0, -5);
    scene.add(fill);
    geology = window.EarthquakeGeometry.createGeology(THREE);
    scene.add(geology.root);
    geology.setCutaway(cutaway);
    $('cutaway').setAttribute('aria-pressed', String(cutaway));
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    $('viewport').appendChild(renderer.domElement);
    camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    setCamera();
    const resize = () => {
      const width = $('viewport').clientWidth;
      const height = $('viewport').clientHeight;
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      positionChoices();
    };
    resize();
    window.addEventListener('resize', resize);
    rendererKind = 'webgl';
    const frame = () => { if (!renderer) return; positionChoices(); renderer.render(scene, camera); requestAnimationFrame(frame); };
    requestAnimationFrame(frame);
  }

  function initFallback() {
    if (!model || !window.EarthquakeFallback) throw new Error('Model or fallback resource is unavailable');
    if (geology) { geology.dispose(); geology = null; }
    fallback = window.EarthquakeFallback.create($('viewport'));
    rendererKind = 'fallback';
    paint();
    window.addEventListener('resize', positionChoices);
  }

  async function boot() {
    bindControls();
    try {
      const response = await fetch('content.json');
      if (!response.ok) throw new Error('Content could not be loaded');
      const data = await response.json();
      content = new Map(data.entries.map(entry => [entry.id, entry]));
      buildNarration();
      if (window.EarthquakeLabAudio) {
        audio = window.EarthquakeLabAudio.create({ manifestUrl: 'audio-manifest.json', contentVersion: data.contentVersion, onStatus: audioStatus });
        audio.ready.then(() => paintText());
      }
      try { initScene(); }
      catch (error) { initFallback(); }
      paint();
    } catch (error) {
      console.error(error);
      reportError(language === 'zh' ? '模型资源暂时不可用。' : 'The model is temporarily unavailable.');
    }
  }
  boot();
})();

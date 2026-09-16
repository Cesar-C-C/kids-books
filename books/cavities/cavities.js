(function (root) {
  'use strict';

  const BRUSH_ZONES = Object.freeze(['outer', 'inner', 'chewing']);
  const ZONE_COPY = Object.freeze({
    outer: ['外侧已刷到', 'Outer surfaces brushed'],
    inner: ['内侧已刷到', 'Inner surfaces brushed'],
    chewing: ['咀嚼面已刷到', 'Chewing surfaces brushed']
  });

  function markZone(state, zone) {
    if (!BRUSH_ZONES.includes(zone)) throw new Error(`Unknown brush zone: ${zone}`);
    const completed = Array.isArray(state && state.completed) ? state.completed : [];
    return {
      completed: completed.includes(zone) ? [...completed] : [...completed, zone]
    };
  }

  function remainingMs(startedAt, now, durationMs = 120000) {
    const duration = Math.max(0, Number(durationMs) || 0);
    const remaining = duration - (Number(now) - Number(startedAt));
    return Math.round(Math.max(0, Math.min(duration, remaining)));
  }

  function createTimerController(options = {}) {
    const requestedDuration = options.durationMs === undefined ? 120000 : Number(options.durationMs);
    const duration = Number.isFinite(requestedDuration) ? Math.max(0, requestedDuration) : 120000;
    const now = options.now || Date.now;
    const schedule = options.setInterval || setInterval;
    const cancel = options.clearInterval || clearInterval;
    const onTick = options.onTick || function () {};
    let status = 'idle';
    let remaining = duration;
    let startedAt = null;
    let intervalId = null;

    function snapshot() {
      return { status, remaining };
    }

    function emit() {
      onTick(snapshot());
    }

    function clearActiveInterval() {
      if (intervalId !== null) {
        cancel(intervalId);
        intervalId = null;
      }
    }

    function update() {
      if (status !== 'running') return snapshot();
      remaining = remainingMs(startedAt, now(), duration);
      if (remaining === 0) {
        status = 'finished';
        clearActiveInterval();
      }
      emit();
      return snapshot();
    }

    function beginInterval() {
      clearActiveInterval();
      intervalId = schedule(update, 250);
    }

    function start() {
      if (status === 'running') return snapshot();
      if (status === 'paused') return resume();
      remaining = duration;
      startedAt = now();
      status = duration === 0 ? 'finished' : 'running';
      if (status === 'running') beginInterval();
      emit();
      return snapshot();
    }

    function pause() {
      if (status !== 'running') return snapshot();
      update();
      clearActiveInterval();
      if (status !== 'finished') status = 'paused';
      emit();
      return snapshot();
    }

    function resume() {
      if (status !== 'paused') return snapshot();
      startedAt = now() - (duration - remaining);
      status = 'running';
      beginInterval();
      emit();
      return snapshot();
    }

    function reset() {
      clearActiveInterval();
      status = 'idle';
      remaining = duration;
      startedAt = null;
      emit();
      return snapshot();
    }

    return {
      start,
      pause,
      resume,
      reset,
      suspend: pause,
      getState: snapshot
    };
  }

  function makeElement(doc, name, attributes = {}, text = '') {
    const element = doc.createElement(name);
    for (const [key, value] of Object.entries(attributes)) {
      if (key === 'className') element.className = value;
      else element.setAttribute(key, value);
    }
    if (text) element.textContent = text;
    return element;
  }

  function appendBilingualStatus(doc, parent, attributes = {}) {
    const status = makeElement(doc, 'p', attributes);
    status.appendChild(makeElement(doc, 'span', { className: 'cavities-status-zh' }));
    status.appendChild(makeElement(doc, 'span', { className: 'cavities-status-en', lang: 'en' }));
    parent.appendChild(status);
    return status;
  }

  function setBilingual(status, zh, en) {
    const zhLine = status.querySelector('.cavities-status-zh');
    const enLine = status.querySelector('.cavities-status-en');
    if (zhLine.textContent !== zh) zhLine.textContent = zh;
    if (enLine.textContent !== en) enLine.textContent = en;
  }

  function protectReaderGestures(section) {
    section.addEventListener('touchstart', event => event.stopPropagation());
    section.addEventListener('touchend', event => event.stopPropagation());
    section.addEventListener('keydown', function (event) {
      if (event.key.startsWith('Arrow')) event.stopPropagation();
    });
  }

  function mountBrushZones(doc, page, pageIndex) {
    const text = page.querySelector('.text');
    if (!text || text.querySelector('.brush-zones')) return false;
    const titleId = `brush-zones-title-${pageIndex}`;
    const section = makeElement(doc, 'section', {
      className: 'brush-zones cavities-activity',
      'aria-labelledby': titleId
    });
    section.appendChild(makeElement(doc, 'h3', { id: titleId }, '刷到三个牙面 / Brush three surfaces'));
    const controls = makeElement(doc, 'div', { className: 'brush-zone-controls' });
    const status = appendBilingualStatus(doc, section, {
      className: 'cavities-live',
      role: 'status',
      'aria-live': 'polite',
      'aria-atomic': 'true'
    });
    setBilingual(status, '选择一个牙面开始。', 'Choose a tooth surface to begin.');
    let state = { completed: [] };
    const labels = {
      outer: '外侧 / Outer',
      inner: '内侧 / Inner',
      chewing: '咀嚼面 / Chewing'
    };

    for (const zone of BRUSH_ZONES) {
      const button = makeElement(doc, 'button', {
        className: 'brush-zone-button',
        type: 'button',
        'data-zone': zone,
        'aria-pressed': 'false'
      }, labels[zone]);
      button.addEventListener('click', function () {
        state = markZone(state, zone);
        button.setAttribute('aria-pressed', 'true');
        button.classList.add('is-complete');
        if (state.completed.length === BRUSH_ZONES.length) {
          section.classList.add('is-complete');
          setBilingual(status, '每个牙面都刷到了', 'Every surface is brushed');
        } else {
          setBilingual(status, ZONE_COPY[zone][0], ZONE_COPY[zone][1]);
        }
      });
      controls.appendChild(button);
    }
    section.insertBefore(controls, status);
    protectReaderGestures(section);
    text.appendChild(section);
    return true;
  }

  function formatCountdown(milliseconds) {
    const totalSeconds = Math.ceil(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  function mountBrushTimer(doc, page, pageIndex) {
    const text = page.querySelector('.text');
    if (!text || text.querySelector('.brush-timer')) return false;
    const titleId = `brush-timer-title-${pageIndex}`;
    const section = makeElement(doc, 'section', {
      className: 'brush-timer cavities-activity',
      'aria-labelledby': titleId
    });
    section.appendChild(makeElement(doc, 'h3', { id: titleId }, '可选两分钟计时 / Optional two-minute timer'));
    section.appendChild(makeElement(doc, 'p', { className: 'brush-device-note' },
      '刷牙时可以放下设备，请让大人帮忙。 / You may put the device down while brushing. Ask a grown-up to help.'));
    const countdown = makeElement(doc, 'p', {
      className: 'brush-countdown',
      role: 'timer',
      'aria-live': 'off',
      'aria-atomic': 'true'
    }, '2:00');
    section.appendChild(countdown);
    const controls = makeElement(doc, 'div', { className: 'brush-timer-controls' });
    const startButton = makeElement(doc, 'button', { type: 'button', 'data-action': 'start' }, '开始 / Start');
    const pauseButton = makeElement(doc, 'button', { type: 'button', 'data-action': 'pause', disabled: '' }, '暂停 / Pause');
    const resumeButton = makeElement(doc, 'button', { type: 'button', 'data-action': 'resume', disabled: '' }, '继续 / Resume');
    const resetButton = makeElement(doc, 'button', { type: 'button', 'data-action': 'reset' }, '重置 / Reset');
    for (const button of [startButton, pauseButton, resumeButton, resetButton]) controls.appendChild(button);
    section.appendChild(controls);
    const live = appendBilingualStatus(doc, section, {
      className: 'cavities-live brush-timer-live',
      role: 'status',
      'aria-live': 'polite',
      'aria-atomic': 'true'
    });

    function render(state) {
      countdown.textContent = formatCountdown(state.remaining);
      section.setAttribute('data-timer-status', state.status);
      startButton.disabled = state.status === 'running' || state.status === 'paused';
      pauseButton.disabled = state.status !== 'running';
      resumeButton.disabled = state.status !== 'paused';
      if (state.status === 'running') setBilingual(live, '计时进行中。', 'Timer running.');
      else if (state.status === 'paused') setBilingual(live, '计时已暂停。', 'Timer paused.');
      else if (state.status === 'finished') setBilingual(live, '两分钟到了，可以请大人帮你检查。', 'Two minutes are up. Ask a grown-up to check.');
      else setBilingual(live, '准备好后再开始。', 'Start when you are ready.');
    }

    const timer = createTimerController({ onTick: render });
    startButton.addEventListener('click', timer.start);
    pauseButton.addEventListener('click', timer.pause);
    resumeButton.addEventListener('click', timer.resume);
    resetButton.addEventListener('click', timer.reset);

    const observer = typeof root.MutationObserver === 'function'
      ? new root.MutationObserver(function () {
          if (!page.classList.contains('active')) timer.suspend();
        })
      : null;
    if (observer) observer.observe(page, { attributes: true, attributeFilter: ['class'] });

    function handleVisibility() {
      if (doc.hidden) timer.suspend();
    }
    function handlePageHide() {
      timer.suspend();
    }
    doc.addEventListener('visibilitychange', handleVisibility);
    root.addEventListener('pagehide', handlePageHide);
    protectReaderGestures(section);
    text.appendChild(section);
    render(timer.getState());
    return true;
  }

  function mountAll(doc, pages) {
    if (!doc || !pages) return 0;
    const renderedPages = doc.querySelectorAll('#pages .page');
    let mounted = 0;
    Array.from(renderedPages).forEach(function (page, index) {
      const activity = pages[index] && pages[index].activity;
      if (!activity) return;
      if (activity.type === 'brush-zones' && mountBrushZones(doc, page, index)) mounted += 1;
      if (activity.type === 'brush-timer' && mountBrushTimer(doc, page, index)) mounted += 1;
    });
    return mounted;
  }

  const api = { BRUSH_ZONES, markZone, remainingMs, createTimerController, mountAll };
  root.CavitiesActivity = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root.document && root.PAGES) mountAll(root.document, root.PAGES);
})(typeof window !== 'undefined' ? window : globalThis);

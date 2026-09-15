(function (root) {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';

  function clamp01(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 0;
    return Math.min(1, Math.max(0, number));
  }

  function calculateFocusModel({ eyeGrowth = 0, lensCorrection = 0 } = {}) {
    const growth = clamp01(eyeGrowth);
    const correction = clamp01(lensCorrection);
    // Percentages are illustrative screen coordinates, not anatomical measurements.
    const retinaX = 82 + 10 * growth;
    const focusX = 82 + 10 * correction;
    return {
      retinaX,
      focusX,
      isFocused: Math.abs(retinaX - focusX) < 0.6
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

  function makeSvgElement(doc, name, attributes = {}, text = '') {
    const element = doc.createElementNS(SVG_NS, name);
    for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
    if (text) element.textContent = text;
    return element;
  }

  function mountKiteNumber(doc, page, metadata) {
    const art = page.querySelector('.art');
    if (!art || art.querySelector('.myopia-kite-clue')) return false;
    const layer = makeElement(doc, 'div', {
      className: 'myopia-kite-clue',
      role: 'img',
      'aria-label': '远处风筝上模糊的数字 8 / Blurred number 8 on the faraway kite'
    });
    layer.appendChild(makeElement(doc, 'span', { className: 'myopia-kite-number' }, metadata.value || '8'));
    art.appendChild(layer);
    return true;
  }

  function addDiagramLabel(doc, svg, text, x, y, targetX, targetY) {
    const group = makeSvgElement(doc, 'g', { class: 'myopia-eye-label' });
    group.appendChild(makeSvgElement(doc, 'line', { x1: x, y1: y + 7, x2: targetX, y2: targetY }));
    group.appendChild(makeSvgElement(doc, 'text', { x, y }, text));
    svg.appendChild(group);
  }

  function mountEyeLabels(doc, page, metadata) {
    const art = page.querySelector('.art');
    if (!art || art.querySelector('.myopia-eye-labels')) return false;
    const svg = makeSvgElement(doc, 'svg', {
      class: 'myopia-eye-labels',
      viewBox: '0 0 1000 667',
      role: 'img',
      'aria-label': '眼睛聚焦原理标注 / Eye focus diagram labels',
      preserveAspectRatio: 'xMidYMid meet'
    });
    addDiagramLabel(doc, svg, '角膜 / Cornea', 270, 164, 392, 252);
    addDiagramLabel(doc, svg, '晶状体 / Lens', 438, 126, 486, 252);
    addDiagramLabel(doc, svg, '视网膜 / Retina', 784, 128, 844, 248);
    addDiagramLabel(doc, svg, '聚焦 / Focus', metadata.focusX - 58, metadata.focusY + 100,
      metadata.focusX, metadata.focusY);
    art.appendChild(svg);
    art.appendChild(makeElement(doc, 'p', { className: 'myopia-scale-note' },
      '原理示意，不按真实比例 / Diagram only — not to scale'));
    return true;
  }

  function mountEditableLayer(doc, page, metadata) {
    if (!metadata) return false;
    if (metadata.type === 'blurred-kite-number') return mountKiteNumber(doc, page, metadata);
    if (metadata.type === 'eye-diagram-labels') return mountEyeLabels(doc, page, metadata);
    return false;
  }

  function mountFocusModel(doc, page, pageIndex) {
    const text = page.querySelector('.text');
    if (!text || text.querySelector('.myopia-focus')) return false;

    const section = makeElement(doc, 'section', {
      className: 'myopia-focus',
      'aria-label': '光线聚焦模型 / Focus model'
    });
    const titleId = `myopia-focus-title-${pageIndex}`;
    const rangeId = `myopia-eye-growth-${pageIndex}`;
    const diagramId = `myopia-focus-diagram-${pageIndex}`;
    const statusId = `myopia-focus-status-${pageIndex}`;
    section.appendChild(makeElement(doc, 'h3', { id: titleId }, '试试光线聚焦 / Try the focus model'));

    const controls = makeElement(doc, 'div', { className: 'myopia-focus-controls' });
    const growthControl = makeElement(doc, 'div', { className: 'myopia-growth-control' });
    const rangeLabel = makeElement(doc, 'label', { for: rangeId }, '眼球生长 / Eye growth');
    const range = makeElement(doc, 'input', {
      id: rangeId,
      className: 'myopia-growth-range',
      type: 'range',
      min: '0',
      max: '1',
      step: '0.1',
      value: '0',
      'aria-describedby': statusId
    });
    growthControl.appendChild(rangeLabel);
    growthControl.appendChild(range);
    controls.appendChild(growthControl);
    const correction = makeElement(doc, 'button', {
      className: 'myopia-correction',
      type: 'button',
      'aria-pressed': 'false',
      'aria-controls': diagramId
    }, '戴上矫正眼镜 / Add corrective lenses');
    controls.appendChild(correction);
    section.appendChild(controls);

    const diagram = makeSvgElement(doc, 'svg', {
      id: diagramId,
      class: 'myopia-focus-diagram',
      viewBox: '0 0 100 52',
      role: 'img',
      'aria-label': '角膜、晶状体、视网膜和焦点示意 / Cornea, lens, retina and focus diagram'
    });
    const eyeBody = makeSvgElement(doc, 'path', { class: 'myopia-eye-body' });
    diagram.appendChild(eyeBody);
    diagram.appendChild(makeSvgElement(doc, 'path', {
      class: 'myopia-cornea',
      'data-part': 'cornea',
      d: 'M28 10 Q18 26 28 42'
    }));
    diagram.appendChild(makeSvgElement(doc, 'ellipse', {
      class: 'myopia-lens',
      'data-part': 'lens',
      cx: '34', cy: '26', rx: '5', ry: '14'
    }));
    const retina = makeSvgElement(doc, 'line', {
      class: 'myopia-retina',
      'data-part': 'retina',
      y1: '12', y2: '40'
    });
    diagram.appendChild(retina);
    const upperRay = makeSvgElement(doc, 'path', { class: 'myopia-ray' });
    const middleRay = makeSvgElement(doc, 'path', { class: 'myopia-ray' });
    const lowerRay = makeSvgElement(doc, 'path', { class: 'myopia-ray' });
    diagram.appendChild(upperRay);
    diagram.appendChild(middleRay);
    diagram.appendChild(lowerRay);
    const focus = makeSvgElement(doc, 'circle', {
      class: 'myopia-focus-point',
      'data-part': 'focus',
      cy: '26', r: '2.2'
    });
    diagram.appendChild(focus);
    diagram.appendChild(makeSvgElement(doc, 'text', { x: '12', y: '8' }, '光线 / Light'));
    diagram.appendChild(makeSvgElement(doc, 'text', { x: '18', y: '49', 'data-part': 'cornea-label' }, '角膜 Cornea'));
    diagram.appendChild(makeSvgElement(doc, 'text', { x: '35', y: '49', 'data-part': 'lens-label' }, '晶状体 Lens'));
    diagram.appendChild(makeSvgElement(doc, 'text', { x: '69', y: '49', 'data-part': 'focus-label' }, '焦点 Focus'));
    diagram.appendChild(makeSvgElement(doc, 'text', { x: '84', y: '8', 'data-part': 'retina-label' }, '视网膜 Retina'));
    section.appendChild(diagram);

    const status = makeElement(doc, 'p', {
      id: statusId,
      className: 'myopia-focus-status',
      role: 'status',
      'aria-live': 'polite'
    });
    const statusZh = makeElement(doc, 'span', { className: 'myopia-status-zh' });
    const statusEn = makeElement(doc, 'span', { className: 'myopia-status-en', lang: 'en' });
    status.appendChild(statusZh);
    status.appendChild(statusEn);
    section.appendChild(status);
    section.appendChild(makeElement(doc, 'p', { className: 'myopia-disclaimer' },
      '原理示意，不是视力测试 / Explanation only — not a vision test.'));

    function update() {
      const corrected = correction.getAttribute('aria-pressed') === 'true';
      const model = calculateFocusModel({
        eyeGrowth: range.value,
        lensCorrection: corrected ? range.value : 0
      });
      const retinaX = String(model.retinaX);
      const focusX = String(model.focusX);
      eyeBody.setAttribute('d', `M28 8 C54 2 ${retinaX} 8 ${retinaX} 26 C${retinaX} 44 54 50 28 44`);
      retina.setAttribute('x1', retinaX);
      retina.setAttribute('x2', retinaX);
      focus.setAttribute('cx', focusX);
      upperRay.setAttribute('d', `M3 17 L29 17 L${focusX} 26 L${retinaX} 35`);
      middleRay.setAttribute('d', `M3 26 L${focusX} 26 L${retinaX} 26`);
      lowerRay.setAttribute('d', `M3 35 L29 35 L${focusX} 26 L${retinaX} 17`);
      section.setAttribute('data-focused', String(model.isFocused));
      statusZh.textContent = model.isFocused ? '焦点落在视网膜上' : '焦点落在视网膜前方';
      statusEn.textContent = model.isFocused ? 'Focus lands on the retina.' : 'Focus falls in front of the retina.';
    }

    range.addEventListener('input', update);
    correction.addEventListener('click', function () {
      const pressed = correction.getAttribute('aria-pressed') !== 'true';
      correction.setAttribute('aria-pressed', String(pressed));
      correction.textContent = pressed
        ? '摘下矫正眼镜 / Remove corrective lenses'
        : '戴上矫正眼镜 / Add corrective lenses';
      update();
    });
    section.addEventListener('touchstart', event => event.stopPropagation());
    section.addEventListener('touchend', event => event.stopPropagation());
    section.addEventListener('keydown', function (event) {
      if (event.key.startsWith('Arrow')) event.stopPropagation();
    });
    text.appendChild(section);
    update();
    return true;
  }

  function mountAll(doc, pages) {
    if (!doc || !pages) return 0;
    const renderedPages = doc.querySelectorAll('#pages .page');
    let mounted = 0;
    Array.from(renderedPages).forEach(function (page, index) {
      const data = pages[index];
      if (!data) return;
      if (mountEditableLayer(doc, page, data.editableLayer)) mounted += 1;
      if (data.activity && data.activity.type === 'focus-model' && mountFocusModel(doc, page, index)) mounted += 1;
    });
    return mounted;
  }

  const api = { calculateFocusModel, mountAll };
  root.MyopiaActivity = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root.document && root.PAGES) mountAll(root.document, root.PAGES);
})(typeof window !== 'undefined' ? window : globalThis);

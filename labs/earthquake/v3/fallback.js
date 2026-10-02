(function (root) {
  'use strict';
  function create(mount) {
    mount.classList.add('has-fallback');
    const host = document.createElement('div');
    host.id = 'model-fallback';
    host.className = 'model-fallback';
    host.innerHTML = `<p id="fallback-note" class="fallback-note"></p>
      <svg viewBox="0 0 800 480" role="img" aria-label="Diagram of a faulted rock block with focus, flags and wavefronts">
        <rect x="0" y="0" width="800" height="480" fill="#203943"/>
        <path d="M80 140H400" stroke="#b4d3b5" stroke-width="8"/>
        <path d="M80 140H400L508 380H80Z" fill="#b49a78" stroke="#f3d6a2" stroke-width="3"/>
        <g id="fallback-hanging"><path d="M400 140H720V380H508Z" fill="#c9aa82" stroke="#f3d6a2" stroke-width="3"/><path d="M400 140H720" stroke="#b4d3b5" stroke-width="8"/><path id="fallback-marker-right" d="M404 158L660 158" fill="none" stroke="#3a2725" stroke-width="5"/></g>
        <path id="fallback-marker-left" d="M160 158L396 158" fill="none" stroke="#3a2725" stroke-width="5"/>
        <path d="M400 140L508 380" stroke="#9a4438" stroke-width="8"/>
        <rect x="447" y="242" width="24" height="32" rx="4" fill="#4b2d2b"/>
        <circle id="fallback-focus" cx="486.4" cy="332" r="12" fill="#ac4c3c" stroke="#fff0d2" stroke-width="3"/>
        <path id="fallback-projection" d="M486.4 332V140" stroke="#d86c4d" stroke-width="3" stroke-dasharray="9 7"/>
        <circle id="fallback-epicenter" cx="486.4" cy="140" r="13" fill="none" stroke="#d86c4d" stroke-width="4"/>
        <g id="fallback-strike-arrows" stroke="#ffe0aa" stroke-width="7" fill="none"><path d="M285 54v53m0-53-14 17m14-17 14 17"/><path d="M594 107V54m0 53-14-17m14 17 14-17"/></g>
        <g id="fallback-flag-near"><path d="M440 140V90" stroke="#26333a" stroke-width="5"/><path d="M440 92H476L461 109H440Z" fill="#4bc1d0"/><circle id="fallback-near-p" cx="426" cy="82" r="8" fill="#47bed1"/><circle id="fallback-near-s" cx="445" cy="82" r="8" fill="#4688b3"/></g>
        <g id="fallback-flag-far"><path d="M640 140V90" stroke="#26333a" stroke-width="5"/><path d="M640 92H676L661 109H640Z" fill="#347da6"/><circle id="fallback-far-p" cx="626" cy="82" r="8" fill="#47bed1"/><circle id="fallback-far-s" cx="645" cy="82" r="8" fill="#4688b3"/></g>
        <circle id="fallback-wave-p" cx="486.4" cy="332" r="0" fill="none" stroke="#47bed1" stroke-width="5"/>
        <circle id="fallback-wave-s" cx="486.4" cy="332" r="0" fill="none" stroke="#a294ef" stroke-width="5" stroke-dasharray="10 8"/>
        <g id="fallback-surface-particles">
          <circle cx="440" cy="140" r="12" fill="none" stroke="#26333a" stroke-width="3"/>
          <circle id="fallback-surface-near" cx="440" cy="140" r="7" fill="#f7bd55" stroke="#26333a" stroke-width="2"/>
          <circle cx="640" cy="140" r="12" fill="none" stroke="#26333a" stroke-width="3"/>
          <circle id="fallback-surface-far" cx="640" cy="140" r="7" fill="#f7bd55" stroke="#26333a" stroke-width="2"/>
        </g>
        <circle id="fallback-particle-origin" cx="440" cy="167" r="14" fill="none" stroke="#26333a" stroke-width="3"/>
        <circle id="fallback-particle" cx="440" cy="167" r="8" fill="#f7bd55" stroke="#26333a" stroke-width="2"/>
      </svg><p id="fallback-caption" class="fallback-caption"></p>`;
    mount.appendChild(host);
    const $ = id => host.querySelector('#' + id);
    function render({ card, model, view, language, focus: origin = root.EarthquakeModel.FOCUS }) {
      const zh = language !== 'en';
      $('fallback-note').textContent = zh ? '3D 暂不可用；剖面投影未画出前后距离，仍可完成四个观察。' : '3D is unavailable; this section projection omits front-to-back distance. All four observations remain available.';
      const isWave = card === 'waves';
      const isFocus = card === 'focus-epicenter';
      let offset = 0;
      let bend = 0;
      if (card === 'elastic-rebound') { offset = model.slipOffset; bend = Math.min(0.35, model.elasticStrain * 0.7); }
      else if (card === 'fault-types') offset = 0.64;
      const type = card === 'fault-types' ? view.type : 'reverse';
      const reverse = type === 'reverse';
      const normal = type === 'normal';
      const dx = reverse ? -offset * 44 * root.EarthquakeModel.FAULT_DIP : normal ? offset * 44 * root.EarthquakeModel.FAULT_DIP : 0;
      const dy = reverse ? -offset * 44 : normal ? offset * 44 : 0;
      $('fallback-hanging').setAttribute('transform', `translate(${dx} ${dy})`);
      $('fallback-strike-arrows').style.display = type === 'strike-slip' ? '' : 'none';
      $('fallback-marker-left').setAttribute('d', `M160 158L396 ${158 - bend * 80}`);
      $('fallback-marker-right').setAttribute('d', `M404 ${158 - bend * 80}L660 158`);
      $('fallback-projection').style.display = isFocus && view.focusRevealed ? '' : 'none';
      $('fallback-epicenter').style.display = isFocus && view.focusRevealed ? '' : 'none';
      $('fallback-focus').style.display = isFocus || isWave ? '' : 'none';
      const fx = 400 + 80 * origin.x, fy = 140 - 80 * origin.y;
      $('fallback-focus').setAttribute('cx', fx); $('fallback-focus').setAttribute('cy', fy);
      $('fallback-epicenter').setAttribute('cx', fx);
      $('fallback-projection').setAttribute('d', `M${fx} ${fy}V140`);
      for (const kind of ['p', 's']) { $('fallback-wave-' + kind).setAttribute('cx', fx); $('fallback-wave-' + kind).setAttribute('cy', fy); }
      for (const id of ['fallback-flag-near', 'fallback-flag-far', 'fallback-wave-p', 'fallback-wave-s', 'fallback-particle', 'fallback-particle-origin', 'fallback-surface-particles']) $(id).style.display = isWave ? '' : 'none';
      if (isWave) {
        $('fallback-wave-p').setAttribute('r', String(Math.min(520, model.frontRadius.p * 80)));
        $('fallback-wave-s').setAttribute('r', String(Math.min(520, model.frontRadius.s * 80)));
        $('fallback-wave-p').style.display = model.mode === 's' || model.frontRadius.p > 6 ? 'none' : '';
        $('fallback-wave-s').style.display = model.mode === 'p' || model.frontRadius.s > 6 ? 'none' : '';
        for (const flag of ['near', 'far']) for (const kind of ['p', 's']) {
          $(`fallback-${flag}-${kind}`).style.display = (model.mode === 'combined' || model.mode === kind) && model.tick >= model.arrivalTicks[flag][kind] ? '' : 'none';
        }
        const offsets = root.EarthquakeModel;
        const p = offsets.particleDisplacement(model, offsets.TRACKED_POINT, 'p');
        const s = offsets.particleDisplacement(model, offsets.TRACKED_POINT, 's');
        const move = { x: (model.mode === 's' ? 0 : p.x) + (model.mode === 'p' ? 0 : s.x), y: (model.mode === 's' ? 0 : p.y) + (model.mode === 'p' ? 0 : s.y) };
        $('fallback-particle').setAttribute('cx', String(440 + 80 * move.x));
        $('fallback-particle').setAttribute('cy', String(167 - 80 * move.y));
        for (const flag of offsets.FLAGS) {
          const fp = offsets.particleDisplacement(model, flag.position, 'p');
          const fs = offsets.particleDisplacement(model, flag.position, 's');
          const dx = (model.mode === 's' ? 0 : fp.x) + (model.mode === 'p' ? 0 : fs.x);
          const dy = (model.mode === 's' ? 0 : fp.y) + (model.mode === 'p' ? 0 : fs.y);
          $('fallback-surface-' + flag.id).setAttribute('cx', String(400 + 80 * (flag.position.x + dx)));
          $('fallback-surface-' + flag.id).setAttribute('cy', String(140 - 80 * dy));
        }
      }
      $('fallback-caption').textContent = isWave
        ? (zh ? '波前向外走，地下和地表黄点在各自圆圈附近往复。' : 'Fronts travel outward; underground and surface points oscillate near their own outlines.')
        : isFocus ? (zh ? '地下红点是震源；竖线上方是震中。' : 'The red point below is the focus; above it is the epicenter.')
          : type === 'strike-slip' ? (zh ? '箭头沿断层前后相反方向移动；剖面里不会张开空隙。' : 'Arrows move in opposite along-strike directions; the section does not open a gap.')
            : (zh ? '深色标记线先弯曲，断层滑后留下错位。' : 'The dark marker bends first and stays offset after slip.');
    }
    function dispose() { host.remove(); mount.classList.remove('has-fallback'); }
    return { render, dispose };
  }
  root.EarthquakeFallback = { create };
})(typeof window !== 'undefined' ? window : globalThis);

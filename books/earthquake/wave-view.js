'use strict';
window.mountWave = function (container, {content, lang, session}) {
 const {el, button, svg, shape} = EarthquakeUI, W = EarthquakeWave;
 const t = (zh, en) => lang() === 'en' ? en : zh;
 let state = W.createWave();
 const reduced = matchMedia('(prefers-reduced-motion: reduce)');
 const heading = el('h2'), graphic = svg(''), legend = el('details', 'model-legend');
 const legendSummary = el('summary'), localMotion = el('p');
 legend.id = 'wave-local-motion-details'; localMotion.id = 'wave-local-motion';
 legendSummary.style.minHeight = '44px'; legendSummary.style.cursor = 'pointer';
 legend.append(legendSummary, localMotion);
 const arrivals = el('p', 'arrival-record'), result = el('p', 'result');
 const controls = el('div', 'controls'), tools = el('details', 'tools');
 const summary = el('summary'), extras = el('div', 'controls');
 result.setAttribute('role', 'status');
 tools.append(summary, extras);
 function advance(dt) { state = W.stepWave(state, dt); render(); }
 function pump() {
  if (state.phase !== 'running') return;
  advance(.025);
  if (state.phase === 'running') session.schedule(pump, 70);
 }
 function observeReduced() {
  const target = state.time < .8 - 1e-9 ? .8 : state.time < 1.3 - 1e-9 ? 1.3 : Math.sqrt(2) + .8;
  while (state.time < target - 1e-9 && state.phase === 'running')
   state = W.stepWave(state, Math.min(.1, target - state.time));
  if (state.phase === 'running') state = W.setWaveMode(state, 'paused');
  render();
 }
 const start = button('', () => {
  if (state.phase === 'done') return;
  const prior = state;
  session.cancel('wave-start');
  state = W.setWaveMode(prior, 'running');
  render();
  if (reduced.matches) observeReduced(); else pump();
 }, 'wave-start');
 const pause = button('', () => session.cancel('wave-pause'), 'wave-pause');
 const step = button('', () => {
  if (state.phase === 'done') return;
  session.cancel('wave-step');
  state = W.setWaveMode(state, 'running');
  advance(.1);
  if (state.phase === 'running') state = W.setWaveMode(state, 'paused');
  render();
 }, 'wave-step');
 const reset = button('', () => {
  session.cancel('wave-reset'); state = W.createWave(); render();
 }, 'wave-reset');
 controls.append(start, pause); extras.append(step, reset);
 container.append(heading, graphic, legend, controls, result, arrivals, tools);
 function render() {
  const item = content.interactions.find(x => x.id === 'wave-predict');
  EarthquakeUI.narratedText(heading, item[lang()], item.kind, item.id, lang());
  const resultId = state.time >= 1.8 - 1e-9 ? 'wave-finished' :
   state.time >= 1 - 1e-9 ? 'wave-surface' : state.time >= .5 - 1e-9 ? 'wave-moving' : 'wave-ready';
  const observation = content.interactions.find(x => x.id === resultId);
  EarthquakeUI.narratedText(result, observation[lang()], observation.kind, observation.id, lang());
  start.textContent = reduced.matches ?
   state.time < .8 - 1e-9 ? t('看地下标记', 'Watch underground') :
   state.time < 1.3 - 1e-9 ? t('看地表标记', 'Watch the surface') :
   t('看脉冲经过之后', 'After the pulse') :
   state.phase === 'paused' ? t('继续观察', 'Continue observing') : t('看振动从地下传开', 'Watch the disturbance spread');
  pause.textContent = t('暂停', 'Pause');
  step.textContent = t('下一小步', 'Next small step');
  reset.textContent = t('重新观察', 'Start again');
  start.disabled = state.phase === 'running' || state.phase === 'done';
  pause.disabled = state.phase !== 'running'; step.disabled = state.phase === 'done';
  summary.textContent = t('慢看与重看', 'Step and replay');
  legendSummary.textContent = t('① 地下 · ② 地表｜灰圈：原位｜右侧：位移 ×8', '① Underground · ② Surface | Gray ring: start | Right: displacement ×8');
  const localObservation = content.interactions.find(x => x.id === 'local-motion');
  EarthquakeUI.narratedText(localMotion, localObservation[lang()], localObservation.kind, localObservation.id, lang());
  arrivals.textContent = t('到达记录：A（近）', 'Arrival record: A (near) ') +
   (state.arrived.a ? t('已到达', 'arrived') : t('未到达', 'not yet')) +
   t(' · B（远）', ' · B (far) ') + (state.arrived.b ? t('已到达', 'arrived') : t('未到达', 'not yet'));
  container.dataset.phase = state.phase;
  graphic.setAttribute('aria-label', t(
   '左侧为地下向地表传播。①地下与②地表标记同时可见。右侧分别放大同一时刻的局部位移八倍。A近、B远只记录到达。',
   'A disturbance spreads from underground toward the surface. Both underground and surface markers remain visible. The right windows enlarge their displacement eight times at the same instant. Near A and far B record arrival.'));
  graphic.replaceChildren();
  const clipId = 'wave-overview-clip', defs = shape(graphic, 'defs', {});
  const clip = shape(defs, 'clipPath', {id:clipId});
  shape(clip, 'rect', {x:20, y:60, width:305, height:188});
  shape(graphic, 'rect', {x:20, y:60, width:305, height:188, rx:8, fill:'#efd8b0'});
  shape(graphic, 'path', {d:'M20 60H325', stroke:'#73513c', 'stroke-width':4});
  shape(graphic, 'path', {d:'M255 60L180 200L154 248', stroke:'#963e2a', 'stroke-width':4});
  const wave = shape(graphic, 'g', {'clip-path':'url(#' + clipId + ')'});
  const cx=180, cy=200, scale=140;
  shape(wave, 'circle', {cx, cy, r:state.time*scale, fill:'none', stroke:'#267e83', 'stroke-width':3, opacity:state.time>0?1:0});
  shape(graphic, 'circle', {cx, cy, r:6, fill:'#963e2a'});
  shape(graphic, 'text', {x:cx+10, y:cy+24, 'font-size':16, fill:'#59382a'}, t('震源', 'Focus'));
  for (const f of ['a','b']) {
   const x=cx+W.slots[state.flags[f]]*scale;
   shape(graphic, 'path', {d:'M'+x+' 60V18h28v22h-28', stroke:'#29473f', fill:state.arrived[f]?'#f0b842':'#fff8e7', 'stroke-width':2});
   shape(graphic, 'text', {x:x+8, y:35, 'font-size':18, fill:'#29473f'}, f.toUpperCase());
  }
  for (const [id, numeral, color, zoomY] of [['near','①','#a35d22',124],['surface','②','#296f98',212]]) {
   const p=W.points[id], motion=W.sampleMotion(state,id), x=cx+p.x*scale, y=cy-(p.y+1)*scale;
   shape(graphic, 'path', {d:'M'+(x+13)+' '+y+'L345 '+zoomY, fill:'none', stroke:'#8c998b', 'stroke-dasharray':'3 5'});
   shape(graphic, 'circle', {cx:x, cy:y, r:12, fill:'none', stroke:'#697469', 'stroke-width':2, 'stroke-dasharray':'3 3'});
   shape(graphic, 'circle', {cx:x+motion.x*scale, cy:y-motion.y*scale, r:6, fill:color, stroke:'#fff8e7', 'stroke-width':2});
   shape(graphic, 'text', {x:x-31, y:y+7, 'font-size':20, fill:color}, numeral);
   shape(graphic, 'rect', {x:345, y:zoomY-39, width:192, height:78, rx:12, fill:'#f3efdf', stroke:'#b9c0aa'});
   shape(graphic, 'text', {x:358, y:zoomY+7, 'font-size':21, fill:color}, numeral);
   shape(graphic, 'path', {d:'M445 '+(zoomY-31)+'V'+(zoomY+31), stroke:'#c5c8b8', 'stroke-width':1});
   shape(graphic, 'circle', {cx:445, cy:zoomY, r:12, fill:'none', stroke:'#697469', 'stroke-width':2, 'stroke-dasharray':'3 3'});
   shape(graphic, 'circle', {cx:445+motion.x*scale*8, cy:zoomY-motion.y*scale*8, r:7, fill:color});
  }
 }
 const off = session.onCancel(() => {
  if (state.phase === 'running') state = W.setWaveMode(state, 'paused');
  render();
 });
 render();
 return {render, cancel:()=>session.cancel('wave'), destroy:off,
  snapshot:()=>({...structuredClone(state), motions:{underground:W.sampleMotion(state,'near'), surface:W.sampleMotion(state,'surface')}, magnification:8})};
};

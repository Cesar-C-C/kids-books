(() => {
 'use strict';
 // Same progressive-reveal controller as the airplane and train studios, driving
 // the launch vehicle. One code path for every assembly: a group of three layers
 // (exterior / interior / ghost), driven by a single update().
 const $ = id => document.getElementById(id), T = window.THREE, lessons = window.ROCKET_PARTS, details = window.ROCKET_DETAILS;
 const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
 let storage; try { storage = localStorage; } catch { storage = { getItem: () => null, setItem: () => { } }; }
 const journal = DiscoveryProgress.create(storage, 'little-rockets:whole-rocket:v1', { parts: [...lessons, ...details].map(p => p.id), actions: ['open', 'spin', 'explode'], tasks: [] });
 const speech = LabSpeech.create($('speak'), $('speech-status'));
 const notes = {
  fairing: '整流罩在发射穿过稠密大气时保护货物，同时把箭体头部修成流线型。飞出大气层后它不再需要，就被抛掉以减轻重量。',
  satellite: '卫星是这次发射的货物。它自带太阳翼和天线，入轨后要靠自己的姿控系统保持朝向，把太阳翼对准太阳、把天线对准地面。',
  upperstage: '上面级负责最后的加速和入轨。它在接近真空的环境工作，所以喷管可以做得更大更薄，让燃气充分膨胀。',
  interstage: '级间段连接上下两级，还要在飞行中承受上面级的重量和发动机的推力，所以做成闭合的环形承力结构。',
  structure: '箭体是半硬壳结构：薄蒙皮配环形框与纵向长梁，一起承力。这样既轻又能扛住发动机推力和飞行中的弯曲载荷。',
  fuel: '燃料箱储存液体燃料。箱内加压后，燃料被稳定地压向发动机；两端用球形封头，靠圆弧把压力均匀分散开。',
  oxidizer: '氧化剂箱储存液氧。太空里没有空气，火箭必须自带氧气，所以氧化剂的质量往往比燃料还大。',
  boosters: '助推器在起飞最需要推力的时候帮忙。它们结构简单、推力大，燃料烧完就分离抛掉，不给主级增加负担。',
  engines: '发动机把推进剂的化学能变成高速喷流。喷管先收缩再扩张，把高压燃气加速出去，火箭就获得反方向的推力。'
 };
 const tips = {
  fairing: '拖动动作滑杆，看两瓣罩体向两边张开；打开剖面能看到里侧的衬层。',
  satellite: '放大卫星，找金色的星体、两侧的太阳翼和顶上碟形天线。',
  upperstage: '靠近上面级，看它下方的小喷管和肩部的收口。',
  interstage: '打开剖面，看圆环中间给发动机留出的空腔。',
  structure: '打开剖面，数一数沿箭体排下来的环形框，再找纵向长梁。',
  fuel: '拆开外壳，找到橙色贮箱；比较它两端的球形封头。',
  oxidizer: '找到蓝色贮箱，看看外面那层浅色绝热包覆。',
  boosters: '转到侧面，数一数两侧的助推器，再到下面找各自的喷管。',
  engines: '转到火箭底部，找出三个钟形喷管；拖动动作滑杆看它们摆动。'
 };
 const helps = {
  fairing: '拖动动作滑杆：两瓣罩体绕根部向外张开，就像到高空后抛掉整流罩。',
  satellite: '拖动动作滑杆：太阳翼从折叠状态向外展开，增大受光面积。',
  upperstage: '上面级固定在箭体上部；打开剖面能看到里面的两个小贮箱。',
  interstage: '这一环在两级分离时被抛掉，上面级发动机才有空间点火。',
  structure: '拖动剖切观察环框与长梁；拆解后能看到外壳与内部结构分开。',
  fuel: '贮箱位置固定；打开剖面观察球形封头与箱内空间。',
  oxidizer: '贮箱位置固定；拆解后能看到绝热包覆与箭体分开。',
  boosters: '助推器固定在主箭体两侧，靠两条支杆把推力传给箭体。',
  engines: '拖动动作滑杆，三台发动机一起轻轻摆动——这就是火箭转向的办法。'
 };
// The stack is tall and slim, so parts that run along the body read from the
// flank and the bottom group from below, where the nozzle layout is clear. The
// bottom two groups sit far enough out that the boosters cannot fill the frame.
const angles = {
 fairing: [-.62, .26], satellite: [-.62, .30], upperstage: [-.55, .20],
 interstage: [-.62, .18], structure: [-.62, .22], fuel: [-.55, .16],
 oxidizer: [-.55, .16], boosters: [1.15, .10], engines: [1.05, .06]
};
const clampRadius = { fairing: 2.2, satellite: 1.3, upperstage: 1.7, interstage: 1.2, structure: 3.0, fuel: 1.6, oxidizer: 1.7, boosters: 4.6, engines: 3.2 };
const minRadius = { fairing: 1.7, satellite: .9, upperstage: 1.2, interstage: .9, structure: 2.2, fuel: 1.1, oxidizer: 1.2, boosters: 3.6, engines: 2.6 };
 // A part that only makes sense next to its neighbour stays lit with it.
 const keepWith = {};
 const offsets = {
  structure: [0, 0, 0], oxidizer: [0, 0, 0], fuel: [0, 0, 0], interstage: [0, 0, 0],
  upperstage: [0, 0, 0], satellite: [0, 1.4, 0], fairing: [0, 2.6, 0], boosters: [0, 0, 0], engines: [0, -1.4, 0]
 };
 // The camera looks at the middle of the stack, not at the body: the rocket stands
// from y = -3.45 (pad) to y = +6.0 (nose tip), so its visual centre is near y = 1.2.
const look0 = new T.Vector3(0, 1.2, 0);
 let renderer, scene, camera, rocket, assemblies = [], active = null, detail = null, mode='outside', playing = false, slow = true, simTime = 0, mechanism = 0, autoRotate = false;
let yaw = -.62, pitch = .20, distance = 15.5, overviewDistance = 15.5, explosion = 0, targetExplosion = 0, reveal = 0, near = 0;
const look = new T.Vector3(0, 1.2, 0), target = { yaw, pitch, distance, look: look.clone() };
 const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches, pickables = [], surfaces = [], materialOriginal = new Map(), materialTransparency = new Map();
 let activeFit = 6, clipping = new T.Plane(), lastFrame = 0;

 const exhibit=LabExhibit.create('rocket',T),viewHistory=[];let openingView=null;
 const captureView=()=>({yaw:target.yaw,pitch:target.pitch,distance:target.distance,look:target.look.clone()});
 function restoreView(v){if(!v)return;target.yaw=v.yaw;target.pitch=v.pitch;target.distance=v.distance;target.look.copy(v.look);autoRotate=false;}
 function remember(){viewHistory.push(captureView());if(viewHistory.length>20)viewHistory.shift();}
 function closeExhibit(immediate=false){exhibit.close(immediate);mode='outside';playing=false;mechanism=0;detail=null;}
 function toggleOpening(){
  if(exhibit.opened){closeExhibit();restoreView(openingView);openingView=null;}
  else if(active){openingView=captureView();targetExplosion=0;explosion=0;exhibit.open(active);mode='inside';remember();focus();
   if(['cabin','upper-cabin','lower-cabin'].includes(exhibit.opened.key)){target.pitch=.55;target.distance=Math.max(target.distance,fit(active.radius*1.1));}
  }renderLesson();
 }

 function progress() { $('progress-text').textContent = journal.read().found.length + ' / ' + (lessons.length + details.length); }
 function inherit(object, key) { for (let o = object; o; o = o.parent) if (o.userData[key]) return o.userData[key]; return null; }
 function data() { return detail ? details.find(d => d.id === detail) : active ? lessons.find(p => p.id === active.region) : null; }
 function sameRegion(id) { return assemblies.filter(a => a.region === id); }
 function worldCenter(a) { return a.group.localToWorld(a.center.clone()); }
 function nearestAssembly(region) { return sameRegion(region).sort((a, b) => worldCenter(a).distanceToSquared(camera.position) - worldCenter(b).distanceToSquared(camera.position))[0]; }
 function fit(radius) { return Math.max(1.6, radius / Math.sin(T.MathUtils.degToRad(24)) * 1.06 * Math.max(1, 1.05 / camera.aspect)); }
 function detailObjects() { return active && detail ? [].concat(active.details[detail] || []) : []; }
 function detailCenter() {
  const groups = detailObjects(); if (!groups.length) return worldCenter(active);
  const box = new T.Box3();
  groups.forEach(g => g.children.forEach(c => box.expandByObject(c)));
  return box.isEmpty() ? worldCenter(active) : box.getCenter(new T.Vector3());
 }
 function focus() {
  if (!active || !camera) return;
  const point = detail ? detailCenter() : worldCenter(active); target.look.copy(point);
  let r = active.radius;
  if (detail) {
   const b = new T.Box3();
   detailObjects().forEach(g => g.children.forEach(c => b.expandByObject(c)));
   r = b.isEmpty() ? .8 : b.getBoundingSphere(new T.Sphere()).radius;
   r = Math.min(Math.max(r, minRadius[active.region] || .7), clampRadius[active.region] || r);
  }
  target.distance = Math.max(fit(r), 2.0); activeFit = fit(active.radius); autoRotate = false;
  const a = angles[active.region] || [-.6, .3]; target.yaw = a[0]; target.pitch = a[1];
 }
 function selectAssembly(a,focusIt=false){if(!a)return;if(targetExplosion){targetExplosion=0;explosion=0;}exhibit.select(a);if(active!==a){playing=false;mechanism=0;}active=a;detail=null;mode=exhibit.opened?'inside':'outside';activeFit=fit(a.radius);speech.stop();journal.mark('found',a.region);if(focusIt){remember();focus();}renderLesson();}
 function selectDetail(id,focusIt=true){const d=details.find(d=>d.id===id);if(!d)return;if(!active||active.region!==d.region)selectAssembly(nearestAssembly(d.region));if(!exhibit.opened){renderLesson();return;}detail=id;journal.mark('found',id);speech.stop();if(focusIt){remember();focus();}renderLesson();}
 function home() {remember();closeExhibit(); active = null; detail = null; mode='outside'; playing = false; autoRotate = false; targetExplosion = 0; target.look.copy(look0); target.yaw = -.62; target.pitch = .20; target.distance = overviewDistance; renderLesson(); }
 function back(){restoreView(viewHistory.pop());renderLesson();}
 function renderLesson() {
  const p = data(); progress();
  $('part-name').textContent = p?.name || 'Your rocket'; $('part-zh-name').textContent = p?.zhName || '你的火箭'; $('lesson-category').textContent = active ? (detail ? 'LOOK INSIDE' : 'MEET THE PART') : 'A WORLD INSIDE';
  $('part-en').textContent = p?.en || 'Look closer. There is a whole world inside this rocket.'; $('part-zh').textContent = p?.zh || '靠近一点，这枚火箭里面还有一个世界。';
  $('part-tip').textContent=detail?p.tip:'拖动旋转，滚轮缩放。点击部件认识它，再点击“靠近观察”或主动打开结构。';
  $('principle-box').hidden = !active; $('part-principle').textContent = detail ? p.principle : active ? notes[active.region] : '';
  $('crumb-region').textContent = active ? '› ' + lessons.find(p => p.id === active.region).zhName : ''; $('crumb-detail').textContent = detail ? '› ' + p.zhName : ''; $('back-part').hidden = !detail;
  $('back-view').disabled=!viewHistory.length;
  document.querySelectorAll('[data-part]').forEach(b => b.setAttribute('aria-pressed', active?.region === b.dataset.part));
  const children = active ? details.filter(d => d.region === active.region) : [];
  $('explore-section').hidden = !children.length; $('detail-count').textContent = children.length + ' 个发现'; $('detail-list').replaceChildren();
  children.forEach(d => { const b = document.createElement('button'); b.className = 'detail-button'; b.dataset.detail = d.id; b.setAttribute('aria-pressed', detail === d.id); b.innerHTML = d.name + '<small>' + d.zhName + '</small>'; b.disabled=!exhibit.opened;b.onclick=()=>selectDetail(d.id); $('detail-list').append(b); });
  $('operation-panel').hidden = !active;
  $('mechanism-help').textContent = active ? helps[active.region] : '';
  const opened=!!exhibit.opened;$('open-part').textContent=opened?'合上 · 恢复外观':exhibit.plan(active)?.label||'打开结构';$('open-part').setAttribute('aria-pressed',opened);
  $('opening-note').textContent=opened?'教学展示：覆盖件暂时打开，内部保留安装位置。合上可恢复模型和打开前的视角。':'缩放只改变距离。先主动打开模型，再探索内部细节。';
  if(active?.defaultVisible===false)$('opening-note').textContent='拓展教学部件：这部分没有出现在本书的主图中，选中时才显示。';
  $('mechanism-controls').hidden=!active||!['fairing', 'satellite', 'engines'].includes(active.region);if($('mechanism-controls').hidden)$('mechanism-help').textContent='';$('part-zh-name').after($('operation-panel'));$('operation-panel').after($('explore-section'));updateButtons();
 }
 function updateButtons() { document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', b.dataset.view === mode)); $('mechanism-play').setAttribute('aria-pressed', playing); $('mechanism-play').textContent = playing ? 'Ⅱ 暂停观察' : '▶ 看它怎样工作'; $('auto-rotate').setAttribute('aria-pressed', autoRotate); $('explode-button').setAttribute('aria-pressed', targetExplosion > 0); $('explode-button').textContent = targetExplosion ? '组装' : '拆解'; $('slow-play').setAttribute('aria-pressed', slow); }
 lessons.forEach((p, i) => { const b = document.createElement('button'); b.className = 'region-button'; b.dataset.part = p.id; b.setAttribute('aria-pressed', false); b.innerHTML = '<i>' + String(i + 1).padStart(2, '0') + '</i><span><strong>' + p.name + '</strong><small>' + p.zhName + '</small></span>'; b.onclick = () => { if (camera) selectAssembly(nearestAssembly(p.id)); else { $('part-name').textContent = p.name; $('part-en').textContent = p.en; $('part-zh').textContent = p.zh; } }; $('region-list').append(b); });
 $('speak').onclick = () => speech.say($('part-name').textContent + '. ' + $('part-en').textContent, true);
 $('language').onclick = () => { const only = document.body.classList.toggle('english-only'); $('language').textContent = only ? 'English only' : '中英双语'; $('language').setAttribute('aria-pressed', !only); };
 $('book-view').onclick = $('whole-rocket').onclick = $('home-view').onclick = home; $('back-view').onclick=back;$('back-part').onclick=()=>{detail=null;renderLesson();};$('focus-part').onclick=()=>{remember();focus();renderLesson();};$('open-part').onclick=toggleOpening;
 $('zoom-in').onclick = () => { target.distance = Math.max(1.4, target.distance * .8); }; $('zoom-out').onclick = () => { target.distance = Math.min(70, target.distance * 1.25); };
 $('side-view').onclick = () => { target.pitch = .04; target.yaw = 0; autoRotate = false; updateButtons(); }; $('top-view').onclick = () => { target.pitch = 1.50; target.yaw = 0; autoRotate = false; updateButtons(); }; $('auto-rotate').onclick = () => { autoRotate = !autoRotate; updateButtons(); };
 $('explode-button').onclick = () => {closeExhibit(true); targetExplosion = targetExplosion ? 0 : 1; detail = null; active = null; target.look.copy(look0); target.distance = overviewDistance * (targetExplosion ? 1.28 : 1); playing = false; record(); renderLesson(); };
 document.querySelectorAll('[data-view]').forEach(b => b.onclick = () => { mode = b.dataset.view; updateButtons(); });
 $('mechanism-play').onclick = () => { playing = !playing; updateButtons(); }; $('slow-play').onclick = () => { slow = !slow; updateButtons(); };
 $('mechanism-step').onclick = () => { playing = false; simTime += .28; mechanism = (mechanism + .07) % 1; updateButtons(); record(); };
 $('mechanism').oninput = e => { mechanism = Number(e.target.value) / 100; simTime = mechanism * Math.PI; record(); };
 function record() { if (!active && !targetExplosion) return; if (targetExplosion > 0) journal.mark('operated', 'explode'); if (reveal > .45) journal.mark('operated', 'open'); if (simTime > 0) journal.mark('operated', 'spin'); }

 function init() {
  // Transparent canvas, like the shared labs: .stage paints #edf2e7 and the
  // HELLO, / YOUR ROCKET captions sit behind the model, not on top of it.
  scene = new T.Scene(); camera = new T.PerspectiveCamera(42, 1, .02, 260);
  renderer = new T.WebGLRenderer({ antialias: true, alpha: true }); renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.outputColorSpace = T.SRGBColorSpace; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1; renderer.localClippingEnabled = true; renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
  const canvas = renderer.domElement; $('viewport').prepend(canvas); canvas.setAttribute('aria-hidden', 'true'); canvas.onwebglcontextlost = e => { e.preventDefault(); $('load-error').hidden = false; };
  scene.add(new T.HemisphereLight(0xf4f8ff, 0x9bafbd, 2.5)); const key = new T.DirectionalLight(0xfff7e9, 3.2); key.position.set(-8, 16, 8); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -12, right: 12, top: 16, bottom: -12, near: .1, far: 60 }); key.shadow.normalBias = .025; key.shadow.bias = -.0003; scene.add(key); const fill = new T.DirectionalLight(0xd6edff, 1.4); fill.position.set(6, 5, -8); scene.add(fill);
  rocket = RocketV3.create(T); assemblies = rocket.assemblies; scene.add(rocket.root);
  for (const a of assemblies) {
   a.group.userData.assemblyId = a.id; a.group.userData.region = a.region; a.base = a.group.position.clone();
   a.offset = new T.Vector3(...(offsets[a.id] || [0, 0, 0]));
   for (const [layer, root] of [['exterior', a.exterior], ['interior', a.interior], ['ghost', a.ghost]]) root.traverse(o => {
    if (!o.material) return;
    // Independent materials isolate observation state between assemblies.
    if (Array.isArray(o.material)) o.material = o.material.map(m => m.clone()); else o.material = o.material.clone();
    const materials = [].concat(o.material), d = inherit(o, 'detail');
    // Only the shell casts shadows: the shadow pass would otherwise redraw the
    // whole interior for a shadow nobody can see inside a closed body.
    surfaces.push({ object: o, assembly: a, layer, detail: d, materials, shadow: o.castShadow && layer === 'exterior' });
    materials.forEach(m => { materialOriginal.set(m, { opacity: m.opacity, transparent: m.transparent, depthWrite: m.depthWrite }); materialTransparency.set(m, m.transparent); });
    if (layer !== 'ghost' && o.isMesh) { o.userData.pickAssembly = a.id; o.userData.pickDetail = d; pickables.push(o); }
   });
  }
  const ground = new T.Mesh(new T.PlaneGeometry(80, 80), new T.ShadowMaterial({ opacity: .13 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -3.47; ground.receiveShadow = true; scene.add(ground);
  const grid = new T.GridHelper(26, 26, 0xd1dee7, 0xe0e8ef); grid.position.y = -3.475; grid.material.transparent = true; grid.material.opacity = .26; scene.add(grid);
  function resize() {
   const b = $('viewport').getBoundingClientRect(); renderer.setSize(b.width, b.height, false); camera.aspect = b.width / b.height; camera.updateProjectionMatrix();
   // The stack is tall and slim, so frame it by its height rather than by a
   // bounding sphere, which would leave most of the stage empty. The rocket runs
   // 9.6 m from pad to nose tip; with a 24 deg half-angle the vertical view spans
   // 2*d*tan(24) at distance d, so d ~= 5.9 fills about 85% of the frame height.
   // Narrow viewports are wider than they are tall, so back off as the aspect
   // grows to keep the same coverage.
   overviewDistance = Math.max(13.5, 6.6 * Math.max(1, Math.min(1.5, camera.aspect / 1.45)));
   if (!active && !targetExplosion) target.distance = overviewDistance;
  }
  new ResizeObserver(resize).observe($('viewport')); resize(); distance = target.distance;
  const ray = new T.Raycaster();
  function hit(x, y) { const b = canvas.getBoundingClientRect(); ray.setFromCamera(new T.Vector2((x - b.left) / b.width * 2 - 1, -(y - b.top) / b.height * 2 + 1), camera); return ray.intersectObjects(pickables, false).find(h => { for (let o = h.object; o; o = o.parent) if (!o.visible) return false; const m = [].concat(h.object.material)[0]; if (m.opacity < .18) return false; return !m.clippingPlanes?.some(p => p.distanceToPoint(h.point) < 0); }); }
  function pick(h, close = false) { if (!h) return; const a = assemblies.find(a => a.id === h.object.userData.pickAssembly); if (!a) return; const id = h.object.userData.pickDetail; if (id && details.some(d => d.id === id)) { if (active !== a) selectAssembly(a, false); selectDetail(id, close); } else selectAssembly(a, close); }
  function pan(dx, dy) { const scale = distance * .0012; target.look.add(new T.Vector3(1, 0, 0).applyQuaternion(camera.quaternion).multiplyScalar(-dx * scale)).add(new T.Vector3(0, 1, 0).applyQuaternion(camera.quaternion).multiplyScalar(dy * scale)); }
  const pointers = new Map(); let drag = 0, lastTap = null, pinch = 0;
  canvas.oncontextmenu = e => e.preventDefault();
  canvas.onpointerdown = e => { canvas.setPointerCapture(e.pointerId); pointers.set(e.pointerId, { x: e.clientX, y: e.clientY }); drag = 0; autoRotate = false; if (pointers.size === 2) { const p = [...pointers.values()]; pinch = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y); drag = 99; lastTap = null;  } };
  canvas.onpointermove = e => { if (!pointers.has(e.pointerId)) return; const old = pointers.get(e.pointerId), dx = e.clientX - old.x, dy = e.clientY - old.y; pointers.set(e.pointerId, { x: e.clientX, y: e.clientY }); drag += Math.abs(dx) + Math.abs(dy); if (pointers.size === 2) { const p = [...pointers.values()], d = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y); target.distance = clamp(target.distance * pinch / Math.max(d, 1), 1.4, 70); pinch = d; pan(dx * .5, dy * .5); } else if (e.buttons === 2 || e.shiftKey) pan(dx, dy); else { target.yaw -= dx * .006; target.pitch = clamp(target.pitch + dy * .005, -1.15, 1.50); } };
  canvas.onpointerup = e => { if (drag < 6 && pointers.size === 1 && e.button !== 2) { const h = hit(e.clientX, e.clientY); pick(h); const now = performance.now(); if (e.pointerType !== 'mouse' && lastTap && now - lastTap.t < 350 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 24) { pick(h, true); lastTap = null; } else lastTap = { t: now, x: e.clientX, y: e.clientY }; } pointers.delete(e.pointerId); pinch = 0; }; canvas.onpointercancel = e => { pointers.delete(e.pointerId); pinch = 0; drag = 99; };
  canvas.ondblclick = e => { if (drag < 6) pick(hit(e.clientX, e.clientY), true); };
  canvas.addEventListener('wheel', e => { e.preventDefault();  target.distance = clamp(target.distance * Math.exp(e.deltaY * .0012), 1.4, 70); }, { passive: false });
  $('viewport').onkeydown = e => { if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-', 'Escape'].includes(e.key)) { e.preventDefault(); if (e.key === 'Escape') back(); if (e.key === 'ArrowLeft') target.yaw -= .16; if (e.key === 'ArrowRight') target.yaw += .16; if (e.key === 'ArrowUp') target.pitch = clamp(target.pitch + .12, -1.15, 1.50); if (e.key === 'ArrowDown') target.pitch = clamp(target.pitch - .12, -1.15, 1.50); if (e.key === '+' || e.key === '=') target.distance = Math.max(1.4, target.distance * .8); if (e.key === '-') target.distance = Math.min(70, target.distance * 1.25); } };
  window.rocketLab = {
   setView: (y, p, d, x = 0) => { target.yaw = y; target.pitch = p; target.distance = d; target.look.set(x, -.6, 0); },
   select: id => selectAssembly(nearestAssembly(id)), focusDetail: id => selectDetail(id),
   snapshot: () => ({displayVersion:1,...exhibit.snapshot(),history:viewHistory.length, generation: 4, changedOpacity: surfaces.filter(s => s.materials.some(m => Math.abs(m.opacity - materialOriginal.get(m).opacity) > 1e-6)).length, modelId: rocket.root.uuid, selected: active?.region || null, assembly: active?.id || null, detail, near, reveal, mode, playing, simulationTime: simTime, level: mechanism, explosion, meshCount: pickables.length, geometry: rocket.counts, visited: journal.read().found, camera: { yaw, pitch, distance, target: look.toArray() }, assemblies: assemblies.map(a => ({ id: a.id, region: a.region, exterior: a.exterior.visible, interior: a.interior.visible, ghost:a.ghost.visible,exteriorPosition:a.exterior.position.toArray(),position:a.group.position.toArray() })), renderer: renderer.info.render }),
   projectPart: id => { const a = assemblies.find(a => a.id === id) || nearestAssembly(id); if (!a) return null; const c = worldCenter(a).project(camera), b = canvas.getBoundingClientRect(); return { x: b.left + (c.x * .5 + .5) * b.width, y: b.top + (-c.y * .5 + .5) * b.height }; }
  };
  requestAnimationFrame(frame);
 }
 function frame(stamp) {
  requestAnimationFrame(frame); const dt = Math.min((stamp - lastFrame) / 1000, .05); lastFrame = stamp; if (document.hidden) return;
  const ease = reduced ? 1 : 1 - Math.exp(-dt * 8); if (autoRotate) target.yaw += dt * .17;
  yaw += (target.yaw - yaw) * ease; pitch += (target.pitch - pitch) * ease; distance += (target.distance - distance) * ease; look.lerp(target.look, ease); explosion += (targetExplosion - explosion) * ease;
  camera.position.set(Math.sin(yaw) * Math.cos(pitch) * distance, Math.sin(pitch) * distance, Math.cos(yaw) * Math.cos(pitch) * distance).add(look); camera.lookAt(look); camera.updateMatrixWorld(true);
  near = active && explosion < .02 ? clamp((activeFit * 1.7 - distance) / (activeFit * .7)) : 0;
  reveal=exhibit.opened?exhibit.amount:0;
  if (playing) { simTime += dt * (slow ? .55 : 1); mechanism = .5 - .5 * Math.cos(simTime); record(); }
  $('mechanism').value = Math.round(mechanism * 100); $('mechanism-value').textContent = Math.round(mechanism * 100) + '%';
  $('depth-status').textContent=explosion>.1?'拆解展示':exhibit.opened?'已打开 · '+(data()?.zhName||'结构'):'自由观察';$('observation-state').textContent=exhibit.opened?'手动打开':'完整外观';
  rocket.update({ time: simTime, mechanism: mechanism > .001, level: mechanism, region: active?.region });
  for (const a of assemblies) { a.group.position.copy(a.base).addScaledVector(a.offset, explosion); if (a.update) a.update({ time: simTime, mechanism: mechanism > .001, level: mechanism, region: active?.region }); }
  exhibit.step(ease,assemblies,surfaces,materialOriginal,explosion,active);
  rocket.root.updateMatrixWorld(true);
  const label = $('model-label'); label.hidden = !active || near < .2;
  if (!label.hidden) { const p = (detail ? detailCenter() : worldCenter(active)).project(camera), b = $('viewport').getBoundingClientRect(); label.textContent = data().name; label.hidden = Math.abs(p.x) > 1 || Math.abs(p.y) > 1 || p.z > 1; label.style.left = (p.x * .5 + .5) * b.width + 'px'; label.style.top = (-p.y * .5 + .5) * b.height - 20 + 'px'; }
  renderer.render(scene, camera);
 }
 window.addEventListener('pagehide', () => { playing = false; speech.stop(); });
 try { init(); } catch (e) { console.error('Rocket v3', e); $('load-error').hidden = false; }
 renderLesson();
 function deepLink() { if (!camera || !assemblies.length) return; const id = new URLSearchParams(location.search).get('part'); if (id && lessons.some(p => p.id === id)) selectAssembly(nearestAssembly(id)); }
 window.addEventListener('hashchange', deepLink); deepLink();
})();

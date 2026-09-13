(() => {
 'use strict';
 // Same progressive-reveal controller as the airplane and train studios, driving
 // the school bus. One code path for every assembly: a group of three layers
 // (exterior / interior / ghost), driven by a single update().
 const $ = id => document.getElementById(id), T = window.THREE, lessons = window.SCHOOLBUS_PARTS, details = window.SCHOOLBUS_DETAILS;
 const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
 let storage; try { storage = localStorage; } catch { storage = { getItem: () => null, setItem: () => { } }; }
 const journal = DiscoveryProgress.create(storage, 'little-school-bus:whole-bus:v1', { parts: [...lessons, ...details].map(p => p.id), actions: ['open', 'spin', 'explode'], tasks: [] });
 const speech = LabSpeech.create($('speak'), $('speech-status'));
 const notes = {
  body: '车身是一整条钢制外壳，包住里面的座椅和地板。侧面两条黑色防擦条同时也是加强筋，让车身侧面更抗撞。',
  roof: '车顶做成圆拱形，比平板更能承重。翻车时拱形车顶能撑住冲击，保护车厢里的人。车顶的两扇逃生窗向外推开。',
  hood: '发动机装在车头前方的舱盖下面，这叫"前置"。撞车时车头这段先被压扁、吸收能量，车厢里的人就更安全。',
  cab: '驾驶室放在车头前面，视野最好。方向盘通过转向机构带动前轮，司机转很多圈前轮才转一个小角度，才省力。',
  doors: '两片折门各自绕铰链转，折起来占的地方小，开门时不会伸到车外划到人。车尾还有一扇安全门，从里面一推就开。',
  seats: '座椅是硬板不是软沙发，靠背做得特别高。撞车时孩子往前甩会被高靠背接住，这叫隔舱化保护，是校车不用普通安全带也安全的原因。',
  aisle: '过道必须一直保持空旷。紧急疏散时它是一条直路，不用绕弯就能最快跑到车尾的安全门。',
  stopsign: '停车牌由司机座上的一个开关控制。伸出去后它比车身宽出一截，同时还有一盏红灯亮起，提醒后方车辆必须停下。',
  lights: '黄灯先闪，表示"请注意，校车要停了"；红灯接着闪，表示"必须停"。两级预警让后面的车有时间慢慢减速。',
  wheels: '轮胎靠花纹把积水挤走，橡胶才能直接碰到路面。前轴的一对车轮还负责转向，后轴承担更重的车身。'
 };
 const tips = {
  body: '先看这辆校车长长的黄色车身，数一数侧面有几扇车窗。',
  roof: '从车头方向看车顶的弧度，再看看顶上那两个方方的逃生窗。',
  hood: '转到车头，找找伸出来的舱盖、格栅和两个圆圆的头灯。',
  cab: '放大到驾驶室，找一找大方向盘和它前面的仪表台。',
  doors: '拖动动作滑杆，看两扇车门怎样从中间折开。',
  seats: '走进车厢，看看一排排蓝座椅和高高的靠背。',
  aisle: '沿着中间的过道一直往后走，看看它通到哪里。',
  stopsign: '拖动滑杆，看那块红色八角牌怎样从车身侧面伸出来。',
  lights: '转到车头正面，数一数车顶上有几盏警示灯，哪一盏先亮。',
  wheels: '转到侧面，比较前轮和后轮，看看亮闪闪的轮毂。'
 };
 const helps = {
  body: '车身位置固定；拆解后能看到黄色外壳和里面的座椅、地板分开。',
  roof: '车顶盖住车厢；放大后能看到拱形顶板和两扇逃生窗。',
  hood: '舱盖在车头前方；拆解后能看到它和后面的驾驶室分开。',
  cab: '驾驶室在车身最前面；放大后能看到方向盘、仪表和驾驶座。',
  doors: '拖动动作滑杆：两片门扇各自绕铰链向外折开，就像到站开门。',
  seats: '座椅固定在地板上；打开剖面能看到一排排座椅和高靠背。',
  aisle: '过道在车厢正中；只有保持空着，紧急时才能最快疏散。',
  stopsign: '拖动动作滑杆：停车牌从贴着车身的位置摆出，直到和车身垂直。',
  lights: '警示灯装在车顶前部；放大后能看清红灯和黄灯的排列。',
  wheels: '车轮压在车轴两端；放大后能看清花纹、轮毂和轮罩。'
 };

// The bus is long and low, so the flank reads best from the side and the
// underside groups from below, where the floor and axles separate.
// yaw 0 puts the camera on +Z, straight at the flank, which is how the book draws
// the bus; +-PI/2 swings round to the nose (-X) or the tail (+X). Slight offsets
// keep the box from reading as a flat elevation.
const angles = {
 body: [.22, .14], roof: [.30, .50], hood: [-2.10, .12], cab: [-1.95, .16],
 doors: [-2.05, .06], seats: [.22, .12], aisle: [.22, -.10],
 stopsign: [-1.20, .10], lights: [-2.05, .28], wheels: [.35, -.14]
};
const clampRadius = { body: 5.4, roof: 4.6, hood: 2.2, cab: 2.4, doors: 2.0, seats: 4.2, aisle: 4.2, stopsign: 1.8, lights: 1.6, wheels: 4.2 };
const minRadius = { body: 3.8, roof: 3.4, hood: 1.5, cab: 1.7, doors: 1.4, seats: 2.8, aisle: 2.8, stopsign: 1.2, lights: 1.1, wheels: 2.8 };
 // A part that only makes sense next to its neighbour stays lit with it.
 const keepWith = {};
 const offsets = {
 body: [0, 0, 0], roof: [0, 1.6, 0], hood: [-.30, 0, 0], cab: [0, 0, 0],
 doors: [0, 0, 0], seats: [0, -.10, 0], aisle: [0, 0, 0],
 stopsign: [0, 0, 0], lights: [0, .30, 0], wheels: [0, -.20, 0]
 }; // The camera looks at the middle of the bus: it runs from y = -2.06 (ground) to
// y = +1.79 (roof crown), so its visual centre is near y = -0.15.
const look0 = new T.Vector3(-.30, -.30, 0);
 let renderer, scene, camera, bus, assemblies = [], active = null, detail = null, mode='outside', playing = false, slow = true, simTime = 0, mechanism = 0, autoRotate = false;
let yaw = -.62, pitch = .16, distance = 19, overviewDistance = 19, explosion = 0, targetExplosion = 0, reveal = 0, near = 0;
const look = new T.Vector3(-.30, -.30, 0), target = { yaw, pitch, distance, look: look.clone() };
 const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches, pickables = [], surfaces = [], materialOriginal = new Map(), materialTransparency = new Map();
 let activeFit = 6, clipping = new T.Plane(), lastFrame = 0;

 const exhibit=LabExhibit.create('schoolbus',T),viewHistory=[];let openingView=null;
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
 function home() {remember();closeExhibit(); active = null; detail = null; mode='outside'; playing = false; autoRotate = false; targetExplosion = 0; target.look.copy(look0); target.yaw = .34; target.pitch = .20; target.distance = overviewDistance; renderLesson(); }
 function back(){restoreView(viewHistory.pop());renderLesson();}
 function renderLesson() {
  const p = data(); progress(); document.querySelector('.inspector').scrollTop = 0;
  $('part-name').textContent = p?.name || 'Your school bus'; $('part-zh-name').textContent = p?.zhName || '你的校车'; $('lesson-category').textContent = active ? (detail ? 'LOOK INSIDE' : 'MEET THE PART') : 'A WORLD INSIDE';
  $('part-en').textContent = p?.en || 'Look closer. There is a whole world inside this bus.'; $('part-zh').textContent = p?.zh || '靠近一点，这辆巴士里面还有一个世界。';
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
  $('mechanism-controls').hidden=!active||!['doors', 'stopsign'].includes(active.region);if($('mechanism-controls').hidden)$('mechanism-help').textContent='';$('part-directory').open=false;$('part-zh-name').after($('operation-panel'));$('operation-panel').after($('explore-section'));updateButtons();
 }
 function updateButtons() { document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', b.dataset.view === mode)); $('mechanism-play').setAttribute('aria-pressed', playing); $('mechanism-play').textContent = playing ? 'Ⅱ 暂停观察' : '▶ 看它怎样工作'; $('auto-rotate').setAttribute('aria-pressed', autoRotate); $('explode-button').setAttribute('aria-pressed', targetExplosion > 0); $('explode-button').textContent = targetExplosion ? '组装' : '拆解'; $('slow-play').setAttribute('aria-pressed', slow); }
 lessons.forEach((p, i) => { const b = document.createElement('button'); b.className = 'region-button'; b.dataset.part = p.id; b.setAttribute('aria-pressed', false); b.innerHTML = '<i>' + String(i + 1).padStart(2, '0') + '</i><span><strong>' + p.name + '</strong><small>' + p.zhName + '</small></span>'; b.onclick = () => { if (camera) selectAssembly(nearestAssembly(p.id)); else { $('part-name').textContent = p.name; $('part-en').textContent = p.en; $('part-zh').textContent = p.zh; } }; $('region-list').append(b); });
 $('speak').onclick = () => speech.say($('part-name').textContent + '. ' + $('part-en').textContent, true);
 $('language').onclick = () => { const only = document.body.classList.toggle('english-only'); $('language').textContent = only ? 'English only' : '中英双语'; $('language').setAttribute('aria-pressed', !only); };
 $('book-view').onclick = $('whole-bus').onclick = $('home-view').onclick = home; $('back-view').onclick=back;$('back-part').onclick=()=>{detail=null;renderLesson();};$('focus-part').onclick=()=>{remember();focus();renderLesson();};$('open-part').onclick=toggleOpening;
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
  // HELLO, / YOUR BUS captions sit behind the model, not on top of it.
  scene = new T.Scene(); camera = new T.PerspectiveCamera(42, 1, .02, 200);
  renderer = new T.WebGLRenderer({ antialias: true, alpha: true }); renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.outputColorSpace = T.SRGBColorSpace; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1; renderer.localClippingEnabled = true; renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
  const canvas = renderer.domElement; $('viewport').prepend(canvas); canvas.setAttribute('aria-hidden', 'true'); canvas.onwebglcontextlost = e => { e.preventDefault(); $('load-error').hidden = false; };
  scene.add(new T.HemisphereLight(0xf4f8ff, 0x9bafbd, 2.5)); const key = new T.DirectionalLight(0xfff7e9, 3.2); key.position.set(-7, 14, 11); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -14, right: 14, top: 12, bottom: -12, near: .1, far: 60 }); key.shadow.normalBias = .025; key.shadow.bias = -.0003; scene.add(key); const fill = new T.DirectionalLight(0xd6edff, 1.4); fill.position.set(6, 5, -8); scene.add(fill);
  bus = SchoolBusV3.create(T); assemblies = bus.assemblies; scene.add(bus.root);
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
  const ground = new T.Mesh(new T.PlaneGeometry(80, 80), new T.ShadowMaterial({ opacity: .13 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -2.06; ground.receiveShadow = true; scene.add(ground);
  const grid = new T.GridHelper(26, 26, 0xd1dee7, 0xe0e8ef); grid.position.y = -2.055; grid.material.transparent = true; grid.material.opacity = .26; scene.add(grid);
  function resize() {
   const b = $('viewport').getBoundingClientRect(); renderer.setSize(b.width, b.height, false); camera.aspect = b.width / b.height; camera.updateProjectionMatrix();
   // The bus is long and low, so it is the LENGTH that has to fit: at distance d
   // the horizontal view spans 2*d*tan(24)*aspect, so d ~= 9.4/aspect fills about
   // 90% of the width. On a narrow phone the height becomes the binding
   // constraint, so take whichever of the two needs more room.
   const byLength = 12.8 / Math.max(.5, camera.aspect);
   const byHeight = 5.6;
   overviewDistance = Math.max(10, Math.max(byLength, byHeight));
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
  window.busLab = {
   setView: (y, p, d, x = 0) => { autoRotate = false; active = null; detail = null; mode='outside'; targetExplosion = 0; renderLesson(); target.yaw = y; target.pitch = p; target.distance = d; target.look.set(x, -.6, 0); },
   select: id => selectAssembly(nearestAssembly(id)), focusDetail: id => selectDetail(id),
   snapshot: () => ({displayVersion:1,...exhibit.snapshot(),history:viewHistory.length, generation: 4, changedOpacity: surfaces.filter(s => s.materials.some(m => Math.abs(m.opacity - materialOriginal.get(m).opacity) > 1e-6)).length, modelId: bus.root.uuid, selected: active?.region || null, assembly: active?.id || null, detail, near, reveal, mode, playing, simulationTime: simTime, level: mechanism, explosion, meshCount: pickables.length, geometry: bus.counts, visited: journal.read().found, camera: { yaw, pitch, distance, target: look.toArray() }, assemblies: assemblies.map(a => ({ id: a.id, region: a.region, exterior: a.exterior.visible, interior: a.interior.visible, ghost:a.ghost.visible,exteriorPosition:a.exterior.position.toArray(),position:a.group.position.toArray() })), renderer: renderer.info.render }),
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
  bus.update({ time: simTime, mechanism: mechanism > .001, level: mechanism, region: active?.region });
  for (const a of assemblies) { a.group.position.copy(a.base).addScaledVector(a.offset, explosion); if (a.update) a.update({ time: simTime, mechanism: mechanism > .001, level: mechanism, region: active?.region }); }
  exhibit.step(ease,assemblies,surfaces,materialOriginal,explosion,active);
  bus.root.updateMatrixWorld(true);
  const label = $('model-label'); label.hidden = !active || near < .2;
  if (!label.hidden) { const p = (detail ? detailCenter() : worldCenter(active)).project(camera), b = $('viewport').getBoundingClientRect(); label.textContent = data().name; label.hidden = Math.abs(p.x) > 1 || Math.abs(p.y) > 1 || p.z > 1; label.style.left = (p.x * .5 + .5) * b.width + 'px'; label.style.top = (-p.y * .5 + .5) * b.height - 20 + 'px'; }
  renderer.render(scene, camera);
 }
 window.addEventListener('pagehide', () => { playing = false; speech.stop(); });
 try { init(); } catch (e) { console.error('School bus v3', e); $('load-error').hidden = false; }
 renderLesson();
 function deepLink() { if (!camera || !assemblies.length) return; const id = new URLSearchParams(location.search).get('part'); if (id && lessons.some(p => p.id === id)) selectAssembly(nearestAssembly(id)); }
 window.addEventListener('hashchange', deepLink); deepLink();
})();

(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const lessons = window.PLANE_PARTS;
  const detailLessons = window.AIRPLANE_DETAILS;
  let storage;try{storage=localStorage;}catch{storage={getItem(){return null;},setItem(){throw Error('unavailable');}};}
  const journal=DiscoveryProgress.create(storage,'little-wings:whole-airplane:v1',{parts:[...lessons.map(p=>p.id),...detailLessons.map(p=>p.id)],actions:['open','spin','bypass','core','shaft'],tasks:ENGINE_CONTENT.tasks.map(t=>t.id)});
  // Preserve discoveries made in the previously published engine explorer.
  const previousJournal=DiscoveryProgress.create(storage,'little-wings:engine-discovery:v1',{parts:ENGINE_CONTENT.parts.map(p=>p.id),actions:['open','spin','bypass','core','shaft'],tasks:ENGINE_CONTENT.tasks.map(t=>t.id)}).read();
  previousJournal.found.forEach(id=>journal.mark('found','engine.'+id));
  for(const kind of ['operated','explained'])previousJournal[kind].forEach(id=>journal.mark(kind,id));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const visited = new Set(journal.read().found);
  let detailId=null,detailsModel=null,manualCutaway=0,effectiveCutaway=0,mechanism=0,simulationTime=0,mechanismPlaying=false;
  let selected = 0, explosion = 0, targetExplosion = 0, showLabels = false;
  let autoRotate = false, scene, camera, renderer, model, raycaster, suspended = false;
  const look = {x:0,y:-.25,z:0}, lookTarget = {...look};
  const nodes = [], pickables = [], labels = [];
  let yaw = -0.45, pitch = 0.48, distance = 13.8;
  const cameraTarget = {yaw, pitch, distance};
  let quizRound = 0, quizScore = 0, quizPart = null, quizAnswered = false, quizOrder = [];

  lessons.forEach((p, i) => {
    const button = document.createElement('button');
    button.className = 'part-button';
    button.style.setProperty('--part-color', p.color);
    button.dataset.part = p.id;
    button.innerHTML = `<span class="dot"></span><span>${p.name}</span><span class="zh">${p.zhName}</span>`;
    button.addEventListener('click', () => selectPart(i));
    button.addEventListener('dblclick',()=>focusCurrent());
    $('part-list').append(button);
    const label = document.createElement('button');
    label.className = 'model-label';
    label.style.setProperty('--part-color', p.color);
    label.innerHTML = `<b></b>${p.name}`;
    label.addEventListener('click', () => selectPart(i));
    label.addEventListener('dblclick',()=>focusCurrent());
    $('labels').append(label);
    labels.push(label);
  });

  const speech = window.LabSpeech.create($('speak'), $('speech-status'));
  const stopSpeech = () => speech.stop();
  const say = (text, main = false) => speech.say(text, main);
  function selectPart(i) {
    selected = (i + lessons.length) % lessons.length;
    detailId=null;
    const p = lessons[selected];
    visited.add(p.id);
    journal.mark('found',p.id);
    stopSpeech();
    $('part-number').textContent = `${String(selected + 1).padStart(2, '0')} / 10`;
    $('part-symbol').textContent = String(selected + 1).padStart(2, '0');
    $('part-category').textContent = p.category;
    $('part-name').textContent = p.name;
    $('part-zh-name').textContent = p.zhName;
    $('part-en').textContent = p.en;
    $('part-zh').textContent = p.zh;
    $('part-tip').textContent = p.tip;
    if($('selected-engine-entry'))$('selected-engine-entry').hidden=p.id!=='engines';
    $('progress-text').textContent = `${visited.size} / ${lessons.length+detailLessons.length}`;
    $('stage-region').textContent=p.zhName;$('stage-detail').textContent='';
    $('part-principle').textContent=principles[p.id]||p.tip;
    $('detail-list').replaceChildren();const children=detailLessons.filter(d=>d.region===p.id);$('detail-count').textContent=children.length?children.length+' 个细节':'可操作部件';
    children.forEach(d=>{const b=document.createElement('button');b.dataset.detail=d.id;b.setAttribute('aria-pressed','false');b.innerHTML=`${d.name}<small>${d.zhName}</small>`;b.addEventListener('click',()=>selectDetail(d.id,true));$('detail-list').append(b);});
    $('engine-missions').hidden=p.id!=='engines';$('mechanism-help').textContent=mechanismHelp[p.id]||'拖动机构滑杆，观察活动面绕连接处转动。';
    labels.forEach((l,n)=>l.innerHTML=`<b></b>${lessons[n].name}`);
    document.querySelectorAll('.part-button').forEach((b, n) => {
      b.setAttribute('aria-pressed', n === selected);
      b.classList.toggle('explored', visited.has(lessons[n].id));
    });
    labels.forEach((l, n) => l.classList.toggle('active', n === selected));
    if (model) model.traverse(o => {
      if (!o.isMesh || !o.userData.part || !o.material.emissive) return;
      const active = o.userData.part === p.id;
      o.material.emissive.set(active ? '#3c6950' : '#000000');
      o.material.emissiveIntensity = active ? 0.19 : 0;
    });
  }

  const principles={fuselage:'外壳包住机身骨架。客舱在地板上方，行李货舱在下方。',cockpit:'驾驶舱里有座椅、仪表与控制器。这里展示它们的位置，不模拟真实驾驶程序。',wings:'翼梁和翼肋支撑机翼；不同活动翼面帮助改变飞机的运动和气流。',engines:'风扇与核心共同推动空气向后。单轴结构、叶片级数与气流速度为教学简化。',gear:'轮子承受地面载荷，支柱传递载荷并缓冲触地。这里以轮轴、支柱和刹车包为重点。',ailerons:'两侧副翼相反偏转，帮助飞机滚转。动作幅度为定性示意。',elevators:'升降舵位于水平尾翼后缘，帮助改变飞机的俯仰。',rudder:'方向舵位于垂直尾翼后缘，帮助改变机头左右偏转。'};
  const mechanismHelp={fuselage:'剖切看客舱骨架、座椅与下层行李；这个区域没有播放动画。',cockpit:'放大座椅、仪表与控制器；这里以内部位置为重点。',engines:'拖动机构滑杆转动叶片；演示时跟随气流。选择转轴可突出连接。',wings:'机构滑杆演示襟翼、缝翼与扰流板的不同动作；这是并列比较，非真实飞行构型。',gear:'机构滑杆转动车轮，放大看轮轴和刹车包；不模拟起落架收放。'};
  function selectDetail(id,focus=false){const d=detailLessons.find(d=>d.id===id);if(!d)return;if(lessons[selected].id!==d.region)selectPart(lessons.findIndex(p=>p.id===d.region));detailId=id;visited.add(id);journal.mark('found',id);stopSpeech();$('part-name').textContent=d.name;$('part-zh-name').textContent=d.zhName;$('part-en').textContent=d.en;$('part-zh').textContent=d.zh;$('part-tip').textContent=d.tip;$('part-principle').textContent=d.principle;$('stage-detail').textContent='› '+d.zhName;$('progress-text').textContent=`${visited.size} / ${lessons.length+detailLessons.length}`;document.querySelectorAll('[data-detail]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.detail===id));labels[selected].innerHTML=`<b></b>${d.name}`;if(focus){manualCutaway=.95;$('cutaway').value='95';focusCurrent();}}
  function nearestNode(id){return nodes.filter(n=>n.id===id).sort((a,b)=>a.group.getWorldPosition(new THREE.Vector3()).distanceToSquared(camera.position)-b.group.getWorldPosition(new THREE.Vector3()).distanceToSquared(camera.position))[0];}
  function focusPoint(point,d){Object.assign(lookTarget,{x:point.x,y:point.y,z:point.z});cameraTarget.distance=d;autoRotate=false;$('auto-rotate').setAttribute('aria-pressed',false);}
  function focusCurrent(){
    if(!model)return;
    const region=lessons[selected].id;model.updateMatrixWorld(true);
    const node=nearestNode(region),point=detailId?detailsModel.anchor(detailId,camera.position):node.group.localToWorld(node.anchor.clone());
    if(point){
      const side=point.z<0?-1:1;
      // Approach from outside the selected side; see wheels below the wing.
      const angles={gear:[side>0?0:Math.PI,-.12],wings:[side>0?-.3:Math.PI+.3,.8],engines:[side>0?-.65:Math.PI+.65,.12],fuselage:[side>0?-.3:Math.PI+.3,.18],cockpit:[side>0?.7:Math.PI-.7,.22]};
      if(angles[region])view(...angles[region]);
      focusPoint(point,detailId?(region==='wings'?3.1:region==='fuselage'?2.8:1.65):({fuselage:7,cockpit:3,wings:5,engines:3,gear:2.8}[region]||4));
    }
    if(innerWidth<781)$('viewport').scrollIntoView({block:'start',behavior:'instant'});
  }
  function homeView(){view(-.45,.48);Object.assign(lookTarget,{x:0,y:-.25,z:0});cameraTarget.distance=targetExplosion>.5?17:13.8;manualCutaway=0;$('cutaway').value='0';mechanism=0;$('mechanism').value='0';mechanismPlaying=false;$('mechanism-play').setAttribute('aria-pressed',false);$('mechanism-play').textContent='▶ 演示';}
  $('focus-part').addEventListener('click',focusCurrent);$('whole-airplane').addEventListener('click',homeView);
  $('controls-toggle').addEventListener('click',()=>{const open=document.querySelector('.learning-panel').classList.toggle('controls-open');$('controls-toggle').setAttribute('aria-expanded',open);});
  $('cutaway').addEventListener('input',e=>{manualCutaway=Number(e.target.value)/100;$('auto-reveal').checked=false;});
  $('mechanism').addEventListener('input',e=>{mechanism=Number(e.target.value)/100;simulationTime=mechanism*4;recordObservation();});
  $('mechanism-play').addEventListener('click',()=>{mechanismPlaying=!mechanismPlaying;$('mechanism-play').setAttribute('aria-pressed',mechanismPlaying);$('mechanism-play').textContent=mechanismPlaying?'Ⅱ 暂停':'▶ 演示';});
  $('mechanism-step').addEventListener('click',()=>{mechanismPlaying=false;$('mechanism-play').setAttribute('aria-pressed',false);$('mechanism-play').textContent='▶ 演示';simulationTime+=.25;mechanism=(mechanism+.08)%1;$('mechanism').value=Math.round(mechanism*100);recordObservation();});
  function recordObservation(){if(!renderer||lessons[selected].id!=='engines')return;if(effectiveCutaway>.6)journal.mark('operated','open');if(mechanism>.05){journal.mark('operated','spin');if(effectiveCutaway>.6){if(detailId==='engine.bypass')journal.mark('operated','bypass');if(['engine.compressor','engine.combustor','engine.turbine'].includes(detailId))journal.mark('operated','core');if(detailId==='engine.shaft')journal.mark('operated','shaft');}}}
  ENGINE_CONTENT.tasks.forEach(t=>{const o=document.createElement('option');o.value=t.id;o.textContent=t.title;$('engine-task').append(o);});
  function renderEngineTask(){const t=ENGINE_CONTENT.tasks.find(t=>t.id===$('engine-task').value);$('engine-task-question').textContent=t.question;$('engine-task-zh').textContent=t.zh;$('engine-task-feedback').textContent=journal.read().explained.includes(t.id)?'✓ 这个发现已保存，可继续观察。':'先放大对应零件，打开剖切并操作机构。两条路线分别选择外涵道和燃烧室观察。';$('engine-task-answers').replaceChildren();t.answers.forEach(([id,en,zh])=>{const b=document.createElement('button');b.textContent=en+' · '+zh;b.addEventListener('click',()=>{const state=journal.read();const found=!t.found||state.found.includes('engine.'+t.found);if(!found||!t.needs.every(n=>state.operated.includes(n))){$('engine-task-feedback').textContent='先观察对应零件并操作机构，再解释你的发现。';return;}if(id===t.correct){journal.mark('explained',t.id);$('engine-task-feedback').textContent='✓ 已保存：'+t.discovery;}else $('engine-task-feedback').textContent=t.hint;});$('engine-task-answers').append(b);});}
  $('engine-task').addEventListener('change',renderEngineTask);$('engine-task-speak').addEventListener('click',()=>say(ENGINE_CONTENT.tasks.find(t=>t.id===$('engine-task').value).question));renderEngineTask();

  function setExplosion(value) {
    targetExplosion = Math.max(0, Math.min(1, value));
    $('explode').value = Math.round(targetExplosion * 100);
    $('explode-value').textContent = `${Math.round(targetExplosion * 100)}%`;
    $('stage-mode').textContent = targetExplosion > 0 ? '拆解探索' : '整机观察';
    $('explode-button').textContent = targetExplosion > 0.95 ? '✓ 已全部拆解' : '◈ 一键拆解';
    if (targetExplosion > 0.5) {cameraTarget.distance = Math.max(cameraTarget.distance, 17);Object.assign(lookTarget,{x:0,y:-.25,z:0});}
  }
  $('explode').addEventListener('input', e => setExplosion(Number(e.target.value) / 100));
  $('explode-button').addEventListener('click', () => setExplosion(1));
  $('assemble').addEventListener('click', () => { setExplosion(0); homeView(); });
  $('toggle-labels').addEventListener('click', () => {
    showLabels = !showLabels;
    $('toggle-labels').setAttribute('aria-pressed', showLabels);
  });
  $('prev-part').addEventListener('click', () => selectPart(selected - 1));
  $('next-part').addEventListener('click', () => selectPart(selected + 1));
  $('speak').addEventListener('click', () => {
    if ('speechSynthesis' in window && (speechSynthesis.speaking || speechSynthesis.pending)) stopSpeech();
    else say(`${$('part-name').textContent}. ${$('part-en').textContent}`, true);
  });
  $('language').addEventListener('click', () => {
    const onlyEnglish = document.body.classList.toggle('english-only');
    $('language').setAttribute('aria-pressed', !onlyEnglish);
    $('language').textContent = onlyEnglish ? 'English only' : '中英双语';
  });
  function view(y, p) { cameraTarget.yaw = y; cameraTarget.pitch = p; autoRotate = false; $('auto-rotate').setAttribute('aria-pressed', false); }
  $('home-view').addEventListener('click', homeView);
  $('top-view').addEventListener('click', () => view(0, 1.52));
  $('side-view').addEventListener('click', () => view(0, 0.06));
  $('zoom-in').addEventListener('click', () => {if(cameraTarget.distance>8)focusCurrent();else cameraTarget.distance=Math.max(.65,cameraTarget.distance*.8);});
  $('zoom-out').addEventListener('click', () => cameraTarget.distance = Math.min(30, cameraTarget.distance*1.25));
  $('auto-rotate').addEventListener('click', () => { autoRotate = !autoRotate; $('auto-rotate').setAttribute('aria-pressed', autoRotate); });

  function init3D() {
    const T = window.THREE;
    if (!T) throw Error('THREE could not load');
    scene = new T.Scene();
    camera = new T.PerspectiveCamera(39, 1, 0.015, 100);
    renderer = new T.WebGLRenderer({antialias:true, alpha:true});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    $('viewport').append(renderer.domElement);
    renderer.domElement.setAttribute('aria-hidden', 'true');
    renderer.domElement.addEventListener('webglcontextlost', e => {
      e.preventDefault(); $('load-error').hidden = false;
      $('load-error').textContent = '3D 显示暂时中断，请刷新页面恢复。右侧英文学习卡仍可使用。';
    });
    scene.add(new T.HemisphereLight(0xfffcf0, 0x789b87, 2.5));
    const key = new T.DirectionalLight(0xfff4df, 3.3);
    key.position.set(-5, 10, 6); key.castShadow = true;
    key.shadow.mapSize.set(2048,2048);
    Object.assign(key.shadow.camera, {left:-11,right:11,top:11,bottom:-11,near:0.1,far:35});
    key.shadow.bias = -0.0005; key.shadow.normalBias = 0.035;
    scene.add(key);
    const fill = new T.DirectionalLight(0xe6f7ff, 1.4); fill.position.set(6,3,-7); scene.add(fill);
    model = new T.Group(); scene.add(model);
    raycaster = new T.Raycaster();
    const mat = (color, options = {}) => new T.MeshStandardMaterial({color, roughness:0.42, metalness:0.08, ...options});
    const colors = {cream:'#faf3da',wing:'#419d91',dark:'#244858',gold:'#e5b646',orange:'#e68057',rubber:'#354850'};
    function addPart(id, position, offset, anchor) {
      const group = new T.Group(); group.position.set(...position); group.userData.part = id;
      model.add(group);
      const base = group.position.clone();
      const lineGeo = new T.BufferGeometry().setFromPoints([base,base]);
      const line = new T.Line(lineGeo,new T.LineDashedMaterial({color:0x8ea794,dashSize:0.12,gapSize:0.12,transparent:true,opacity:0.55}));
      line.visible = false; scene.add(line);
      nodes.push({id,group,base,offset:new T.Vector3(...offset),anchor:new T.Vector3(...anchor),line});
      return group;
    }
    function mesh(group, geo, material, position = [0,0,0]) {
      const m = new T.Mesh(geo,material.clone()); m.position.set(...position);
      m.castShadow = true; m.receiveShadow = true; m.userData.part = group.userData.part;
      group.add(m); pickables.push(m); return m;
    }
    function sphere(g, pos, scale, color) {
      const m = mesh(g,new T.SphereGeometry(1,36,24),mat(color),pos); m.scale.set(...scale); return m;
    }
    function box(g,pos,size,color) { return mesh(g,new T.BoxGeometry(...size),mat(color),pos); }
    function panel(g, points, depth, color, plane = 'xz') {
      const shape = new T.Shape(); points.forEach(([a,b],i) => i ? shape.lineTo(a,b) : shape.moveTo(a,b)); shape.closePath();
      const geo = new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:0.035,bevelThickness:0.025,curveSegments:1});
      geo.translate(0,0,-depth/2);
      if (plane === 'xz') geo.rotateX(Math.PI/2);
      return mesh(g,geo,mat(color));
    }
    // The airplane points toward -X. Z is the span; Y is up.
    const body = addPart('fuselage',[0,0,0],[0,0,0],[-0.8,0.75,0]);
    const profile = [[0,-3.8],[.16,-3.69],[.36,-3.43],[.53,-3.05],[.64,-2.55],[.68,-1.7],[.68,.65],[.6,1.8],[.44,2.75],[.19,3.55],[.025,3.9],[0,3.95]];
    const bodyGeo = new T.LatheGeometry(profile.map(([r,x])=>new T.Vector2(r,x)),64); bodyGeo.rotateZ(-Math.PI/2);
    mesh(body,bodyGeo,mat(colors.cream));
    // Painted belly and rows of inset passenger windows.
    sphere(body,[0,-.35,0],[2.9,.34,.58], '#b8d5c3');
    for (const side of [-1,1]) {
      for (let j=0;j<11;j++) sphere(body,[-2.02+j*.35,.22,side*.643],[.094,.12,.024], colors.dark);
      const stripe = box(body,[-.05,-.02,side*.673],[4.65,.055,.016],colors.wing);
      stripe.material.roughness = .7;
      const door = box(body,[-2.45,.08,side*.595],[.25,.59,.045], '#e1d9c2'); door.rotation.x = side*.08;
      box(body,[-2.45,.2,side*.624],[.12,.15,.014],colors.dark);
    }
    const cockpit = addPart('cockpit',[-2.86,.38,0],[-1.15,1.5,0],[-.1,.4,0]);
    sphere(cockpit,[0,0,0],[.62,.38,.48],colors.dark);
    box(cockpit,[-.13,.25,0],[.035,.15,.84],colors.cream).rotation.z = -.2;
    box(cockpit,[-.4,.17,0],[.27,.08,.045],colors.cream).rotation.z = .5;
    // Separate left/right wings, with matching blue outer trailing ailerons.
    for (const s of [-1,1]) {
      const wing = addPart('wings',[0,-.17,0],[0,.22,s*1.85],[.6,.14,s*2.7]);
      panel(wing,[[-.9,s*.51],[.83,s*4.12],[1.43,s*4.12],[1.06,s*2.45],[1.17,s*2.43],[1.44,s*.51]],.11,colors.wing);
      const tip = box(wing,[1.06,.14,s*4.06],[.58,.34,.07],colors.wing); tip.rotation.x = s*-.22;
      const navigation = sphere(wing,[.85,.045,s*4.07],[.085,.07,.075],s===1?'#ec7056':'#9bd289'); navigation.material.emissive.set(s===1?'#873326':'#387b32');
      const aileron = addPart('ailerons',[0,-.17,0],[.5,.32,s*2.0],[1.55,.13,s*3.2]);
      panel(aileron,[[1.12,s*2.5],[1.49,s*4.1],[1.79,s*4.08],[1.6,s*2.5]],.08,'#5f92b3');
      // Turbofan nacelle: an open ring, a recessed dark core, a hub and blades.
      const engine = addPart('engines',[-.38,-.84,s*1.84],[-.55,-1.0,s*1.45],[-.4,.05,0]);
      box(engine,[.35,.44,0],[.66,.45,.14],'#d3daca');
      const engineProfile = [[.37,-.78],[.47,-.7],[.5,-.52],[.49,.45],[.36,.72],[.28,.73],[.32,.52],[.39,-.5],[.32,-.7],[.37,-.78]];
      const eg = new T.LatheGeometry(engineProfile.map(([r,x])=>new T.Vector2(r,x)),48); eg.rotateZ(-Math.PI/2);
      mesh(engine,eg,mat(colors.orange));
      const rim = mesh(engine,new T.TorusGeometry(.372,.055,12,48),mat('#f6d6a8'),[-.733,0,0]); rim.rotation.y = Math.PI/2;
      const disk = mesh(engine,new T.CylinderGeometry(.325,.325,.025,40),mat('#2d4348'),[-.64,0,0]); disk.rotation.z = Math.PI/2;
      const fan = new T.Group(); engine.add(fan); fan.userData.fan = true;
      for (let j=0;j<10;j++) {
        const a = j*Math.PI/5;
        const blade = mesh(engine,new T.BoxGeometry(.04,.24,.066),mat('#a2b7ad'),[-.67,Math.cos(a)*.18,Math.sin(a)*.18]);
        blade.rotation.x = a; fan.attach(blade);
      }
      sphere(engine,[-.75,0,0],[.17,.105,.105],'#d9dfca');
    }
    const fin = addPart('fin',[2.65,.37,0],[.5,1.8,0],[.35,1.13,0]);
    panel(fin,[[-.58,0],[.17,1.83],[.81,1.83],[.81,.23],[1.0,0]],.14,colors.gold,'xy');
    // Tail insignia is geometry, so it remains crisp in every view.
    for (const s of [-1,1]) { const dot = sphere(fin,[.35,1.09,s*.098],[.16,.16,.013],'#fff2c7'); }
    const rudder = addPart('rudder',[2.65,.37,0],[1.45,1.8,0],[1.06,1.0,0]);
    panel(rudder,[[.88,.25],[.88,1.8],[1.16,1.67],[1.42,.25]],.11,'#c78d39','xy');
    for (const s of [-1,1]) {
      const stabilizer = addPart('stabilizers',[2.63,.14,0],[1.05,.4,s*1.25],[.3,.1,s*1.3]);
      panel(stabilizer,[[-.51,s*.2],[.42,s*1.92],[.96,s*1.91],[.65,s*.2]],.08,'#88b49b');
      const elevator = addPart('elevators',[2.63,.14,0],[1.6,.15,s*1.35],[1.0,.05,s*1.35]);
      panel(elevator,[[.72,s*.2],[1.03,s*1.91],[1.27,s*1.83],[1.08,s*.2]],.065,'#d28e60');
    }
    for (const [x,z,isNose] of [[-2.5,0,true],[.82,-.54,false],[.82,.54,false]]) {
      const gear = addPart('gear',[x,-.62,z],[0,-1.75,z*.6],[0,-.6,0]);
      const strut = mesh(gear,new T.CylinderGeometry(.055,.06,.6,12),mat('#bbc6bd'),[0,-.3,0]);
      for (const side of [-1,1]) {
        const wheel = mesh(gear,new T.CylinderGeometry(isNose?.19:.25,isNose?.19:.25,.12,24),mat(colors.rubber),[0,-.63,side*(isNose?.1:.16)]);
        wheel.rotation.x = Math.PI/2;
        const hub = mesh(gear,new T.CylinderGeometry(.085,.085,.126,18),mat('#a7b9ac'),[0,-.63,side*(isNose?.1:.16)]); hub.rotation.x = Math.PI/2;
      }
    }
    // A quiet circular display plinth and radial hangar markings.
    const floor = new T.Mesh(new T.CircleGeometry(6.9,96),mat('#e4ecd9',{roughness:1,metalness:0}));
    floor.rotation.x = -Math.PI/2; floor.position.y = -3.4; floor.receiveShadow = true; scene.add(floor);
    const ring = new T.Mesh(new T.RingGeometry(6.15,6.17,96),new T.MeshBasicMaterial({color:'#cad9c2',side:T.DoubleSide}));
    ring.rotation.x = -Math.PI/2;ring.position.y=-3.387;scene.add(ring);
    const shadow = new T.Mesh(new T.PlaneGeometry(200,200),new T.ShadowMaterial({opacity:.10}));shadow.rotation.x=-Math.PI/2;shadow.position.y=-3.42;shadow.receiveShadow=true;scene.add(shadow);
    for(let i=0;i<12;i++){
      const a=i*Math.PI/6; const line=new T.Mesh(new T.BoxGeometry(.025,.008,.22),mat('#bdcfb6'));
      line.position.set(Math.sin(a)*6.16,-3.37,Math.cos(a)*6.16);line.rotation.y=a;scene.add(line);
    }

    detailsModel=window.AirplaneDetails.install({THREE:T,model,nodes,pickables});
    function resize() {
      const rect = $('viewport').getBoundingClientRect();
      if(!rect.width||!rect.height)return;
      renderer.setSize(rect.width,rect.height,false);
      camera.aspect = rect.width/rect.height;
      camera.fov = camera.aspect < 1 ? 48 : 39;
      camera.updateProjectionMatrix();
    }
    new ResizeObserver(resize).observe($('viewport')); resize();
    const pointers = new Map(); let pointerStart = null, dragDistance = 0, pinchDistance = 0, lastTap = null;
    const canvas = renderer.domElement;
    function pickAt(x,y){const r=canvas.getBoundingClientRect();raycaster.setFromCamera(new T.Vector2((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1),camera);return raycaster.intersectObjects(pickables,false).find(h=>{for(let o=h.object;o;o=o.parent)if(!o.visible)return false;return h.object.material.opacity>.18;});}
    function chooseHit(hit,focus=false){if(!hit)return;const id=hit.object.userData.part,i=lessons.findIndex(p=>p.id===id);if(i<0)return;if(hit.object.userData.detail)selectDetail(hit.object.userData.detail,false);else selectPart(i);if(focus){focusPoint(hit.point,hit.object.userData.detail?1.7:3);if(innerWidth<781)$('viewport').scrollIntoView({block:'center'});}}
    function pan(dx,dy){const scale=distance*.0014,right=new T.Vector3(1,0,0).applyQuaternion(camera.quaternion),up=new T.Vector3(0,1,0).applyQuaternion(camera.quaternion),v=right.multiplyScalar(-dx*scale).addScaledVector(up,dy*scale);lookTarget.x+=v.x;lookTarget.y+=v.y;lookTarget.z+=v.z;}
    canvas.addEventListener('contextmenu',e=>e.preventDefault());
    function pointerDown(e) {
      canvas.setPointerCapture(e.pointerId); pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      pointerStart={x:e.clientX,y:e.clientY}; dragDistance=0;
      if(pointers.size===2){const a=[...pointers.values()];pinchDistance=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);dragDistance=99;lastTap=null;const hit=pickAt((a[0].x+a[1].x)/2,(a[0].y+a[1].y)/2);if(hit&&cameraTarget.distance>3){chooseHit(hit);Object.assign(lookTarget,{x:hit.point.x,y:hit.point.y,z:hit.point.z});}}
      autoRotate=false;$('auto-rotate').setAttribute('aria-pressed',false);
    }
    canvas.addEventListener('pointerdown',pointerDown);
    canvas.addEventListener('pointermove',e=>{
      if(!pointers.has(e.pointerId))return;
      const old=pointers.get(e.pointerId),dx=e.clientX-old.x,dy=e.clientY-old.y;
      pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      dragDistance += Math.abs(dx)+Math.abs(dy);
      if(pointers.size===2){
        const a=[...pointers.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);
        if(pinchDistance>0)cameraTarget.distance=Math.max(.65,Math.min(30,cameraTarget.distance*pinchDistance/Math.max(1,d)));
        pinchDistance=d;
        pan(dx*.5,dy*.5);
      }else if(e.buttons===2||e.shiftKey){pan(dx,dy);}else{cameraTarget.yaw-=dx*.006;cameraTarget.pitch=Math.max(-1.2,Math.min(1.52,cameraTarget.pitch+dy*.005));}
    });
    canvas.addEventListener('pointerup',e=>{
      if(pointers.size===1&&dragDistance<6&&pointerStart){
        const hit=pickAt(e.clientX,e.clientY);
        if(hit){
          const id=hit.object.userData.part;chooseHit(hit);
          const now=performance.now();
          if(e.pointerType!=='mouse'&&lastTap&&now-lastTap.time<380&&Math.hypot(e.clientX-lastTap.x,e.clientY-lastTap.y)<25){lastTap=null;chooseHit(hit,true);}
          else lastTap=e.pointerType!=='mouse'?{time:now,x:e.clientX,y:e.clientY}:null;
        }else lastTap=null;
      }else lastTap=null;
      pointers.delete(e.pointerId);pinchDistance=0;pointerStart=null;
    });
    canvas.addEventListener('pointercancel',e=>{pointers.delete(e.pointerId);pointerStart=null;pinchDistance=0;});
    canvas.addEventListener('dblclick',e=>{
      if(dragDistance>=6)return;
      chooseHit(pickAt(e.clientX,e.clientY),true);
    });
    canvas.addEventListener('wheel',e=>{e.preventDefault();const hit=pickAt(e.clientX,e.clientY);if(e.deltaY<0&&hit&&cameraTarget.distance>3){const region=hit.object.userData.part;if(region!==lessons[selected].id)selectPart(lessons.findIndex(p=>p.id===region));Object.assign(lookTarget,{x:hit.point.x,y:hit.point.y,z:hit.point.z});}cameraTarget.distance=Math.max(.65,Math.min(30,cameraTarget.distance*Math.exp(e.deltaY*.0015)));},{passive:false});
    $('viewport').addEventListener('keydown',e=>{
      const keys=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-'];if(!keys.includes(e.key))return;e.preventDefault();
      if(e.key==='ArrowLeft')cameraTarget.yaw-=.15;if(e.key==='ArrowRight')cameraTarget.yaw+=.15;
      if(e.key==='ArrowUp')cameraTarget.pitch=Math.min(1.52,cameraTarget.pitch+.12);if(e.key==='ArrowDown')cameraTarget.pitch=Math.max(-1.2,cameraTarget.pitch-.12);
      if(e.key==='+'||e.key==='=')cameraTarget.distance=Math.max(.65,cameraTarget.distance*.8);if(e.key==='-')cameraTarget.distance=Math.min(30,cameraTarget.distance*1.25);
    });
    const world = new T.Vector3(), projected = new T.Vector3();
    let previousTime = performance.now();
    function frame(time) {
      requestAnimationFrame(frame);
      if(document.hidden||suspended){previousTime=time;return;}
      const dt=Math.min((time-previousTime)/1000,.05);previousTime=time;
      const ease=reduced?1:1-Math.exp(-dt*9);
      if(autoRotate)cameraTarget.yaw+=dt*.22;
      yaw+=(cameraTarget.yaw-yaw)*ease;pitch+=(cameraTarget.pitch-pitch)*ease;distance+=(cameraTarget.distance-distance)*ease;
      explosion+=(targetExplosion-explosion)*ease;
      const automatic=$('auto-reveal').checked?Math.max(0,Math.min(1,(4.5-distance)/2.6)):0;
      effectiveCutaway=Math.max(manualCutaway,automatic);
      $('cutaway-value').textContent=(automatic>manualCutaway?'自动 ':'')+Math.round(effectiveCutaway*100)+'%';
      $('stage-mode').textContent=effectiveCutaway>.3?'局部内部':'外观观察';
      if(mechanismPlaying){simulationTime+=dt;mechanism=.5-.5*Math.cos(simulationTime);$('mechanism').value=Math.round(mechanism*100);recordObservation();}
      const fittedDistance=distance*Math.max(1,1.15/camera.aspect);
      camera.position.set(Math.sin(yaw)*Math.cos(pitch)*fittedDistance,Math.sin(pitch)*fittedDistance,Math.cos(yaw)*Math.cos(pitch)*fittedDistance);
      for(const key of ['x','y','z'])look[key]+=(lookTarget[key]-look[key])*ease;
      camera.position.x+=look.x;camera.position.y+=look.y+.25;camera.position.z+=look.z;
      camera.lookAt(look.x,look.y,look.z);
      nodes.forEach(n=>{
        n.group.position.copy(n.base).addScaledVector(n.offset,explosion);
        n.line.visible=explosion>.02&&n.offset.lengthSq()>.1;
        const a=n.line.geometry.attributes.position;a.setXYZ(0,n.base.x,n.base.y,n.base.z);a.setXYZ(1,n.group.position.x,n.group.position.y,n.group.position.z);a.needsUpdate=true;n.line.computeLineDistances();
      });
      detailsModel.update({time:simulationTime,cutaway:effectiveCutaway,region:lessons[selected].id,mechanism,selected:detailId,focus:explosion>.05?0:Math.max(0,Math.min(1,(10-distance)/5)),focusPosition:lookTarget});
      model.updateMatrixWorld(true);camera.updateMatrixWorld(true);
      const width=canvas.clientWidth,height=canvas.clientHeight;
      // Labels stay attached to their 3D part; avoid overlaps when all are shown.
      const occupied=[];
      const order=[selected,...lessons.map((_,i)=>i).filter(i=>i!==selected)];
      order.forEach(i=>{
        const label=labels[i];
        if(!showLabels&&i!==selected){label.hidden=true;return;}
        const candidates=nodes.filter(n=>n.id===lessons[i].id);
        const n=candidates.sort((a,b)=>a.group.localToWorld(a.anchor.clone()).distanceToSquared(camera.position)-b.group.localToWorld(b.anchor.clone()).distanceToSquared(camera.position))[0];if(!n){label.hidden=true;return;}
        if(i===selected&&detailId){world.copy(detailsModel.anchor(detailId,camera.position));}else{world.copy(n.anchor);n.group.localToWorld(world);}projected.copy(world).project(camera);
        if(projected.z>1||projected.z<-1){label.hidden=true;return;}
        let x=Math.max(65,Math.min(width-75,(projected.x*.5+.5)*width));
        let y=Math.max(65,Math.min(height-24,(-projected.y*.5+.5)*height-20));
        let tries=0;
        while(occupied.some(p=>Math.abs(x-p.x)<115&&Math.abs(y-p.y)<30)&&tries<12){y+=31;if(y>height-22){y=80;x=Math.max(65,x-120);}tries++;}
        occupied.push({x,y});label.style.left=`${x}px`;label.style.top=`${y}px`;label.hidden=false;
      });
      renderer.render(scene,camera);
    }
    requestAnimationFrame(frame);
    window.airplaneLab = {
      select:id=>{const i=lessons.findIndex(p=>p.id===id);if(i>=0)selectPart(i);},
      setActive:active=>{suspended=!active;if(active)resize();else stopSpeech();},
      capture:()=>({yaw,pitch,distance,cameraTarget:{...cameraTarget},look:{...look},lookTarget:{...lookTarget},selected,autoRotate,explosion,targetExplosion}),
      restore:s=>{yaw=s.yaw;pitch=s.pitch;distance=s.distance;Object.assign(cameraTarget,s.cameraTarget);Object.assign(look,s.look);Object.assign(lookTarget,s.lookTarget);autoRotate=s.autoRotate;explosion=s.explosion;targetExplosion=s.targetExplosion;selectPart(s.selected);},
      approachEngine:()=>{stopSpeech();autoRotate=false;const n=nodes.filter(n=>n.id==='engines').sort((a,b)=>a.group.getWorldPosition(new T.Vector3()).distanceToSquared(camera.position)-b.group.getWorldPosition(new T.Vector3()).distanceToSquared(camera.position))[0];if(n){const v=n.group.getWorldPosition(new T.Vector3());Object.assign(lookTarget,{x:v.x,y:v.y,z:v.z});cameraTarget.distance=5.8;}},
      snapshot:()=>({selected:lessons[selected].id,detail:detailId,cutaway:effectiveCutaway,mechanism,simulationTime,modelId:model.uuid,detailCount:detailsModel.ids.length,explosion,targetExplosion,visited:[...visited],meshCount:pickables.length,position:nodes.map(n=>({id:n.id,position:n.group.position.toArray(),base:n.base.toArray()})),camera:{yaw,pitch,distance,target:{...look}},renderer:renderer.info.render}),
      projectPart:id=>{
        const n=nodes.filter(n=>n.id===id).sort((a,b)=>a.group.getWorldPosition(new T.Vector3()).distanceToSquared(camera.position)-b.group.getWorldPosition(new T.Vector3()).distanceToSquared(camera.position))[0];if(!n)return null;
        const v=n.group.getWorldPosition(new T.Vector3()).project(camera),r=canvas.getBoundingClientRect();return {x:r.left+(v.x*.5+.5)*r.width,y:r.top+(-v.y*.5+.5)*r.height};
      }
    };
  }

  const questions = {
    fuselage:'Find the body of the airplane.',cockpit:'Where do the pilots sit?',wings:'Which parts make lift?',engines:'Which parts push the airplane forward?',gear:'Which parts help the airplane roll on the ground?',fin:'Find the tall tail.',stabilizers:'Find the small, flat tail wings.',ailerons:'Which parts help one wing go up and the other go down?',elevators:'Which parts help the nose point up or down?',rudder:'Which part helps the nose point left or right?'
  };
  function shuffle(list) { const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a; }
  function quizQuestion() {
    quizAnswered=false;quizPart=quizOrder[quizRound];
    $('quiz-count').textContent=`第 ${quizRound+1} / 5 题 · 一起找一找`;
    $('quiz-question').textContent=questions[quizPart.id];$('quiz-feedback').textContent='';$('quiz-next').hidden=true;
    $('quiz-options').replaceChildren();
    const options=shuffle([quizPart,...shuffle(lessons.filter(p=>p.id!==quizPart.id)).slice(0,3)]);
    let firstTry=true;
    options.forEach(p=>{
      const b=document.createElement('button');b.textContent=p.name;
      b.addEventListener('click',()=>{
        if(quizAnswered)return;
        if(p.id===quizPart.id){
          quizAnswered=true;if(firstTry)quizScore++;
          b.classList.add('correct');$('quiz-feedback').textContent=`Yes! ${p.name}. 找对啦！这是${p.zhName}。`;
          selectPart(lessons.indexOf(p));$('quiz-next').textContent=quizRound===4?'看看我的成绩 ✦':'下一题 →';$('quiz-next').hidden=false;
        }else{firstTry=false;b.classList.add('wrong');b.disabled=true;$('quiz-feedback').textContent='再观察一下，你可以再试一次。';}
      });$('quiz-options').append(b);
    });
  }
  $('quiz').addEventListener('click',()=>{stopSpeech();quizRound=0;quizScore=0;quizOrder=shuffle(lessons).slice(0,5);quizQuestion();$('quiz-dialog').showModal();});
  $('quiz-speak').addEventListener('click',()=>{if(quizPart)say(questions[quizPart.id]);});
  $('quiz-next').addEventListener('click',()=>{
    if(quizRound===4){
      $('quiz-count').textContent='挑战完成 · GREAT EXPLORING!';$('quiz-question').textContent=`✦ ${quizScore} / 5`;
      $('quiz-feedback').textContent='你已经完成了 5 道题！继续探索，每次都会多认识一点。';$('quiz-options').replaceChildren();$('quiz-next').hidden=true;quizPart=null;
    }else{quizRound++;quizQuestion();}
  });
  $('quiz-dialog').addEventListener('close',stopSpeech);
  window.addEventListener('pagehide',()=>{mechanismPlaying=false;stopSpeech();});
  try{init3D();}catch(e){console.error('Airplane 3D:',e);$('load-error').hidden=false;}
  const requestedPart = new URLSearchParams(location.search).get('part');
  selectPart(Math.max(0, lessons.findIndex(p => p.id === requestedPart)));
  function followDetailLink(){if(location.hash==='#engine'){selectPart(lessons.findIndex(p=>p.id==='engines'));focusCurrent();}}
  window.addEventListener('hashchange',followDetailLink);followDetailLink();
})();

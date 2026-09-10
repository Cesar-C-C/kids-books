(() => {
 'use strict';
 const $=id=>document.getElementById(id),T=window.THREE,lessons=window.PLANE_PARTS,details=window.AIRPLANE_DETAILS;
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
 let storage;try{storage=localStorage;}catch{storage={getItem:()=>null,setItem:()=>{}};}
 const journal=DiscoveryProgress.create(storage,'little-wings:whole-airplane:v1',{parts:[...lessons,...details].map(p=>p.id),actions:['open','spin','bypass','core','shaft'],tasks:ENGINE_CONTENT.tasks.map(t=>t.id)});
 const legacy=DiscoveryProgress.create(storage,'little-wings:engine-discovery:v1',{parts:ENGINE_CONTENT.parts.map(p=>p.id),actions:['open','spin','bypass','core','shaft'],tasks:ENGINE_CONTENT.tasks.map(t=>t.id)}).read();
 legacy.found.forEach(id=>journal.mark('found','engine.'+id));for(const k of ['operated','explained'])legacy[k].forEach(id=>journal.mark(k,id));
 const speech=LabSpeech.create($('speak'),$('speech-status'));
 const notes={fuselage:'框架、地板和座椅共同组成客舱；行李位于地板下面。',cockpit:'飞行员根据仪表信息操作飞机，这里展示装置的位置与连接。',wings:'翼梁、翼肋和蒙皮共同承力。襟翼、缝翼和扰流板改变翼面的形状与气流。',engines:'风扇让空气向后流动；外涵空气绕过核心，核心内的燃料燃烧增加能量。',gear:'轮轴与支柱支撑机体；主轮刹车通过摩擦帮助机轮减速。',fin:'垂直尾翼帮助保持方向稳定，方向舵位于它的后缘。',stabilizers:'水平尾翼帮助保持俯仰稳定，升降舵位于它的后缘。',ailerons:'左右副翼朝相反方向偏转，帮助飞机滚转。',elevators:'升降舵偏转改变尾部的空气作用力，帮助控制俯仰。',rudder:'方向舵偏转，帮助控制机头的左右偏转。'};
 const tips={fuselage:'放大客舱，看看座椅、过道和地板下的行李。',cockpit:'靠近机头，找一找座椅前面的仪表和操纵装置。',wings:'靠近一侧机翼，找到沿翼展延伸的梁和一片片翼肋。',engines:'从前面的风扇开始，沿着发动机一直看向后方。',gear:'转到下方，看看轮轴、支柱和主轮内侧的刹车。',fin:'看看竖直的尾翼，比较它和后缘活动的方向舵。',stabilizers:'找到两片小尾翼，再观察它们后缘的升降舵。',ailerons:'按演示，观察机翼外侧后缘的活动面。',elevators:'按演示，观察水平尾翼后缘的活动面。',rudder:'按演示，观察垂直尾翼后缘的活动面。'};
 let renderer,scene,camera,airframe,assemblies=[],active=null,detail=null,mode='auto',flow='both',playing=false,slow=true,simTime=0,mechanism=0,autoRotate=false;
 let yaw=-.62,pitch=.4,distance=25,overviewDistance=25,explosion=0,targetExplosion=0,reveal=0,near=0;
 const look=new T.Vector3(0,.3,0),target={yaw,pitch,distance,look:look.clone()};
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,pickables=[],surfaces=[],materialOriginal=new Map(),materialTransparency=new Map();
 let activeFit=5,clipping=new T.Plane(),lastFrame=0;
 function progress(){$('progress-text').textContent=journal.read().found.length+' / 34';}
 function inherit(object,key){for(let o=object;o;o=o.parent)if(o.userData[key])return o.userData[key];return null;}
 function data(){return detail?details.find(d=>d.id===detail):active?lessons.find(p=>p.id===active.region):null;}
 function sameRegion(id){return assemblies.filter(a=>a.region===id);}
 function worldCenter(a){return a.group.localToWorld(a.center.clone());}
 function nearestAssembly(region){return sameRegion(region).sort((a,b)=>worldCenter(a).distanceToSquared(camera.position)-worldCenter(b).distanceToSquared(camera.position))[0];}
 function fit(radius){return Math.max(1.25,radius/Math.sin(T.MathUtils.degToRad(42/2))*1.05*Math.max(1,.95/camera.aspect));}
 function detailObjects(){return active&&detail?[].concat(active.details[detail]||[]):[];}
 function detailCenter(){
  const groups=detailObjects();if(!groups.length)return worldCenter(active);
  const box=new T.Box3();groups.forEach(g=>box.expandByObject(g));
  if(active.region==='gear'){
   const candidates=[];groups.forEach(g=>g.traverse(o=>{if(o.isMesh)candidates.push(o);}));
   candidates.sort((a,b)=>a.getWorldPosition(new T.Vector3()).distanceToSquared(camera.position)-b.getWorldPosition(new T.Vector3()).distanceToSquared(camera.position));
   if(candidates.length)return candidates[0].getWorldPosition(new T.Vector3());
  }
  return box.isEmpty()?worldCenter(active):box.getCenter(new T.Vector3());
 }
 function focus(){
  if(!active||!camera)return;
  const point=detail?detailCenter():worldCenter(active);target.look.copy(point);
  let r=active.radius;
  if(detail){const b=new T.Box3();detailObjects().forEach(g=>b.expandByObject(g));r=b.isEmpty()?.8:b.getBoundingSphere(new T.Sphere()).radius;r=Math.min(r,{fuselage:1.9,cockpit:.75,gear:.7,wings:1.85,engines:1.3}[active.region]||r);}
  target.distance=fit(r);activeFit=fit(active.radius);autoRotate=false;
  let angles=active.view||[-.5,.3];
  if(active.region==='engines')angles=[active.group.position.z<0?Math.PI+.7:-.7,.18];
  if(active.region==='gear')angles=[-.35,-.12];
  if(active.region==='wings')angles=[point.z<0?Math.PI+.3:-.3,.8];
  if(active.region==='fuselage')angles=[-.25,.15];
  if(active.region==='cockpit')angles=[.7,.18];
  if(active.region==='fin'||active.region==='rudder')angles=[.2,.2];
  if(active.region==='stabilizers'||active.region==='elevators')angles=[point.z<0?Math.PI+.3:-.3,.7];
  target.yaw=angles[0];target.pitch=angles[1];
  if(innerWidth<=800){const panel=document.querySelector('.inspector'),stage=document.querySelector('.stage');window.scrollTo({top:panel.getBoundingClientRect().top+scrollY-stage.offsetHeight-12,behavior:'instant'});}
 }
 function selectAssembly(a,focusIt=true){if(!a)return;active=a;detail=null;mode='auto';activeFit=fit(a.radius);speech.stop();journal.mark('found',a.region);renderLesson();if(focusIt)focus();}
 function selectDetail(id,focusIt=true){const d=details.find(d=>d.id===id);if(!d)return;if(!active||active.region!==d.region)active=nearestAssembly(d.region);detail=id;mode='inside';journal.mark('found',id);speech.stop();renderLesson();if(focusIt)focus();}
 function home(){active=null;detail=null;mode='auto';playing=false;autoRotate=false;targetExplosion=0;target.look.set(0,.3,0);target.yaw=-.62;target.pitch=.4;target.distance=overviewDistance;renderLesson();}
 function back(){if(detail){detail=null;mode='auto';renderLesson();focus();}else home();}
 function renderLesson(){
  const p=data();progress();document.querySelector('.inspector').scrollTop=0;
  $('part-name').textContent=p?.name||'Your airplane';$('part-zh-name').textContent=p?.zhName||'你的小飞机';$('lesson-category').textContent=active?(detail?'LOOK INSIDE':'MEET THE PART'):'A WORLD INSIDE';
  $('part-en').textContent=p?.en||'Look closer. There is a whole world inside this airplane.';$('part-zh').textContent=p?.zh||'靠近一点，这架飞机里面还有一个世界。';
  $('part-tip').textContent=detail?(p.tip.replace(/剖切滑杆/g,'剖面按钮').replace(/机构滑杆/g,'动作滑杆')):active?tips[active.region]:'拖动飞机，从不同方向看看。点一个部位，或把鼠标放在它上面向前滚动。';
  $('principle-box').hidden=!active;$('part-principle').textContent=detail?p.principle:active?notes[active.region]:'';
  $('crumb-region').textContent=active?'› '+lessons.find(p=>p.id===active.region).zhName:'';$('crumb-detail').textContent=detail?'› '+p.zhName:'';$('back-part').hidden=!detail;
  $('back-view').disabled=!active;
  document.querySelectorAll('[data-part]').forEach(b=>b.setAttribute('aria-pressed',active?.region===b.dataset.part));
  const children=active?details.filter(d=>d.region===active.region):[];
  $('explore-section').hidden=!children.length;$('detail-count').textContent=children.length+' 个发现';$('detail-list').replaceChildren();
  children.forEach(d=>{const b=document.createElement('button');b.className='detail-button';b.dataset.detail=d.id;b.setAttribute('aria-pressed',detail===d.id);b.innerHTML=d.name+'<small>'+d.zhName+'</small>';b.onclick=()=>selectDetail(d.id);$('detail-list').append(b);});
  $('operation-panel').hidden=!active;$('mechanism-controls').hidden=!active||['fuselage','cockpit','fin','stabilizers'].includes(active.region);
  $('mechanism-help').textContent=!active?'':active.region==='gear'?'轮子转动演示；支柱、刹车和舱口展示结构位置。':active.region==='engines'?'蓝色气流经过压气机，在燃烧室加热后变为暖色；单轴连接为教学简化。':active.region==='wings'?'襟翼、缝翼与扰流板分别演示自己的活动方式。':active.region==='fuselage'||active.region==='cockpit'?'拖动视角，观察结构的位置。':'';
  $('flow-choices').hidden=active?.region!=='engines';$('engine-missions').hidden=active?.region!=='engines';
  updateButtons();
 }
 function updateButtons(){document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.view===mode));document.querySelectorAll('[data-flow]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.flow===flow));$('mechanism-play').setAttribute('aria-pressed',playing);$('mechanism-play').textContent=playing?'Ⅱ 暂停观察':'▶ 看它怎样工作';$('auto-rotate').setAttribute('aria-pressed',autoRotate);$('explode-button').setAttribute('aria-pressed',targetExplosion>0);$('explode-button').textContent=targetExplosion?'组装':'拆解';$('slow-play').setAttribute('aria-pressed',slow);}
 lessons.forEach((p,i)=>{const b=document.createElement('button');b.className='region-button';b.dataset.part=p.id;b.setAttribute('aria-pressed',false);b.innerHTML='<i>'+String(i+1).padStart(2,'0')+'</i><span><strong>'+p.name+'</strong><small>'+p.zhName+'</small></span>';b.onclick=()=>{if(camera)selectAssembly(nearestAssembly(p.id));else{$('part-name').textContent=p.name;$('part-en').textContent=p.en;$('part-zh').textContent=p.zh;}};$('region-list').append(b);});
 $('speak').onclick=()=>speech.say($('part-name').textContent+'. '+$('part-en').textContent,true);
 $('language').onclick=()=>{const only=document.body.classList.toggle('english-only');$('language').textContent=only?'English only':'中英双语';$('language').setAttribute('aria-pressed',!only);};
 $('whole-airplane').onclick=$('home-view').onclick=home;$('back-view').onclick=$('back-part').onclick=back;
 $('zoom-in').onclick=()=>{target.distance=Math.max(.55,target.distance*.8);};$('zoom-out').onclick=()=>{target.distance=Math.min(55,target.distance*1.25);};
 $('side-view').onclick=()=>{target.pitch=.05;target.yaw=0;autoRotate=false;updateButtons();};$('top-view').onclick=()=>{target.pitch=1.53;target.yaw=0;autoRotate=false;updateButtons();};$('auto-rotate').onclick=()=>{autoRotate=!autoRotate;updateButtons();};
 $('explode-button').onclick=()=>{targetExplosion=targetExplosion?0:1;detail=null;active=null;target.look.set(0,.3,0);target.distance=overviewDistance*(targetExplosion?1.25:1);playing=false;renderLesson();};
 document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{mode=b.dataset.view;updateButtons();});
 document.querySelectorAll('[data-flow]').forEach(b=>b.onclick=()=>{flow=b.dataset.flow;updateButtons();record();});
 $('mechanism-play').onclick=()=>{playing=!playing;updateButtons();};$('slow-play').onclick=()=>{slow=!slow;updateButtons();};
 $('mechanism-step').onclick=()=>{playing=false;simTime+=.28;mechanism=(mechanism+.07)%1;updateButtons();record();};
 $('mechanism').oninput=e=>{mechanism=Number(e.target.value)/100;simTime=mechanism*Math.PI;record();};
 function record(){if(active?.region!=='engines')return;if(reveal>.45)journal.mark('operated','open');if(simTime>0){journal.mark('operated','spin');if(reveal>.45){if(flow==='both'||flow==='bypass')journal.mark('operated','bypass');if(flow==='both'||flow==='core')journal.mark('operated','core');if(detail==='engine.shaft')journal.mark('operated','shaft');}}}
 ENGINE_CONTENT.tasks.forEach(t=>{const o=document.createElement('option');o.value=t.id;o.textContent=t.title;$('engine-task').append(o);});
 function task(){const t=ENGINE_CONTENT.tasks.find(t=>t.id===$('engine-task').value);$('task-question').textContent=t.question;$('task-zh').textContent=t.zh;$('task-feedback').textContent=journal.read().explained.includes(t.id)?'✓ 这个发现已保存。':'观察对应部件，播放或单步演示，再说说你的发现。';$('task-answers').replaceChildren();t.answers.forEach(([id,en,zh])=>{const b=document.createElement('button');b.textContent=en+' · '+zh;b.onclick=()=>{const s=journal.read();if((t.found&&!s.found.includes('engine.'+t.found))||!t.needs.every(n=>s.operated.includes(n))){$('task-feedback').textContent='先找到对应部件，打开剖面并操作演示。';return;}$('task-feedback').textContent=id===t.correct?'✓ 已保存：'+t.discovery:t.hint;if(id===t.correct)journal.mark('explained',t.id);};$('task-answers').append(b);});}
 $('engine-task').onchange=task;task();

 function init(){
  scene=new T.Scene();scene.background=new T.Color('#edf3f7');camera=new T.PerspectiveCamera(42,1,.02,180);
  renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1;renderer.localClippingEnabled=true;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  const canvas=renderer.domElement;$('viewport').prepend(canvas);canvas.setAttribute('aria-hidden','true');canvas.onwebglcontextlost=e=>{e.preventDefault();$('load-error').hidden=false;};
  scene.add(new T.HemisphereLight(0xf4f8ff,0x9bafbd,2.5));const key=new T.DirectionalLight(0xfff7e9,3.2);key.position.set(-7,12,7);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-14,right:14,top:14,bottom:-14,near:.1,far:50});key.shadow.normalBias=.025;key.shadow.bias=-.0003;scene.add(key);const fill=new T.DirectionalLight(0xd6edff,1.4);fill.position.set(5,4,-8);scene.add(fill);
  airframe=AirframeV3.create(T);assemblies=airframe.assemblies;scene.add(airframe.root);
  for(const side of [-1,1]){const a=EngineV3.create(T,{id:side>0?'engine-right':'engine-left',side});a.group.position.set(-.65,-1,side*2.65);airframe.root.add(a.group);assemblies.push(a);}
  for(const a of assemblies){a.group.userData.assemblyId=a.id;a.group.userData.region=a.region;a.base=a.group.position.clone();const c=worldCenter(a);a.offset=new T.Vector3(c.x*.2,a.region==='fuselage'?0:a.region==='cockpit'?1.1:a.region==='gear'?-1.3:.6,Math.sign(c.z)*1.8);if(a.region==='fin'||a.region==='rudder')a.offset.y=1.8;
   for(const [layer,root]of[['exterior',a.exterior],['interior',a.interior],['ghost',a.ghost]])root.traverse(o=>{
    if(!o.material)return;
    // Independent materials isolate observation state between assemblies.
    if(Array.isArray(o.material))o.material=o.material.map(m=>m.clone());else o.material=o.material.clone();
    const materials=[].concat(o.material),d=inherit(o,'detail');
    surfaces.push({object:o,assembly:a,layer,detail:d,materials,shadow:o.castShadow});
    materials.forEach(m=>{materialOriginal.set(m,{opacity:m.opacity,transparent:m.transparent,depthWrite:m.depthWrite});materialTransparency.set(m,m.transparent);});
    if(layer!=='ghost'&&o.isMesh){o.userData.pickAssembly=a.id;o.userData.pickDetail=d;pickables.push(o);}
   });
  }
  const ground=new T.Mesh(new T.PlaneGeometry(120,120),new T.ShadowMaterial({opacity:.13}));ground.rotation.x=-Math.PI/2;ground.position.y=-2.03;ground.receiveShadow=true;scene.add(ground);
  const grid=new T.GridHelper(30,30,0xd1dee7,0xe0e8ef);grid.position.y=-2.045;grid.material.transparent=true;grid.material.opacity=.28;scene.add(grid);
  function resize(){const b=$('viewport').getBoundingClientRect();renderer.setSize(b.width,b.height,false);camera.aspect=b.width/b.height;camera.updateProjectionMatrix();overviewDistance=fit(6.5);if(!active&&!targetExplosion)target.distance=overviewDistance;}
  new ResizeObserver(resize).observe($('viewport'));resize();distance=target.distance;
  const ray=new T.Raycaster();
  function hit(x,y){const b=canvas.getBoundingClientRect();ray.setFromCamera(new T.Vector2((x-b.left)/b.width*2-1,-(y-b.top)/b.height*2+1),camera);return ray.intersectObjects(pickables,false).find(h=>{for(let o=h.object;o;o=o.parent)if(!o.visible)return false;const m=[].concat(h.object.material)[0];if(m.opacity<.18)return false;return !m.clippingPlanes?.some(p=>p.distanceToPoint(h.point)<0);});}
  function pick(h,close=false){if(!h)return;const a=assemblies.find(a=>a.id===h.object.userData.pickAssembly);if(!a)return;const id=h.object.userData.pickDetail;if(id&&details.some(d=>d.id===id)){if(active!==a)selectAssembly(a,false);selectDetail(id,close);}else selectAssembly(a,close);}
  function pan(dx,dy){const scale=distance*.0012;target.look.add(new T.Vector3(1,0,0).applyQuaternion(camera.quaternion).multiplyScalar(-dx*scale)).add(new T.Vector3(0,1,0).applyQuaternion(camera.quaternion).multiplyScalar(dy*scale));}
  const pointers=new Map();let drag=0,lastTap=null,pinch=0;
  canvas.oncontextmenu=e=>e.preventDefault();
  canvas.onpointerdown=e=>{canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});drag=0;autoRotate=false;if(pointers.size===2){const p=[...pointers.values()];pinch=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);drag=99;lastTap=null;const h=hit((p[0].x+p[1].x)/2,(p[0].y+p[1].y)/2);if(h&&!active){selectAssembly(assemblies.find(a=>a.id===h.object.userData.pickAssembly),false);target.look.copy(h.point);}}};
  canvas.onpointermove=e=>{if(!pointers.has(e.pointerId))return;const old=pointers.get(e.pointerId),dx=e.clientX-old.x,dy=e.clientY-old.y;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});drag+=Math.abs(dx)+Math.abs(dy);if(pointers.size===2){const p=[...pointers.values()],d=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);target.distance=clamp(target.distance*pinch/Math.max(d,1),.55,55);pinch=d;pan(dx*.5,dy*.5);}else if(e.buttons===2||e.shiftKey)pan(dx,dy);else{target.yaw-=dx*.006;target.pitch=clamp(target.pitch+dy*.005,-1.1,1.53);}};
  canvas.onpointerup=e=>{if(drag<6&&pointers.size===1&&e.button!==2){const h=hit(e.clientX,e.clientY);pick(h);const now=performance.now();if(e.pointerType!=='mouse'&&lastTap&&now-lastTap.t<350&&Math.hypot(e.clientX-lastTap.x,e.clientY-lastTap.y)<24){pick(h,true);lastTap=null;}else lastTap={t:now,x:e.clientX,y:e.clientY};}pointers.delete(e.pointerId);pinch=0;};canvas.onpointercancel=e=>{pointers.delete(e.pointerId);pinch=0;drag=99;};
  canvas.ondblclick=e=>{if(drag<6)pick(hit(e.clientX,e.clientY),true);};
  canvas.addEventListener('wheel',e=>{e.preventDefault();if(e.deltaY<0&&!targetExplosion){const h=hit(e.clientX,e.clientY);if(h&&(!active||distance>activeFit*1.4)){selectAssembly(assemblies.find(a=>a.id===h.object.userData.pickAssembly),false);target.look.copy(h.point);}}target.distance=clamp(target.distance*Math.exp(e.deltaY*.0012),.55,55);},{passive:false});
  $('viewport').onkeydown=e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Escape'].includes(e.key)){e.preventDefault();if(e.key==='Escape')back();if(e.key==='ArrowLeft')target.yaw-=.16;if(e.key==='ArrowRight')target.yaw+=.16;if(e.key==='ArrowUp')target.pitch=clamp(target.pitch+.12,-1.1,1.53);if(e.key==='ArrowDown')target.pitch=clamp(target.pitch-.12,-1.1,1.53);if(e.key==='+'||e.key==='=')target.distance=Math.max(.55,target.distance*.8);if(e.key==='-')target.distance=Math.min(55,target.distance*1.25);}};
  window.airplaneLab={select:id=>selectAssembly(nearestAssembly(id)),focusDetail:id=>selectDetail(id),snapshot:()=>({generation:3,modelId:airframe.root.uuid,selected:active?.region||null,assembly:active?.id||null,detail,near,reveal,mode,playing,simulationTime:simTime,explosion,meshCount:pickables.length,visited:journal.read().found,camera:{yaw,pitch,distance,target:look.toArray()},assemblies:assemblies.map(a=>({id:a.id,region:a.region,exterior:a.exterior.visible,interior:a.interior.visible,ghost:a.ghost.visible})),renderer:renderer.info.render}),projectPart:id=>{const a=assemblies.find(a=>a.id===id)||nearestAssembly(id);if(!a)return null;const p=worldCenter(a).project(camera),b=canvas.getBoundingClientRect();return{x:b.left+(p.x*.5+.5)*b.width,y:b.top+(-p.y*.5+.5)*b.height};}};
  requestAnimationFrame(frame);
 }
 function frame(stamp){
  requestAnimationFrame(frame);const dt=Math.min((stamp-lastFrame)/1000,.05);lastFrame=stamp;if(document.hidden)return;
  const ease=reduced?1:1-Math.exp(-dt*8);if(autoRotate)target.yaw+=dt*.17;
  yaw+=(target.yaw-yaw)*ease;pitch+=(target.pitch-pitch)*ease;distance+=(target.distance-distance)*ease;look.lerp(target.look,ease);explosion+=(targetExplosion-explosion)*ease;
  camera.position.set(Math.sin(yaw)*Math.cos(pitch)*distance,Math.sin(pitch)*distance,Math.cos(yaw)*Math.cos(pitch)*distance).add(look);camera.lookAt(look);camera.updateMatrixWorld(true);
  near=active&&explosion<.02?clamp((activeFit*1.7-distance)/(activeFit*.7)):0;
  reveal=active?(mode==='inside'?1:mode==='outside'?0:clamp((near-.28)/.72)):0;
  if(playing){simTime+=dt*(slow?.55:1);mechanism=.5-.5*Math.cos(simTime);record();}
  $('mechanism').value=Math.round(mechanism*100);$('mechanism-value').textContent=Math.round(mechanism*100)+'%';
  $('depth-status').textContent=explosion>.1?'部件拆解':!active||near<.15?'整体观察':reveal>.45?'内部结构':'靠近观察';$('observation-state').textContent=mode==='auto'?'随缩放变化':mode==='inside'?'局部剖面':'完整外观';
  airframe.update({time:simTime,mechanism:mechanism>.001,region:active?.region});
  for(const a of assemblies){a.group.position.copy(a.base).addScaledVector(a.offset,explosion);if(a.update)a.update({time:simTime,mechanism,flow:a===active&&reveal>.4&&simTime>0?flow:'off',selected:a===active?detail:null});}
  if(active){const center=worldCenter(active),normal=camera.position.clone().sub(center).normalize();clipping.setFromNormalAndCoplanarPoint(normal.clone().negate(),center.clone().addScaledVector(normal,active.radius*(1-reveal)));}
  for(const a of assemblies){const chosen=a===active;const distant=!chosen&&near>.9&&explosion<.02;a.exterior.visible=!distant;a.interior.visible=chosen&&reveal>.03||explosion>.2;a.ghost.visible=distant;}
  for(const s of surfaces){
   const chosen=s.assembly===active,context=!chosen&&near>0&&explosion<.02;
   for(const m of s.materials){const orig=materialOriginal.get(m);Object.assign(m,orig);m.clippingPlanes=chosen&&s.layer==='exterior'&&!s.detail&&reveal>.01?[clipping]:null;
    let alpha=1;if(context&&s.layer==='exterior')alpha=1-near;if(chosen&&detail&&((s.detail&&s.detail!==detail)||(!s.detail&&s.layer==='exterior')))alpha=.12;
    if(alpha<1){m.opacity*=alpha;m.transparent=true;m.depthWrite=false;}
    if(materialTransparency.get(m)!==m.transparent){m.needsUpdate=true;materialTransparency.set(m,m.transparent);}
   }
   s.object.castShadow=s.shadow&&!context&&!(chosen&&reveal>.1&&s.layer==='exterior');
  }
  airframe.root.updateMatrixWorld(true);
  const label=$('model-label');label.hidden=!active||near<.2;
  if(!label.hidden){const p=(detail?detailCenter():worldCenter(active)).project(camera),b=$('viewport').getBoundingClientRect();label.textContent=data().name;label.hidden=Math.abs(p.x)>1||Math.abs(p.y)>1||p.z>1;label.style.left=(p.x*.5+.5)*b.width+'px';label.style.top=(-p.y*.5+.5)*b.height-20+'px';}
  renderer.render(scene,camera);
 }
 window.addEventListener('pagehide',()=>{playing=false;speech.stop();});
 try{init();}catch(e){console.error('Airplane v3',e);$('load-error').hidden=false;}
 renderLesson();
 function deepLink(){if(!camera||!assemblies.length)return;if(location.hash==='#engine')selectAssembly(nearestAssembly('engines'));else{const id=new URLSearchParams(location.search).get('part');if(id&&lessons.some(p=>p.id===id))selectAssembly(nearestAssembly(id));}}
 window.addEventListener('hashchange',deepLink);deepLink();
})();

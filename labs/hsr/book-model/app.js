(() => {
 'use strict';
 // Explicit model opening and independent camera navigation for the train exhibit.
 const $=id=>document.getElementById(id),T=window.THREE,lessons=window.HSR_PARTS,details=window.HSR_DETAILS;
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
 let storage;try{storage=localStorage;}catch{storage={getItem:()=>null,setItem:()=>{}};}
 const journal=DiscoveryProgress.create(storage,'little-railways:whole-train:v1',{parts:[...lessons,...details].map(p=>p.id),actions:['open','spin','explode'],tasks:[]});
 const speech=LabSpeech.create($('speak'),$('speech-status'));
 const notes={
  cab:'驾驶室在列车最前端。司机看前方的线路和信号，用手柄控制加速与制动；列车自动防护系统会在超速时自动干预。',
  body:'车体是筒形的铝合金结构，环形梁与纵向梁一起承力；地板上装座椅，地板下布置电缆和管路。',
  windows:'车窗用多层夹胶安全玻璃。列车进出隧道时车外气压会突然变化，密封条和厚玻璃能减轻耳朵的不适。',
  roof:'车顶盖住客室，上面装着空调机组。机组处理好的空气沿车顶风道送到每位乘客身边，再沿两侧回风。',
  seats:'座椅用软垫加金属骨架，重量传给地板。椅背要有足够强度，紧急减速时能承受来自乘客的冲击。',
  doors:'车门由电机驱动开合，门边有橡胶密封条。列车运行中门缝要封住，既能挡风，也帮助保持车内气压。',
  bogies:'转向架是列车的“腿脚”。构架装着两个轮对，一系钢弹簧和二系空气弹簧一起把车体托住并吸收振动。',
  motors:'牵引电机把电变成转动，再经小齿轮带动车轴上的大齿轮：转速降下来，力矩升上去，正好驱动列车。',
  pantograph:'受电弓由绝缘子与车顶隔开，弓臂把弓头压在上方的接触线上，一边滑动一边取电；接触线高度变化时弓臂随之升降。',
  coupler:'车钩把两节车厢连起来，钩头里的锁紧机构保证牵引和制动时都不脱开，后面的吸能元件吸收冲击。'};
 const tips={
  cab:'靠近车头，找大风挡、司机座椅和操纵台上的三块显示屏。',
  body:'打开剖面，找出沿车身一圈圈的环梁和纵向长梁；再看看地板下的横梁。',
  windows:'转到侧面，数一数车窗；拖动动作滑杆，看遮阳帘落下来。',
  roof:'抬起车顶：长方形的是空调机组，两条长管道是送风风道。',
  seats:'拆开后切换俯视，找到中间那条长走道；打开剖面看坐垫和椅背里的支撑。',
  doors:'拖动动作滑杆，看门扇沿车身滑开；门边的感应条和小灯是门控系统。',
  bogies:'转到下方，找 H 形构架、两根车轴四个车轮和构架上方的空气弹簧。',
  motors:'打开剖面，找电机里的铜绕组、旁边的齿轮箱和上方的冷却风道。',
  pantograph:'拖动动作滑杆，看弓臂抬起；顶上横条是弓头滑板，下面四个柱子是绝缘子。',
  coupler:'转到车厢尾端，找伸出的钩头；钩头后面叠着吸能元件。'};
 const helps={
  cab:'拖动视角，看看操纵台上的显示屏和手柄的位置。',
  body:'拖动剖切观察环梁与纵向梁；拆解后能看到地板与行李架分开。',
  windows:'拖动动作滑杆，遮阳帘会落下来；打开剖面能看到里侧的玻璃层。',
  roof:'抬起车顶，再拖动动作滑杆看空调风扇的位置。',
  seats:'座椅位置固定；打开剖面观察坐垫与椅背内部的支撑结构。',
  doors:'拖动动作滑杆，门扇沿车身滑开；感应条负责确认门口安全。',
  bogies:'拖动动作滑杆，车轮和车轴一起转动；空气弹簧把车体托住并减振。',
  motors:'拖动动作滑杆，看转子转动；蓝色线路是冷却风道，银灰色机壳是牵引电机。',
  pantograph:'拖动动作滑杆：弓臂抬起并折成合适的角度，去接触上方的接触线。',
  coupler:'拖动动作滑杆，看钩头摆动；后面的吸能元件在连挂时被压缩。'};
 // yaw 0 looks at the flank, yaw +/-pi/2 looks down the track. Parts that run
// along the carriage (shell, glazing, seats, doors) are shown from the flank,
// the bogie and motor from the axle line where their symmetry reads.
const angles={cab:[-.96,.22],body:[.30,.22],roof:[.36,.52],windows:[.22,.03],seats:[-1.08,.32],doors:[.30,.03],coupler:[.58,.12],bogies:[.2,-.04],motors:[.2,-.06],pantograph:[1.13,.32]};
const clampRadius={cab:1.1,body:2.6,roof:2.4,windows:1.9,seats:1.9,doors:2.0,coupler:.95,bogies:1.4,motors:1.3,pantograph:1.05};
// A floor keeps a small part in the frame together with the part it works with:
// the collector head alone would float, the wheelset alone would lose its frame.
const minRadius={cab:.85,body:2.0,roof:2.0,windows:1.5,seats:1.5,doors:1.6,coupler:.7,bogies:1.35,motors:1.2,pantograph:.95};
 // Parts that must stay lit while one of their neighbours is being explained.
 const keepWith={'panto.head':['panto.arm'],'panto.arm':['panto.head'],'motors.motor':['motors.gearbox'],'motors.gearbox':['motors.motor'],'bogies.wheelset':['bogies.frame'],'bogies.frame':['bogies.wheelset'],'cab.displays':['cab.desk'],'seats.cushion':['seats.back'],'seats.back':['seats.cushion'],'coupler.buffer':['coupler.head'],'doors.sensor':['doors.leaf']};
 const offsets={cab:[-2.30,.55,0],'cabin-body':[0,0,0],roof:[0,2.30,0],windows:[0,.55,-2.60],seats:[0,1.35,0],doors:[0,.35,2.50],coupler:[2.10,-.35,0],'bogie-front':[0,-1.50,0],'bogie-rear':[0,-1.50,0],'motor-front':[0,-2.30,0],'motor-rear':[0,-2.30,0],pantograph:[0,3.20,0]};
 const BOGIES=[{id:'bogie-front',x:-5.6},{id:'bogie-rear',x:5.5}];
 const MOTORS=[{id:'motor-front',x:-5.6},{id:'motor-rear',x:5.5}];
 const look0=new T.Vector3(15,.2,0);
 let renderer,scene,camera,train,track,assemblies=[],active=null,detail=null,mode='outside',playing=false,slow=true,simTime=0,mechanism=0,autoRotate=false;
 let yaw=-.28,pitch=.25,distance=18,overviewDistance=18,explosion=0,targetExplosion=0,reveal=0,near=0;
 const look=new T.Vector3(15,.2,0),target={yaw,pitch,distance,look:look.clone()};
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,pickables=[],surfaces=[],materialOriginal=new Map(),materialTransparency=new Map();
 let activeFit=6,clipping=new T.Plane(new T.Vector3(0,0,-1),0),lastFrame=0;
 let opening=null,closing=null,openAmount=0,openingView=null;const viewHistory=[];
 const cabinRegions=['body','roof','windows','seats'];
 const openingType=()=>!active?null:cabinRegions.includes(active.region)?'cabin':['cab','motors','bogies'].includes(active.region)?active.region:null;
 function remember(){viewHistory.push({yaw:target.yaw,pitch:target.pitch,distance:target.distance,look:target.look.clone()});if(viewHistory.length>20)viewHistory.shift();}
 function closeOpening(){closing=opening;opening=null;mode='outside';playing=false;mechanism=0;detail=null;}
 function openPart(){if(opening){closeOpening();if(openingView){target.yaw=openingView.yaw;target.pitch=openingView.pitch;target.distance=openingView.distance;target.look.copy(openingView.look);}openingView=null;}else{openingView={yaw:target.yaw,pitch:target.pitch,distance:target.distance,look:target.look.clone()};targetExplosion=0;closing=null;openAmount=0;opening=openingType();mode='inside';remember();focus();if(opening==='cabin'){target.look.set(0,.8,0);target.yaw=.15;target.pitch=.85;target.distance=fit(7.5);}if(opening==='cab'){target.yaw=(active.rearDrivingCar?Math.PI:0)-.4;target.pitch=.45;target.distance=fit(2.7);}}renderLesson();}
 function progress(){$('progress-text').textContent=journal.read().found.length+' / '+(lessons.length+details.length);}
 function inherit(object,key){for(let o=object;o;o=o.parent)if(o.userData[key])return o.userData[key];return null;}
 function data(){return detail?details.find(d=>d.id===detail):active?lessons.find(p=>p.id===active.region):null;}
 function sameRegion(id){return assemblies.filter(a=>a.region===id);}
 function worldCenter(a){return a.group.localToWorld(a.center.clone());}
 function nearestAssembly(region){return sameRegion(region).sort((a,b)=>worldCenter(a).distanceToSquared(camera.position)-worldCenter(b).distanceToSquared(camera.position))[0];}
 function fit(radius){return Math.max(1.45,radius/Math.sin(T.MathUtils.degToRad(21))*1.06*Math.max(1,1.25/camera.aspect));}
 function detailObjects(){return active&&detail?[].concat(active.details[detail]||[]):[];}
 function detailCenter(){
  const groups=detailObjects();if(!groups.length)return worldCenter(active);
  const box=new T.Box3();groups.forEach(g=>box.expandByObject(g));
  return box.isEmpty()?worldCenter(active):box.getCenter(new T.Vector3());
 }
 function focus(){
  if(!active||!camera)return;
  const point=detail?detailCenter():worldCenter(active);target.look.copy(point);
  let r=active.radius;
  if(detail){const b=new T.Box3();detailObjects().forEach(g=>b.expandByObject(g));r=b.isEmpty()?.8:b.getBoundingSphere(new T.Sphere()).radius;r=Math.min(Math.max(r,minRadius[active.region]||.7),clampRadius[active.region]||r);}
  target.distance=Math.max(fit(r),1.6);activeFit=fit(active.radius);autoRotate=false;
  const a=angles[active.region]||[-.6,.3];target.yaw=a[0]+(active.rearDrivingCar?Math.PI:0);target.pitch=a[1];

 }
 function selectAssembly(a,focusIt=false){if(!a)return;if(targetExplosion){targetExplosion=0;explosion=0;}const next=cabinRegions.includes(a.region)?'cabin':a.region;if(opening&&opening!==next){closeOpening();closing=null;openAmount=0;}if(active!==a){playing=false;mechanism=0;}active=a;detail=null;activeFit=fit(a.radius);speech.stop();journal.mark('found',a.region);if(focusIt){remember();focus();}renderLesson();}
 function selectDetail(id,focusIt=true){const d=details.find(d=>d.id===id);if(!d)return;if(!active||active.region!==d.region)selectAssembly(nearestAssembly(d.region));if(openingType()&&!opening){renderLesson();return;}detail=id;journal.mark('found',id);speech.stop();if(focusIt){remember();focus();}renderLesson();}
 function home(){remember();closeOpening();active=null;detail=null;autoRotate=false;targetExplosion=0;target.look.copy(look0);target.yaw=-.28;target.pitch=.25;target.distance=overviewDistance;renderLesson();}
 function back(){const v=viewHistory.pop();if(v){target.yaw=v.yaw;target.pitch=v.pitch;target.distance=v.distance;target.look.copy(v.look);autoRotate=false;}renderLesson();}
 function renderLesson(){
  const p=data();progress();
  $('part-name').textContent=p?.name||'Your high-speed train';$('part-zh-name').textContent=p?.zhName||'你的高速列车';$('lesson-category').textContent=active?(detail?'LOOK INSIDE':'MEET THE PART'):'A WORLD INSIDE';
  $('part-en').textContent=p?.en||'Look closer. There is a whole world inside this train.';$('part-zh').textContent=p?.zh||'靠近一点，这列高铁里面还有一个世界。';
  $('part-tip').textContent=detail?p.tip:active?'点击“靠近观察”调整视角。内部结构需要先打开模型；拖动可从不同方向查看。':'拖动旋转，滚轮缩放。点击部件认识它，再用“靠近观察”调整视角。';
  $('principle-box').hidden=!active;$('part-principle').textContent=detail?p.principle:active?notes[active.region]:'';
  $('crumb-region').textContent=active?'› '+lessons.find(p=>p.id===active.region).zhName:'';$('crumb-detail').textContent=detail?'› '+p.zhName:'';$('back-part').hidden=!detail;
  $('back-view').disabled=!viewHistory.length;
  document.querySelectorAll('[data-part]').forEach(b=>b.setAttribute('aria-pressed',active?.region===b.dataset.part));
  const children=active?details.filter(d=>d.region===active.region):[];
  $('explore-section').hidden=!children.length;$('detail-count').textContent=children.length+' 个发现';$('detail-list').replaceChildren();
  children.forEach(d=>{const b=document.createElement('button');b.className='detail-button';b.dataset.detail=d.id;b.setAttribute('aria-pressed',detail===d.id);b.innerHTML=d.name+'<small>'+d.zhName+'</small>';b.disabled=!!openingType()&&!opening;b.onclick=()=>selectDetail(d.id);$('detail-list').append(b);});
  $('operation-panel').hidden=!active;
  $('open-part').hidden=!openingType();$('open-part').textContent=opening?'合上 · 恢复外观':({cabin:'打开客室',cab:'打开驾驶室',motors:'抬起车体 · 切开电机',bogies:'抬起车体'})[openingType()]||'打开';$('open-part').setAttribute('aria-pressed',!!opening);
  $('opening-note').textContent=opening?'教学展示：覆盖件暂时移开，内部仍在原来的安装位置。可旋转观察，点击合上恢复。':openingType()?'先打开模型，再选择下方的内部细节。缩放不会改变模型结构。':'直接观察部件，或播放它的动作。';
  $('mechanism-controls').hidden=!active||!['doors','windows','bogies','motors','pantograph','coupler','roof'].includes(active.region);
  $('operation-panel').after($('explore-section'));
  $('mechanism-help').textContent=active&&!$('mechanism-controls').hidden?'点击播放观察动作，展开“自己动手调节”可拖动控制。':'';
  $('part-zh-name').after($('operation-panel'));updateButtons();
 }
 function updateButtons(){document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.view===mode));$('mechanism-play').setAttribute('aria-pressed',playing);$('mechanism-play').textContent=playing?'Ⅱ 暂停观察':'▶ 看它怎样工作';$('auto-rotate').setAttribute('aria-pressed',autoRotate);$('explode-button').setAttribute('aria-pressed',targetExplosion>0);$('explode-button').textContent=targetExplosion?'组装':'拆解';$('slow-play').setAttribute('aria-pressed',slow);}
 lessons.forEach((p,i)=>{const b=document.createElement('button');b.className='region-button';b.dataset.part=p.id;b.setAttribute('aria-pressed',false);b.innerHTML='<i>'+String(i+1).padStart(2,'0')+'</i><span><strong>'+p.name+'</strong><small>'+p.zhName+'</small></span>';b.onclick=()=>{if(camera)selectAssembly(nearestAssembly(p.id));else{$('part-name').textContent=p.name;$('part-en').textContent=p.en;$('part-zh').textContent=p.zh;}};$('region-list').append(b);});
 $('speak').onclick=()=>speech.say($('part-name').textContent+'. '+$('part-en').textContent,true);
 $('language').onclick=()=>{const only=document.body.classList.toggle('english-only');$('language').textContent=only?'English only':'中英双语';$('language').setAttribute('aria-pressed',!only);};
 $('book-view').onclick=$('whole-train').onclick=$('home-view').onclick=home;$('back-view').onclick=back;$('back-part').onclick=()=>{detail=null;renderLesson();};
 $('focus-part').onclick=()=>{remember();focus();renderLesson();};$('open-part').onclick=openPart;
 $('zoom-in').onclick=()=>{target.distance=Math.max(1.2,target.distance*.8);};$('zoom-out').onclick=()=>{target.distance=Math.min(140,target.distance*1.25);};
 $('side-view').onclick=()=>{target.pitch=.04;target.yaw=0;autoRotate=false;updateButtons();};$('top-view').onclick=()=>{target.pitch=1.50;target.yaw=0;autoRotate=false;updateButtons();};$('auto-rotate').onclick=()=>{autoRotate=!autoRotate;updateButtons();};
 $('explode-button').onclick=()=>{closeOpening();closing=null;openAmount=0;targetExplosion=targetExplosion?0:1;detail=null;active=null;target.look.copy(look0);target.distance=overviewDistance*(targetExplosion?1.30:1);playing=false;record();renderLesson();};
 document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{mode=b.dataset.view;updateButtons();});
 $('mechanism-play').onclick=()=>{playing=!playing;updateButtons();};$('slow-play').onclick=()=>{slow=!slow;updateButtons();};
 $('mechanism-step').onclick=()=>{playing=false;simTime+=.28;mechanism=(mechanism+.07)%1;updateButtons();record();};
 $('mechanism').oninput=e=>{mechanism=Number(e.target.value)/100;simTime=mechanism*Math.PI;record();};
 function record(){if(!active&&!targetExplosion)return;if(targetExplosion>0)journal.mark('operated','explode');if(reveal>.45)journal.mark('operated','open');if(simTime>0)journal.mark('operated','spin');}

 function init(){
  // Transparent canvas, like the shared labs: .stage paints #edf2e7 and the
  // HELLO, / YOUR HIGH-SPEED TRAIN captions sit behind the model, not on top.
  scene=new T.Scene();camera=new T.PerspectiveCamera(42,1,.02,220);
  renderer=new T.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1;renderer.localClippingEnabled=true;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  const canvas=renderer.domElement;$('viewport').prepend(canvas);canvas.setAttribute('aria-hidden','true');canvas.onwebglcontextlost=e=>{e.preventDefault();$('load-error').hidden=false;};
  scene.add(new T.HemisphereLight(0xf4f8ff,0x9bafbd,2.5));const key=new T.DirectionalLight(0xfff7e9,3.2);key.position.set(-7,13,7);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-15,right:15,top:15,bottom:-15,near:.1,far:50});key.shadow.normalBias=.025;key.shadow.bias=-.0003;scene.add(key);const fill=new T.DirectionalLight(0xd6edff,1.4);fill.position.set(5,4,-8);scene.add(fill);
  train=BookTrainExterior.create(T);assemblies=train.assemblies;scene.add(train.root);
  for(const b of BOGIES){const a=BookTrainGear.createBogie(T,{id:b.id,x:b.x});train.root.add(a.group);assemblies.push(a);}
  for(const m of MOTORS){const a=BookTrainGear.createMotor(T,{id:m.id,x:m.x});train.root.add(a.group);assemblies.push(a);}
  const panto=BookTrainGear.createPantograph(T);train.root.add(panto.group);assemblies.push(panto);const coupler=BookTrainGear.createCoupler(T);train.root.add(coupler.group);assemblies.push(coupler);
  for(const coach of assemblies.filter(a=>a.id.startsWith('coach-'))){const start=Number(coach.id.slice(6));for(const x of [start+2.5,start+(coach.rearDrivingCar?13.6:13.9)]){const b=BookTrainGear.createBogie(T,{id:'passive',x});const g=b.exterior;g.position.x=x;g.traverse(o=>{o.userData={region:coach.region,assemblyId:coach.id};});coach.exterior.add(g);}}
  for(const a of assemblies){a.group.userData.assemblyId=a.id;a.group.userData.region=a.region;a.base=a.group.position.clone();a.offset=new T.Vector3(...(offsets[a.id]||[0,.6,0]));
   for(const [layer,root]of[['exterior',a.exterior],['interior',a.interior],['ghost',a.ghost]])root.traverse(o=>{
    if(!o.material)return;
    // Independent materials isolate observation state between assemblies.
    if(Array.isArray(o.material))o.material=o.material.map(m=>m.clone());else o.material=o.material.clone();
    const materials=[].concat(o.material),d=inherit(o,'detail');
    // Only the shell casts shadows. Everything inside it is either hidden by
    // that shell or small enough that its shadow is invisible — and the shadow
    // pass would otherwise redraw every one of the ~860 meshes.
    surfaces.push({object:o,assembly:a,layer,detail:d,materials,shadow:o.castShadow&&layer==='exterior'});
    materials.forEach(m=>{materialOriginal.set(m,{opacity:m.opacity,transparent:m.transparent,depthWrite:m.depthWrite});materialTransparency.set(m,m.transparent);});
    if(layer!=='ghost'&&o.isMesh){o.userData.pickAssembly=a.id;o.userData.pickDetail=d;pickables.push(o);}
   });
  }
  track=BookTrainGear.createTrack(T,{from:-12,to:46});scene.add(track);
  // The airframe counts only the carriage it built, so recount now that the
  // running gear is attached — the snapshot has to describe the whole train.
  train.counts=(()=>{let m=0,t=0;train.root.traverse(o=>{if(!o.isMesh)return;m++;t+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3;});return{assemblies:assemblies.length,meshes:m,triangles:Math.round(t)};})();
  const ground=new T.Mesh(new T.PlaneGeometry(140,140),new T.ShadowMaterial({opacity:.13}));ground.rotation.x=-Math.PI/2;ground.position.y=-1.82;ground.receiveShadow=true;scene.add(ground);
  const grid=new T.GridHelper(34,34,0xd1dee7,0xe0e8ef);grid.position.y=-1.825;grid.material.transparent=true;grid.material.opacity=.26;scene.add(grid);
  function resize(){const b=$('viewport').getBoundingClientRect();renderer.setSize(b.width,b.height,false);camera.aspect=b.width/b.height;camera.updateProjectionMatrix();
   // The carriage is long and shallow, so frame it by its length: the sphere
   // formula would leave two thirds of the stage empty.
   overviewDistance=Math.max(40,26/(Math.tan(T.MathUtils.degToRad(21))*camera.aspect*.85));
   if(!active&&!targetExplosion)target.distance=overviewDistance;}
  new ResizeObserver(resize).observe($('viewport'));resize();distance=target.distance;
  const ray=new T.Raycaster();
  function hit(x,y){const b=canvas.getBoundingClientRect();ray.setFromCamera(new T.Vector2((x-b.left)/b.width*2-1,-(y-b.top)/b.height*2+1),camera);return ray.intersectObjects(pickables,false).find(h=>{for(let o=h.object;o;o=o.parent)if(!o.visible)return false;const m=[].concat(h.object.material)[0];if(m.opacity<.18)return false;return !m.clippingPlanes?.some(p=>p.distanceToPoint(h.point)<0);});}
  function pick(h,close=false){if(!h)return;const a=assemblies.find(a=>a.id===h.object.userData.pickAssembly);if(!a)return;const id=h.object.userData.pickDetail;if(id&&details.some(d=>d.id===id)){if(active!==a)selectAssembly(a,false);selectDetail(id,close);}else selectAssembly(a,close);}
  function pan(dx,dy){const scale=distance*.0012;target.look.add(new T.Vector3(1,0,0).applyQuaternion(camera.quaternion).multiplyScalar(-dx*scale)).add(new T.Vector3(0,1,0).applyQuaternion(camera.quaternion).multiplyScalar(dy*scale));}
  const pointers=new Map();let drag=0,lastTap=null,pinch=0;
  canvas.oncontextmenu=e=>e.preventDefault();
  canvas.onpointerdown=e=>{canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});drag=0;autoRotate=false;if(pointers.size===2){const p=[...pointers.values()];pinch=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);drag=99;lastTap=null;}};
  canvas.onpointermove=e=>{if(!pointers.has(e.pointerId))return;const old=pointers.get(e.pointerId),dx=e.clientX-old.x,dy=e.clientY-old.y;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});drag+=Math.abs(dx)+Math.abs(dy);if(pointers.size===2){const p=[...pointers.values()],d=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);target.distance=clamp(target.distance*pinch/Math.max(d,1),1.2,140);pinch=d;pan(dx*.5,dy*.5);}else if(e.buttons===2||e.shiftKey)pan(dx,dy);else{target.yaw-=dx*.006;target.pitch=clamp(target.pitch+dy*.005,-1.15,1.50);}};
  canvas.onpointerup=e=>{if(drag<6&&pointers.size===1&&e.button!==2){const h=hit(e.clientX,e.clientY);pick(h);const now=performance.now();if(e.pointerType!=='mouse'&&lastTap&&now-lastTap.t<350&&Math.hypot(e.clientX-lastTap.x,e.clientY-lastTap.y)<24){pick(h,true);lastTap=null;}else lastTap={t:now,x:e.clientX,y:e.clientY};}pointers.delete(e.pointerId);pinch=0;};canvas.onpointercancel=e=>{pointers.delete(e.pointerId);pinch=0;drag=99;};
  canvas.ondblclick=e=>{if(drag<6)pick(hit(e.clientX,e.clientY),true);};
  canvas.addEventListener('wheel',e=>{e.preventDefault();target.distance=clamp(target.distance*Math.exp(e.deltaY*.0012),1.2,140);},{passive:false});
  $('viewport').onkeydown=e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Escape'].includes(e.key)){e.preventDefault();if(e.key==='Escape')back();if(e.key==='ArrowLeft')target.yaw-=.16;if(e.key==='ArrowRight')target.yaw+=.16;if(e.key==='ArrowUp')target.pitch=clamp(target.pitch+.12,-1.15,1.50);if(e.key==='ArrowDown')target.pitch=clamp(target.pitch-.12,-1.15,1.50);if(e.key==='+'||e.key==='=')target.distance=Math.max(1.2,target.distance*.8);if(e.key==='-')target.distance=Math.min(140,target.distance*1.25);}};
  window.trainLab={setView:(y,p,d,x=-1)=>{target.yaw=y;target.pitch=p;target.distance=d;target.look.set(x,.2,0);},select:id=>selectAssembly(nearestAssembly(id)),focusDetail:id=>selectDetail(id),snapshot:()=>({generation:5,opening,openAmount,cutNormal:clipping.normal.toArray(),history:viewHistory.length,changedOpacity:surfaces.filter(s=>s.materials.some(m=>Math.abs(m.opacity-materialOriginal.get(m).opacity)>1e-6)).length,reference:train.reference,modelId:train.root.uuid,selected:active?.region||null,assembly:active?.id||null,detail,near,reveal,mode,playing,simulationTime:simTime,level:mechanism,explosion,meshCount:pickables.length,geometry:train.counts,visited:journal.read().found,camera:{yaw,pitch,distance,target:look.toArray()},assemblies:assemblies.map(a=>({id:a.id,region:a.region,exterior:a.exterior.visible,interior:a.interior.visible,ghost:a.ghost.visible,position:a.group.position.toArray(),exteriorPosition:a.exterior.position.toArray()})),renderer:renderer.info.render}),projectPart:id=>{const a=assemblies.find(a=>a.id===id)||nearestAssembly(id);if(!a)return null;const c=worldCenter(a).project(camera),b=canvas.getBoundingClientRect();return{x:b.left+(c.x*.5+.5)*b.width,y:b.top+(-c.y*.5+.5)*b.height};}};
  requestAnimationFrame(frame);
 }
 function frame(stamp){
  requestAnimationFrame(frame);const dt=Math.min((stamp-lastFrame)/1000,.05);lastFrame=stamp;if(document.hidden)return;
  const ease=reduced?1:1-Math.exp(-dt*8);if(autoRotate)target.yaw+=dt*.17;
  yaw+=(target.yaw-yaw)*ease;pitch+=(target.pitch-pitch)*ease;distance+=(target.distance-distance)*ease;look.lerp(target.look,ease);explosion+=(targetExplosion-explosion)*ease;
  camera.position.set(Math.sin(yaw)*Math.cos(pitch)*distance,Math.sin(pitch)*distance,Math.cos(yaw)*Math.cos(pitch)*distance).add(look);camera.lookAt(look);camera.updateMatrixWorld(true);
  near=active&&explosion<.02?clamp((activeFit*1.7-distance)/(activeFit*.7)):0;
  openAmount+=((opening?1:0)-openAmount)*ease;if(openAmount<.001)closing=null;const shownOpening=opening||closing;reveal=opening?openAmount:0;
  if(playing){simTime+=dt*(slow?.55:1);mechanism=.5-.5*Math.cos(simTime);record();}
  $('mechanism').value=Math.round(mechanism*100);$('mechanism-value').textContent=Math.round(mechanism*100)+'%';
  $('depth-status').textContent=explosion>.1?'拆解展示':opening?'已打开 · '+({cabin:'客室',cab:'驾驶室',motors:'电机',bogies:'车体'})[opening]:'自由观察';$('observation-state').textContent=opening?'手动打开':'完整外观';
  train.update({time:simTime,mechanism:mechanism>.001,level:mechanism,region:active?.region});
  for(const a of assemblies){a.group.position.copy(a.base).addScaledVector(a.offset,explosion);if(a.update)a.update({time:simTime,mechanism:mechanism>.001,level:mechanism,region:active?.region,spin:1.55});}
  // Opening is independent of the camera. Original geometry and materials are reused.
  for(const a of assemblies){
   const cabin=shownOpening==='cabin'&&['cabin-body','roof','windows','doors','seats'].includes(a.id);
   a.exterior.position.set(0,0,0);
   if(shownOpening==='cabin'){
    if(a.id==='roof')a.exterior.position.y=3.5*openAmount;if(a.id==='pantograph')a.group.position.y+=3.5*openAmount;
    if(['cabin-body','windows','doors'].includes(a.id))a.exterior.position.set(0,.4*openAmount,-4*openAmount);
   }
   if(shownOpening==='cab'&&a===active)a.exterior.position.set(-1.5*openAmount,3.5*openAmount,0);
   if(['bogies','motors'].includes(shownOpening)&&['cab','cabin-body','roof','windows','doors','seats','pantograph'].includes(a.id))a.group.position.y+=2.8*openAmount;
   a.exterior.visible=a.region!=='seats'||cabin||explosion>.2;
   a.interior.visible=cabin||(shownOpening===a.region&&a===active)||explosion>.2;
   a.ghost.visible=false;
  }
  // A fixed longitudinal section exposes the motor without following the eye.
  clipping.set(new T.Vector3(0,0,-1),active?worldCenter(active).z:0);
  for(const s of surfaces){
   const cut=shownOpening==='motors'&&s.assembly===active&&s.layer==='exterior';
   for(const m of s.materials){Object.assign(m,materialOriginal.get(m));m.clippingPlanes=cut?[clipping]:null;}
   s.object.castShadow=s.shadow&&!cut;
   for(const m of s.materials){if(m.emissive){if(!m.userData.originalEmissive)m.userData.originalEmissive=m.emissive.clone();m.emissive.copy(m.userData.originalEmissive);if(s.assembly===active)m.emissive.lerp(new T.Color(0x245749),.12);}}
  }
  train.root.updateMatrixWorld(true);
  const label=$('model-label');label.hidden=!active||near<.2;
  if(!label.hidden){const p=(detail?detailCenter():worldCenter(active)).project(camera),b=$('viewport').getBoundingClientRect();label.textContent=data().name;label.hidden=Math.abs(p.x)>1||Math.abs(p.y)>1||p.z>1;label.style.left=(p.x*.5+.5)*b.width+'px';label.style.top=(-p.y*.5+.5)*b.height-20+'px';}
  renderer.render(scene,camera);
 }
 window.addEventListener('pagehide',()=>{playing=false;speech.stop();});
 try{init();}catch(e){console.error('Train v3',e);$('load-error').hidden=false;}
 renderLesson();
 function deepLink(){if(!camera||!assemblies.length)return;if(location.hash==='#engine'||location.hash==='#pantograph')selectAssembly(nearestAssembly('pantograph'));else{const id=new URLSearchParams(location.search).get('part');if(id&&lessons.some(p=>p.id===id))selectAssembly(nearestAssembly(id));}}
 window.addEventListener('hashchange',deepLink);deepLink();
})();

(() => {
 'use strict';
 function mount(root=document,options={}) {
 const $=id=>root.getElementById(id),{parts,tasks}=window.ENGINE_CONTENT;
 const surface=root.querySelector('.engine-surface')||document.body;
 let active=options.active!==false,needsResize=true,resize=()=>false,ownsSpeech=false;
 let storage;try{storage=window.localStorage;}catch{storage={getItem(){throw Error('unavailable')},setItem(){throw Error('unavailable')}};}
 const journal=DiscoveryProgress.create(storage,'little-wings:engine-discovery:v1',{parts:parts.map(p=>p.id),actions:['open','spin','bypass','core','shaft'],tasks:tasks.map(t=>t.id)});
 let {part:selected,open,flow}=journal.read().view,shaft=false,time=0,playing=false,slow=false,taskIndex=0;
 let scene,camera,renderer,model,rendered=false,yaw=-.32,pitch=.25,distance=12.5,lastStamp=0,utteranceId=0;
 const label=document.createElement('span');label.className='engine-label';$('engine-labels').append(label);
 const getPart=()=>parts.find(p=>p.id===selected);
 function saveView(){journal.saveView({part:selected,open,flow});renderJournal();}
 function stopSpeech(){utteranceId++;if(ownsSpeech&&'speechSynthesis'in window)speechSynthesis.cancel();ownsSpeech=false;$('speech-status').textContent='';}
 function say(text){
  stopSpeech();if(!('speechSynthesis'in window)){$('speech-status').textContent='此浏览器不支持朗读，可以一起读上面的英文。';return;}
  const id=utteranceId,u=new SpeechSynthesisUtterance(text),voices=speechSynthesis.getVoices().filter(v=>/^en[-_]/i.test(v.lang));
  u.voice=voices.find(v=>v.localService&&v.lang==='en-US')||voices.find(v=>v.lang==='en-US')||voices[0]||null;u.lang='en-US';u.rate=$('speech-slow').checked?.65:.85;u.pitch=1.03;
  u.onerror=e=>{if(id===utteranceId){ownsSpeech=false;if(!['canceled','interrupted'].includes(e.error))$('speech-status').textContent='英文语音暂不可用。可以阅读上面的英文，或检查设备的英语语音设置。';}};u.onend=()=>{if(id===utteranceId)ownsSpeech=false;};ownsSpeech=true;speechSynthesis.speak(u);
 }
 function select(id,record=true){
  if(!parts.some(p=>p.id===id))return;selected=id;stopSpeech();if(record)journal.mark('found',id);
  const p=getPart();$('crumb-part').textContent=p.zh;$('engine-name').textContent=p.name;$('engine-zh-name').textContent=p.zh;$('engine-category').textContent=p.category;$('engine-en').textContent=p.en;$('engine-zh').textContent=p.translation;$('action-en').textContent=p.action;$('action-zh').textContent=p.actionZh;$('detail-en').textContent=p.detail;$('detail-zh').textContent=p.detailZh;label.textContent=p.name;
  root.querySelectorAll('[data-engine-part]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.enginePart===id));saveView();renderEvidence();
 }
 parts.forEach(p=>{const b=document.createElement('button');b.dataset.enginePart=p.id;b.innerHTML=`${p.name}<small>${p.zh}</small>`;b.addEventListener('click',()=>select(p.id));$('engine-parts').append(b);});
 const descriptions={both:'蓝色圆点走外涵道，核心的小点经过燃烧室后变为暖色。两条路线都向后流动。',bypass:'● 外涵道：空气从风扇后绕过核心，不经过燃烧室。',core:'◆ 核心：空气经过压气机、燃烧室和涡轮。暖色表示燃烧增加的能量。',off:'气流已隐藏。可以更清楚地观察内部结构和机械连接。'};
 function setFlow(value){flow=value;root.querySelectorAll('[data-flow]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.flow===flow));$('flow-description').textContent=shaft?'正在观察转轴连接，气流暂时隐藏。再次点击“突出转轴连接”可返回气流观察。':descriptions[flow];saveView();}
 root.querySelectorAll('[data-flow]').forEach(b=>b.addEventListener('click',()=>setFlow(b.dataset.flow)));
 function setOpen(value){open=Math.max(0,Math.min(1,value));$('shell-open').value=Math.round(open*100);$('shell-value').textContent=`${Math.round(open*100)}%`;$('view-state').textContent=open>.4?'内部剖面':'外观观察';if(open>=.65&&renderer)journal.mark('operated','open');saveView();renderEvidence();}
 $('shell-open').addEventListener('input',e=>setOpen(Number(e.target.value)/100));
 function recordMotion(){if(!renderer)return;const before=journal.read().operated.length;journal.mark('operated','spin');if(open>=.65){journal.mark('operated','open');if(!shaft&&(flow==='core'||flow==='bypass'))journal.mark('operated',flow);if(shaft)journal.mark('operated','shaft');}if(journal.read().operated.length!==before){renderJournal();renderEvidence();}}
 function setPlaying(value){playing=value;$('play').setAttribute('aria-pressed',playing);$('play').textContent=playing?'Ⅱ 暂停':'▶ 播放';}
 $('play').addEventListener('click',()=>setPlaying(!playing));
 $('step').addEventListener('click',()=>{setPlaying(false);time+=.35;recordMotion();});
 $('slow').addEventListener('click',()=>{slow=!slow;$('slow').setAttribute('aria-pressed',slow);});
 $('shaft-toggle').addEventListener('click',()=>{shaft=!shaft;$('shaft-toggle').setAttribute('aria-pressed',shaft);$('flow-description').textContent=shaft?'正在观察转轴连接，气流暂时隐藏。再次点击“突出转轴连接”可返回气流观察。':descriptions[flow];});
 function resetView(){setPlaying(false);time=0;shaft=false;slow=false;$('shaft-toggle').setAttribute('aria-pressed',false);$('slow').setAttribute('aria-pressed',false);yaw=-.32;pitch=.25;distance=12.5;setOpen(0);setFlow('both');}
 $('reset-view').addEventListener('click',resetView);$('engine-home').addEventListener('click',()=>{resetView();select('inlet');$('engine-viewport').focus();});
 $('front-view').addEventListener('click',()=>{yaw=-Math.PI/2;pitch=.04;});$('side-view').addEventListener('click',()=>{yaw=0;pitch=.06;});
 const zoom=f=>{distance=Math.max(7,Math.min(20,distance*f));};$('zoom-in').addEventListener('click',()=>zoom(.85));$('zoom-out').addEventListener('click',()=>zoom(1.15));
 $('say-name').addEventListener('click',()=>say(getPart().name));$('say-sentence').addEventListener('click',()=>say(getPart().en));$('say-action').addEventListener('click',()=>say(getPart().action));$('say-detail').addEventListener('click',()=>say(getPart().detail));$('stop-speech').addEventListener('click',stopSpeech);
 function setLanguage(englishOnly){const english=!!englishOnly;surface.classList.toggle('english-only',english);$('language').setAttribute('aria-pressed',!english);$('language').textContent=english?'显示中文':'中英双语';}
 $('language').addEventListener('click',()=>setLanguage(!surface.classList.contains('english-only')));
 function evidence(t){const state=journal.read();return t.needs.every(id=>state.operated.includes(id))&&(!t.found||state.found.includes(t.found));}
 function renderEvidence(){if(!$('observation-state'))return;const t=tasks[taskIndex];$('observation-state').textContent=evidence(t)?'✓ 已有观察记录，试着解释你的发现。':'先动手观察：'+t.instruction;}
 function renderTask(index){
  taskIndex=index;stopSpeech();const t=tasks[index];$('task-step').textContent=t.short;$('task-title').textContent=t.title;$('task-instruction').textContent=t.instruction;$('task-question').textContent=t.question;$('task-question-zh').textContent=t.zh;$('task-feedback').textContent='';$('next-task').hidden=true;
  root.querySelectorAll('[data-task]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.task===t.id));$('task-answers').replaceChildren();
  t.answers.forEach(([id,en,zh])=>{const b=document.createElement('button');b.dataset.answer=id;b.innerHTML=`${en}<small>${zh}</small>`;b.addEventListener('click',()=>{
   if(!evidence(t)){$('task-feedback').textContent='先完成上面的观察，再来解释。'+t.instruction;return;}
   if(id!==t.correct){b.classList.add('wrong');$('task-feedback').textContent=t.hint;return;}
   b.classList.remove('wrong');b.classList.add('correct');journal.mark('explained',t.id);$('task-feedback').textContent='已加入发现记录：'+t.discovery;$('next-task').hidden=index===tasks.length-1;renderJournal();
  });$('task-answers').append(b);});renderEvidence();
 }
 tasks.forEach(t=>{const b=document.createElement('button');b.dataset.task=t.id;b.innerHTML=`${t.title}<small>${t.short}</small>`;b.addEventListener('click',()=>renderTask(tasks.indexOf(t)));$('task-tabs').append(b);});
 $('say-task').addEventListener('click',()=>say(tasks[taskIndex].question));$('next-task').addEventListener('click',()=>renderTask(Math.min(tasks.length-1,taskIndex+1)));
 function renderJournal(){
  const state=journal.read();$('found-count').textContent=`${state.found.length} / 8`;$('task-total').textContent=`${state.explained.length} / 4 个发现`;$('journal-summary').textContent=`找到 ${state.found.length} 个部件 · 操作 ${state.operated.length} 种观察方式 · 解释 ${state.explained.length} 个发现`;
  $('save-status').textContent=journal.persistent?'自动保存在这台设备的浏览器中，下次可以接着探索。':'浏览器暂不能保存；本次仍可探索，关闭后记录可能丢失。';$('journal-cards').replaceChildren();
  tasks.forEach(t=>{const done=state.explained.includes(t.id),card=document.createElement('div');card.textContent=done?'✓ '+t.discovery:t.title;const small=document.createElement('small');small.textContent=done?t.discoveryEn:'等待你的发现';card.append(small);$('journal-cards').append(card);const tab=root.querySelector(`[data-task="${t.id}"] small`);if(tab)tab.textContent=done?'✓ 已解释 · 可再探索':t.short;});
 }
 $('clear-progress').addEventListener('click',()=>{$('clear-dialog').returnValue='';$('clear-dialog').showModal();});$('clear-dialog').addEventListener('close',()=>{if($('clear-dialog').returnValue==='clear'){journal.reset();resetView();select('inlet',false);renderTask(0);}});
 function init(){
  const T=window.THREE,viewport=$('engine-viewport');scene=new T.Scene();camera=new T.PerspectiveCamera(38,1,.1,100);renderer=new T.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0,0);renderer.outputColorSpace=T.SRGBColorSpace;viewport.prepend(renderer.domElement);
  scene.add(new T.HemisphereLight(0xffffff,0x6f816d,2.5));const light=new T.DirectionalLight(0xfff5df,3);light.position.set(-3,7,8);scene.add(light);const rim=new T.DirectionalLight(0xd6eaff,1.5);rim.position.set(2,4,-6);scene.add(rim);model=EngineModel.create(T);scene.add(model.group);
  const ray=new T.Raycaster(),mouse=new T.Vector2();
  resize=()=>{const w=viewport.clientWidth,h=viewport.clientHeight;if(!renderer||w<=0||h<=0){needsResize=true;return false;}renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();needsResize=false;return true;};new ResizeObserver(resize).observe(viewport);resize();
  const pointers=new Map();let down=null,moved=false,pinch=0;
  viewport.addEventListener('pointerdown',e=>{pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});viewport.setPointerCapture(e.pointerId);if(pointers.size===1){down={x:e.clientX,y:e.clientY};moved=false;}else{moved=true;const [a,b]=[...pointers.values()];pinch=Math.hypot(a.x-b.x,a.y-b.y);}});
  viewport.addEventListener('pointermove',e=>{const old=pointers.get(e.pointerId);if(!old)return;const dx=e.clientX-old.x,dy=e.clientY-old.y;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2){const[a,b]=[...pointers.values()],gap=Math.hypot(a.x-b.x,a.y-b.y);if(gap>0&&pinch>0)zoom(pinch/gap);pinch=gap;}else{if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>5)moved=true;yaw-=dx*.007;pitch=Math.max(-.8,Math.min(1.2,pitch+dy*.006));}});
  viewport.addEventListener('pointerup',e=>{if(!moved&&pointers.size===1){const r=viewport.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(mouse,camera);const hit=ray.intersectObjects(model.pickables).find(h=>h.object.visible&&h.object.material.opacity>.2);if(hit)select(hit.object.userData.part);}pointers.delete(e.pointerId);down=null;});
  viewport.addEventListener('pointercancel',e=>{pointers.delete(e.pointerId);moved=true;down=null;});
  viewport.addEventListener('wheel',e=>{e.preventDefault();zoom(Math.exp(e.deltaY*.001));},{passive:false});
  viewport.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft')yaw-=.15;if(e.key==='ArrowRight')yaw+=.15;if(e.key==='ArrowUp')pitch=Math.min(1.2,pitch+.1);if(e.key==='ArrowDown')pitch=Math.max(-.8,pitch-.1);if(e.key==='+')zoom(.9);if(e.key==='-')zoom(1.1);}});
  let lastEvidence=0;
  function frame(stamp){requestAnimationFrame(frame);const dt=Math.min(.05,(stamp-lastStamp)/1000||0);lastStamp=stamp;if(!active||document.hidden)return;if(needsResize&&!resize())return;if(playing){time+=dt*(slow?.25:1);if(stamp-lastEvidence>500){recordMotion();lastEvidence=stamp;}}
   model.update({time,open,flow,shaft,selected});const fit=innerWidth<780?1.22:1;camera.position.set(Math.sin(yaw)*Math.cos(pitch)*distance*fit,Math.sin(pitch)*distance*fit+.35,Math.cos(yaw)*Math.cos(pitch)*distance*fit);camera.lookAt(0,.3,0);renderer.render(scene,camera);rendered=true;
   const p=model.anchors[selected].clone();model.group.localToWorld(p);p.project(camera);const visible=p.z<1&&p.z>-1&&Math.abs(p.x)<.85&&Math.abs(p.y)<.8;label.hidden=!visible;label.style.left=((p.x+1)*.5*viewport.clientWidth)+'px';label.style.top=((1-p.y)*.5*viewport.clientHeight-20)+'px';
  }requestAnimationFrame(frame);
 }
 try{init();}catch(e){console.error('Engine discovery:',e);if(renderer){renderer.dispose();renderer.domElement.remove();}renderer=null;$('engine-error').hidden=false;$('engine-labels').hidden=true;for(const id of ['play','step','shell-open','shaft-toggle'])$(id).disabled=true;}
 function setActive(value){active=!!value;if(!active){setPlaying(false);stopSpeech();}else{needsResize=true;resize();}}
 const api={snapshot:()=>({rendered,active,selected,time,open,flow,shaft,playing,camera:{yaw,pitch,distance},journal:journal.read()}),setActive,setLanguage,focusPart:id=>select(id)};
 window.engineDiscovery=api;
 if(typeof options.onExit==='function')root.querySelectorAll('[data-return-airplane]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();setActive(false);options.onExit(link.dataset.returnAirplane==='wings'?'wings':'engines');}));
 setFlow(flow);setOpen(open);select(selected,false);renderTask(Math.max(0,tasks.findIndex(t=>!journal.read().explained.includes(t.id))));renderJournal();
 document.addEventListener('visibilitychange',()=>{if(document.hidden){setPlaying(false);stopSpeech();}});window.addEventListener('pagehide',()=>{setPlaying(false);stopSpeech();});
 return api;
 }
 window.EngineDiscovery={mount};
 if(document.getElementById('engine-viewport'))mount();
})();

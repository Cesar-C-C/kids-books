(function(){
'use strict';
const $=id=>document.getElementById(id),M=window.RopewayModel,model=M.create(),content=window.ROPEWAY_CONTENT,audio=window.RopewayAudio;
let language=new URLSearchParams(location.search).get('lang')==='en'?'en':'zh',mode='journey',manual=null,follow=false,cutaway=true;
const original=new Map([...document.querySelectorAll('[data-ui]')].map(n=>[n,n.textContent]));
const EN={back:'← 3D laboratories',title:'How does a gondola take us uphill?',subtitle:'Follow the coral cabin as it changes how it moves.',scope:'Monocable · Detachable · Circulating / Mechanism model, not operating instructions',journey:'A cabin’s round trip',safety:'Stopping is protection',tension:'A sliding frame',cutawayLabel:'VALLEY ROPEWAY / CUTAWAY',fallbackNote:'3D unavailable: the plan view still uses the same mechanism.',ropeLegend:'Dark: endless rope',railLegend:'Light: station rail',carLegend:'Coral: followed cabin',play:'Run the loop',pause:'Pause and observe',step:'One small step',reset:'Reset the example',follow:'Follow the coral cabin',gripFault:'Observe a coupling-check fault',powerFault:'Observe main-drive unavailability',auxiliary:'Conditions allow: auxiliary-drive example',safetyLimit:'An auxiliary drive cannot bypass a coupling fault. Professionals follow the installation’s emergency plan.',stretch:'Illustrative rope-length change',stretchLimit:'Observe frame movement only; no real temperature, tension or hydraulic calculation.',viewTools:'Viewpoints and enclosure',overview:'Whole valley',stationView:'Inside the station',driveView:'Drive and brakes',topView:'Route from above',zoomIn:'Zoom in ＋',zoomOut:'Zoom out −',roof:'Show enclosure',gesture:'Drag with a mouse to orbit. On touch: swipe sideways to orbit; swipe vertically to scroll. Viewpoint buttons also work.',evidence:'THE EVIDENCE IN VIEW',gripLabel:'Rope grip',supportLabel:'Station rail',speedLabel:'Cabin / rope relative speed',driveLabel:'Drive / brakes',listen:'Listen to this line',audioStop:'Stop narration',care:'Safety needs more than one part',types:'Not all ropeways look like this',limits:'What is not simulated?',reading:'Find another clue',sources:'Sources and scope',sourceNote:'Manufacturer configurations and operating examples have distinct scopes. Only official GB 12352-2018 metadata was checked, not clause-level compliance. All dimensions and timing are illustrative.',voicePending:'Formal bilingual narration not yet connected · Illustrative mechanism, not operating instructions'};
const tr=(zh,en)=>language==='zh'?zh:en;
EN.phaseTools='Pause at a station step';
const view={target:[0,4,0],distance:34,yaw:.26,pitch:.46,fit:true};
let scene=null;
try{if(new URLSearchParams(location.search).get('render')!=='fallback')scene=window.RopewayScene.create($('stage'));}catch(e){console.warn('Ropeway 3D fallback',e.message);$('stage').querySelector('canvas')?.remove();}
if(!scene){$('fallback').hidden=false;$('render-note').hidden=false;}
function lesson(id){return content.find(c=>c.id===id)||content[0];}
let lastLesson='',lastMode='';
function stopAudio(){audio.stop();$('audio-status').textContent='';}
function setView(target,distance,yaw,pitch){Object.assign(view,{target,distance,yaw,pitch,fit:distance>25});}
function renderText(s){
  const c=s.cars[0],id=manual||(mode==='safety'?(s.fault==='grip'?'monitor':s.drive==='auxiliary'?'auxiliary':s.fault==='power'?'auxiliary':'brakes'):mode==='tension'?'tension':c.phase==='line'?'loop':c.phase);
  const l=lesson(id);
  $('stage-lesson').textContent=l.title[language];
  $('stage-clue').textContent=s.fault==='grip'?tr('检查未通过 · 保护停机','Failed check · protective stop'):c.rail?tr('轨道承载 · 输送轮胎接手','Rail supports · conveyor tires take over'):tr('同一根钢索：托住，也牵引','One rope: supports and pulls');
  if(lastLesson!==id||lastMode!==language){
    stopAudio();$('lesson-title').textContent=l.title[language];$('lesson-text').textContent=l.text[language];$('listen').disabled=!audio.has(id,language);
    lastLesson=id;lastMode=language;
  }
  $('grip-status').textContent=s.fault==='grip'?tr('闭合 · 检查未通过','Closed · failed check'):c.grip>.98?tr('闭合','Closed'):c.grip<.02?tr('打开','Open'):tr('正在开合','Opening / closing');
  $('support-status').textContent=c.rail?tr('正在承载','Supporting'):tr('线路钢索承载','Rope supports');
  $('speed-status').textContent=(c.speed*s.factor/M.LINE_SPEED).toFixed(2)+' / '+s.factor.toFixed(2);
  $('drive-status').textContent=s.brakes?tr('制动保护','Brakes applied'):s.drive==='auxiliary'?tr('辅助 · 低速','Auxiliary · slow'):s.drive==='main'?tr('主驱动','Main drive'):tr('已暂停','Paused');
  const status={paused:tr('暂停','Paused'),running:tr('运行中','Running'),stopping:tr('减速停机','Stopping'),'protective-stop':tr('保护停机 · 检查未通过','Protective stop · failed check'),'power-stop':tr('主驱动不可用 · 其他检查正常','Main drive unavailable · other checks normal'),'aux-running':tr('辅助驱动条件示例','Conditional auxiliary example')};
  $('motion-status').textContent=status[s.mode];
  $('follow').setAttribute('aria-pressed',String(follow));
  $('play').disabled=!!s.fault;$('step').disabled=!!s.fault;
  $('grip-fault').disabled=!!s.fault;$('power-fault').disabled=!!s.fault;$('auxiliary').disabled=!s.auxiliaryAllowed;
  document.querySelectorAll('[data-phase]').forEach(b=>{b.disabled=!!s.fault;b.setAttribute('aria-pressed',String(c.phase===b.dataset.phase));});
}
function syncLanguage(){
 document.documentElement.lang=language==='zh'?'zh-CN':'en';document.title=tr('索道怎样带我们上山？ · 3D 实验室','How does a gondola work? · 3D Lab');
 original.forEach((zh,n)=>n.textContent=language==='zh'?zh:(EN[n.dataset.ui]||zh));
 $('language').setAttribute('aria-label',tr('切换为英文','Switch to Chinese'));
 for(const id of ['care','brakes','types','limits'])$(id==='brakes'?'brake-text':id+'-text').textContent=lesson(id).text[language];
 $('phase-buttons').replaceChildren();
 for(const id of ['support','detach','decelerate','board','accelerate','couple','check']){
   const b=document.createElement('button');b.type='button';b.dataset.phase=id;b.textContent=lesson(id).title[language];
   b.onclick=()=>{stopAudio();model.pause();model.seek(id);manual=null;follow=true;$('follow').setAttribute('aria-pressed','true');setView([10,7,0],9,.85,.43);};$('phase-buttons').append(b);
 }
 $('reading-cards').replaceChildren();
 for(const id of ['loop','rollers','brakes','care','auxiliary','types','tension','limits']){
   const b=document.createElement('button');b.type='button';b.dataset.lesson=id;
   const small=document.createElement('small');small.textContent=tr('寻找线索','FIND A CLUE');
   const title=document.createElement('span');title.textContent=lesson(id).title[language];b.append(small,title);
   b.onclick=()=>{manual=id;stopAudio();if(id==='rollers')setView([4,6,0],10,.7,.4);if(['brakes','auxiliary','tension'].includes(id)){follow=false;setView([-10,4.6,0],7,.7,.5);}};$('reading-cards').append(b);
 }
 if(audio.manifest.status==='ready')$('voice-note').textContent=tr('中英双语点读已接入 · 机制示意，非操作指导','Bilingual narration connected · Illustrative mechanism, not operating instructions');
 lastMode='';renderText(model.snapshot());
 const map=tr(['1S · 承载 + 牵引','2S · 承载 / 牵引','3S · 两根承载 / 一根牵引','↔ 往复式'],['1S · Supports + pulls','2S · Support / haul','3S · 2 support / 1 haul','↔ Reversible']);
 document.querySelectorAll('.type-map span').forEach((n,i)=>n.textContent=map[i]);
 const u=new URL(location.href);u.searchParams.set('lang',language);history.replaceState(null,'',u);
}
$('sources-list').replaceChildren();
window.ROPEWAY_SOURCES.forEach(([title,url])=>{const li=document.createElement('li'),a=document.createElement('a');a.textContent=title;a.href=url;a.target='_blank';a.rel='noopener';li.append(a);$('sources-list').append(li);});
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{
 mode=b.dataset.mode;manual=null;stopAudio();model.pause();follow=false;$('follow').setAttribute('aria-pressed','false');
 document.querySelectorAll('[data-mode]').forEach(n=>n.setAttribute('aria-pressed',String(n===b)));
 ['journey','safety','tension'].forEach(x=>$(x+'-tools').hidden=x!==mode);
 if(mode==='journey')setView([0,4,0],34,.26,.46);else setView([-10,4.6,0],8,.7,.5);
});
$('language').onclick=()=>{stopAudio();language=language==='zh'?'en':'zh';syncLanguage();};
$('play').onclick=()=>{manual=null;model.play();};
$('pause').onclick=()=>model.pause();
$('step').onclick=()=>{if(model.play()){for(let i=0;i<6;i++)model.tick(.1);model.pause();}};
$('reset').onclick=()=>{stopAudio();model.reset();manual=null;$('stretch').value=0;};
$('follow').onclick=()=>{follow=!follow;manual=null;$('follow').setAttribute('aria-pressed',String(follow));if(follow){view.distance=7;view.yaw=.85;view.pitch=.4;view.fit=false;}};
$('grip-fault').onclick=()=>{stopAudio();manual=null;follow=true;view.distance=7;view.yaw=.85;view.pitch=.4;model.fault('grip');};
$('power-fault').onclick=()=>{stopAudio();manual=null;follow=false;setView([-10,4.6,0],8,.7,.5);model.fault('power');};
$('auxiliary').onclick=()=>{manual=null;model.auxiliary();};
$('stretch').oninput=e=>{model.state.stretch=Number(e.target.value);manual=null;};
$('overview').onclick=()=>{follow=false;setView([0,4,0],34,.26,.46);};
$('station-view').onclick=()=>{follow=false;setView([10,7,0],10,.9,.48);};
$('drive-view').onclick=()=>{follow=false;manual='brakes';setView([-10,4.6,0],7,.7,.5);};
$('top-view').onclick=()=>{follow=false;setView([0,4,0],33,0,1.45);};
$('zoom-in').onclick=()=>view.distance=Math.max(4,view.distance*.82);
$('zoom-out').onclick=()=>view.distance=Math.min(55,view.distance/ .82);
$('roof').onclick=()=>{cutaway=!cutaway;$('roof').setAttribute('aria-pressed',String(cutaway));$('roof').textContent=cutaway?tr('显示外壳','Show enclosure'):tr('打开外壳','Open enclosure');};
$('listen').onclick=()=>{model.pause();audio.play(lastLesson,language,status=>$('audio-status').textContent=({playing:tr('正在朗读','Playing'),idle:'',pending:tr('正式点读待接入','Narration pending'),error:tr('播放失败，请重试','Playback failed; retry')})[status]);};
$('audio-stop').onclick=stopAudio;
// Native pan-y is never prevented. Secondary pointers block orbit until all lift.
let gesture=null,blocked=false;const touches=new Set();
document.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'){touches.add(e.pointerId);if(touches.size>1||!e.isPrimary){gesture=null;blocked=true;}}},{capture:true,passive:true});
$('stage').addEventListener('pointerdown',e=>{
 if(e.button!==0||e.target.closest?.('button,a,input,summary,select,textarea'))return;
 if(e.pointerType==='touch'&&(blocked||touches.size!==1||!e.isPrimary))return;
 gesture={id:e.pointerId,x:e.clientX,y:e.clientY,yaw:view.yaw,pitch:view.pitch,touch:e.pointerType==='touch',axis:null};
},{passive:true});
$('stage').addEventListener('pointermove',e=>{
 const g=gesture;if(!g||g.id!==e.pointerId||e.buttons!==1)return;
 const dx=e.clientX-g.x,dy=e.clientY-g.y;
 if(g.touch){if(blocked||touches.size!==1)return;if(!g.axis){if(Math.hypot(dx,dy)<8)return;g.axis=Math.abs(dx)>Math.abs(dy)?'x':'y';}if(g.axis!=='x')return;}
 follow=false;view.yaw=g.yaw-dx*.007;if(!g.touch)view.pitch=Math.max(.08,Math.min(1.5,g.pitch+dy*.005));
},{passive:true});
function release(e){if(gesture?.id===e.pointerId)gesture=null;if(e.pointerType==='touch'){touches.delete(e.pointerId);if(!touches.size)blocked=false;}}
for(const event of ['pointerup','pointercancel'])document.addEventListener(event,release,{capture:true,passive:true});
for(const event of ['pointerleave','lostpointercapture'])$('stage').addEventListener(event,e=>{if(gesture?.id===e.pointerId)gesture=null;},{passive:true});
function suspend(){gesture=null;touches.clear();blocked=false;stopAudio();model.pause();}
document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend();});
addEventListener('blur',suspend);addEventListener('pagehide',suspend);
function fallbackInit(){
 const project=p=>[(p[0]+14)*25,(p[2]+4)*40],line=pts=>pts.map(p=>project(p).join(',')).join(' ');
 const rope=Array.from({length:301},(_,i)=>M.ropePoint(i/300));
 const rail=[];for(const s of [-1,1])for(const id of ['support','detach','decelerate','board','accelerate','couple','check'])for(let i=0;i<25;i++)rail.push(M.stationPoint(id,i/24,s));
 const drive='<g id="fallback-drive"><rect x="-45" y="-64" width="90" height="128" rx="5" fill="none" stroke="#637c85"/><ellipse rx="35" ry="56" fill="none" stroke="#146f75" stroke-width="7"/>'+Array.from({length:8},(_,i)=>'<line class="drive-spoke" stroke="#637c85" stroke-width="3"/>').join('')+'<rect x="28" y="-17" width="4" height="34" fill="#637c85"/><rect class="service-pad" x="23" width="14" height="6" fill="#ef755b"/><rect class="service-pad" x="23" width="14" height="6" fill="#ef755b"/><rect id="fallback-aux" x="-8" y="-85" width="22" height="20" rx="3" fill="#f4c464" stroke="#637c85"/><rect id="fallback-brake" x="31" y="-7" width="9" height="14" fill="#ef755b"/></g>';
 const shapes='<polyline id="fallback-rope" points="'+line(rope)+'" fill="none" stroke="#263e49" stroke-width="3"/><polyline points="'+line(rail.slice(0,175))+'" fill="none" stroke="#a7b8b8" stroke-width="9"/><polyline points="'+line(rail.slice(175))+'" fill="none" stroke="#a7b8b8" stroke-width="9"/>'+drive+'<ellipse cx="600" cy="160" rx="35" ry="56" fill="none" stroke="#146f75" stroke-width="7"/>'+Array.from({length:14},(_,i)=>'<circle id="fallback-marker-'+i+'" r="3" fill="#f4c464"/>').join('')+Array.from({length:8},(_,i)=>'<g id="fallback-car-'+i+'"><rect x="-8" y="-12" width="16" height="24" rx="4" fill="'+(i?'#146f75':'#ef755b')+'"/><line class="jaw" y1="-5" y2="5" stroke="#f4c464" stroke-width="3"/></g>').join('');
 $('fallback').innerHTML='<svg viewBox="-50 -50 800 420" role="img" aria-label="Plan-view mechanism: moving rope markers, station-supported carriers, drive, brake and sliding frame"><rect x="-10000" y="-10000" width="20000" height="20000" fill="#e6efec"/><g id="fallback-world">'+shapes+'</g></svg>';
}
if(!scene)fallbackInit();
function fallbackUpdate(s){
 const svg=$('fallback').querySelector('svg'),rect=$('stage').getBoundingClientRect(),center=[(view.target[0]+14)*25,(view.target[2]+4)*40];
 const h=view.fit?420*view.distance/34:view.distance*22,w=view.fit?800*view.distance/34:h*rect.width/rect.height;
 svg.setAttribute('viewBox',[center[0]-w/2,center[1]-h/2,w,h].join(' '));
 $('fallback-world').setAttribute('transform','rotate('+(-view.yaw*180/Math.PI)+' '+center.join(' ')+')');
 const rope=Array.from({length:301},(_,i)=>M.ropePoint(i/300,s.stretch));$('fallback-rope').setAttribute('points',rope.map(p=>[(p[0]+14)*25,(p[2]+4)*40].join(',')).join(' '));
 $('fallback-drive').setAttribute('transform','translate('+((4-.3*s.stretch)*25)+' 160)');
 $('fallback-drive').querySelectorAll('.drive-spoke').forEach((n,i)=>{const a=i*Math.PI/4-s.time*M.LINE_SPEED/1.4;n.setAttribute('x2',String(35*Math.cos(a)));n.setAttribute('y2',String(56*Math.sin(a)));});
 $('fallback-drive').querySelectorAll('.service-pad').forEach((n,i)=>n.setAttribute('y',String((i?1:-1)*(s.brakes?14:22)-3)));
 $('fallback-brake').setAttribute('stroke',s.brakes?'#9d322c':'none');$('fallback-brake').setAttribute('stroke-width','4');
 $('fallback-aux').setAttribute('stroke',s.drive==='auxiliary'?'#bc7130':'#637c85');$('fallback-aux').setAttribute('stroke-width',s.drive==='auxiliary'?'5':'1');
 for(let i=0;i<14;i++){const p=M.ropePoint(i/14+s.time*M.LINE_SPEED/M.ropeLength(s.stretch),s.stretch),o=$('fallback-marker-'+i);o.setAttribute('cx',String((p[0]+14)*25));o.setAttribute('cy',String((p[2]+4)*40));}
 s.cars.forEach((c,i)=>{const g=$('fallback-car-'+i);g.setAttribute('transform','translate('+((c.position[0]+14)*25)+' '+((c.position[2]+4)*40)+') rotate('+(-c.heading*180/Math.PI)+')');g.querySelector('.jaw').setAttribute('x1',String((1-c.grip)*9));g.querySelector('.jaw').setAttribute('x2',String((1-c.grip)*9));});
}
let previous=performance.now(),lastDraw=0;
function frame(t){
 const dt=Math.min(.1,(t-previous)/1000);previous=t;
 if(!document.hidden)model.tick(dt);
 if(!document.hidden&&t-lastDraw>32){const s=model.snapshot();renderText(s);if(follow)view.target=[s.cars[0].position[0],s.cars[0].position[1]-.5,s.cars[0].position[2]];
 if(scene){scene.update(s,cutaway);scene.render(view);}else fallbackUpdate(s);lastDraw=t;}
 requestAnimationFrame(frame);
}
syncLanguage();requestAnimationFrame(frame);
window.RopewayLab={getSnapshot:()=>({...model.snapshot(),view:{...view},language,lessonMode:mode,lesson:lastLesson,follow,cutaway,audio:audio.getState(),render:scene?'webgl':'fallback',visual:scene?scene.visualState():null,geometry:scene?{calls:scene.renderer.info.render.calls,triangles:scene.renderer.info.render.triangles}:null})};
})();

'use strict';
window.mountFault = function (container, {content,lang,session}) {
 const {el,button,svg,shape}=EarthquakeUI,F=EarthquakeFault,t=(zh,en)=>lang()==='en'?en:zh;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let state=F.createFault(),driverActive=false,replayActive=false,guided=false,target=null;
 let history=[structuredClone(state)];
 const heading=el('h2'),graphic=svg(''),legend=el('p','model-legend'),result=el('p','result');
 const controls=el('div','controls'),tools=el('details','tools'),summary=el('summary'),extras=el('div','controls');
 result.setAttribute('role','status');tools.append(summary,extras);
 function advance(drive,dt) {state=F.stepFault(state,{drive,dt});history.push(structuredClone(state));render();}
 function observationReached() {return target==='locked'&&state.eventCount===0&&state.elasticStrain>=.10;}
 function pump() {
  if(state.paused||replayActive) return;
  advance(driverActive,1/30);
  if(guided&&observationReached()){session.cancel('observation');return;}
  if(state.phase==='settled'){driverActive=false;guided=false;render();return;}
  if(driverActive||state.phase==='slipping')session.schedule(pump,1000/30);
 }
 function step() {
  session.cancel('step');state=F.pauseFault(state,false);advance(state.eventCount===0,.1);
  state=F.pauseFault(state,true);render();
 }
 const observe=button('',()=>{
  if(state.phase==='settled')return;
  session.cancel('guided');state=F.pauseFault(state,false);guided=true;
  target=state.elasticStrain<.10&&state.eventCount===0?'locked':'settled';
  driverActive=state.eventCount===0;
  if(reduced.matches){
   for(let i=0;i<90;i++){advance(state.eventCount===0,.1);if(state.phase==='settled'||observationReached())break;}
   session.cancel('observation');
  }else pump();
 },'fault-observe');
 const pause=button('',()=>session.cancel('pause'),'fault-pause');
 const push=button('',event=>{if(event.detail===0)step();},'fault-drive'),single=button('',step,'fault-step');
 push.onpointerdown=event=>{
  if(event.button!==0||replayActive||state.phase==='settled')return;
  session.cancel('drive');state=F.pauseFault(state,false);driverActive=true;
  push.setPointerCapture(event.pointerId);
  if(reduced.matches)step();else pump();
 };
 push.onpointerup=()=>{driverActive=false;render();};
 push.onpointercancel=()=>session.cancel('pointercancel');
 push.onlostpointercapture=()=>{driverActive=false;render();};
 const reset=button('',()=>{
  session.cancel('reset');state=F.createFault();history=[structuredClone(state)];render();
 },'fault-reset');
 const replay=button('',()=>{
  if(history.length<2)return;
  const frames=history.map(x=>({...x}));session.cancel('replay');replayActive=true;let i=0;
  const next=()=>{state={...frames[i],paused:true};render();
   if(++i<frames.length)session.schedule(next,reduced.matches?160:65);
   else {replayActive=false;render();}
  };
  next();
 },'fault-replay');
 controls.append(observe,pause);extras.append(push,single,replay,reset);
 container.append(heading,graphic,legend,controls,result,tools);
 function render() {
  const prompt=content.interactions.find(x=>x.id==='fault-predict');
  EarthquakeUI.narratedText(heading,prompt[lang()],prompt.kind,prompt.id,lang());
  observe.textContent=state.phase==='settled'?t('已看到永久错位','Permanent offset remains'):
   state.elasticStrain<.10&&state.eventCount===0?t('看接缝锁住时的变化','Watch the locked fault'):
   t('继续加载，看滑移与回弹','Continue loading: slip and rebound');
  observe.disabled=guided||replayActive||driverActive||state.phase==='settled';
  pause.textContent=t('暂停','Pause');pause.disabled=state.paused||(!guided&&!driverActive&&!replayActive&&state.phase!=='slipping');
  summary.textContent=t('手动慢看与重看','Manual steps and replay');
  push.textContent=t('按住慢慢推动','Hold to load gently');single.textContent=t('推一小步','Load one small step');
  reset.textContent=t('重新观察','Start again');replay.textContent=t('慢放重看','Replay slowly');
  push.disabled=single.disabled=replayActive||state.phase==='settled';replay.disabled=history.length<2||replayActive;
  legend.textContent=t('灰色虚线：开始｜棕色实线：现在｜形变放大', 'Gray dashed: start | Brown solid: now | Deformation enlarged');
  const id=state.phase==='initial'?'fault-initial':state.phase==='locked'?'fault-locked':state.phase==='slipping'?'fault-slipped':'fault-settled';
  const observation=content.interactions.find(x=>x.id===id);
  EarthquakeUI.narratedText(result,observation[lang()],observation.kind,observation.id,lang());
  container.dataset.phase=state.phase;
  graphic.setAttribute('aria-label',t(
   '向内挤压的逆断层。灰色虚线保存原来的纹路，棕色纹路显示锁定时的形变与滑动后的永久错位。',
   'A compressed reverse fault. Gray dashed lines preserve the initial markings; brown lines show deformation while locked and permanent offset after slip.'));
  graphic.replaceChildren();
  const slip=state.slipOffset*330,bend=state.elasticStrain*360;
  shape(graphic,'path',{d:'M30 70H360L210 240H30Z',fill:'none',stroke:'#a38e72','stroke-dasharray':'5 5'});
  shape(graphic,'path',{d:'M360 70H530V240H210Z',fill:'#d1a16c',stroke:'#785536','stroke-width':2});
  const hanging=shape(graphic,'g',{transform:'translate('+(slip*.66)+' '+(-slip*.75)+')'});
  shape(hanging,'path',{d:'M30 70H360L210 240H30Z',fill:'#edca91',stroke:'#785536','stroke-width':2});
  for(const y of [110,150,190]){
   shape(graphic,'path',{d:'M30 '+y+'H530',fill:'none',stroke:'#65796e','stroke-width':2,'stroke-dasharray':'5 4'});
   const join=360-(y-70)*150/170;
   shape(hanging,'path',{d:'M30 '+y+'Q'+(join-50)+' '+(y-bend)+' '+join+' '+y,fill:'none',stroke:'#985229','stroke-width':4});
   shape(graphic,'path',{d:'M'+join+' '+y+'Q'+(join+50)+' '+(y+bend)+' 530 '+y,fill:'none',stroke:'#a56a43','stroke-width':4});
  }
  shape(graphic,'path',{d:'M360 70L210 240',stroke:'#903d2c','stroke-width':5});
  shape(graphic,'text',{x:80,y:35,fill:'#244c45','font-size':28},'→');
  shape(graphic,'text',{x:455,y:35,fill:'#244c45','font-size':28},'←');
 }
 const off=session.onCancel(()=>{
  driverActive=replayActive=guided=false;state=F.pauseFault(state,true);render();
 });
 render();
 return {render,cancel:()=>session.cancel('fault'),destroy:off,
  snapshot:()=>({...structuredClone(state),driverActive,replayActive,guided,recordedFrames:history.length})};
};

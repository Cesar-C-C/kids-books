window.mountFault=function(container,{content,lang,session}){
 const {el,button,svg,shape}=EarthquakeUI,F=EarthquakeFault,t=(zh,en)=>lang()==='en'?en:zh;
 let state=F.createFault(),driverActive=false,replayActive=false,history=[structuredClone(state)],prediction=null;
 const heading=el('h2'),predict=el('details','prediction'),summary=el('summary'),choices=el('div','controls');predict.append(summary,choices);
 for(const [id,zh,en]of [['still','也都不动','Everything stays still'],['bend','旁边慢慢变形','Nearby rock bends'],['watch','先看看','Just watch']]){const b=button(t(zh,en),()=>{prediction=id;predict.open=false;summary.textContent=t('我的猜想：','My prediction: ')+b.textContent;});b.dataset.zh=zh;b.dataset.en=en;choices.append(b);}
 const graphic=svg(''),result=el('p','result');result.setAttribute('role','status');
 const controls=el('div','controls'),tools=el('details','tools'),tooltitle=el('summary'),extras=el('div','controls');tools.append(tooltitle,extras);
 function advance(drive,dt){state=F.stepFault(state,{drive,dt});history.push(structuredClone(state));render();}
 function pump(){if(state.paused||replayActive)return;advance(driverActive,1/30);if(state.phase!=='settled'&&(driverActive||state.phase==='slipping'))session.schedule(pump,1000/30);else driverActive=false;}
 function step(){session.cancel('step');state=F.pauseFault(state,false);advance(state.eventCount===0,.1);state=F.pauseFault(state,true);render();}
 const push=button('',e=>{if(e.detail===0)step();},'fault-drive'),single=button('',step,'fault-step');
 push.onpointerdown=e=>{if(e.button!==0||replayActive||state.phase==='settled')return;session.cancel('drive');state=F.pauseFault(state,false);driverActive=true;push.setPointerCapture(e.pointerId);if(matchMedia('(prefers-reduced-motion: reduce)').matches){step();return;}pump();};
 push.onpointerup=()=>{driverActive=false;render();};push.onpointercancel=()=>session.cancel('pointercancel');push.onlostpointercapture=()=>{driverActive=false;};
 const pause=button('',()=>{const was=state.paused;session.cancel('pause');state=F.pauseFault(state,!was);render();if(!state.paused&&state.phase==='slipping')pump();},'fault-pause');
 const reset=button('',()=>{session.cancel('reset');state=F.createFault();history=[structuredClone(state)];render();},'fault-reset');
 const replay=button('',()=>{if(history.length<2)return;const frames=history.map(x=>({...x}));session.cancel('replay');replayActive=true;let i=0;const next=()=>{state={...frames[i],paused:true};render();if(++i<frames.length)session.schedule(next,matchMedia('(prefers-reduced-motion: reduce)').matches?160:65);else{replayActive=false;render();}};next();},'fault-replay');
 controls.append(push,single);extras.append(pause,replay,reset);container.append(heading,predict,graphic,controls,result,tools);
 function render(){EarthquakeUI.narratedText(heading,content.interactions.find(x=>x.id==='fault-predict')[lang()],'prompt','fault-predict',lang());summary.textContent=prediction?t('我的猜想：','My prediction: ')+({still:t('也都不动','Everything stays still'),bend:t('旁边慢慢变形','Nearby rock bends'),watch:t('先看看','Just watch')}[prediction]):t('先猜猜，也可以直接试','Make a guess, or try it');choices.querySelectorAll('button').forEach(b=>b.textContent=b.dataset[lang()]);tooltitle.textContent=t('观察工具','Observation tools');push.textContent=t('按住慢慢推动','Hold to push gently');single.textContent=t('推一小步','Push one small step');pause.textContent=state.paused?t('继续观察','Continue observing'):t('暂停观察','Pause');reset.textContent=t('同样条件，再试一次','Try the same conditions again');replay.textContent=t('慢放重看','Replay slowly');push.disabled=replayActive||state.phase==='settled';single.disabled=replayActive||state.phase==='settled';replay.disabled=history.length<2||replayActive;
  const id=state.phase==='initial'?'fault-initial':state.phase==='locked'?'fault-locked':state.phase==='slipping'?'fault-slipped':'fault-settled';EarthquakeUI.narratedText(result,content.interactions.find(x=>x.id===id)[lang()],'result',id,lang());container.dataset.phase=state.phase;
  graphic.setAttribute('aria-label',t('逆断层：向内挤压，接缝锁定时纹路弯曲，随后左侧上盘向右上方滑动','Reverse fault: compression bends the markings while locked; the left hanging wall then slips upward to the right'));
  graphic.replaceChildren();const slip=state.slipOffset*330,bend=state.elasticStrain*180;
  shape(graphic,'path',{d:'M30 70H360L210 240H30Z',fill:'none',stroke:'#a38e72','stroke-dasharray':'5 5'});
  shape(graphic,'path',{d:'M360 70H530V240H210Z',fill:'#d1a16c',stroke:'#785536','stroke-width':2});
  const hanging=shape(graphic,'g',{transform:`translate(${slip*.66} ${-slip*.75})`});shape(hanging,'path',{d:'M30 70H360L210 240H30Z',fill:'#edca91',stroke:'#785536','stroke-width':2});
  for(const y of [110,150,190]){const join=360-(y-70)*150/170;shape(hanging,'path',{d:`M30 ${y} Q${join-50} ${y-bend} ${join} ${y}`,fill:'none',stroke:'#a56a43','stroke-width':4});shape(graphic,'path',{d:`M${join} ${y}Q${join+50} ${y+bend} 530 ${y}`,fill:'none',stroke:'#a56a43','stroke-width':4});}
  shape(graphic,'path',{d:'M360 70L210 240',stroke:'#903d2c','stroke-width':5});shape(graphic,'text',{x:80,y:45,fill:'#244c45','font-size':28},'→');shape(graphic,'text',{x:455,y:45,fill:'#244c45','font-size':28},'←');shape(graphic,'text',{x:300,y:255,'text-anchor':'middle',fill:'#553e2e','font-size':15},t('看接缝与两边的纹路','Watch the seam and markings'));
 }
 const off=session.onCancel(()=>{driverActive=false;replayActive=false;state=F.pauseFault(state,true);render();});render();
 return {render,cancel:()=>session.cancel('fault'),destroy:()=>off(),snapshot:()=>({...structuredClone(state),driverActive,replayActive,prediction,recordedFrames:history.length})};
};

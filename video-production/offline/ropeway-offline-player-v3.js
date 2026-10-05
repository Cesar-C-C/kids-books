// Native project adaptation; CHAPTERS and all embedded media are original v5.
const v=document.getElementById('film'),a=document.getElementById('mandarin'),play=document.getElementById('play'),big=document.getElementById('big-play'),seek=document.getElementById('seek'),clock=document.getElementById('clock'),status=document.getElementById('status'),player=document.getElementById('player');
const sources={video:v.getAttribute('src'),mandarin:a.getAttribute('src')},TIMEOUT=10000;
let language='zh',userMuted=false,volume=1,blocked=false,ready=false,lastError='',dragging=false;
let loaded=true,wanted=false,videoSeek=false,target=null,position=0,serial=0,starting=false,timer=null,requests=0,settled=0;
const stamp=t=>{t=Math.max(0,Math.floor(t||0));return String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0');};
const logicalTime=()=>target!==null?target:loaded?v.currentTime:position;
function clearWatch(){clearTimeout(timer);timer=null;}
function watch(){if(timer===null)timer=setTimeout(()=>fail('定位或加载未能完成。可以重新加载，或停止等待。 / Seek or loading did not finish. Retry or cancel.'),TIMEOUT);}
function announce(text,error=false){status.textContent=text;status.classList.toggle('error',error);document.getElementById('recovery').hidden=!(error||blocked);}
function regular(){if(!lastError)announce(language==='zh'?'普通话配音':'English narration');}
function applyVolume(){v.muted=language==='zh'||userMuted;v.volume=volume;a.muted=userMuted;a.volume=volume;document.getElementById('mute').setAttribute('aria-pressed',String(userMuted));document.getElementById('mute').textContent=userMuted?'已静音':'声音';}
function update(){const t=logicalTime();play.disabled=false;play.textContent=wanted?'暂停':'播放';big.hidden=wanted||t>.1;big.disabled=false;if(!dragging)seek.value=t;clock.textContent=stamp(t)+' / '+stamp(Math.round(v.duration||597.5));const chapter=CHAPTERS.findLast(c=>t>=c.start)||CHAPTERS[0];document.querySelectorAll('.chapter').forEach(b=>b.setAttribute('aria-current',String(Number(b.dataset.chapter)===chapter.id)));}
function hold(text){blocked=true;ready=false;v.pause();a.pause();announce(text);watch();update();}
function unload(){v.pause();a.pause();for(const el of [v,a]){el.removeAttribute('src');el.load();}loaded=false;ready=false;videoSeek=false;starting=false;}
function fail(text){position=logicalTime();serial++;wanted=false;blocked=false;clearWatch();lastError=text;unload();target=null;announce(text,true);update();}
function cancel(){position=logicalTime();serial++;wanted=false;target=null;blocked=false;lastError='';clearWatch();unload();dragging=false;announce('已停止等待，点击播放可重新打开。 / Cancelled. Play to reopen.');update();}
function loadMedia(autoPlay){serial++;loaded=true;ready=false;lastError='';videoSeek=false;starting=false;wanted=autoPlay;target=position;v.src=sources.video;a.src=sources.mandarin;applyVolume();v.load();a.load();hold('正在加载影片… / Preparing the film…');}
function alignAudio(){a.playbackRate=v.playbackRate;if(language!=='zh')return true;if(a.readyState<2||a.seeking)return false;if(Math.abs(a.currentTime-v.currentTime)>.025){a.pause();a.currentTime=Math.min(v.currentTime,Math.max(0,a.duration-.005));return false;}return true;}
// One native video seek in flight; every input immediately owns the logical
// target. Apply its latest value on native completion, without input debounce.
function pump(){
 if(!loaded||lastError)return;if(v.readyState<1||videoSeek||v.seeking)return;
 if(target!==null){if(Math.abs(target-v.currentTime)>.002){videoSeek=true;hold('正在定位画面… / Seeking the picture…');v.currentTime=target;return;}position=v.currentTime;target=null;settled=requests;}
 if(v.readyState<2||!alignAudio()){hold('正在准备画面和配音… / Preparing picture and narration…');return;}
 ready=true;blocked=false;if(!wanted)clearWatch();regular();update();if(wanted)resume();
}
async function resume(){
 if(starting||!loaded||!wanted||blocked||target!==null||videoSeek||v.seeking||!ready||lastError)return;
 const ticket=serial;starting=true;watch();
 try{applyVolume();await v.play();if(ticket!==serial)return;if(!wanted||blocked||target!==null){v.pause();a.pause();return;}if(language==='zh'){await a.play();if(ticket!==serial)return;if(!wanted||blocked||target!==null)a.pause();}}
 catch(e){if(ticket===serial&&wanted&&e.name!=='AbortError')fail('无法继续播放。请重新加载。 / Playback failed. Please retry.');}
 finally{if(ticket===serial)starting=false;update();}
}
function togglePlay(){if(wanted){serial++;wanted=false;starting=false;v.pause();a.pause();if(!blocked)regular();update();return;}lastError='';wanted=true;if(!loaded){loadMedia(true);return;}if(v.ended)jump(0);pump();if(ready)resume();update();}
function jump(t){const max=Number.isFinite(v.duration)?v.duration-.005:597.495;position=Math.max(0,Math.min(max,t));target=position;requests++;serial++;starting=false;v.pause();a.pause();if(loaded&&!lastError){hold('正在定位画面… / Seeking the picture…');pump();}else update();}
function selectLanguage(next){if(next===language)return;serial++;starting=false;language=next;a.pause();v.pause();document.querySelectorAll('[data-language]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.language===language)));applyVolume();if(loaded&&!lastError){hold('正在准备配音… / Preparing narration…');pump();}else update();}
play.addEventListener('click',togglePlay);big.addEventListener('click',togglePlay);v.addEventListener('click',togglePlay);document.querySelectorAll('[data-language]').forEach(b=>b.addEventListener('click',()=>selectLanguage(b.dataset.language)));
v.addEventListener('seeked',()=>{if(!loaded)return;videoSeek=false;pump();});a.addEventListener('seeked',pump);
for(const event of ['loadedmetadata','loadeddata','canplay']){v.addEventListener(event,()=>{if(Number.isFinite(v.duration))seek.max=v.duration;pump();});a.addEventListener(event,pump);}
v.addEventListener('playing',()=>{if(!wanted||target!==null||blocked||lastError){v.pause();a.pause();return;}if(language==='en')clearWatch();regular();update();});a.addEventListener('playing',()=>{if(wanted&&language==='zh'&&!v.paused&&!blocked&&target===null)clearWatch();});v.addEventListener('pause',()=>{a.pause();update();});
v.addEventListener('ended',()=>{serial++;wanted=false;starting=false;a.pause();clearWatch();update();announce('旅程结束，继续保持好奇！ / Keep being curious!');});
v.addEventListener('waiting',()=>{if(loaded&&wanted&&!lastError)hold('正在等待画面… / Waiting for picture…');});a.addEventListener('waiting',()=>{if(loaded&&wanted&&language==='zh'&&!lastError)hold('正在等待中文配音… / Waiting for Mandarin…');});
v.addEventListener('ratechange',()=>{a.playbackRate=v.playbackRate;});v.addEventListener('volumechange',()=>{const muted=language==='zh'||userMuted;if(v.muted!==muted)v.muted=muted;if(v.volume!==volume)v.volume=volume;});
v.addEventListener('error',()=>{if(loaded)fail('视频无法读取，请重新加载。 / Video unavailable. Please retry.');});a.addEventListener('error',()=>{if(loaded&&language==='zh')fail('中文配音无法读取，请重新加载或选择 English。 / Mandarin unavailable. Retry or choose English.');});
function finishSeekDrag(){dragging=false;update();}seek.addEventListener('pointerdown',()=>dragging=true);for(const event of ['pointerup','pointercancel','lostpointercapture','blur'])seek.addEventListener(event,finishSeekDrag);seek.addEventListener('input',()=>jump(Number(seek.value)));seek.addEventListener('change',finishSeekDrag);
document.getElementById('back').addEventListener('click',()=>jump(logicalTime()-10));document.getElementById('forward').addEventListener('click',()=>jump(logicalTime()+10));document.getElementById('speed').addEventListener('change',e=>v.playbackRate=Number(e.target.value));document.getElementById('mute').addEventListener('click',()=>{userMuted=!userMuted;applyVolume();});document.getElementById('volume').addEventListener('input',e=>{volume=Number(e.target.value);userMuted=volume===0;applyVolume();});document.querySelectorAll('.chapter').forEach(b=>b.addEventListener('click',()=>jump(Number(b.dataset.start))));
document.getElementById('retry').addEventListener('click',()=>{position=logicalTime();const again=wanted;unload();target=null;clearWatch();loadMedia(again);});document.getElementById('cancel').addEventListener('click',cancel);
function refreshFullscreen(){document.getElementById('fullscreen').textContent=document.fullscreenElement||player.classList.contains('fallback-fullscreen')?'退出全屏':'全屏';}
document.getElementById('fullscreen').addEventListener('click',async()=>{if(document.fullscreenElement)await document.exitFullscreen();else if(player.classList.contains('fallback-fullscreen')){player.classList.remove('fallback-fullscreen');document.body.classList.remove('fullscreen-open');}else{try{await player.requestFullscreen();}catch{player.classList.add('fallback-fullscreen');document.body.classList.add('fullscreen-open');}}refreshFullscreen();});document.addEventListener('fullscreenchange',refreshFullscreen);
document.addEventListener('keydown',e=>{if(e.code==='Escape'&&player.classList.contains('fallback-fullscreen')){e.preventDefault();player.classList.remove('fallback-fullscreen');document.body.classList.remove('fullscreen-open');refreshFullscreen();return;}if(e.target.matches('input,select,textarea,button,a,summary'))return;if(e.code==='Space'){e.preventDefault();togglePlay();}else if(e.code==='ArrowLeft'){e.preventDefault();jump(logicalTime()-10);}else if(e.code==='ArrowRight'){e.preventDefault();jump(logicalTime()+10);}else if(e.code==='Escape'){player.classList.remove('fallback-fullscreen');document.body.classList.remove('fullscreen-open');refreshFullscreen();}});
setInterval(()=>{if(loaded&&wanted&&!blocked&&!v.paused&&language==='zh'&&!a.seeking&&Math.abs(a.currentTime-v.currentTime)>.12){hold('正在同步配音… / Synchronizing narration…');pump();}update();},150);
window.addEventListener('pagehide',()=>{serial++;wanted=false;v.pause();a.pause();clearWatch();dragging=false;});
window.playerState=()=>({language,time:loaded?v.currentTime:position,audioTime:a.currentTime,videoPaused:v.paused,audioPaused:a.paused,videoMuted:v.muted,userMuted,blocked,rate:v.playbackRate,audioRate:a.playbackRate,ready,error:lastError,requestedTime:logicalTime(),requests,settled,videoSeek,wanted});window.selectNarration=selectLanguage;window.jumpTo=jump;
applyVolume();hold('正在准备影片… / Preparing the film…');pump();update();

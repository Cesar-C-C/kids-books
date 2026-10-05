/* Adapted from the source v5 native bilingual player. Original English is in
   browser.mp4; Mandarin is a separate AAC. Do NOT substitute dual-audio MP4.
   No source media is requested until the viewer clicks Play. */
(() => {
 const $=id=>document.getElementById(id),v=$('film'),a=$('mandarin'),status=$('status'),player=$('player');
 const TIMEOUT=30000;
 let config=null,language='zh',userMuted=false,volume=1,serial=0,loaded=false,ready=false,wanted=false,blocked=false,lastError='',dragging=false,position=0,timer=null,controller=null,configPromise=null;
 const stamp=t=>{t=Math.max(0,Math.floor(t||0));return String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0');};
 function announce(text,error=false){status.textContent=text;status.classList.toggle('error',error);$('recovery').hidden=!(error||loaded&&!ready);if(error)lastError=text;}
 function regular(){if(!lastError&&ready)announce(language==='zh'?'普通话配音':'English narration');}
 function clearTimer(){clearTimeout(timer);timer=null;}
 function watch(){clearTimer();timer=setTimeout(()=>fail('加载时间较长，已停止等待。可以重新加载。 / Loading timed out. Retry when ready.'),TIMEOUT);}
 function applyVolume(){const muted=language==='zh'||userMuted;if(v.muted!==muted)v.muted=muted;if(v.volume!==volume)v.volume=volume;a.muted=userMuted;a.volume=volume;$('mute').setAttribute('aria-pressed',String(userMuted));$('mute').textContent=userMuted?'已静音':'声音';}
 function align(force=false){a.playbackRate=v.playbackRate;if(language==='zh'&&a.readyState>=1&&!a.seeking&&Math.abs(a.currentTime-v.currentTime)>(force?.025:.12))a.currentTime=Math.min(v.currentTime,Math.max(0,a.duration-.005));}
 function update(){const now=loaded?v.currentTime:position;$('play').textContent=wanted&&!v.paused?'暂停':!ready&&loaded?'停止加载':'播放';$('big-play').hidden=loaded||wanted;$('seek').value=dragging?$('seek').value:now;$('clock').textContent=stamp(now)+' / '+stamp(Math.round(config?.duration||597.5));const chapter=config?.chapters.findLast(c=>now>=c.start)||config?.chapters[0];document.querySelectorAll('.chapter').forEach(b=>b.setAttribute('aria-current',String(Number(b.dataset.chapter)===chapter?.id)));}
 function stop(unload=false){serial++;wanted=false;blocked=false;clearTimer();v.pause();a.pause();if(unload){position=v.currentTime||position;loaded=false;ready=false;for(const el of [v,a]){el.removeAttribute('src');el.load();}}update();}
 function fail(message){stop(true);lastError=message;announce(message,true);}
 async function init(){
  if(config)return config;if(configPromise)return configPromise;
  controller=new AbortController();const abort=controller,timeout=setTimeout(()=>abort.abort(),TIMEOUT);
  configPromise=(async()=>{try{const r=await fetch('film.json',{signal:abort.signal});if(r.status!==200)throw Error('manifest');const c=await r.json();if(c.kind!=='native-bilingual-film'||c.duration!==597.5||c.captionPairs!==104)throw Error('manifest');config=c;
   for(const c of config.chapters){const b=document.createElement('button');b.className='chapter';b.dataset.chapter=c.id;b.textContent=c.zh;b.title=c.en;b.addEventListener('click',()=>jump(c.start));$('chapters').append(b);}update();return c;
  }finally{clearTimeout(timeout);controller=null;configPromise=null;}})();return configPromise;
 }
 function load(){loaded=true;ready=false;lastError='';announce('正在加载画面和配音… / Preparing video and narration…');watch();v.preload='auto';a.preload='auto';v.src=config.media.video.url;a.src=config.media.mandarin.url;applyVolume();v.load();a.load();update();}
 async function start(){
  const token=serial;try{await init();if(token!==serial)return;wanted=true;if(!loaded)load();if(ready)await resume(token);update();}catch(e){if(token===serial)fail('播放器未能准备好，请重新加载。 / Could not prepare the player. Retry.');}
 }
 async function chinese(token){
  if(token!==serial||language!=='zh'||!wanted||v.paused||v.seeking||blocked)return;
  if(a.seeking)return;try{await a.play();if(token===serial&&(language!=='zh'||!wanted||v.paused||blocked))a.pause();}
  catch(e){if(token===serial&&wanted&&language==='zh'&&e.name!=='AbortError')fail('中文配音无法播放，请重新加载。 / Mandarin playback failed. Retry.');}
 }
 async function resume(token=serial){if(token!==serial||!ready||!wanted||lastError)return;applyVolume();if(v.paused&&language==='zh'){align(true);if(a.seeking){ready=false;return;}}try{await v.play();if(token!==serial)return;await chinese(token);}catch(e){if(token===serial&&e.name!=='AbortError')fail('视频无法播放，请重新加载。 / Video playback failed. Retry.');}}
 function updateReady(){if(!loaded||lastError)return;const was=ready;ready=v.readyState>=2&&!v.seeking&&(language==='en'||a.readyState>=2&&!a.seeking);if(ready){clearTimer();regular();if(!was&&wanted)resume();}update();}
 function toggle(){if(wanted){const cancelLoading=!ready;stop(cancelLoading);if(cancelLoading)announce('已停止加载。点击播放可继续。 / Loading stopped. Play to resume.');else regular();}else{if(v.ended)jump(0);start();}update();}
 function selectLanguage(next){if(next===language)return;serial++;language=next;document.querySelectorAll('[data-language]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.language===next)));a.pause();applyVolume();if(lastError){update();return;}if(next==='zh'&&loaded){v.pause();align(true);}ready=false;blocked=false;updateReady();if(next==='zh'&&loaded&&!ready){blocked=true;announce('正在准备中文配音… / Preparing Mandarin…');watch();}else if(wanted)resume();regular();update();}
 function jump(t){position=Math.max(0,Math.min(config?.duration||597.5,t));if(loaded&&v.readyState>=1){v.currentTime=Math.min(position,v.duration-.005);align(true);}update();}
 function retry(){stop(true);lastError='';announce('重新加载… / Retrying…');start();}
 for(const id of ['play','big-play'])$(id).addEventListener('click',toggle);v.addEventListener('click',toggle);
 $('retry').addEventListener('click',retry);$('cancel').addEventListener('click',()=>{stop(true);lastError='';announce('已停止加载。点击播放可继续。 / Loading stopped. Play to resume.');});
 document.querySelectorAll('[data-language]').forEach(b=>b.addEventListener('click',()=>selectLanguage(b.dataset.language)));
 v.addEventListener('loadedmetadata',()=>{if(loaded&&position){v.currentTime=Math.min(position,v.duration-.005);align(true);}});
 a.addEventListener('loadedmetadata',()=>align(true));
 for(const e of ['loadedmetadata','loadeddata','canplay']){v.addEventListener(e,updateReady);a.addEventListener(e,()=>{blocked=false;updateReady();if(ready&&wanted){if(v.paused)resume();else chinese(serial);}});}
 v.addEventListener('playing',()=>{if(!wanted){v.pause();return;}blocked=false;clearTimer();regular();chinese(serial);update();});
 v.addEventListener('pause',()=>{a.pause();update();});
 v.addEventListener('ended',()=>{wanted=false;a.pause();clearTimer();update();announce('旅程结束，继续保持好奇！');});
 v.addEventListener('waiting',()=>{if(!loaded||!wanted||lastError)return;blocked=true;a.pause();announce('正在准备画面… / Buffering picture…');watch();});
 a.addEventListener('waiting',()=>{if(!loaded||!wanted||language!=='zh'||lastError)return;blocked=true;ready=false;v.pause();announce('正在准备中文配音… / Buffering Mandarin…');watch();});
 v.addEventListener('seeking',()=>{if(!loaded)return;blocked=true;a.pause();align(true);if(wanted)watch();});
 v.addEventListener('seeked',()=>{if(!loaded)return;blocked=false;align(true);clearTimer();if(wanted)resume();regular();update();});
 v.addEventListener('ratechange',()=>{a.playbackRate=v.playbackRate;align(true);});v.addEventListener('volumechange',applyVolume);
 v.addEventListener('error',()=>{if(loaded)fail('视频未能加载，请重新加载或下载完整播放器。 / Video unavailable. Retry or download the full player.');});
 a.addEventListener('error',()=>{if(loaded&&language==='zh')fail('中文配音未能加载，请重新加载，或选择 English。 / Mandarin unavailable. Retry or select English.');});
 $('seek').addEventListener('pointerdown',()=>dragging=true);$('seek').addEventListener('pointerup',()=>dragging=false);$('seek').addEventListener('pointercancel',()=>{dragging=false;update();});$('seek').addEventListener('input',()=>jump(Number($('seek').value)));$('seek').addEventListener('change',()=>{dragging=false;update();});
 $('back').addEventListener('click',()=>jump((loaded?v.currentTime:position)-10));$('forward').addEventListener('click',()=>jump((loaded?v.currentTime:position)+10));$('replay').addEventListener('click',()=>{jump(0);if(!wanted)start();});$('speed').addEventListener('change',e=>v.playbackRate=Number(e.target.value));$('mute').addEventListener('click',()=>{userMuted=!userMuted;applyVolume();});$('volume').addEventListener('input',e=>{volume=Number(e.target.value);userMuted=volume===0;applyVolume();});
 function refreshFullscreen(){const on=!!document.fullscreenElement||player.classList.contains('fallback-fullscreen');$('fullscreen').textContent=on?'退出全屏':'全屏';}
 $('fullscreen').addEventListener('click',async()=>{if(document.fullscreenElement)await document.exitFullscreen();else if(player.classList.contains('fallback-fullscreen')){player.classList.remove('fallback-fullscreen');document.body.classList.remove('fullscreen-open');}else{try{await player.requestFullscreen();}catch{player.classList.add('fallback-fullscreen');document.body.classList.add('fullscreen-open');}}refreshFullscreen();});document.addEventListener('fullscreenchange',refreshFullscreen);
 document.addEventListener('keydown',e=>{if(e.code==='Escape'&&player.classList.contains('fallback-fullscreen')){e.preventDefault();player.classList.remove('fallback-fullscreen');document.body.classList.remove('fullscreen-open');refreshFullscreen();return;}if(e.target.matches('input,select,textarea,button,a,summary'))return;if(e.code==='Space'){e.preventDefault();toggle();}else if(e.code==='ArrowLeft'){e.preventDefault();jump((loaded?v.currentTime:position)-10);}else if(e.code==='ArrowRight'){e.preventDefault();jump((loaded?v.currentTime:position)+10);}else if(e.code==='Escape'){player.classList.remove('fallback-fullscreen');document.body.classList.remove('fullscreen-open');refreshFullscreen();}});
 const tick=()=>{if(language==='zh'&&wanted&&!v.paused&&!v.seeking&&!blocked)align();update();};
 let interval=setInterval(tick,150);
 window.addEventListener('pagehide',()=>{stop(true);controller?.abort();clearInterval(interval);interval=null;});
 window.addEventListener('pageshow',e=>{if(e.persisted&&interval===null){interval=setInterval(tick,150);lastError='';announce('已返回，点击播放继续。 / Welcome back. Play to resume.');update();}});
 window.playerState=()=>({language,time:loaded?v.currentTime:position,audioTime:a.currentTime,videoPaused:v.paused,audioPaused:a.paused,videoMuted:v.muted,userMuted,blocked,rate:v.playbackRate,audioRate:a.playbackRate,ready,loaded,wanted,error:lastError,serial});window.selectNarration=selectLanguage;window.jumpTo=jump;
 applyVolume();update();init().catch(()=>fail('目录信息未能加载，请重新加载。 / Film information unavailable. Retry.'));
})();

(() => {
 'use strict';
 const AUDIO_VER=6;
 const $=id=>document.getElementById(id), pages=window.PAGES, key='kb-cloud-journey-v1';
 let saved={};try{saved=JSON.parse(localStorage.getItem(key)||'{}')||{};}catch{}
 let current=Number.isInteger(saved.page)?Math.max(0,Math.min(pages.length-1,saved.page)):0;
 let lang=saved.lang==='en'?'en':'zh',auto=false,translation=false,sequenceStep=0;
 let audio=null,voiceTimer=null,autoTimer=null,bubbleTimer=null,playToken=0;
 const text=(zh,en)=>lang==='zh'?zh:en;
 const chaptersZh=['天空来信','第一幕 · 离开池塘','第二幕 · 误入云城','第三幕 · 跨越山岭','第四幕 · 雨中重逢','旅行后的发现'];
 const chaptersEn=['A letter from the sky','ACT I · Leaving the pond','ACT II · Inside a cloud','ACT III · Over the mountain','ACT IV · Finding home','Keep exploring'];
 function save(){try{localStorage.setItem(key,JSON.stringify({page:current,lang}));}catch{}}
 function stop(){++playToken;clearTimeout(voiceTimer);clearTimeout(autoTimer);if(audio){audio.pause();audio.removeAttribute('src');audio.load();audio=null;}if(window.speechSynthesis) speechSynthesis.cancel();$('narrate').setAttribute('aria-pressed','false');$('narrate').textContent=text('▶ 听故事','▶ Listen');$('audio-status').textContent='';}
 function speak(content,file){
  stop();const token=playToken;let usedFallback=false;$('narrate').setAttribute('aria-pressed','true');$('narrate').textContent=text('■ 停止','■ Stop');
  const finish=()=>{if(token!==playToken)return;clearTimeout(voiceTimer);$('narrate').setAttribute('aria-pressed','false');$('narrate').textContent=text('▶ 听故事','▶ Listen');$('audio-status').textContent='';};
  const fallback=()=>{if(token!==playToken||usedFallback)return;usedFallback=true;clearTimeout(voiceTimer);if(audio){audio.onerror=null;audio.onplaying=null;audio.pause();audio=null;}if(!window.speechSynthesis){finish();$('audio-status').textContent=text('当前设备不支持语音，可阅读文字。','Speech unavailable; read the text.');return;}const u=new SpeechSynthesisUtterance(content);u.lang=lang==='zh'?'zh-CN':'en-US';u.rate=lang==='zh'?.86:.88;u.voice=speechSynthesis.getVoices().find(v=>v.lang===u.lang&&/Natural|Aria|Xiaoxiao|Google/.test(v.name))||null;u.onend=finish;u.onerror=finish;speechSynthesis.speak(u);$('audio-status').textContent=text('设备语音','Device voice');};
  if(!file){fallback();return;}
  const a=audio=new Audio(`audio/${file}_${lang}.mp3?v=${AUDIO_VER}`);a.onended=finish;a.onerror=fallback;a.onplaying=()=>{if(token===playToken){clearTimeout(voiceTimer);$('audio-status').textContent='';}};
  $('audio-status').textContent=text('正在加载声音…','Loading audio…');voiceTimer=setTimeout(fallback,7000);a.play().catch(fallback);
 }
 function narration(){const p=pages[current];speak(p[lang],`page_${String(current).padStart(2,'0')}`);}
 function clearBubble(){clearTimeout(bubbleTimer);$('bubble').hidden=true;}
 function discover(){const p=pages[current];$('bubble').textContent=text(p.factZh,p.factEn);$('bubble').hidden=false;$('discovery').open=true;speak(text(p.factZh,p.factEn),`fact_${String(current).padStart(2,'0')}`);bubbleTimer=setTimeout(clearBubble,12000);}
 function activity(){
  const p=pages[current],el=$('activity');el.replaceChildren();$('feedback').textContent='';sequenceStep=0;
  if(p.glossary){const grid=document.createElement('div');grid.className='word-grid';p.glossary.forEach(w=>{const b=document.createElement('button');b.textContent=text(w.zh,w.en);const small=document.createElement('small');small.textContent=text(w.en,w.zh);b.append(small);b.onclick=()=>speak(w[lang],`word_${w.en.toLowerCase().replaceAll(' ','_')}`);grid.append(b);});el.append(grid);return;}
  const q=document.createElement('p');q.className='question';q.textContent='◌ '+text(p.qZh,p.qEn);el.append(q);
  const answers=document.createElement('div');answers.className='answers';el.append(answers);
  if(p.sequence){const routesZh=['蒸发进入空气','冷却凝结成云','长大成为雨滴','落地流入河流'],routesEn=['Evaporate into air','Cool and condense','Grow into raindrops','Fall and flow into rivers'];const status=document.createElement('p');status.className='sequence-count';status.textContent=text('从地表的水开始，依次点选 · 0 / 4','Start with water at the surface · 0 / 4');el.insertBefore(status,answers);[2,0,3,1].forEach(i=>{const b=document.createElement('button');b.textContent=text(routesZh[i],routesEn[i]);b.onclick=()=>{if(i!==sequenceStep){$('feedback').textContent=text('再想想：地表的水先怎样进入空气？完成一步后，再找下一步。','Think of the next step on this route. How does surface water first enter the air?');return;}b.disabled=true;b.classList.add('selected');sequenceStep++;status.textContent=`${sequenceStep} / 4`;$('feedback').textContent=sequenceStep===4?text('连起来了！这是一条常见路线。水还可能进入土壤、植物或冰雪。','Connected! This is one common route. Water can also enter soil, plants, or ice.'):text('接对了，继续找下一步。','That connects. Find the next step.');};answers.append(b);});return;}
  (lang==='zh'?p.choicesZh:p.choicesEn).forEach((label,i)=>{const b=document.createElement('button');b.textContent=label;b.onclick=()=>{answers.querySelectorAll('button').forEach(x=>x.classList.remove('selected','try-again'));const correct=p.answer===-1||i===p.answer;b.classList.add(correct?'selected':'try-again');$('feedback').textContent=correct?text(p.feedbackZh,p.feedbackEn):text('再观察一下图片，或打开上面的“为什么”找线索，然后再试一次。','Look again, or open the explanation above for a clue. Then try again.');};answers.append(b);});
 }
 function render(focus=false){
  stop();clearBubble();const p=pages[current];document.documentElement.lang=lang==='zh'?'zh-CN':'en';
  $('chapter').textContent=(lang==='zh'?chaptersZh:chaptersEn)[p.act];$('page-number').textContent=`${String(current+1).padStart(2,'0')} / ${pages.length}`;
  $('title').textContent=text(p.title,p.titleEn);$('subtitle').textContent=text(p.titleEn,p.title);$('story').textContent=p[lang];$('translated-story').textContent=p[lang==='zh'?'en':'zh'];$('translated-story').hidden=!translation;$('translation').textContent=translation?text('收起英文','Hide Chinese'):text('看英文','Show Chinese');$('translation').setAttribute('aria-expanded',String(translation));
  $('why-title').textContent=text(p.why,p.whyEn);$('fact').textContent=text(p.factZh,p.factEn);$('discovery').open=false;$('read-fact').textContent=text('♪ 听这个秘密','♪ Hear the explanation');
  const im=$('illustration');$('image-error').hidden=true;im.alt=text(p.title,p.titleEn);im.onload=()=>{if(im.naturalWidth)$('illustration').parentElement.style.aspectRatio=`${im.naturalWidth}/${im.naturalHeight}`;};im.onerror=()=>{$('image-error').hidden=false;};im.src=p.img;
  const coords=window.CLOUD_HOTSPOTS[current];$('hotspots').innerHTML=coords?`<g class="hot" tabindex="0" role="button" aria-label="${text('发现插图中的科学秘密','Discover the science in this picture')}" transform="translate(${coords[0]} ${coords[1]})"><circle class="hit" r="78" style="fill:transparent;stroke:none"/><circle class="halo" r="35"/><circle r="24"/><text text-anchor="middle" dominant-baseline="central">✦</text></g>`:'';
  $('art-hint').hidden=!coords;$('art-hint').textContent=text('点亮小圆点，发现一个秘密','Tap the sparkle to discover');$('scene-label').textContent=text('滴滴的旅行 · 插画中的角色为拟人想象','Didi’s journey · Characters are imaginary');
  $('previous').disabled=current===0;$('previous').innerHTML=text('← <span>上一页</span>','← <span>Back</span>');$('previous').ariaLabel=text('上一页','Previous page');$('next').innerHTML=current===pages.length-1?text('<span>再读一遍</span> ↻','<span>Read again</span> ↻'):text('<span>下一页</span> →','<span>Next</span> →');$('next').ariaLabel=current===pages.length-1?text('再读一遍','Read again'):text('下一页','Next page');
  $('progress').style.width=`${(current+1)/pages.length*100}%`;$('journey-label').textContent=text('一滴水，一整个世界','One drop. A whole world.');$('language').textContent=lang==='zh'?'EN':'中文';$('contents').textContent=text('☷ 目录','☷ Contents');$('auto').textContent=text(`自动朗读：${auto?'开':'关'}`,`Auto read: ${auto?'on':'off'}`);$('auto').setAttribute('aria-pressed',String(auto));
  activity();save();if(focus)$('title').focus({preventScroll:true});if(auto)autoTimer=setTimeout(narration,450);
  if(pages[current+1]){const nextImg=new Image();nextImg.src=pages[current+1].img;}
 }
 function turn(delta){current=Math.max(0,Math.min(pages.length-1,current+delta));render(true);window.scrollTo({top:0,behavior:'instant'});}
 $('next').onclick=()=>{if(current===pages.length-1){current=0;render(true);window.scrollTo(0,0);}else turn(1);};$('previous').onclick=()=>turn(-1);
 $('narrate').onclick=()=>{$('narrate').getAttribute('aria-pressed')==='true'?stop():narration();};$('read-fact').onclick=()=>speak(text(pages[current].factZh,pages[current].factEn),`fact_${String(current).padStart(2,'0')}`);
 $('language').onclick=()=>{lang=lang==='zh'?'en':'zh';render();};$('translation').onclick=()=>{translation=!translation;$('translated-story').hidden=!translation;$('translation').setAttribute('aria-expanded',String(translation));$('translation').textContent=translation?text('收起英文','Hide Chinese'):text('看英文','Show Chinese');};
 $('auto').onclick=()=>{auto=!auto;render();};$('hotspots').onclick=e=>{if(e.target.closest('.hot'))discover();};$('hotspots').onkeydown=e=>{if(e.target.closest('.hot')&&(e.key==='Enter'||e.key===' ')){e.preventDefault();discover();}};
 $('bubble').onclick=clearBubble;$('retry-image').onclick=()=>{const im=$('illustration');$('image-error').hidden=true;im.src=pages[current].img+'?retry='+Date.now();};
 $('contents').onclick=()=>{stop();clearBubble();const list=$('toc-pages');list.replaceChildren();pages.forEach((p,i)=>{const b=document.createElement('button');b.textContent=`${String(i+1).padStart(2,'0')} · ${text(p.title,p.titleEn)}`;if(i===current)b.setAttribute('aria-current','page');b.onclick=()=>{$('toc').close();current=i;render(true);window.scrollTo(0,0);};list.append(b);});$('toc').showModal();};$('close-toc').onclick=()=>$('toc').close();
 document.addEventListener('keydown',e=>{if($('toc').open||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;if(e.key==='ArrowRight'){e.preventDefault();turn(1);}if(e.key==='ArrowLeft'){e.preventDefault();turn(-1);}if(e.key==='Escape'){stop();clearBubble();}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});window.addEventListener('pagehide',stop);
 // Only claim a single-finger, clearly horizontal gesture. Vertical scrolling and
 // pinch zoom stay native; controls and browser-edge navigation are excluded.
 let swipe=null,suppressClickUntil=0;
 const reader=$('reader');
 reader.addEventListener('touchstart',e=>{
  swipe=null;suppressClickUntil=0;
  if(e.touches.length!==1||$('toc').open||e.target.closest('button,a,input,textarea,select,summary,[role="button"],[contenteditable],#bubble'))return;
  const t=e.touches[0];
  if(t.clientX<24||t.clientX>innerWidth-24||(window.visualViewport?.scale||1)>1.05)return;
  swipe={id:t.identifier,x:t.clientX,y:t.clientY,dx:0,dy:0,time:performance.now(),page:current,locked:false};
 },{passive:true});
 document.addEventListener('touchstart',e=>{if(e.touches.length>1)swipe=null;},{passive:true});
 document.addEventListener('touchmove',e=>{
  if(!swipe)return;
  const t=Array.from(e.touches).find(t=>t.identifier===swipe.id);
  if(e.touches.length!==1||!t){swipe=null;return;}
  swipe.dx=t.clientX-swipe.x;swipe.dy=t.clientY-swipe.y;
  const ax=Math.abs(swipe.dx),ay=Math.abs(swipe.dy);
  if(!swipe.locked){
   if(ay>12&&ay>=ax){swipe=null;return;}
   if(ax>12&&ax>ay*1.5)swipe.locked=true;
  }
  if(swipe.locked&&e.cancelable)e.preventDefault();
 },{passive:false});
 document.addEventListener('touchend',e=>{
  const s=swipe;swipe=null;if(!s||e.touches.length||$('toc').open||s.page!==current)return;
  const t=Array.from(e.changedTouches).find(t=>t.identifier===s.id);if(!t)return;
  const dx=t.clientX-s.x,dy=t.clientY-s.y;
  if(!s.locked||performance.now()-s.time>1000||Math.abs(dx)<Math.max(50,Math.min(96,innerWidth*.1))||Math.abs(dx)<Math.abs(dy)*1.5)return;
  suppressClickUntil=performance.now()+400;
  if(dx<0&&current<pages.length-1)turn(1);
  if(dx>0&&current>0)turn(-1);
 },{passive:true});
 document.addEventListener('touchcancel',()=>{swipe=null;},{passive:true});
 reader.addEventListener('click',e=>{if(performance.now()<suppressClickUntil){e.preventDefault();e.stopImmediatePropagation();}},true);
 render();
})();

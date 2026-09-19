/* Book-local runtime. Shared shelf and offline integration belong to QA. */
(() => {
 'use strict';
 const AUDIO_VER=1, STORE='moon-diary-v1';
 let story,lang='zh',album=0,angle=90,lampAngle=90,player=null,token=0,entries=[],audioTimer=null,diaryDraft={};
 const $=id=>document.getElementById(id), t=(zh,en)=>lang==='zh'?zh:en;
 const names={zh:['新月','渐盈月牙','上弦月','渐盈凸月','满月','渐亏凸月','下弦月','渐亏月牙'],en:['New moon','Waxing crescent','First quarter','Waxing gibbous','Full moon','Waning gibbous','Last quarter','Waning crescent']};
 function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
 function btn(text,fn){const b=el('button','',text);b.type='button';b.addEventListener('click',fn);return b;}
 function releasePlayer(){if(player){player.onerror=null;player.onended=null;player.onplaying=null;player.pause();player.removeAttribute('src');player.load();player=null;}}
 function clearAudioTimer(){clearTimeout(audioTimer);audioTimer=null;}
 function stop(){token++;clearAudioTimer();releasePlayer();window.speechSynthesis?.cancel();$('audio-status').textContent='';}
 function speak(item,kind='scene'){
   stop();const ticket=token, text=item[lang];let fallbackStarted=false;
   const fallback=()=>{if(ticket!==token||fallbackStarted)return;fallbackStarted=true;clearAudioTimer();releasePlayer();
     if(!window.speechSynthesis){$('audio-status').textContent=t('朗读暂不可用，仍可阅读文字。','Audio is unavailable. You can still read the story.');return;}
     $('audio-status').textContent=t('正在使用设备临时朗读。','Using the device voice for now.');
     const u=new SpeechSynthesisUtterance(text);u.lang=lang==='zh'?'zh-CN':'en-US';u.rate=.9;u.onend=()=>{if(ticket===token)$('audio-status').textContent='';};u.onerror=()=>{if(ticket===token)$('audio-status').textContent=t('设备朗读不可用，请阅读文字。','Device speech is unavailable. Please read the text.');};window.speechSynthesis.speak(u);
   };
   player=new Audio(`audio/${kind}-${item.id}-${lang}.mp3?v=${AUDIO_VER}`);player.onerror=fallback;player.onplaying=()=>{if(ticket===token)clearAudioTimer();};player.onended=()=>{if(ticket===token){clearAudioTimer();releasePlayer();$('audio-status').textContent='';}};$('audio-status').textContent=t('正在朗读…','Reading…');audioTimer=setTimeout(fallback,10000);player.play().catch(fallback);
 }
 function moon(a,cls='moon-disc') {const wrap=el('span');wrap.innerHTML=`<svg class="${cls}" viewBox="0 0 200 200" role="img" aria-label="${names[lang][MoonModel.state(a).index]}"><circle cx="100" cy="100" r="80" fill="#263951"/><path d="${MoonModel.path(a)}" fill="#ffe6a4"/></svg>`;return wrap.firstChild;}
 function scene(item){
   const card=el('article','scene');card.dataset.sceneId=item.id;
   const art=el('div','art'),im=el('img');im.src=`images/${item.image}.webp`;im.alt=t('栗栗的月亮日记插画','An illustration from Lili’s Moon Diary');im.loading='lazy';
   im.onerror=()=>{im.hidden=true;if(!art.querySelector('.pending-art'))art.append(el('p','pending-art',t('插画制作中','Illustration in progress')));};art.append(im);
   if(item.id!=='missing'&&['gift','full','morning','window'].includes(item.image))art.append(moon(item.id==='cloud'?90:item.image==='full'?180:item.image==='morning'?270:45,'sky-moon'));
   if(item.image==='compare'){
     const overlay=document.createElementNS('http://www.w3.org/2000/svg','svg');overlay.setAttribute('viewBox','0 0 1536 1024');overlay.setAttribute('class','paper-moons');overlay.setAttribute('aria-hidden','true');
     overlay.innerHTML=`<path d="${MoonModel.path(45,63,548,803)}" fill="#dab44e"/><path d="${MoonModel.path(90,63,965,801)}" fill="#dab44e"/>`;art.append(overlay);
   }
   const copy=el('div','scene-copy');copy.append(el('span','scene-count',`${String(story.scenes.indexOf(item)+1).padStart(2,'0')} / ${story.scenes.length}`),el('p','',item[lang]),btn(t('▶ 听这一段','▶ Listen'),()=>speak(item)));card.append(art,copy);return card;
 }
 function section(title,id){const s=el('section','chapter');s.id=id;s.append(el('h2','',title));$('book').append(s);return s;}
 function addScenes(parent,items){
   let previous=null,last=null;
   items.forEach(item=>{if(last&&previous===item.image){const text=el('div','continuation');text.dataset.sceneId=item.id;text.append(el('p','',item[lang]),btn(t('▶ 听这一段','▶ Listen'),()=>speak(item)));last.querySelector('.scene-copy').append(text);}else{last=scene(item);parent.append(last);}previous=item.image;});
 }
 function drawLab(){
   const state=MoonModel.state(angle);$('earth-moon').replaceChildren(moon(angle));$('phase-name').textContent=names[lang][state.index];
   $('orbit-moon').setAttribute('transform',`translate(${state.x} ${state.y})`);$('angle').value=angle;$('angle').setAttribute('aria-valuetext',names[lang][state.index]);
   document.querySelectorAll('[data-phase]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.phase)===state.index)));
 }
 function lab(parent){
   const box=el('div','paper');box.innerHTML=`<div class="lab-grid"><div><h3>${t('从太空看','From space')}</h3><svg class="space" viewBox="0 0 450 330" role="img" aria-label="${t('太阳在右，月球绕地球逆时针运行','Sun at right; the Moon moves counterclockwise around Earth')}"><circle cx="200" cy="165" r="130" fill="none" stroke="#768aa6" stroke-dasharray="5 6"/><path d="M440 100H360 M440 165H360 M440 230H360" stroke="#ffe6a4" stroke-width="3"/><path d="M370 94L360 100L370 106 M370 159L360 165L370 171 M370 224L360 230L370 236" stroke="#ffe6a4" fill="none"/><text x="440" y="65" fill="#ffe6a4" text-anchor="end" font-size="15">${t('阳光','Sunlight')}</text><circle cx="200" cy="165" r="23" fill="#64b5b0"/><text x="200" y="207" text-anchor="middle" fill="white" font-size="14">${t('地球','Earth')}</text><g id="orbit-moon"><circle r="15" fill="#334359"/><path d="M0 -15 A15 15 0 0 1 0 15 Z" fill="#ffe6a4"/></g></svg></div><div class="earth-view"><h3>${t('从地球看','From Earth')}</h3><div id="earth-moon"></div><p id="phase-name"></p><small>${t('北半球示意，北极朝上','Northern-hemisphere diagram, north up')}</small></div></div><label for="angle">${t('移动月亮，看看亮面怎样变','Move the Moon. Watch its bright shape change.')}</label><input id="angle" type="range" min="0" max="360" step="1" value="${angle}"><div id="phase-steps" class="controls"></div><div id="phase-choices" class="phase-buttons"></div>`;
   parent.append(box);$('angle').addEventListener('input',e=>{angle=Number(e.target.value);drawLab();});
   $('phase-steps').append(btn(t('← 后退一点','← Step back'),()=>{angle=(angle+345)%360;drawLab();}),btn(t('前进一点 →','Step forward →'),()=>{angle=(angle+15)%360;drawLab();}));
   names[lang].forEach((name,i)=>{const b=btn(name,()=>{angle=i*45;drawLab();});b.dataset.phase=i;$('phase-choices').append(b);});
   box.append(el('p','hint',t('太阳一直在右边。先看月亮朝向太阳的亮面，再看看地球上的样子。','The Sun stays on the right. Look at the Moon’s sunlit half, then compare the view from Earth.')));
   const predict=el('div','prediction');predict.append(el('h3','',t('先猜一猜，再试试看','Make a prediction, then try it')),
     el('p','',t('月亮走到地球左边、远离太阳的一侧时，我们会看见什么？','When the Moon moves to the left of Earth, opposite the Sun, what will we see?')));
   const out=el('p');out.setAttribute('role','status');
   const options=el('div','controls');[[45,t('细月牙','A thin crescent')],[90,t('半月','A half moon')],[180,t('满月','A full moon')]].forEach(([a,label])=>options.append(btn(label,()=>{if(a===180){angle=180;drawLab();out.textContent=t('对！朝向我们的这一面亮起来了。','Yes! The side facing us is lit up.');}else out.textContent=t('再想想：朝着太阳的亮面，这时也朝着地球吗？可以移动月亮找线索。','Try again: does the sunlit side face Earth here? Move the Moon to find a clue.');})));predict.append(options,out);box.append(predict);drawLab();
 }
 function validDiaryEntry(x){return x&&['id','date','time','shape','weather'].every(k=>typeof x[k]==='string'&&x[k].length<100)&&/^\d{4}-\d{2}-\d{2}$/.test(x.date)&&!Number.isNaN(Date.parse(x.date))&&/^([01]\d|2[0-3]):[0-5]\d$/.test(x.time)&&['crescent','half','gibbous','full','not-found','not-observed'].includes(x.shape)&&['clear','cloudy','unknown'].includes(x.weather);}
 function diary(parent){
   const box=el('div','paper');box.append(el('h3','',t('我的月亮日记','My Moon Diary')),el('p','hint',t('只保存在这台设备的浏览器里。无需每天记录，也不用熬夜。','Saved only in this browser on this device. No daily streaks. No staying up late.')));
   const form=el('form','diary-form');
   const controls={};
   function field(key,label,type,options){const l=el('label','',label),v=el(options?'select':'input');v.id='diary-'+key;v.name=key;if(!options)v.type=type;else options.forEach(([value,text])=>{const o=el('option','',text);o.value=value;v.append(o);});l.append(v);controls[key]=v;form.append(l);return v;}
   const now=new Date();field('date',t('日期','Date'),'date').value=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
   field('time',t('时间','Time'),'time').value=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
   field('shape',t('看见的样子','What I saw'),null,[['crescent',t('月牙','Crescent')],['half',t('半月','Half moon')],['gibbous',t('大半个圆','More than half')],['full',t('圆圆的','Round')],['not-found',t('没有找到','Not found')],['not-observed',t('这次没有观察','Did not observe')]]);
   field('weather',t('天空','Sky'),null,[['clear',t('晴朗','Clear')],['cloudy',t('有云','Cloudy')],['unknown',t('没有记录','Not recorded')]]);
   Object.entries(diaryDraft).forEach(([key,value])=>{if(controls[key])controls[key].value=value;});
   const save=el('button','',t('保存这一笔','Save this observation'));save.type='submit';form.append(save);const status=el('p','hint');status.setAttribute('role','status');
   const list=el('ul','entries');
   function persist(){try{localStorage.setItem(STORE,JSON.stringify(entries));status.textContent=t('已保存在本机。','Saved on this device.');}catch{status.textContent=t('浏览器无法保存。请导出日记；关闭页面后可能丢失。','Browser storage is unavailable. Export your diary before closing.');}}
   function render(){list.replaceChildren();entries.forEach(item=>{const li=el('li');const shape=Array.from(controls.shape.options).find(o=>o.value===item.shape)?.textContent||item.shape,weather=Array.from(controls.weather.options).find(o=>o.value===item.weather)?.textContent||item.weather;li.append(el('span','',`${item.date} ${item.time}\n${shape} · ${weather}`),btn(t('删除','Delete'),()=>{if(confirm(t('删除这一条记录？','Delete this observation?'))){entries=entries.filter(x=>x.id!==item.id);persist();render();}}));list.append(li);});}
   form.addEventListener('submit',e=>{e.preventDefault();if(!controls.date.value||!controls.time.value){status.textContent=t('请填写日期和时间。','Please enter a date and time.');return;}entries.push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random(),...Object.fromEntries(Object.entries(controls).map(([k,v])=>[k,v.value]))});persist();render();});
   box.append(form,status,list,btn(t('导出日记','Export diary'),()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(entries,null,2)],{type:'application/json'}));const a=el('a');a.href=url;a.download='my-moon-diary.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}));parent.append(box);render();
 }
 function render(){
   for(const key of ['date','time','shape','weather']){const input=$('diary-'+key);if(input)diaryDraft[key]=input.value;}
   const main=$('book');main.replaceChildren();document.documentElement.lang=lang==='zh'?'zh-CN':'en';$('language').textContent=lang==='zh'?'English':'中文';
   main.append(el('p','eyebrow',t('一份慢慢完成的礼物','A gift, one discovery at a time')),el('h1','',story.title[lang]),el('p','subtitle',t('跟栗栗一起，把变化画下来。','Keep a record of the changes with Lili.')));
   const first=section(t('01 · 这张画，先别擦','01 · Keep that drawing'),'album');const albumScenes=story.scenes.filter(x=>x.act==='album');const cards=el('div');albumScenes.forEach((s,i)=>{const card=scene(s);card.hidden=i!==album;cards.append(card);});first.append(cards);
   const nav=el('div','controls album-nav');const prev=btn(t('← 上一张','← Previous'),()=>{stop();album--;render();document.querySelector('.album-nav button:not(:disabled)').focus({preventScroll:true});$('album').scrollIntoView({block:'start'});}),next=btn(t('下一张 →','Next →'),()=>{stop();album++;render();const buttons=document.querySelectorAll('.album-nav button');(buttons[1].disabled?buttons[0]:buttons[1]).focus({preventScroll:true});$('album').scrollIntoView({block:'start'});});prev.disabled=album===0;next.disabled=album===albumScenes.length-1;nav.append(prev,el('span','',`${album+1} / ${albumScenes.length}`),next);first.append(nav);
   const compare=el('div','sketches');[45,90].forEach((a,i)=>{const c=el('div','sketch');c.append(moon(a),el('p','',i?t('几天后的傍晚','An evening a few days later'):t('第一次画 · 傍晚','First drawing · Evening')));compare.append(c);});first.append(compare);
   const light=section(t('02 · 给小白球一束光','02 · A little ball, a beam of light'),'light');addScenes(light,story.scenes.filter(x=>x.act==='light'));light.append(el('p','lamp-note',t('和大人一起用低温灯做实验；不要碰热灯，也不要直视太阳。','Try this with a grown-up and a cool lamp. Do not touch hot lamps or look directly at the Sun.')));
   const lamp=el('div','paper');lamp.append(el('h3','',t('小白球还完整吗？','Is the little ball still whole?')),el('p','',t('用下面的滑块换个观察位置。小灯保持不动，看看你能见到多少亮面。','Use the slider to change your viewing position. Keep the lamp still and see how much of the bright half is visible.')));
   const preview=el('div','earth-view');preview.append(moon(lampAngle));const range=el('input');range.type='range';range.min='0';range.max='360';range.value=String(lampAngle);range.id='lamp-angle';const label=el('label','',t('我绕着白球看','My view around the ball'));label.htmlFor=range.id;
   function updateLamp(){lampAngle=Number(range.value);preview.replaceChildren(moon(lampAngle));range.setAttribute('aria-valuetext',names[lang][MoonModel.state(lampAngle).index]);}range.oninput=updateLamp;updateLamp();const lampSteps=el('div','controls');lampSteps.id='lamp-steps';lampSteps.append(btn(t('← 换个位置','← Step back'),()=>{range.value=String((Number(range.value)+345)%360);updateLamp();}),btn(t('再换个位置 →','Step forward →'),()=>{range.value=String((Number(range.value)+15)%360);updateLamp();}));lamp.append(preview,label,range,lampSteps);light.append(lamp);
   const orbit=section(t('03 · 换个位置，看见什么？','03 · A different position, a different view'),'orbit');addScenes(orbit,story.scenes.filter(x=>x.act==='orbit'));lab(orbit);
   const cycle=section(t('04 · 把画排成一圈','04 · A circle of drawings'),'cycle');story.scenes.filter(x=>x.act==='cycle').forEach(s=>cycle.append(scene(s)));const circle=el('div','cycle');names[lang].forEach((name,i)=>{const b=btn('',()=>{angle=i*45;drawLab();$('orbit').scrollIntoView({block:'start'});});b.append(moon(i*45),el('span','',name));circle.append(b);});cycle.append(circle);
   const end=section(t('05 · 送给奶奶，也留给你','05 · For Grandma, and for you'),'ending');addScenes(end,story.scenes.filter(x=>x.act==='ending'));diary(end);
   const words=el('div','paper');words.append(el('h3','',t('画册里的小词语','Words from our album')));const row=el('div','vocab');story.vocab.forEach(v=>row.append(btn(`${v.zh} · ${v.en} ▶`,()=>speak(v,'vocab'))));words.append(row);end.append(words);
   const note=el('details','paper');note.append(el('summary','',t('给大人的观察笔记','Notes for grown-ups')),el('p','',t('太空图是从北极上方看的轨道投影，大小和距离未按比例，未模拟轨道倾角和月食。普通月相不是地球的影子；月食是另一种需要特别对齐的现象。地球观察窗采用北半球示意，北极朝上，真实月亮的倾斜、左右方向会随地点与时刻变化。日记不会计算当天的真实月相。','The space view is a projection from above the North Pole, not to scale. It does not model orbital tilt or eclipses. Ordinary Moon phases are not Earth’s shadow; a lunar eclipse requires special alignment. The Earth view uses a northern-hemisphere, north-up diagram orientation. The Moon’s apparent tilt and orientation vary with place and time. The diary does not calculate today’s phase.')),el('p','',t('新月的亮面背向地球，通常难以看见。没找到月亮也可能因为云、遮挡或它不在地平线上。根据当地天气和月出时间，在方便的白天或傍晚观察即可。家用实验请成人布置低温灯，把球稍举高，避免头部挡光，远离热灯与插线，不直视太阳。','At new moon, the sunlit side faces away from Earth and is usually not visible. Clouds, obstacles, or a Moon below the horizon can also explain a missed sighting. Choose convenient daytime or evening observations with local conditions in mind. An adult should set up a cool lamp. Hold the ball slightly higher to avoid blocking the light with your head. Keep away from hot bulbs and cords, and never look directly at the Sun.')));
   const source=el('a','',t('科学来源：NASA Moon Phases','Science source: NASA Moon Phases'));source.href='https://science.nasa.gov/moon/moon-phases/';note.append(source);end.append(note);
 }
 $('language').onclick=()=>{stop();lang=lang==='zh'?'en':'zh';render();};$('stop').onclick=stop;window.addEventListener('pagehide',stop);document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
 fetch('story.json').then(r=>{if(!r.ok)throw Error(r.status);return r.json();}).then(data=>{story=data;try{const saved=JSON.parse(localStorage.getItem(STORE)||'[]');if(Array.isArray(saved))entries=saved.filter(validDiaryEntry).slice(-500);}catch{}render();}).catch(()=>{$('loading').textContent='画册暂时无法打开，请通过本地预览服务重试。 / Could not open the album. Please use the local preview server.';});
 window.MoonBook={getState:()=>({lang,album,angle,audioVersion:AUDIO_VER,entryCount:entries.length}),setAngle:a=>{angle=MoonModel.state(a).angle;drawLab();},stop};
})();

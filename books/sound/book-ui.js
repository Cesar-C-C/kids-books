/* Book-local reading primitives; generated from the same content-task source. */
(() => {
'use strict';
const AUDIO_VER=1;
const $=id=>document.getElementById(id);
let lang='zh',player=null,token=0,timer=null,interrupt=()=>{},story;
const t=(zh,en)=>lang==='zh'?zh:en;
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
function btn(text,fn){const b=el('button','',text);b.type='button';b.onclick=fn;return b;}
function release(){if(player){player.onended=player.onerror=player.onplaying=null;player.pause();player.removeAttribute('src');player.load();player=null;}}
function stop(){token++;clearTimeout(timer);timer=null;release();window.speechSynthesis?.cancel();interrupt();$('audio-status').textContent='';}
function speak(item,kind='scene'){
 stop();const ticket=token;let failed=false;
 const fallback=()=>{if(ticket!==token||failed)return;failed=true;clearTimeout(timer);release();
 if(!window.speechSynthesis){$('audio-status').textContent=t('朗读暂不可用，请阅读文字。','Audio unavailable. Please read the text.');return;}
 $('audio-status').textContent=t('正在使用设备临时朗读。','Using the device voice for now.');
 const u=new SpeechSynthesisUtterance(item[lang]);u.lang=lang==='zh'?'zh-CN':'en-US';u.rate=.9;
 u.onend=()=>{if(ticket===token)$('audio-status').textContent='';};u.onerror=()=>{if(ticket===token)$('audio-status').textContent=t('设备朗读暂不可用。','Device speech is unavailable.');};speechSynthesis.speak(u);};
 player=new Audio('audio/'+kind+'-'+item.id+'-'+lang+'.mp3?v='+AUDIO_VER);player.onerror=fallback;player.onplaying=()=>{if(ticket===token)clearTimeout(timer);};player.onended=()=>{if(ticket===token){clearTimeout(timer);release();$('audio-status').textContent='';}};
 $('audio-status').textContent=t('正在朗读…','Reading…');timer=setTimeout(fallback,10000);player.play().catch(fallback);
}
function copy(item,continuation=false){const n=el('div',continuation?'continuation':'');n.dataset.sceneId=item.id;n.append(el('span','scene-count',String(story.scenes.indexOf(item)+1).padStart(2,'0')),el('p','',item[lang]),btn(t('▶ 听这一段','▶ Listen'),()=>speak(item)));return n;}
function scenes(parent,ids){let prior='',last;ids.forEach(id=>{const item=story.scenes.find(s=>s.id===id);if(item.image===prior){last.querySelector('.scene-copy').append(copy(item,true));return;}const card=el('article','scene'),art=el('div','art'),im=el('img');im.src='images/'+item.image+'.webp';im.alt=t('故事插画','Story illustration');im.loading='lazy';im.onerror=()=>{im.hidden=true;art.append(el('p','pending-art',t('插画正在制作','Illustration in progress')));};art.append(im);const text=el('div','scene-copy');text.append(copy(item));card.append(art,text);parent.append(card);last=card;prior=item.image;});}
function section(title,id){const s=el('section','chapter');s.id=id;s.append(el('h2','',title));$('book').append(s);return s;}
function begin(data,title,subtitle,links){story=data;const main=$('book');main.replaceChildren();document.documentElement.lang=lang==='zh'?'zh-CN':'en';document.title=story.title[lang];$('language').textContent=lang==='zh'?'English':'中文';main.append(el('p','eyebrow',title),el('h1','',story.title[lang]),el('p','subtitle',subtitle));const nav=el('nav','chapters');links.forEach(([id,text])=>{const a=el('a','',text);a.href='#'+id;a.onclick=stop;nav.append(a);});main.append(nav);}
function words(parent){const paper=el('div','paper');paper.append(el('h3','',t('故事里的小词语','Words from the story')));const row=el('div','vocab');story.vocab.forEach(v=>row.append(btn(v.zh+' · '+v.en+' ▶',()=>speak(v,'vocab'))));paper.append(row);parent.append(paper);}
function notes(parent,paragraphs,sources){const d=el('details','paper');d.append(el('summary','',t('给大人的阅读笔记','Reading notes for grown-ups')));paragraphs.forEach(p=>d.append(el('p','',p)));const ul=el('ul');sources.forEach(([name,url])=>{const li=el('li'),a=el('a','',name);a.href=url;li.append(a);ul.append(li);});d.append(ul);parent.append(d);}
function mount(render,onStop=()=>{}){interrupt=onStop;$('language').onclick=()=>{stop();lang=lang==='zh'?'en':'zh';render(story);};$('stop').onclick=stop;window.addEventListener('pagehide',stop);document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});fetch('story.json').then(r=>{if(!r.ok)throw Error(r.status);return r.json();}).then(data=>{story=data;render(data);}).catch(()=>{$('book').textContent=t('无法打开故事，请通过本地预览服务重试。','Could not open the story. Please use a local preview server.');});}
window.BookUI={$,t,el,btn,stop,speak,scenes,section,begin,words,notes,mount,get lang(){return lang;}};
})();

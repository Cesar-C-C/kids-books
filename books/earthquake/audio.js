(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.EarthquakeAudio=api;})(globalThis,()=>{
 'use strict';
 const norm=s=>s.normalize('NFC').replace(/\r\n/g,'\n');
 async function hash(value){const bytes=typeof value==='string'?new TextEncoder().encode(value):value;return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');}
 async function validate(manifest,raw){
  const valid=new Map();try{
   const source=JSON.parse(raw),version=source.scriptVersion,digest=await hash(norm(raw));
   if(!source.frozen||source.bookId!=='earthquake'||manifest?.schemaVersion!==2||manifest.owner!=='book'||manifest.topicId!=='earthquake'||manifest.bookId!=='earthquake'||manifest.contentVersion!==version||manifest.scriptVersion!==version||manifest.sourceSha256!==digest||manifest.scriptSha256!==digest||!Array.isArray(manifest.entries))return valid;
   const counts=new Map();for(const e of manifest.entries)counts.set(e.key,(counts.get(e.key)||0)+1);
   for(const [kind,items]of [['scene',source.scenes],['vocab',source.vocab],['interaction',source.interactions]])for(const item of items){if(!item.narrationNeeded)continue;for(const lang of ['zh','en']){
    const k=kind==='interaction'?item.kind:kind,id=`${k}-${item.id}-${lang}`,key='book:'+id,e=manifest.entries.find(x=>x.key===key),text=norm(item[lang]);
    const segments=(item.segments?.[lang]||[{role:'narrator',sourceText:text}]).map(s=>({role:s.role,sourceText:norm(s.sourceText),spokenText:norm(s.spokenText??s.sourceText)}));
    const utterance={kind:k,id:item.id,lang,text,segments};
    if(counts.get(key)!==1||!e||e.status!=='ready'||e.owner!=='book'||e.id!==id||e.itemId!==item.id||e.kind!==k||e.lang!==lang||e.contentVersion!==(item.contentVersion??version)||e.text!==text||e.output!==`audio/${id}.mp3`||!/^\w[\w-]*$/.test(id)||! /^[a-f0-9]{64}$/.test(e.fileSha256||''))continue;
    if(e.textSha256!==await hash(text)||e.utteranceSha256!==await hash(JSON.stringify(utterance))||JSON.stringify(e.segments.map(({role,sourceText,spokenText})=>({role,sourceText,spokenText})))!==JSON.stringify(segments))continue;
    valid.set(key,{...e,version});
   }}
  }catch{return new Map();}return valid;
 }
 function createNarrator({manifest,sourceRaw,session,onStatus=()=>{},fetcher=(...args)=>fetch(...args),makeAudio=()=>new Audio()}){
  let entries=new Map(),active=null;
  function stop(){if(active)active.finish('stopped');}
  const ready=validate(manifest,sourceRaw).then(map=>{entries=map;});
  session.onCancel(stop);
  const available=(kind,id,lang)=>entries.has(`book:${kind}-${id}-${lang}`);
  function play(kind,id,lang){
   session.cancel('narration');const key=`book:${kind}-${id}-${lang}`,entry=entries.get(key);
   if(!entry){onStatus({state:'unavailable',key});return Promise.resolve();}
   return new Promise(resolve=>{
    const controller=new AbortController();let audio=null,url=null,done=false,timer;
    const token={finish(state){if(done)return;done=true;clearTimeout(timer);controller.abort();if(audio){audio.onended=audio.onerror=null;audio.pause();audio.removeAttribute('src');audio.load();}if(url)URL.revokeObjectURL(url);if(active===token)active=null;onStatus({state,key});resolve();}};
    active=token;onStatus({state:'loading',key});timer=setTimeout(()=>token.finish('unavailable'),20000);
    (async()=>{try{
     const response=await fetcher(entry.output+'?v='+encodeURIComponent(entry.version),{signal:controller.signal});if(!response.ok)throw Error('missing');const bytes=await response.arrayBuffer();if(done)return;if(await hash(bytes)!==entry.fileSha256)throw Error('corrupt');if(done)return;
     url=URL.createObjectURL(new Blob([bytes],{type:'audio/mpeg'}));audio=makeAudio();audio.src=url;audio.onended=()=>token.finish('ended');audio.onerror=()=>token.finish('unavailable');await audio.play();if(done){audio.pause();return;}clearTimeout(timer);onStatus({state:'playing',key});
    }catch{if(!done)token.finish('unavailable');}})();
   });
  }
  return {ready,available,play,stop};
 }
 return {createNarrator};
});

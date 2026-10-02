window.EarthquakeUI=(()=>{
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 const button=(text,fn,id)=>{const b=el('button','',text);b.type='button';b.onclick=fn;if(id)b.id=id;return b;};
 function svg(label){const n=document.createElementNS('http://www.w3.org/2000/svg','svg');n.setAttribute('viewBox','0 0 560 260');n.setAttribute('role','img');n.setAttribute('aria-label',label);return n;}
 function shape(parent,tag,attrs,text){const n=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);if(text)n.textContent=text;parent.append(n);return n;}
 function createSession(){let epoch=0;const timers=new Set(),listeners=new Set();return {get epoch(){return epoch;},cancel(reason){epoch++;timers.forEach(clearTimeout);timers.clear();listeners.forEach(fn=>fn(reason));},schedule(fn,ms){const e=epoch;const id=setTimeout(()=>{timers.delete(id);if(e===epoch)fn();},ms);timers.add(id);return id;},onCancel(fn){listeners.add(fn);return ()=>listeners.delete(fn);}};}
 function narratedText(node,text,kind,id,lang){
  if(!node.querySelector('.listen')){node.replaceChildren(el('span','spoken-text'),button('',()=>{},undefined));node.lastChild.className='listen';}
  node.firstChild.textContent=text;const b=node.lastChild;b.dataset.kind=kind;b.dataset.itemId=id;
  b.textContent=lang==='en'?'Listen':'听这句';b.setAttribute('aria-label',(lang==='en'?'Listen: ':'朗读：')+text);
  b.disabled=!window.EarthquakeUI.audioAvailable?.(kind,id,lang);
 }
 return {el,button,svg,shape,createSession,narratedText};
})();

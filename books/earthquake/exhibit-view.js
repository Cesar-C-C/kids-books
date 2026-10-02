'use strict';
window.mountExhibit = function (container, {content, lang, session}) {
 const {el} = EarthquakeUI, t=(zh,en)=>lang()==='en'?en:zh;
 const heading=el('h2'), chain=el('ol','cause-chain'), result=el('p','result');
 const stages=[
  {id:'strain', title:['接缝锁住，周围形变储能','Locked fault, deformed rock, stored energy'],
   question:'why-locking', scene:'stuck', link:'#fault-lab'},
  {id:'slip', title:['断层滑动，周围部分回弹','Fault slip and partial rebound'],
   question:'why-rebound', scene:'slip', link:'#fault-lab'},
  {id:'waves', title:['波传到这里，地面振动','Waves arrive and the ground moves'],
   question:'why-wave', scene:'surface-shakes', link:'#wave-lab'}
 ];
 result.setAttribute('role','status'); container.append(heading,chain,result);
 function render() {
  heading.textContent=t('岩岩的展览：把原因连起来','Yan-Yan’s display: connect the causes');
  chain.replaceChildren();
  for (const [i,s] of stages.entries()) {
   const li=el('li','cause-step'), label=el('span','cause-number',String(i+1));
   li.dataset.cause=s.id;
   li.append(label,el('h3','',t(...s.title)));
   const evidence=content.scenes.find(x=>x.id===s.scene), p=el('p','cause-evidence');
   EarthquakeUI.narratedText(p,evidence[lang()],'scene',evidence.id,lang()); li.append(p);
   const details=el('details','cause-why'), question=content.why.find(x=>x.id===s.question);
   const explanation=content.scenes.find(x=>x.id===s.question), answer=el('p');
   EarthquakeUI.narratedText(answer,explanation[lang()],'scene',explanation.id,lang());
   details.append(el('summary','',question[lang()]),answer); li.append(details);
   const link=el('a','evidence-link',t('回到这项观察 →','Return to this observation →'));
   link.href=s.link; link.onclick=()=>session.cancel('exhibit-evidence'); li.append(link);
   chain.append(li);
  }
  const complete=content.interactions.find(x=>x.id==='exhibit-complete');
  EarthquakeUI.narratedText(result,complete[lang()],complete.kind,complete.id,lang());
 }
 render();
 return {render,cancel:()=>session.cancel('exhibit'),destroy:()=>{},
  snapshot:()=>({order:[...content.exhibitOrder],mode:'causal-display',gated:false})};
};

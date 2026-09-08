/* Keep whole-aircraft context while mounting detailed regions in this document. */
(() => {
  'use strict';
  const overview=document.getElementById('aircraft-overview'),host=document.getElementById('engine-depth');
  const loading=document.getElementById('discovery-loading'),error=document.getElementById('discovery-error');
  let mode='airplane',wanted=false,version=0,instance=null,mounting=null,saved=null,returnFocus=null,returnScroll=0;
  const entry=document.createElement('button');entry.id='selected-engine-entry';entry.className='primary';entry.dataset.enterEngine='';entry.textContent='打开这个发动机 →';entry.hidden=true;entry.style.marginTop='15px';document.querySelector('.lesson').append(entry);
  const loadedScripts=new Map();
  function script(path){
    if(loadedScripts.has(path))return loadedScripts.get(path);
    const promise=new Promise((resolve,reject)=>{const node=document.createElement('script');node.src=path;node.onload=resolve;node.onerror=()=>{node.remove();loadedScripts.delete(path);reject(new Error('Cannot load '+path));};document.body.append(node);});loadedScripts.set(path,promise);return promise;
  }
  async function mount(){
    if(instance)return instance;if(mounting)return mounting;
    mounting=(async()=>{
      const response=await fetch('engine/index.html');if(!response.ok)throw new Error('Engine template unavailable');
      const template=new DOMParser().parseFromString(await response.text(),'text/html');
      const root=host.shadowRoot||host.attachShadow({mode:'open'});root.replaceChildren();
      const base=new URL('engine/index.html',location.href);
      const cssReady=[...template.querySelectorAll('link[rel="stylesheet"]')].map(link=>new Promise((resolve,reject)=>{const css=document.createElement('link');css.rel='stylesheet';css.href=new URL(link.getAttribute('href'),base).href;css.onload=resolve;css.onerror=()=>reject(new Error('Engine styles unavailable'));root.append(css);}));
      const surface=document.createElement('div');surface.className='engine-surface';
      for(const node of [...template.body.children])if(node.tagName!=='SCRIPT')surface.append(document.importNode(node,true));root.append(surface);
      surface.querySelectorAll('a[href]').forEach(a=>{
        const href=a.getAttribute('href');
        if(href.startsWith('#')){a.addEventListener('click',e=>{e.preventDefault();root.getElementById(href.slice(1))?.scrollIntoView({block:'start'});});return;}
        const url=new URL(href,base);a.href=url.href;
        if(!a.closest('.topbar')&&url.pathname===new URL('index.html',location.href).pathname){a.dataset.returnAirplane=url.searchParams.get('part')==='wings'?'wings':'engines';}
      });
      surface.querySelector('.discovery-intro h1').innerHTML='机翼下的发动机，<span>还藏着哪些秘密？</span>';
      surface.querySelector('.discovery-intro p:last-child').textContent='你仍在这架飞机里。打开外壳，沿着空气继续向里面探索。';
      const context=document.createElement('button');context.className='aircraft-context';context.dataset.returnAirplane='engines';context.innerHTML='<img src="'+new URL('preview.png',location.href).href+'" alt="返回刚才的整架飞机"><span>✈ 整架飞机<small>正在探索：机翼下的发动机</small><b>返回上一层 ↑</b></span>';
      surface.querySelector('.breadcrumbs').after(context);
      const styles=document.createElement('style');styles.textContent=':host{display:block;color:#233f3b;font-family:LocalRound,"Segoe UI","Microsoft YaHei",sans-serif;font-size:14px}.engine-surface{background:#f7f8f2}.engine-surface>.topbar{display:none}.discovery{padding-top:18px}.aircraft-context{display:flex;align-items:center;gap:12px;margin-top:14px;background:#edf2e5;border:1px solid #d9e3d0;border-radius:14px;padding:7px 15px;text-align:left}.aircraft-context img{width:100px;height:62px;object-fit:cover;border-radius:9px}.aircraft-context span{font-size:13px}.aircraft-context small,.aircraft-context b{display:block;font-size:10px;margin-top:5px;color:#5d7a66}.engine-surface.english-only .translation,.engine-surface.english-only .chinese-name{display:none}.discovery-intro{margin:18px 0}.discovery footer{margin-bottom:0}@media(max-width:780px){.aircraft-context{width:100%}.discovery-intro h1{font-size:24px}}';root.append(styles);
      await Promise.all(cssReady);
      await script('../shared/discovery-progress.js');await script('engine/content.js');await script('engine/model.js');await script('engine/app.js?v=inline-20260909');
      instance=window.EngineDiscovery.mount(root,{active:false,onExit:part=>leave(part)});
      return instance;
    })().catch(e=>{mounting=null;throw e;});return mounting;
  }
  async function enter(push=true){
    if(wanted)return;wanted=true;const token=++version;
    saved=window.airplaneLab?.capture();returnFocus=document.activeElement;returnScroll=window.scrollY;
    mode='loading';loading.hidden=false;error.hidden=true;window.airplaneLab?.approachEngine();
    try{
      const [detail]=await Promise.all([mount(),new Promise(resolve=>setTimeout(resolve,matchMedia('(prefers-reduced-motion: reduce)').matches?0:420))]);
      if(!wanted||token!==version)return;
      if(push&&location.hash!=='#engine')history.pushState({airplaneDepth:'engine'},'',location.pathname+location.search+'#engine');
      overview.hidden=true;host.hidden=false;window.airplaneLab?.setActive(false);detail.setLanguage(document.body.classList.contains('english-only'));detail.setActive(true);host.classList.remove('depth-enter');void host.offsetWidth;host.classList.add('depth-enter');mode='engine';loading.hidden=true;host.scrollIntoView({block:'start'});host.shadowRoot.querySelector('[data-return-airplane]')?.focus({preventScroll:true});
    }catch(e){if(token!==version)return;console.error('Inline engine:',e);wanted=false;mode='airplane';loading.hidden=true;error.hidden=false;if(saved)window.airplaneLab?.restore(saved);if(location.hash==='#engine')history.replaceState(null,'',location.pathname+location.search);}
  }
  function leave(part='engines',updateHistory=true){
    if(!wanted&&mode==='airplane')return;wanted=false;++version;instance?.setActive(false);host.hidden=true;overview.hidden=false;loading.hidden=true;error.hidden=true;if(saved)window.airplaneLab?.restore(saved);window.airplaneLab?.setActive(true);if(part==='wings')window.airplaneLab?.select('wings');mode='airplane';
    if(updateHistory&&location.hash==='#engine'){if(history.state?.airplaneDepth==='engine')history.back();else history.replaceState(null,'',location.pathname+location.search);}
    window.scrollTo({top:returnScroll,behavior:'instant'});
    const focus=returnFocus?.isConnected&&!returnFocus.closest('[hidden]')&&returnFocus.matches('button,a,input,[tabindex]')?returnFocus:overview.querySelector('[data-enter-engine]');
    focus?.focus({preventScroll:true});
  }
  document.querySelectorAll('[data-enter-engine]').forEach(b=>b.addEventListener('click',()=>enter()));
  window.addEventListener('airplane:enter-engine',()=>enter());document.getElementById('cancel-discovery').addEventListener('click',()=>leave());
  document.getElementById('language').addEventListener('click',()=>instance?.setLanguage(document.body.classList.contains('english-only')));
  const route=()=>{if(location.hash==='#engine')enter(false);else leave('engines',false);};window.addEventListener('popstate',route);window.addEventListener('hashchange',route);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&mode==='engine'&&!host.shadowRoot.querySelector('dialog[open]')){e.preventDefault();leave();}});
  window.airplaneDiscovery={get mode(){return mode;},enter,leave};
  if(location.hash==='#engine')enter(false);
})();

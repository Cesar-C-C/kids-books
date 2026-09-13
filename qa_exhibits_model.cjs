const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const ctx={window:{},console};vm.createContext(ctx);vm.runInContext(fs.readFileSync('labs/shared/vendor/three.min.js','utf8'),ctx);const T=ctx.THREE;
vm.runInContext(fs.readFileSync('labs/shared/exhibit.js','utf8'),ctx);
for(const [id,api]of[['airplane','AirframeV3'],['rocket','RocketV3'],['schoolbus','SchoolBusV3'],['doubledecker','DoubleDeckerV3'],['station','StationV3']]){
 const file=id==='airplane'?'airframe':id+'frame';vm.runInContext(fs.readFileSync(`labs/${id}/v3/${file}.js`,'utf8'),ctx);
 const model=ctx.window[api].create(T),assemblies=model.assemblies;
 if(id==='airplane'){vm.runInContext(fs.readFileSync('labs/airplane/v3/engine.js','utf8'),ctx);for(const side of[-1,1]){const a=ctx.window.EngineV3.create(T,{id:side>0?'engine-right':'engine-left',side});a.group.position.set(-.65,-1,side*2.65);model.root.add(a.group);assemblies.push(a);}}
 const originals=new Map(),surfaces=[],base=new Map();model.root.updateMatrixWorld(true);
 for(const a of assemblies){base.set(a,a.group.position.clone());for(const layer of['exterior','interior','ghost'])a[layer].traverse(o=>{if(!o.material)return;const ms=[].concat(o.material).map(m=>m.clone());o.material=Array.isArray(o.material)?ms:ms[0];ms.forEach(m=>originals.set(m,{opacity:m.opacity,transparent:m.transparent,depthWrite:m.depthWrite}));surfaces.push({object:o,materials:ms,assembly:a,layer,shadow:o.castShadow});});}
 const exhibit=ctx.window.LabExhibit.create(id,T);const frame=a=>{for(const x of assemblies)x.group.position.copy(base.get(x));exhibit.step(1,assemblies,surfaces,originals,0,a);model.root.updateMatrixWorld(true);};
 frame(null);const initial=new Map();model.root.traverse(o=>initial.set(o,o.position.clone()));
 for(const a of assemblies){exhibit.select(a);exhibit.open(a);frame(a);assert.ok(exhibit.opened);assert.ok(a.interior.visible);
  for(const s of surfaces)for(const m of s.materials)assert.equal(m.opacity,originals.get(m).opacity,'opening preserves opacity');
  if(id==='rocket'&&a.id==='satellite'){const fairing=assemblies.find(x=>x.id==='fairing');assert.ok(fairing.group.position.distanceTo(base.get(fairing))>2,'liner moves with payload cover');}
  if(id==='rocket'&&a.id==='upperstage')assert.ok(exhibit.opened.cut.includes('interstage'),'upper nozzle needs adjacent interstage opening');
  if(id==='doubledecker'&&a.id==='cab'){const dash=a.exterior.getObjectByName('cab.dash');assert.ok(dash.position.equals(initial.get(dash)),'dashboard stays installed');}
  exhibit.close();frame(a);assert.equal(exhibit.amount,0);model.root.traverse(o=>assert.ok(o.position.distanceTo(initial.get(o))<1e-8,`${id}/${a.id}/${o.name}: close restores object position`));
  for(const s of surfaces)for(const m of s.materials)assert.equal(m.clippingPlanes,null);
 }
 console.log(`PASS ${id}: all openings preserve opacity, clear covers and restore every object position.`);
}

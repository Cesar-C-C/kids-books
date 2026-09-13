const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert/strict');
const context={window:{},console};vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'labs/shared/vendor/three.min.js'),'utf8'),context);const T=context.THREE;
for(const file of ['airframe','engine'])vm.runInContext(fs.readFileSync(path.join(__dirname,`labs/airplane/v3/${file}.js`),'utf8'),context);
const plane=context.window.AirframeV3.create(T),initial=[];
for(const side of [-1,1]){const a=context.window.EngineV3.create(T,{id:'engine-'+side,side});a.group.position.set(-.65,-1,side*2.65);plane.root.add(a.group);plane.assemblies.push(a);}
assert.equal(plane.assemblies.length,15);assert.equal(new Set(plane.assemblies.map(a=>a.id)).size,15);
const ids=new Set();let ghostMeshes=0,meshes=0;
for(const a of plane.assemblies){assert.equal(a.group.parent,plane.root);for(const k of ['exterior','interior','ghost'])assert.equal(a[k].parent,a.group);assert.equal(a.interior.visible,false);assert.equal(a.ghost.visible,false);for(const id of Object.keys(a.details))ids.add(id);a.ghost.traverse(o=>{if(o.isMesh){ghostMeshes++;assert.ok(o.material.opacity<.2);assert.equal(o.material.depthWrite,false);}});a.group.traverse(o=>{if(o.isMesh){meshes++;const p=o.geometry.attributes.position;for(let i=0;i<p.array.length;i++)assert.ok(Number.isFinite(p.array[i]));}initial.push({o,p:o.position.clone(),q:o.quaternion.clone()});});}
for(const region of ['cabin.frames','cabin.floor','cabin.seats','cabin.cargo','cockpit.panel','wing.ribs','wing.flap','gear.brake','engine.fan','engine.compressor','engine.combustor','engine.turbine','engine.shaft'])assert.ok(ids.has(region),region);
assert.ok(ghostMeshes<=20,'Context must use simple silhouettes, not every internal mesh');assert.ok(meshes<750,'Detailed aircraft stays within a 750-mesh budget');
plane.update({time:1,mechanism:1,region:'wings'});assert.ok(initial.some(s=>s.q.angleTo(s.o.quaternion)>.01));plane.update({time:0,mechanism:0});for(const s of initial){assert.ok(s.p.distanceTo(s.o.position)<1e-8);assert.ok(s.q.angleTo(s.o.quaternion)<1e-7);}
const b=new T.Box3().setFromObject(plane.root),size=b.getSize(new T.Vector3());assert.ok(size.x>11&&size.x<13&&size.z>13&&size.z<14);
console.log(`PASS v3: fresh airframe, 15 attached assemblies, ${meshes} meshes, ${ghostMeshes} silhouette meshes, finite geometry, structural details and reversible hinges.`);

vm.runInContext(fs.readFileSync(path.join(__dirname,'labs/airplane/v3/inspection.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'labs/airplane/detail-parts.js'),'utf8'),context);
for(const d of context.window.AIRPLANE_DETAILS)assert.ok(plane.assemblies.some(a=>a.region===d.region&&a.details[d.id]),'Every discovery maps to geometry: '+d.id);
for(const a of plane.assemblies)assert.ok(context.window.AIRPLANE_DETAILS.some(d=>d.region===a.region),'Every aircraft part offers deeper exploration');
const elev=plane.assemblies.filter(a=>a.region==='elevators').map(a=>a.details['elevator.hinge'].children[0]);
plane.update({region:'elevators',mechanism:true,level:.25});const turns=elev.map(g=>new T.Vector3(1,0,0).applyQuaternion(g.quaternion).y);assert.ok(turns[0]*turns[1]>0,'Elevators deflect together');
const ail=plane.assemblies.filter(a=>a.region==='ailerons').map(a=>a.details['aileron.hinge'].children[0]);plane.update({region:'ailerons',mechanism:true,level:.25});assert.ok(new T.Vector3(1,0,0).applyQuaternion(ail[0].quaternion).y*new T.Vector3(1,0,0).applyQuaternion(ail[1].quaternion).y<0,'Ailerons deflect oppositely');
for(const id of ['wing.flap','wing.spoiler']){plane.update({region:'wings',detail:id,mechanism:true,level:1});for(const a of plane.assemblies.filter(a=>a.region==='wings')){const h=a.details[id].children[0],dy=new T.Vector3(1,0,0).applyQuaternion(h.quaternion).y;assert.ok(id==='wing.flap'?dy<0:dy>0,id+' deploys out of the fixed wing');for(const other of ['wing.flap','wing.slat','wing.spoiler'].filter(x=>x!==id))assert.ok(a.details[other].children[0].quaternion.angleTo(new T.Quaternion())<1e-7,'Only selected mechanism moves');}}
plane.update({mechanism:false});
const gear=plane.assemblies.find(a=>a.region==='gear'),wheel=gear.details['gear.wheel'].children.find(g=>g.name==='Main wheel'&&g.position.z>1.2),before=wheel.position.clone();
context.window.AirplaneInspection.apply(T,gear,'gear.brake',true,plane.assemblies,[]);assert.ok(wheel.position.distanceTo(before)>.8);
context.window.AirplaneInspection.apply(T,null,null,false,plane.assemblies,[]);assert.ok(wheel.position.distanceTo(before)<1e-8,'Brake opening restores wheel installation');
console.log('PASS aircraft inspection: 30 geometry-backed discoveries, independent correctly directed controls, reversible wheel removal.');

plane.root.updateMatrixWorld(true);
const sections=[[.67,-2.05,3.02,-.33,.22],[1.3,-1.72,2.86,-.29,.20],[2,-1.25,2.50,-.23,.17],[4,.03,1.88,-.04,.105],[6.4,1.58,.93,.16,.045]];
let worst=0;
for(const a of plane.assemblies.filter(a=>a.region==='wings'))a.interior.traverse(o=>{if(!o.isMesh)return;const ps=o.geometry.attributes.position;for(let i=0;i<ps.count;i++){const p=o.localToWorld(new T.Vector3().fromBufferAttribute(ps,i)),z=Math.abs(p.z);if(z<.8||z>6.35)continue;let k=0;while(k<sections.length-2&&z>sections[k+1][0])k++;const u=(z-sections[k][0])/(sections[k+1][0]-sections[k][0]),v=sections[k].map((n,j)=>n+(sections[k+1][j]-n)*u),c=(p.x-v[1])/v[2];if(c<0||c>1){worst=Math.max(worst,.1);continue;}const h=5*v[4]*(.2969*Math.sqrt(c)-.126*c-.3516*c*c+.2843*c*c*c-.1015*c*c*c*c),cam=.018*v[2]*Math.sin(Math.PI*c);worst=Math.max(worst,Math.abs(p.y-v[3]-cam)-h);}});
assert.ok(worst<.001,'Wing ribs and spar flanges stay inside the airfoil envelope');console.log('PASS wing structural envelope: ribs and tapered beam flanges stay beneath the skin.');

const linkage=plane.assemblies.find(a=>a.region==='ailerons').details['aileron.linkage'].children.find(o=>o.isGroup),rest=linkage.position.clone();plane.update({region:'ailerons',detail:'aileron.hinge',mechanism:true,level:.25});assert.ok(linkage.position.distanceTo(rest)>.005,'Control linkage follows the moving aileron');plane.update({mechanism:false});assert.ok(linkage.position.distanceTo(rest)<1e-8);

const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert/strict');
const context={window:{},console};vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'labs/shared/vendor/three.min.js'),'utf8'),context);const T=context.THREE;
for(const file of ['airframe','engine'])vm.runInContext(fs.readFileSync(path.join(__dirname,`labs/airplane/v3/${file}.js`),'utf8'),context);
const plane=context.window.AirframeV3.create(T),initial=[];
for(const side of [-1,1]){const a=context.window.EngineV3.create(T,{id:'engine-'+side,side});a.group.position.set(-.65,-1,side*2.65);plane.root.add(a.group);plane.assemblies.push(a);}
assert.equal(plane.assemblies.length,15);assert.equal(new Set(plane.assemblies.map(a=>a.id)).size,15);
const ids=new Set();let ghostMeshes=0,meshes=0;
for(const a of plane.assemblies){assert.equal(a.group.parent,plane.root);for(const k of ['exterior','interior','ghost'])assert.equal(a[k].parent,a.group);assert.equal(a.interior.visible,false);assert.equal(a.ghost.visible,false);for(const id of Object.keys(a.details))ids.add(id);a.ghost.traverse(o=>{if(o.isMesh){ghostMeshes++;assert.ok(o.material.opacity<.2);assert.equal(o.material.depthWrite,false);}});a.group.traverse(o=>{if(o.isMesh){meshes++;const p=o.geometry.attributes.position;for(let i=0;i<p.array.length;i++)assert.ok(Number.isFinite(p.array[i]));}initial.push({o,p:o.position.clone(),q:o.quaternion.clone()});});}
for(const region of ['cabin.frames','cabin.floor','cabin.seats','cabin.cargo','cockpit.panel','wing.ribs','wing.flap','gear.brake','engine.fan','engine.compressor','engine.combustor','engine.turbine','engine.shaft'])assert.ok(ids.has(region),region);
assert.ok(ghostMeshes<=20,'Context must use simple silhouettes, not every internal mesh');assert.ok(meshes<600);
plane.update({time:1,mechanism:1,region:'wings'});assert.ok(initial.some(s=>s.q.angleTo(s.o.quaternion)>.01));plane.update({time:0,mechanism:0});for(const s of initial){assert.ok(s.p.distanceTo(s.o.position)<1e-8);assert.ok(s.q.angleTo(s.o.quaternion)<1e-7);}
const b=new T.Box3().setFromObject(plane.root),size=b.getSize(new T.Vector3());assert.ok(size.x>11&&size.x<13&&size.z>13&&size.z<14);
console.log(`PASS v3: fresh airframe, 15 attached assemblies, ${meshes} meshes, ${ghostMeshes} silhouette meshes, finite geometry, structural details and reversible hinges.`);

const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert/strict');
const T=require('./labs/shared/vendor/three.min.js');
const context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'labs/airplane/engine/model.js'),'utf8'),context);
const detailFile=path.join(__dirname,'labs/airplane/details-model.js');
if(fs.existsSync(detailFile))vm.runInNewContext(fs.readFileSync(detailFile,'utf8'),context);
assert.equal(typeof context.window.AirplaneDetails?.install,'function','Original airframe must accept attached internal details');

// Execute the actual original aircraft construction with real Three.js helpers.
// This catches mismatched attachment coordinates when the main airframe changes.
const model=new T.Group(),nodes=[],pickables=[];
const colors={cream:'#faf3da',wing:'#419d91',dark:'#244858',gold:'#e5b646',orange:'#e68057',rubber:'#354850'};
const mat=(color,options={})=>new T.MeshStandardMaterial({color,...options});
function addPart(id,position,offset,anchor){const group=new T.Group();group.position.set(...position);group.userData.part=id;model.add(group);nodes.push({id,group,base:group.position.clone(),offset:new T.Vector3(...offset),anchor:new T.Vector3(...anchor)});return group;}
function mesh(group,geo,material,position=[0,0,0]){const m=new T.Mesh(geo,material.clone());m.position.set(...position);m.userData.part=group.userData.part;group.add(m);pickables.push(m);return m;}
function sphere(g,p,s,c){const m=mesh(g,new T.SphereGeometry(1,36,24),mat(c),p);m.scale.set(...s);return m;}
function box(g,p,s,c){return mesh(g,new T.BoxGeometry(...s),mat(c),p);}
function panel(g,points,depth,c,plane='xz'){const s=new T.Shape();points.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();const geo=new T.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSize:.035,bevelThickness:.025,bevelSegments:2,steps:1});geo.translate(0,0,-depth/2);if(plane==='xz')geo.rotateX(Math.PI/2);return mesh(g,geo,mat(c));}
const source=fs.readFileSync(path.join(__dirname,'labs/airplane/app.js'),'utf8');
const begin=source.indexOf('// The airplane points toward -X.');
const end=source.indexOf('// A quiet circular display plinth',begin);
assert.ok(begin>=0&&end>begin,'Cannot locate original airframe construction fixture');
vm.runInNewContext(source.slice(begin,end),{T,colors,mat,mesh,sphere,box,panel,addPart});
const originalGroups=nodes.map(n=>n.group),beforeBounds=new T.Box3().setFromObject(model);
const engines=nodes.filter(n=>n.id==='engines');
const oldNacelles=engines.map(n=>n.group.children.find(m=>m.geometry?.type==='LatheGeometry'));
let disposed=0;oldNacelles.forEach(m=>m.geometry.addEventListener('dispose',()=>disposed++));
const details=context.window.AirplaneDetails.install({THREE:T,model,nodes,pickables});
const ids=['engine.inlet','engine.fan','engine.bypass','engine.compressor','engine.combustor','engine.turbine','engine.shaft','engine.nozzle','cabin.frames','cabin.floor','cabin.seats','cabin.cargo','cockpit.seats','cockpit.panel','cockpit.controls','wing.spar','wing.ribs','wing.flap','wing.slat','wing.spoiler','gear.strut','gear.wheel','gear.brake','gear.bay'];
assert.deepEqual([...details.ids].sort(),ids.slice().sort());
assert.equal(disposed,2,'Replaced engine geometry must be disposed');
assert.ok(oldNacelles.every(m=>!m.parent&&!pickables.includes(m)),'Removed nacelles cannot remain in scene or raycasting');
assert.ok(originalGroups.every(g=>g.parent===model),'Details must keep original airplane part roots');
for(const id of ids){
  const meshes=pickables.filter(m=>m.userData.detail===id);
  assert.ok(meshes.length>0,`${id} needs real pickable geometry`);
  for(const m of meshes){assert.ok(Array.from(m.geometry.attributes.position.array).every(Number.isFinite));let p=m;while(p.parent&&p!==model)p=p.parent;assert.equal(p,model,`${id} detached from original airframe`);}
  const a=details.anchor(id,new T.Vector3(-3,3,10));assert.ok(a?.isVector3&&a.toArray().every(Number.isFinite),`${id} anchor must exist`);
}
assert.equal(pickables.filter(m=>m.name==='passenger-seat-cushion').length,16,'Four rows of four cabin seats');
assert.equal(engines.filter(n=>n.group.getObjectByName('turbofan')).length,2,'Both wing engines must be enriched');
assert.ok(pickables.filter(m=>m.userData.detail?.startsWith('engine.')).every(m=>m.userData.part==='engines'));
for(const n of nodes.filter(n=>n.id==='gear'&&n.base.x< -1))n.group.traverse(m=>assert.notEqual(m.userData.detail,'gear.brake','Nose wheels do not have main-wheel brakes'));
const state={time:0,cutaway:0,region:'fuselage',mechanism:0,selected:null};
const update=patch=>{details.update({...state,...patch});model.updateMatrixWorld(true);};
function snap(){const values=[];model.traverse(o=>{values.push(...o.position.toArray(),...o.quaternion.toArray(),o.visible);if(o.isMesh)values.push(o.material.opacity,o.material.emissive?.getHex());});return values;}
update({});const initial=snap();
const wingSkin=nodes.find(n=>n.id==='wings').group.children.find(m=>m.isMesh&&!m.userData.detail);
update({cutaway:1});assert.equal(wingSkin.material.opacity,1,'Cabin reveal must leave wing surroundings opaque');
const fuselageSkin=pickables.filter(m=>m.userData.part==='fuselage'&&!m.userData.detail);
assert.ok(fuselageSkin.some(m=>m.material.opacity<.2),'Cabin skin must reveal internals');
update({region:'wings',cutaway:1,mechanism:.7});assert.ok(wingSkin.material.opacity<.2,'Wing reveal must expose spar and ribs');
const flap=pickables.find(m=>m.userData.detail==='wing.flap');
assert.ok(flap.parent.quaternion.angleTo(new T.Quaternion())>.1,'Flap must actually articulate on its hinge');
const pivot=flap.parent.position.clone();update({region:'wings',mechanism:.2});assert.ok(flap.parent.position.equals(pivot),'Hinge attachment cannot float during articulation');
for(const region of ['ailerons','elevators','rudder']){update({region,mechanism:.8});const n=nodes.find(n=>n.id===region);assert.ok(n.group.children.some(g=>g.isGroup&&g.quaternion.angleTo(new T.Quaternion())>.1),`${region} must turn about a hinge`);}
update({region:'engines',cutaway:1,mechanism:1,time:1});
for(const n of engines){const hood=n.group.getObjectByName('opening-nacelle');assert.ok(hood.position.length()<1e-8,'Engine reveal must not lift shell into wing');}
const positive=details.anchor('engine.fan',new T.Vector3(0,0,12)),negative=details.anchor('engine.fan',new T.Vector3(0,0,-12));
assert.ok(positive.z>1&&negative.z< -1,'Nearest actual engine anchor must follow viewing side');
const positiveNode=engines.find(n=>n.group.position.z>0);positiveNode.group.position.y+=1;model.updateMatrixWorld(true);
const shifted=details.anchor('engine.fan',new T.Vector3(0,0,12));assert.ok(Math.abs(shifted.y-positive.y-1)<1e-7,'Anchors must follow their attached original part');positiveNode.group.position.y-=1;
update({});assert.deepEqual(snap(),initial,'Cutaway, selection and every mechanism must reset reversibly');
const beforeGhostVersion=wingSkin.material.version;
update({region:'engines',selected:'engine.fan',focus:1,focusPosition:new T.Vector3(-1,-.5,2)});
assert.ok(wingSkin.material.version>beforeGhostVersion,'Ghost transition must refresh the opaque GPU shader');
const ghostVersion=wingSkin.material.version;
update({region:'engines',selected:'engine.fan',focus:1,focusPosition:new T.Vector3(-1,-.5,2)});
assert.equal(wingSkin.material.version,ghostVersion,'Stable focus must not recompile shaders every frame');
assert.ok(wingSkin.material.opacity<.15,'Nearby observation must ghost unrelated wings');
const focusedFan=pickables.find(m=>m.userData.detail==='engine.fan'&&m.getWorldPosition(new T.Vector3()).z>0);
assert.ok(focusedFan.material.opacity>.9,'The focused fan must stay clear');
const otherEngine=pickables.find(m=>m.userData.detail==='engine.fan'&&m.getWorldPosition(new T.Vector3()).z<0);
assert.ok(otherEngine.material.opacity<.15,'The opposite engine must not obscure the selected engine');
assert.equal(wingSkin.material.depthWrite,false);assert.equal(wingSkin.castShadow,false);
update({});assert.deepEqual(snap(),initial,'Zooming out must restore all original opacity and mechanisms');
const afterBounds=new T.Box3().setFromObject(model);
assert.ok(afterBounds.min.x>beforeBounds.min.x-.35&&afterBounds.max.x<beforeBounds.max.x+.35,'Details cannot extend beyond nose/tail');
assert.ok(afterBounds.max.z<beforeBounds.max.z+.15&&afterBounds.min.z>beforeBounds.min.z-.15,'Details must stay on the original wings');
console.log(`PASS attached airframe: 24 detail IDs, ${pickables.length} pickables; both engines, 16 seats, local cutaways, original roots, real hinges, world anchors, disposal and reversible updates.`);

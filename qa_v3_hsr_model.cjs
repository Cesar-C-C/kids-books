// Geometry contract for the rebuilt high-speed train lab.
// Pure Node: builds the train (airframe + running gear) in a vm context and
// checks the promises app.js relies on — three layers per assembly, a documented
// detail for every navigable group and geometry that can be put back exactly.
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert/strict');
const context={window:{},console};vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'labs/shared/vendor/three.min.js'),'utf8'),context);
const T=context.THREE;
for(const file of ['trainframe'])vm.runInContext(fs.readFileSync(path.join(__dirname,`labs/hsr/v3/${file}.js`),'utf8'),context);
for(const file of ['runninggear'])vm.runInContext(fs.readFileSync(path.join(__dirname,`labs/hsr/v3/${file}.js`),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'labs/hsr/parts.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'labs/hsr/detail-parts.js'),'utf8'),context);
const parts=context.window.HSR_PARTS,details=context.window.HSR_DETAILS;
const {TrainV3,RunningGearV3}=context.window;

/* ---------- data ---------- */
assert.equal(parts.length,10,'ten whole-train parts');
assert.equal(new Set(parts.map(p=>p.id)).size,10);
for(const p of parts)for(const f of ['id','name','zhName','category','color','en','zh','tip'])assert.ok(typeof p[f]==='string'&&p[f].trim(),`${p.id}/${f}`);
assert.equal(details.length,25,'twenty-five inside discoveries');
assert.equal(new Set(details.map(d=>d.id)).size,25);
for(const d of details){for(const f of ['id','region','name','zhName','en','zh','tip','principle'])assert.ok(typeof d[f]==='string'&&d[f].trim(),`${d.id}/${f}`);assert.ok(parts.some(p=>p.id===d.region),`${d.id}: unknown region ${d.region}`);}
for(const p of parts)assert.ok(details.some(d=>d.region===p.id),`${p.id}: no inside discovery`);

/* ---------- model ---------- */
const train=TrainV3.create(T);
for(const b of [{id:'bogie-front',x:-2.95},{id:'bogie-rear',x:3.05}]){const a=RunningGearV3.createBogie(T,{id:b.id,x:b.x});train.root.add(a.group);train.assemblies.push(a);}
for(const m of [{id:'motor-front',x:-2.95},{id:'motor-rear',x:3.05}]){const a=RunningGearV3.createMotor(T,{id:m.id,x:m.x});train.root.add(a.group);train.assemblies.push(a);}
{const a=RunningGearV3.createPantograph(T,{x:2.55});train.root.add(a.group);train.assemblies.push(a);}
assert.equal(train.assemblies.length,12,'7 carriage assemblies + 2 bogies + 2 motor sets + 1 pantograph');
assert.equal(new Set(train.assemblies.map(a=>a.id)).size,12);
for(const p of parts)assert.ok(train.assemblies.some(a=>a.region===p.id),`no geometry for region ${p.id}`);

const documented=new Set(details.map(d=>d.id)),published=new Set(),initial=[];
let meshes=0,ghostMeshes=0,triangles=0;
for(const a of train.assemblies){
  assert.equal(a.group.parent,train.root,`${a.id}: detached from root`);
  assert.equal(a.group.userData.assemblyId,a.id);
  assert.equal(a.group.userData.region,a.region);
  for(const k of ['exterior','interior','ghost'])assert.equal(a[k].parent,a.group,`${a.id}/${k}: wrong parent`);
  assert.equal(a.interior.visible,false,`${a.id}: interiors must start hidden so the shell reads first`);
  assert.equal(a.ghost.visible,false,`${a.id}: silhouettes must start hidden`);
  assert.ok(Array.isArray(a.view)&&a.view.length===2);
  assert.ok(a.radius>0.4&&a.radius<4.5,`${a.id}: implausible focus radius ${a.radius}`);
  a.ghost.traverse(o=>{if(o.isMesh){ghostMeshes++;assert.ok(o.material.opacity<.2,`${a.id}: ghost must stay faint`);assert.equal(o.material.depthWrite,false);}});
  a.group.traverse(o=>{
    if(!o.isMesh)return;meshes++;
    assert.ok(parts.some(p=>p.id===o.userData.region),`${a.id}: mesh without a known region`);
    const pos=o.geometry.attributes.position;
    for(let i=0;i<pos.array.length;i++)assert.ok(Number.isFinite(pos.array[i]),`${a.id}: non-finite geometry`);
    if(o.geometry.index)triangles+=o.geometry.index.count/3;else triangles+=pos.count/3;
    initial.push({o,p:o.position.clone(),q:o.quaternion.clone(),w:o.getWorldPosition(new T.Vector3())});
  });
  for(const id of Object.keys(a.details)){
    published.add(id);
    const groups=[].concat(a.details[id]);
    assert.ok(groups.length>=1,`${a.id}/${id}: empty detail group`);
    for(const g of groups){
      assert.equal(g.userData.detail,id);
      assert.equal(g.userData.region,a.region);
      let ok=false;for(let p=g.parent;p;p=p.parent)if(p===a.group)ok=true;
      assert.ok(ok,`${a.id}/${id}: detail group is not inside its assembly`);
    }
  }
}
assert.deepEqual([...published].sort(),[...documented].sort(),'every documented detail must exist in the model, and every model detail must be documented');
assert.ok(ghostMeshes<=20,`context must use coarse silhouettes, saw ${ghostMeshes}`);
// The airplane baseline is 549 meshes / 289k triangles; a carriage with two
// bogies, four motors and six rows of seats is allowed to be a little heavier.
assert.ok(meshes>150&&meshes<1000,`expected a detailed model, saw ${meshes} meshes`);
assert.ok(triangles>20000,`expected real geometry, saw ${Math.round(triangles)} triangles`);
assert.ok(train.counts.meshes>0);

/* ---------- reversible, region-gated motion ---------- */
// The blind and the pantograph have a folded rest pose, so settle first, then
// require that every mechanism can be driven and always comes back to it.
const worldPos=o=>o.getWorldPosition(new T.Vector3()),worldQuat=o=>o.getWorldQuaternion(new T.Quaternion());
const drive=(region,level)=>{train.update({time:level,mechanism:level>.001,level,region});for(const a of train.assemblies)if(a.update)a.update({time:level,mechanism:level>.001,level,region,spin:1.55});};
const movedIn=region=>{train.root.updateMatrixWorld(true);const out={};for(const s of initial){
  if(worldPos(s.o).distanceTo(s.w)<.01&&worldQuat(s.o).angleTo(s.wq)<.01)continue;
  const k=s.o.userData.region;if(k!==region)throw new Error(`the ${region} mechanism also moved a ${k} part`);
  out[k]=(out[k]||0)+1;}return out[region]||0;};
const reset=()=>drive(undefined,0);
reset();train.root.updateMatrixWorld(true);
for(const s of initial){s.p.copy(s.o.position);s.q.copy(s.o.quaternion);s.w.copy(worldPos(s.o));s.wq=worldQuat(s.o);}
const check=(region,min)=>{
  drive(region,1);
  const n=movedIn(region);
  assert.ok(n>=min,`${region} must move at least ${min} meshes, saw ${n}`);
  reset();train.root.updateMatrixWorld(true);
  for(const s of initial){
    assert.ok(s.p.distanceTo(s.o.position)<1e-9,`${s.o.userData.detail||s.o.name||'mesh'}: local position must come back`);
    assert.ok(s.q.angleTo(s.o.quaternion)<1e-7,`${s.o.userData.detail||s.o.name||'mesh'}: rotation must come back`);
    assert.ok(s.w.distanceTo(worldPos(s.o))<1e-7,`${s.o.userData.detail||s.o.name||'mesh'}: world position must come back`);
  }
};
check('windows',3);check('doors',8);check('pantograph',10);check('bogies',8);check('motors',4);
reset();
// The pantograph must actually reach up to the wire, not just wiggle.
const panto=train.assemblies.find(a=>a.id==='pantograph'),head=panto.details['panto.head'];
train.root.updateMatrixWorld(true);const low=new T.Box3().setFromObject(head);
panto.update({time:0,mechanism:true,level:1,region:'pantograph'});
train.root.updateMatrixWorld(true);const raised=new T.Box3().setFromObject(head);
assert.ok(raised.max.y>low.max.y+.4,`pantograph must rise: ${low.max.y.toFixed(2)} -> ${raised.max.y.toFixed(2)}`);
assert.ok(raised.min.y>1.2,'the collector head belongs above the roof, never inside the cabin');
panto.update({time:0,mechanism:false,level:0});
// Wheels must turn on time alone while the demo runs.
reset();
const bogie=train.assemblies.find(a=>a.id==='bogie-front');
bogie.update({time:2,mechanism:true,level:.5,region:'bogies',spin:1.55});
const spun=[];bogie.group.traverse(o=>{if(o.isMesh&&Math.abs(o.rotation.z)>1e-6)spun.push(o);});
assert.ok(spun.length>=4,`expected the wheelsets to spin, saw ${spun.length}`);
bogie.update({time:0,mechanism:false,level:0,spin:0});

/* ---------- proportions ---------- */
const bounds=new T.Box3().setFromObject(train.root),size=bounds.getSize(new T.Vector3());
assert.ok(size.x>9&&size.x<13,`carriage length ${size.x.toFixed(2)}`);
assert.ok(size.y>3.4&&size.y<6,`height ${size.y.toFixed(2)}`);
assert.ok(size.z>1.6&&size.z<4,`width ${size.z.toFixed(2)}`);
// The tread must sit on the rail head; only the flange may dip below it.
assert.ok(bounds.min.y>=-1.54&&bounds.min.y<=-1.50,`wheels must rest on the rail, min y ${bounds.min.y.toFixed(3)}`);
const track=RunningGearV3.createTrack(T,{from:-6.3,to:5.7});
const trackBounds=new T.Box3().setFromObject(track);
// Sleeper undersides define the ground, the rail head defines the tread height,
// and the catenary has to reach above everything the pantograph can unfold to.
let railTop=-9;
track.traverse(o=>{if(!o.isMesh)return;const b=new T.Box3().setFromObject(o);if(b.max.y<0)railTop=Math.max(railTop,b.max.y);});
assert.ok(Math.abs(railTop-RunningGearV3.RAIL_TOP)<.005,`rail head ${railTop.toFixed(3)}`);
assert.ok(trackBounds.min.y>-1.66&&trackBounds.min.y<-1.60,`track base ${trackBounds.min.y.toFixed(3)}`);
assert.ok(trackBounds.max.y>2.62,`the contact wire must hang above the raised collector head, saw ${trackBounds.max.y.toFixed(3)}`);
assert.equal(track.name,'train-display-track','the rails must stay outside the pickable tree');
assert.equal(track.parent,null);
let trackMeshes=0;track.traverse(o=>{if(o.isMesh)trackMeshes++;});
assert.ok(trackMeshes>=25,`expected sleepers and rails, saw ${trackMeshes}`);

console.log(`PASS v3 train: 12 assemblies, ${meshes} meshes, ${Math.round(triangles)} triangles, ${ghostMeshes} silhouette meshes; 10 parts / 25 inside discoveries fully cross-linked; reversible doors, spinning wheelsets, folding pantograph; body ${size.toArray().map(v=>v.toFixed(2)).join(' x ')} m.`);

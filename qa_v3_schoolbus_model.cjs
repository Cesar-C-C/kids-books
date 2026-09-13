// Geometry contract for the Type-C school bus v3 studio lab.
// Pure Node: builds the bus in a vm context and checks what app.js depends on —
// the three-layer assembly contract, a documented detail for every navigable
// group, region-gated reversible mechanisms and believable proportions.
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert/strict');
const context = { window: {}, console }; vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, 'labs/shared/vendor/three.min.js'), 'utf8'), context);
const T = context.THREE;
vm.runInContext(fs.readFileSync(path.join(__dirname, 'labs/schoolbus/v3/schoolbusframe.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(__dirname, 'labs/schoolbus/parts.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(__dirname, 'labs/schoolbus/detail-parts.js'), 'utf8'), context);
const parts = context.window.SCHOOLBUS_PARTS, details = context.window.SCHOOLBUS_DETAILS;
const { SchoolBusV3 } = context.window;

/* ---------- data ---------- */
assert.equal(parts.length, 10, 'ten whole-bus parts');
assert.equal(new Set(parts.map(p => p.id)).size, 10);
for (const p of parts) for (const f of ['id', 'name', 'zhName', 'category', 'color', 'en', 'zh', 'tip']) assert.ok(typeof p[f] === 'string' && p[f].trim(), `${p.id}/${f}`);
assert.equal(details.length, 39, 'thirty-nine inside discoveries');
assert.equal(new Set(details.map(d => d.id)).size, 39);
for (const d of details) {
  for (const f of ['id', 'region', 'name', 'zhName', 'en', 'zh', 'tip', 'principle']) assert.ok(typeof d[f] === 'string' && d[f].trim(), `${d.id}/${f}`);
  assert.ok(parts.some(p => p.id === d.region), `${d.id}: unknown region ${d.region}`);
}
for (const p of parts) assert.ok(details.some(d => d.region === p.id), `${p.id}: no inside discovery`);

/* ---------- model ---------- */
const bus = SchoolBusV3.create(T);
assert.equal(bus.assemblies.length, 10, 'one assembly per part');
assert.equal(new Set(bus.assemblies.map(a => a.id)).size, 10);
for (const p of parts) assert.ok(bus.assemblies.some(a => a.region === p.id), `no geometry for region ${p.id}`);

const documented = new Set(details.map(d => d.id)), published = new Set(), initial = [];
let meshes = 0, ghostMeshes = 0, triangles = 0;
for (const a of bus.assemblies) {
  assert.equal(a.group.parent, bus.root, `${a.id}: detached from root`);
  assert.equal(a.group.userData.assemblyId, a.id);
  assert.equal(a.group.userData.region, a.region);
  for (const k of ['exterior', 'interior', 'ghost']) assert.equal(a[k].parent, a.group, `${a.id}/${k}: wrong parent`);
  assert.equal(a.interior.visible, false, `${a.id}: interiors must start hidden so the shell reads first`);
  assert.equal(a.ghost.visible, false, `${a.id}: silhouettes must start hidden`);
  assert.ok(Array.isArray(a.view) && a.view.length === 2);
  assert.ok(a.radius > 0.4 && a.radius < 7, `${a.id}: implausible focus radius ${a.radius}`);
  a.ghost.traverse(o => { if (o.isMesh) { ghostMeshes++; assert.ok(o.material.opacity < .2, `${a.id}: ghost must stay faint`); assert.equal(o.material.depthWrite, false); } });
  a.group.traverse(o => {
    if (!o.isMesh) return; meshes++;
    assert.ok(parts.some(p => p.id === o.userData.region), `${a.id}: mesh without a known region`);
    const pos = o.geometry.attributes.position;
    for (let i = 0; i < pos.array.length; i++) assert.ok(Number.isFinite(pos.array[i]), `${a.id}: non-finite geometry`);
    if (o.geometry.index) triangles += o.geometry.index.count / 3; else triangles += pos.count / 3;
    initial.push({ o, p: o.position.clone(), q: o.quaternion.clone(), w: o.getWorldPosition(new T.Vector3()) });
  });
  for (const id of Object.keys(a.details)) {
    published.add(id);
    const groups = [].concat(a.details[id]);
    assert.ok(groups.length >= 1, `${a.id}/${id}: empty detail group`);
    for (const g of groups) {
      assert.equal(g.userData.detail, id);
      assert.equal(g.userData.region, a.region);
      let ok = false; for (let p = g.parent; p; p = p.parent) if (p === a.group) ok = true;
      assert.ok(ok, `${a.id}/${id}: detail group is not inside its assembly`);
    }
  }
}
assert.deepEqual([...published].sort(), [...documented].sort(), 'every documented detail must exist in the model, and every model detail must be documented');
assert.ok(ghostMeshes <= 20, `context must use coarse silhouettes, saw ${ghostMeshes}`);
assert.ok(meshes > 120 && meshes < 600, `expected a detailed model, saw ${meshes} meshes`);
assert.ok(triangles > 8000, `expected real geometry, saw ${Math.round(triangles)} triangles`);
assert.ok(bus.counts.meshes > 0);

/* ---------- reversible, region-gated motion ---------- */
const worldPos = o => o.getWorldPosition(new T.Vector3()), worldQuat = o => o.getWorldQuaternion(new T.Quaternion());
const drive = (region, level) => { bus.update({ time: level, mechanism: level > .001, level, region }); for (const a of bus.assemblies) if (a.update) a.update({ time: level, mechanism: level > .001, level, region, spin: 1.55 }); };
const movedIn = region => {
  bus.root.updateMatrixWorld(true); const out = {};
  for (const s of initial) {
    if (worldPos(s.o).distanceTo(s.w) < .01 && worldQuat(s.o).angleTo(s.wq) < .01) continue;
    const k = s.o.userData.region; if (k !== region) throw new Error(`the ${region} mechanism also moved a ${k} part`);
    out[k] = (out[k] || 0) + 1;
  }
  return out[region] || 0;
};
const reset = () => drive(undefined, 0);
reset(); bus.root.updateMatrixWorld(true);
for (const s of initial) { s.p.copy(s.o.position); s.q.copy(s.o.quaternion); s.w.copy(worldPos(s.o)); s.wq = worldQuat(s.o); }
const check = (region, min) => {
  drive(region, 1);
  const n = movedIn(region);
  assert.ok(n >= min, `${region} must move at least ${min} meshes, saw ${n}`);
  reset(); bus.root.updateMatrixWorld(true);
  for (const s of initial) {
    assert.ok(s.p.distanceTo(s.o.position) < 1e-9, `${s.o.userData.detail || 'mesh'}: local position must come back`);
    assert.ok(s.q.angleTo(s.o.quaternion) < 1e-7, `${s.o.userData.detail || 'mesh'}: rotation must come back`);
    assert.ok(s.w.distanceTo(worldPos(s.o)) < 1e-7, `${s.o.userData.detail || 'mesh'}: world position must come back`);
  }
};
// The doors and the stop arm are the two mechanisms this bus teaches.
check('doors', 2);
check('stopsign', 1);
reset();

/* ---------- the stop arm must actually deploy ---------- */
// Its signed reach is what matters to a child: folded, the blade hugs the body;
// deployed, it sticks out past the widest point of the bus.
const arm = bus.assemblies.find(a => a.region === 'stopsign');
// The blade sits on the hinge that IS the mechanism, so reach it through the
// assembly rather than through the details map (which only holds the hinge).
const bladeReach = () => {
  bus.root.updateMatrixWorld(true);
  let mn = Infinity, mx = -Infinity, found = 0;
  arm.group.traverse(o => {
    if (!o.isMesh || o.userData.detail !== 'stopsign.blade') return;
    found++;
    const pos = o.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) { const v = new T.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)); o.localToWorld(v); mn = Math.min(mn, v.z); mx = Math.max(mx, v.z); }
  });
  assert.ok(found > 0, 'the octagon blade must exist on the stop arm');
  return { mn, mx };
};
reset();
const folded = bladeReach();
arm.update({ time: 0, mechanism: true, level: 1, region: 'stopsign' });
const deployed = bladeReach();
arm.update({ time: 0, mechanism: false, level: 0 });
assert.ok(deployed.mn < folded.mn - .30, `the stop arm must swing out past the body: folded z ${folded.mn.toFixed(2)} -> deployed z ${deployed.mn.toFixed(2)}`);

/* ---------- proportions: a long-nose, tall, narrow bus ---------- */
const samples = [];
bus.root.updateMatrixWorld(true);
bus.root.traverse(o => {
  if (!o.isMesh) return;
  o.geometry.computeBoundingBox();
  const b = o.geometry.boundingBox;
  for (let i = 0; i < 8; i++) {
    const v = new T.Vector3(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z);
    o.localToWorld(v); samples.push(v);
  }
});
let mn = { x: Infinity, y: Infinity, z: Infinity }, mx = { x: -Infinity, y: -Infinity, z: -Infinity };
for (const v of samples) { mn.x = Math.min(mn.x, v.x); mn.y = Math.min(mn.y, v.y); mn.z = Math.min(mn.z, v.z); mx.x = Math.max(mx.x, v.x); mx.y = Math.max(mx.y, v.y); mx.z = Math.max(mx.z, v.z); }
const size = { x: mx.x - mn.x, y: mx.y - mn.y, z: mx.z - mn.z };
assert.ok(size.x > 8.5 && size.x < 11, `bus length ${size.x.toFixed(2)} m`);
assert.ok(size.y > 2.8 && size.y < 4, `bus height ${size.y.toFixed(2)} m`);
assert.ok(size.z > 2.2 && size.z < 3.2, `bus width ${size.z.toFixed(2)} m`);
// A school bus is much longer than it is tall, and noticeably taller than wide.
assert.ok(size.x / size.y > 2.3, `length/height ${(size.x / size.y).toFixed(2)} must look like a bus`);
assert.ok(size.y / size.z > 1.0, `height/width ${(size.y / size.z).toFixed(2)}: a school bus is tall and narrow`);

// The hood has to stick out ahead of the box: that is what makes it a Type-C.
const span = id => { const a = bus.assemblies.find(a => a.region === id); assert.ok(a, `${id} missing`); a.group.updateMatrixWorld(true); let lo = Infinity, hi = -Infinity; a.group.traverse(o => { if (!o.isMesh) return; o.geometry.computeBoundingBox(); const b = o.geometry.boundingBox; for (let i = 0; i < 8; i++) { const v = new T.Vector3(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z); o.localToWorld(v); lo = Math.min(lo, v.x); hi = Math.max(hi, v.x); } }); return [lo, hi]; };
const [hLo, hHi] = span('hood'), [cLo, cHi] = span('cab');
assert.ok(hLo <= mn.x + .2, `the hood must lead the bus: hood min x ${hLo.toFixed(2)} vs bus min x ${mn.x.toFixed(2)}`);
// The hood occupies the nose; the cab sits behind it. On this axis the nose is
// the most negative x, so the hood must begin ahead of (below) the cab and must
// not reach past the cab's rear.
assert.ok(hLo < cLo, `the hood must begin ahead of the cab: hood ${hLo.toFixed(2)}, cab ${cLo.toFixed(2)}`);
assert.ok(hHi < cHi, `the hood must end before the cab does: hood ${hHi.toFixed(2)}, cab ${cHi.toFixed(2)}`);
assert.ok(hHi - hLo > 1.5, `the hood must be a real engine bonnet, saw ${(hHi - hLo).toFixed(2)} m`);

// The stop arm belongs behind the driver's door, roughly mid-body.
const [sLo] = span('stopsign');
assert.ok(sLo > mn.x + size.x * .35, `the stop arm must sit on the body side, not on the nose: x ${sLo.toFixed(2)}`);

// Wheels must touch the ground while the body rides above it.
const wheels = bus.assemblies.find(a => a.region === 'wheels');
let wheelLo = Infinity;
wheels.group.updateMatrixWorld(true);
wheels.group.traverse(o => { if (!o.isMesh) return; o.geometry.computeBoundingBox(); const b = o.geometry.boundingBox; for (let i = 0; i < 8; i++) { const v = new T.Vector3(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z); o.localToWorld(v); wheelLo = Math.min(wheelLo, v.y); } });
assert.ok(Math.abs(wheelLo - mn.y) < .16, `the tyres must define the ground line: wheels ${wheelLo.toFixed(2)} vs bus ${mn.y.toFixed(2)}`);

console.log(`PASS v3 school bus: ${bus.assemblies.length} assemblies, ${meshes} meshes, ${Math.round(triangles)} triangles, ${ghostMeshes} silhouette meshes; ${parts.length} parts / ${details.length} inside discoveries fully cross-linked; reversible doors + stop arm; long-nose Type-C ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)} m with a ${(hHi - hLo).toFixed(2)} m hood.`);

// Regression: forward-facing backs span the vehicle width, stay inside the shell,
// and leave a continuous center aisle (book interior reference).
bus.root.updateMatrixWorld(true);
bus.root.traverse(o => {
  if (!o.isMesh || !['Seat back', 'Rear bench back', 'Driver back', 'Priority back'].includes(o.name)) return;
  const b = new T.Box3().setFromObject(o), extent = b.getSize(new T.Vector3());
  assert.ok(extent.z > extent.x * 2, `${o.name}: back must face -X, not block the aisle sideways`);
  assert.ok(b.max.x < 4.15 && b.min.x > -4.2, `${o.name}: seat must remain inside the bus`);
  assert.ok(b.max.z < 1.23 && b.min.z > -1.23, `${o.name}: seat must remain inside the side walls`);
});

const roofPanel = bus.root.getObjectByName('Roof panel');
const rv = roofPanel.geometry.attributes.position;
let leftHeight = -Infinity, rightHeight = -Infinity;
for (let i = 0; i < rv.count; i++) {
  const v = roofPanel.localToWorld(new T.Vector3(rv.getX(i), rv.getY(i), rv.getZ(i)));
  if (v.z < -.3) leftHeight = Math.max(leftHeight, v.y);
  if (v.z > .3) rightHeight = Math.max(rightHeight, v.y);
}
assert.ok(Math.abs(leftHeight - rightHeight) < .001, 'arched roof must be symmetric across the bus');
console.log('PASS schoolbus book-shape regressions: symmetric crown, contained forward-facing seats');

// Book silhouette regression: evaluate actual exterior meshes, excluding hidden
// compatibility ghosts, rather than allowing a ghost box to supply bus height.
const exteriorBounds = new T.Box3();
for (const a of bus.assemblies) a.exterior.traverse(o => {
  if (o.isMesh) exteriorBounds.union(new T.Box3().setFromObject(o));
});
const silhouetteSize = exteriorBounds.getSize(new T.Vector3());
const roundTires = [];
bus.root.traverse(o=>{if(o.name==='Tire') roundTires.push(o);});
for(const tire of roundTires) {
  const b = new T.Box3().setFromObject(tire).getSize(new T.Vector3());
  assert.ok(Math.abs(b.x-b.y)<.005,'tire profile must remain circular, never stretched with the body');
}
// A ray through the upper tire must pass through the side-skin wheel cutout.
for (const skin of bus.assemblies.find(a=>a.id==='body').details['body.shell'].children) {
  if(skin.name!=='Continuous wheel-cut side skin') continue;
  const ray = new T.Raycaster(new T.Vector3(2.42,-1.30,5),new T.Vector3(0,0,-1));
  if (bus.BOX_X !== undefined) ray.ray.origin.set(2.30,-1.35,5);
  assert.equal(ray.intersectObject(skin).length,0,'side skin must have a genuine rear wheel clearance');
}

assert.ok(silhouetteSize.x/silhouetteSize.y>2.3 && silhouetteSize.x/silhouetteSize.y<2.5, 'schoolbus silhouette follows the canonical side-view length/height ratio');
assert.ok(roundTires.every(o=>new T.Box3().setFromObject(o).getSize(new T.Vector3()).y>1.19),'schoolbus tires must retain illustrated large diameter');
assert.ok(bus.root.getObjectByName('Sculpted bonnet'),'schoolbus must use the reconstructed tapered bonnet');
console.log('PASS schoolbus canonical silhouette',silhouetteSize.toArray().map(n=>n.toFixed(2)).join(' x '));

const entranceLeaves=[];
bus.root.traverse(o=>{if(o.name==='Door leaf') entranceLeaves.push(o);});
assert.equal(entranceLeaves.length,2);
for(const leaf of entranceLeaves) {
 const b=new T.Box3().setFromObject(leaf);
 assert.ok(b.min.z < -bus.HALF_W-.06 && b.min.y < -1.6,'schoolbus entrance must be outside opaque skin and reach skirt');
}
// Geometry-backed coverage catches empty groups left behind by model reconstruction.
for(const d of details){const a=bus.assemblies.find(a=>a.region===d.region);assert.ok(a.detailMeshes[d.id]?.length,d.id+' must contain actual meshes');}
const panes=[];bus.root.traverse(o=>{if(o.userData.glass)panes.push(o);});
assert.ok(panes.length>=19,'side, front, driver, entry and rear glazing are represented');
for(const o of panes){assert.ok(o.material.isMeshPhysicalMaterial);assert.ok(o.material.transmission>.7);assert.ok(o.material.roughness<.15);assert.equal(o.material.metalness,0);assert.equal(o.material.depthWrite,false);assert.equal(o.castShadow,false);}
const sideSkins=bus.root.getObjectsByProperty('name','Continuous wheel-cut side skin');
for(const side of [-1,1])for(const x of [-.82,.13,1.08,2.03,2.98]){
 const ray=new T.Raycaster(new T.Vector3(x,.42,side*3),new T.Vector3(0,0,-side));
 assert.equal(ray.intersectObjects(sideSkins).length,0,'windows must be real apertures, never glazing backed by steel');
}
// Center aisle must not be obstructed by a full-width rear bench or a lengthwise handrail.
for(const id of ['seats.cushion','seats.back'])for(const o of bus.assemblies.find(a=>a.id==='seats').detailMeshes[id]){
 const b=new T.Box3().setFromObject(o);assert.ok(b.max.z<-.18||b.min.z>.18,'seat leaves clear center aisle');
}
const doorsAssembly=bus.assemblies.find(a=>a.id==='doors');
const leafMeshes=doorsAssembly.detailMeshes['doors.leaf'].filter(o=>o.name==='Door leaf');
for(const t of [0,.25,.5,.75,1]){
 doorsAssembly.update({region:'doors',level:t,mechanism:true});bus.root.updateMatrixWorld(true);
 for(const leaf of leafMeshes){const pivot=leaf.parent;assert.ok(Math.abs(pivot.position.x-bus.DOOR_X)>.4,'hinge stays on an outer jamb');const p=new T.Box3().setFromObject(leaf);assert.ok(p.min.x>bus.DOOR_X-.49&&p.max.x<bus.DOOR_X+.49,'swept leaf remains inside doorway width');}
}
reset();
console.log(`PASS schoolbus inspection: ${details.length} geometry-backed details, ${panes.length} physical glass panes, open window apertures, clear aisle and sampled door sweep.`);
// Conservative oriented-box checks over the whole entry door swing. Glass/frame
// opening holes are ignored here, so a pass includes clearance for the entire leaf.
const steps=doorsAssembly.detailMeshes['doors.step'].filter(o=>['Entry step','Step riser'].includes(o.name));
function leafHitsBox(leaf,step){
 const world=leaf.getWorldPosition(new T.Vector3()),q=leaf.getWorldQuaternion(new T.Quaternion());
 const u=new T.Vector3(1,0,0).applyQuaternion(q),v=new T.Vector3(0,0,1).applyQuaternion(q);
 const b=new T.Box3().setFromObject(step),center=b.getCenter(new T.Vector3()),half=b.getSize(new T.Vector3()).multiplyScalar(.5);
 if(Math.abs(world.y-center.y)>=1.32+half.y-.001)return false;
 const delta=center.clone().sub(world);
 for(const axis of [u,v,new T.Vector3(1,0,0),new T.Vector3(0,0,1)]){
  const reach=.22*Math.abs(u.dot(axis))+.03*Math.abs(v.dot(axis))+half.x*Math.abs(axis.x)+half.z*Math.abs(axis.z);
  if(Math.abs(delta.dot(axis))>=reach-.001)return false;
 }
 return true;
}
for(let i=0;i<=36;i++){
 doorsAssembly.update({region:'doors',mechanism:true,level:i/36});bus.root.updateMatrixWorld(true);
 for(const leaf of leafMeshes)for(const step of steps)assert.equal(leafHitsBox(leaf,step),false,`${step.name}: door sweep at ${i}/36 must not intersect steps`);
}
reset();console.log('PASS 37 door-sweep positions: both leaves clear every tread and riser.');

for(const leaf of leafMeshes){
 const panes=leaf.children.filter(o=>o.userData.glass);assert.equal(panes.length,2);
 const intervals=panes.map(o=>{o.geometry.computeBoundingBox();const b=o.geometry.boundingBox;assert.ok(b.max.x>=.175&&b.min.x<=-.175,'glass overlaps vertical door seal');return [o.position.y+b.min.y,o.position.y+b.max.y];}).sort((a,b)=>a[0]-b[0]);
 assert.ok(intervals[0][0]<=-1.275&&intervals[0][1]>=-.0325&&intervals[1][0]<=.0325&&intervals[1][1]>=1.275,'door glass fills openings behind frame and middle rail');
}
console.log('PASS entry glazing overlaps every seal and middle rail.');

// The stop plate must be parallel to its lettering, rather than burying half the word.
for(const name of ['Stop sign','Stop border']){
 const plate=arm.group.getObjectByName(name);
 const normal=new T.Vector3(0,1,0).applyQuaternion(plate.quaternion);
 assert.ok(Math.abs(normal.z)>.999999,name+' face aligns with lettering plane');
}
console.log('PASS stop plate and lettering share a parallel face.');

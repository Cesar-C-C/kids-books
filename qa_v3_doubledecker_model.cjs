// Geometry contract for the double-decker v3 studio lab.
// Pure Node: builds the bus in a vm context and checks what app.js depends on —
// the three-layer assembly contract, a documented detail for every navigable
// group, region-gated reversible mechanisms and believable proportions.
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert/strict');
const context = { window: {}, console }; vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, 'labs/shared/vendor/three.min.js'), 'utf8'), context);
const T = context.THREE;
vm.runInContext(fs.readFileSync(path.join(__dirname, 'labs/doubledecker/v3/doubledeckerframe.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(__dirname, 'labs/doubledecker/parts.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(__dirname, 'labs/doubledecker/detail-parts.js'), 'utf8'), context);
const parts = context.window.DOUBLEDECKER_PARTS, details = context.window.DOUBLEDECKER_DETAILS;
const { DoubleDeckerV3 } = context.window;

/* ---------- data ---------- */
assert.equal(parts.length, 10, 'ten whole-bus parts');
assert.equal(new Set(parts.map(p => p.id)).size, 10);
for (const p of parts) for (const f of ['id', 'name', 'zhName', 'category', 'color', 'en', 'zh', 'tip']) assert.ok(typeof p[f] === 'string' && p[f].trim(), `${p.id}/${f}`);
assert.equal(new Set(details.map(d => d.id)).size, details.length, 'detail ids must be unique');
for (const d of details) {
  for (const f of ['id', 'region', 'name', 'zhName', 'en', 'zh', 'tip', 'principle']) assert.ok(typeof d[f] === 'string' && d[f].trim(), `${d.id}/${f}`);
  assert.ok(parts.some(p => p.id === d.region), `${d.id}: unknown region ${d.region}`);
}
for (const p of parts) assert.ok(details.some(d => d.region === p.id), `${p.id}: no inside discovery`);

/* ---------- model ---------- */
const bus = DoubleDeckerV3.create(T);
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
assert.ok(meshes > 250 && meshes < 1200, `expected a detailed model, saw ${meshes} meshes`);
assert.ok(triangles > 15000, `expected real geometry, saw ${Math.round(triangles)} triangles`);
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
  drive(region, .63);
  const n = movedIn(region);
  assert.ok(n >= min, `${region} must move at least ${min} meshes, saw ${n}`);
  reset(); bus.root.updateMatrixWorld(true);
  for (const s of initial) {
    assert.ok(s.p.distanceTo(s.o.position) < 1e-9, `${s.o.userData.detail || 'mesh'}: local position must come back`);
    assert.ok(s.q.angleTo(s.o.quaternion) < 1e-7, `${s.o.userData.detail || 'mesh'}: rotation must come back`);
    assert.ok(s.w.distanceTo(worldPos(s.o)) < 1e-7, `${s.o.userData.detail || 'mesh'}: world position must come back`);
  }
};
const mechanisms = bus.assemblies.filter(a => typeof a.update === 'function').map(a => a.region);
assert.ok(mechanisms.length >= 1, 'at least one assembly must animate');
for (const region of mechanisms) check(region, 1);
reset();

/* ---------- proportions: twice as tall as it is wide ---------- */
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
assert.ok(size.x > 7 && size.x < 11, `bus length ${size.x.toFixed(2)} m`);
assert.ok(size.y > 3.4 && size.y < 5.2, `bus height ${size.y.toFixed(2)} m`);
assert.ok(size.z > 2.2 && size.z < 3.4, `bus width ${size.z.toFixed(2)} m`);
// The whole point of a double-decker: a second full deck on top.
assert.ok(size.y / size.z > 1.15, `height/width ${(size.y / size.z).toFixed(2)}: a double-decker is tall`);
assert.ok(size.x / size.y < 2.6, `length/height ${(size.x / size.y).toFixed(2)}: the upper deck makes it stubby`);

// The upper deck must genuinely sit above the lower one, separated by a floor.
const span = id => { const a = bus.assemblies.find(a => a.region === id); assert.ok(a, `${id} missing`); a.group.updateMatrixWorld(true); let lo = Infinity, hi = -Infinity; a.group.traverse(o => { if (!o.isMesh) return; o.geometry.computeBoundingBox(); const b = o.geometry.boundingBox; for (let i = 0; i < 8; i++) { const v = new T.Vector3(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z); o.localToWorld(v); lo = Math.min(lo, v.y); hi = Math.max(hi, v.y); } }); return [lo, hi]; };
const [uLo, uHi] = span('upper'), [lLo, lHi] = span('lower');
assert.ok(lLo < uLo, `the lower deck must start below the upper deck: ${lLo.toFixed(2)} vs ${uLo.toFixed(2)}`);
assert.ok(uHi > lHi + 1.0, `the upper deck must rise well above the lower one: ${uHi.toFixed(2)} vs ${lHi.toFixed(2)}`);
// Two stacked passenger cabins must each be tall enough to stand in.
assert.ok(uHi - uLo > 1.2, `the upper cabin must have headroom, saw ${(uHi - uLo).toFixed(2)} m`);
assert.ok(lHi - lLo > 1.0, `the lower cabin must have headroom, saw ${(lHi - lLo).toFixed(2)} m`);

// The stairs must connect the two decks: one end low, the other high.
const stair = bus.assemblies.find(a => a.region === 'stairs');
assert.ok(stair, 'the staircase must exist');
stair.group.updateMatrixWorld(true);
let stepLo = Infinity, stepHi = -Infinity;
stair.group.traverse(o => { if (!o.isMesh) return; o.geometry.computeBoundingBox(); const b = o.geometry.boundingBox; for (let i = 0; i < 8; i++) { const v = new T.Vector3(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z); o.localToWorld(v); stepLo = Math.min(stepLo, v.y); stepHi = Math.max(stepHi, v.y); } });
assert.ok(stepHi - stepLo > 1.4, `the staircase must span both decks, saw ${(stepHi - stepLo).toFixed(2)} m`);

// Wheels must touch the ground while the body rides above it.
const wheels = bus.assemblies.find(a => a.region === 'wheels');
let wheelLo = Infinity;
wheels.group.updateMatrixWorld(true);
wheels.group.traverse(o => { if (!o.isMesh) return; o.geometry.computeBoundingBox(); const b = o.geometry.boundingBox; for (let i = 0; i < 8; i++) { const v = new T.Vector3(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z); o.localToWorld(v); wheelLo = Math.min(wheelLo, v.y); } });
assert.ok(Math.abs(wheelLo - mn.y) < .16, `the tyres must define the ground line: wheels ${wheelLo.toFixed(2)} vs bus ${mn.y.toFixed(2)}`);

console.log(`PASS v3 double-decker: ${bus.assemblies.length} assemblies, ${meshes} meshes, ${Math.round(triangles)} triangles, ${ghostMeshes} silhouette meshes; ${parts.length} parts / ${details.length} inside discoveries fully cross-linked; reversible ${mechanisms.join('/')} motion; two-deck bus ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)} m with ${(stepHi - stepLo).toFixed(2)} m of stairs.`);

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

const stairOpening = new T.Vector3(-2.05, bus.DECK_MID + .02, -.74);
for (const name of ['Upper floor', 'Deck underside', 'Body floor band']) {
  bus.root.traverse(o => {
    if (!o.isMesh || o.name !== name) return;
    const b = new T.Box3().setFromObject(o);
    assert.ok(!(stairOpening.x > b.min.x && stairOpening.x < b.max.x && stairOpening.z > b.min.z && stairOpening.z < b.max.z), `${name}: must leave the illustrated stairwell open`);
  });
}
assert.ok(bus.assemblies.find(a => a.id === 'stairs').center.x < -1.5, 'stairs belong behind the front entrance');
console.log('PASS doubledecker book-shape regressions: forward-facing seats, front staircase, open stairwell');

// The closed middle doorway is on the illustrated passenger side between axles,
// and leaves with the body exterior instead of obstructing the opened cabin.
const middleDoor = bus.root.getObjectByName('Middle doorway frame');
assert.ok(middleDoor && middleDoor.position.x > -1 && middleDoor.position.x < 1.5 && middleDoor.position.z < -bus.HALF_W, 'middle doorway must be between the axles on the passenger side');
let middleExterior = false;
for (let p = middleDoor.parent; p; p = p.parent) if (p === bus.assemblies.find(a => a.id === 'body').exterior) middleExterior = true;
assert.ok(middleExterior, 'middle doorway must follow the opening body exterior');
const middlePanes = [];
bus.root.traverse(o => { if (o.name === 'Middle door glazing') middlePanes.push(o); });
assert.equal(middlePanes.length, 2, 'middle door has two closed glazed leaves');
assert.ok(middlePanes.every(o => o.material.isMeshPhysicalMaterial && o.material.transmission > .9), 'middle door glazing transmits light');
console.log('PASS doubledecker middle doorway: two physical glass panes, passenger side, body exterior ownership');

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

assert.ok(silhouetteSize.x/silhouetteSize.y>1.8 && silhouetteSize.x/silhouetteSize.y<2.1,'doubledecker must retain two tall storeys instead of the old low box');
assert.ok(bus.root.getObjectByName('Rounded front body') && bus.root.getObjectByName('Rounded rear body'),'bus ends must use rounded continuous sections');
for(const a of bus.assemblies) assert.ok(a.group.scale.distanceTo(new T.Vector3(1,1,1))<1e-9,'display pivots must retain unit scale');
console.log('PASS doubledecker canonical silhouette',silhouetteSize.toArray().map(n=>n.toFixed(2)).join(' x '));

const frontDoors=bus.assemblies.find(a=>a.id==='doors');
assert.equal(frontDoors.details['doors.step'].parent,frontDoors.interior,'entry steps remain inside closed bus');
let fullPanes=0;
frontDoors.details['doors.leaf'].traverse(o=>{if(o.isMesh&&o.userData.detail==='doors.glass'){fullPanes++;assert.ok(new T.Box3().setFromObject(o).getSize(new T.Vector3()).y>2,'front entry pane must be full height');}});
assert.equal(fullPanes,2,'animated front door has two full-height glazed leaves');

const wheelchairBay=bus.root.getObjectByName('Wheelchair bay floor');
const wheelchairBounds=new T.Box3().setFromObject(wheelchairBay);
assert.ok(wheelchairBounds.min.z>-bus.HALF_W+.1 && wheelchairBounds.max.z<bus.HALF_W-.1,'priority bay floor must remain inside sidewalls instead of crossing the entrance');
assert.equal(bus.assemblies.find(a=>a.id==='lower').details['lower.stroller'].parent,bus.assemblies.find(a=>a.id==='lower').interior,'priority bay is hidden inside the closed bus');

// Inspection regressions: check the real target meshes, not empty compatibility groups.
const glass=[];bus.root.traverse(o=>{if(o.userData.glass)glass.push(o);});
assert.ok(glass.length>=25,'all passenger, front, rear and entrance panes exist');
for(const pane of glass){assert.ok(pane.material.isMeshPhysicalMaterial&&pane.material.transmission>.9&&pane.material.ior>1.4,'glass must transmit and refract light');assert.equal(pane.castShadow,false);}
for(const d of details){const a=bus.assemblies.find(a=>a.region===d.region);assert.ok(a.detailMeshes[d.id]?.length,d.id+' needs actual geometry');}
reset();bus.root.updateMatrixWorld(true);
const bodyShell=bus.assemblies.find(a=>a.id==='body').details['body.shell'];
// Rays through the two decks and both doorways must not meet a solid body plate.
for(const[x,y,z,dx,dz]of[[.66,1.51,5,0,-1],[-1.52,-.25,-5,0,1],[-3.52,-.5,-5,0,1],[.62,-.5,-5,0,1],[-6,-.19,0,1,0]]){
 const ray=new T.Raycaster(new T.Vector3(x,y,z),new T.Vector3(dx,0,dz),0,dx?2:3.9);
 assert.equal(ray.intersectObject(bodyShell,true).length,0,'window or doorway must be a real hole');
}
const lowerA=bus.assemblies.find(a=>a.id==='lower'),stairsA=bus.assemblies.find(a=>a.id==='stairs');
const stairTreads=stairsA.detailMeshes['stairs.treads'].filter(o=>o.name==='Step tread');
assert.equal(stairTreads.length,6);
const seatMeshes=lowerA.detailMeshes['lower.seats'].filter(o=>['Seat cushion','Seat back'].includes(o.name));
for(const tread of stairTreads)for(const seat of seatMeshes)assert.equal(new T.Box3().setFromObject(tread).intersectsBox(new T.Box3().setFromObject(seat)),false,'stairs must not intersect seats');
const topStep=Math.max(...stairTreads.map(o=>new T.Box3().setFromObject(o).max.y));
const topFloor=bus.assemblies.find(a=>a.id==='upper').detailMeshes['upper.floor'].find(o=>o.name==='Upper floor');
assert.ok(Math.abs(topStep-new T.Box3().setFromObject(topFloor).max.y)<.002,'top step meets upper floor');
const floor=lowerA.details['lower.floor'].getObjectByName('Lower floor');
const entryRay=new T.Raycaster(new T.Vector3(-3.52,2,-1.02),new T.Vector3(0,-1,0));
assert.equal(entryRay.intersectObject(floor).length,0,'entry floor must leave room above the step');
const block=bus.root.getObjectByName('Engine block'),rotor=bus.root.getObjectByName('Cooling rotor');
for(let i=0;i<=36;i++){
 drive('doors',i/36);bus.root.updateMatrixWorld(true);
 frontDoors.details['doors.leaf'].traverse(o=>{if(o.isMesh)assert.ok(new T.Box3().setFromObject(o).max.z<-1.24,'door sweeps outside shell and steps');});
 drive('engine',i/36);bus.root.updateMatrixWorld(true);
 rotor.traverse(o=>{if(o.isMesh)assert.equal(new T.Box3().setFromObject(o).intersectsBox(new T.Box3().setFromObject(block)),false,'rotor clears engine across full rotation');});
}
reset();console.log(`PASS doubledecker inspection: ${details.length} real details, ${glass.length} physical panes, window/entry apertures, six connected steps and 37 door/fan positions.`);

// Check actual tire, shoulder and tread vertices against the retained floor volume.
reset();bus.root.updateMatrixWorld(true);const floorBounds=new T.Box3().setFromObject(floor);let testedWheelVertices=0;
for(const id of ['wheels.tire','wheels.tread'])for(const mesh of bus.assemblies.find(a=>a.id==='wheels').detailMeshes[id]){
 const p=mesh.geometry.attributes.position;for(let i=0;i<p.count;i++){
  const w=mesh.localToWorld(new T.Vector3().fromBufferAttribute(p,i));if(w.y<floorBounds.min.y||w.y>floorBounds.max.y)continue;
  testedWheelVertices++;const r=new T.Raycaster(new T.Vector3(w.x,5,w.z),new T.Vector3(0,-1,0));assert.equal(r.intersectObject(floor).length,0,'wheel shoulder/tread must clear the floor aperture');
 }
}
assert.ok(testedWheelVertices>100);console.log('PASS '+testedWheelVertices+' wheel vertices clear the lower floor.');

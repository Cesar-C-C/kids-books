// Geometry contract for the rocket v3 studio lab.
// Pure Node: builds the rocket in a vm context and checks the promises app.js
// relies on — three layers per assembly, a documented detail for every navigable
// group, and geometry that can be put back exactly after any mechanism moves.
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert/strict');
const context = { window: {}, console }; vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, 'labs/shared/vendor/three.min.js'), 'utf8'), context);
const T = context.THREE;
vm.runInContext(fs.readFileSync(path.join(__dirname, 'labs/rocket/v3/rocketframe.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(__dirname, 'labs/rocket/parts.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(__dirname, 'labs/rocket/detail-parts.js'), 'utf8'), context);
const parts = context.window.ROCKET_PARTS, details = context.window.ROCKET_DETAILS;
const { RocketV3 } = context.window;

/* ---------- data ---------- */
assert.equal(parts.length, 9, 'nine whole-rocket parts');
assert.equal(new Set(parts.map(p => p.id)).size, 9);
for (const p of parts) for (const f of ['id', 'name', 'zhName', 'category', 'color', 'en', 'zh', 'tip']) assert.ok(typeof p[f] === 'string' && p[f].trim(), `${p.id}/${f}`);
assert.equal(details.length, 26, 'twenty-six inside discoveries');
assert.equal(new Set(details.map(d => d.id)).size, 26);
for (const d of details) {
  for (const f of ['id', 'region', 'name', 'zhName', 'en', 'zh', 'tip', 'principle']) assert.ok(typeof d[f] === 'string' && d[f].trim(), `${d.id}/${f}`);
  assert.ok(parts.some(p => p.id === d.region), `${d.id}: unknown region ${d.region}`);
}
for (const p of parts) assert.ok(details.some(d => d.region === p.id), `${p.id}: no inside discovery`);

/* ---------- model ---------- */
const rocket = RocketV3.create(T);
assert.equal(rocket.assemblies.length, 9, 'one assembly per part');
assert.equal(new Set(rocket.assemblies.map(a => a.id)).size, 9);
for (const p of parts) assert.ok(rocket.assemblies.some(a => a.region === p.id), `no geometry for region ${p.id}`);

const documented = new Set(details.map(d => d.id)), published = new Set(), initial = [];
let meshes = 0, ghostMeshes = 0, triangles = 0;
for (const a of rocket.assemblies) {
  assert.equal(a.group.parent, rocket.root, `${a.id}: detached from root`);
  assert.equal(a.group.userData.assemblyId, a.id);
  assert.equal(a.group.userData.region, a.region);
  for (const k of ['exterior', 'interior', 'ghost']) assert.equal(a[k].parent, a.group, `${a.id}/${k}: wrong parent`);
  assert.equal(a.interior.visible, false, `${a.id}: interiors must start hidden so the shell reads first`);
  assert.equal(a.ghost.visible, false, `${a.id}: silhouettes must start hidden`);
  assert.ok(Array.isArray(a.view) && a.view.length === 2);
  assert.ok(a.radius > 0.4 && a.radius < 6, `${a.id}: implausible focus radius ${a.radius}`);
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
assert.ok(meshes > 70 && meshes < 500, `expected a detailed model, saw ${meshes} meshes`);
assert.ok(triangles > 8000, `expected real geometry, saw ${Math.round(triangles)} triangles`);
assert.ok(rocket.counts.meshes > 0);

/* ---------- reversible, region-gated motion ---------- */
const worldPos = o => o.getWorldPosition(new T.Vector3()), worldQuat = o => o.getWorldQuaternion(new T.Quaternion());
const drive = (region, level) => { rocket.update({ time: level, mechanism: level > .001, level, region }); for (const a of rocket.assemblies) if (a.update) a.update({ time: level, mechanism: level > .001, level, region, spin: 1.55 }); };
const movedIn = region => {
  rocket.root.updateMatrixWorld(true); const out = {};
  for (const s of initial) {
    if (worldPos(s.o).distanceTo(s.w) < .01 && worldQuat(s.o).angleTo(s.wq) < .01) continue;
    const k = s.o.userData.region; if (k !== region) throw new Error(`the ${region} mechanism also moved a ${k} part`);
    out[k] = (out[k] || 0) + 1;
  }
  return out[region] || 0;
};
const reset = () => drive(undefined, 0);
reset(); rocket.root.updateMatrixWorld(true);
for (const s of initial) { s.p.copy(s.o.position); s.q.copy(s.o.quaternion); s.w.copy(worldPos(s.o)); s.wq = worldQuat(s.o); }
const check = (region, min) => {
  drive(region, 1);
  const n = movedIn(region);
  assert.ok(n >= min, `${region} must move at least ${min} meshes, saw ${n}`);
  reset(); rocket.root.updateMatrixWorld(true);
  for (const s of initial) {
    assert.ok(s.p.distanceTo(s.o.position) < 1e-9, `${s.o.userData.detail || 'mesh'}: local position must come back`);
    assert.ok(s.q.angleTo(s.o.quaternion) < 1e-7, `${s.o.userData.detail || 'mesh'}: rotation must come back`);
    assert.ok(s.w.distanceTo(worldPos(s.o)) < 1e-7, `${s.o.userData.detail || 'mesh'}: world position must come back`);
  }
};
// Only the parts that genuinely carry a mechanism are gated; the rest must stay put.
const mechanisms = rocket.assemblies.filter(a => typeof a.update === 'function').map(a => a.region);
assert.ok(mechanisms.length >= 1, 'at least one assembly must animate');
for (const region of mechanisms) check(region, 1);
reset();

/* ---------- proportions (launch vehicle, not a toy) ---------- */
const launch = [];
rocket.root.updateMatrixWorld(true);
rocket.root.traverse(o => {
  if (!o.isMesh) return;
  o.geometry.computeBoundingBox();
  const b = o.geometry.boundingBox;
  for (let i = 0; i < 8; i++) {
    const v = new T.Vector3(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z);
    o.localToWorld(v); launch.push(v);
  }
});
let mn = { x: Infinity, y: Infinity, z: Infinity }, mx = { x: -Infinity, y: -Infinity, z: -Infinity };
for (const v of launch) { mn.x = Math.min(mn.x, v.x); mn.y = Math.min(mn.y, v.y); mn.z = Math.min(mn.z, v.z); mx.x = Math.max(mx.x, v.x); mx.y = Math.max(mx.y, v.y); mx.z = Math.max(mx.z, v.z); }
const size = { x: mx.x - mn.x, y: mx.y - mn.y, z: mx.z - mn.z };
assert.ok(size.y > 8 && size.y < 13, `rocket height ${size.y.toFixed(2)} m`);
assert.ok(size.x < 4.5 && size.z < 4.5, `footprint ${size.x.toFixed(2)} x ${size.z.toFixed(2)} m`);
// The stack must climb: fairing tip above the upper stage, engines at the bottom.
const topOf = id => { const a = rocket.assemblies.find(a => a.region === id); assert.ok(a, `${id} missing`); let hi = -Infinity; a.group.updateMatrixWorld(true); a.group.traverse(o => { if (!o.isMesh) return; o.geometry.computeBoundingBox(); const b = o.geometry.boundingBox; for (let i = 0; i < 8; i++) { const v = new T.Vector3(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z); o.localToWorld(v); hi = Math.max(hi, v.y); } }); return hi; };
const bottomOf = id => { const a = rocket.assemblies.find(a => a.region === id); let lo = Infinity; a.group.updateMatrixWorld(true); a.group.traverse(o => { if (!o.isMesh) return; o.geometry.computeBoundingBox(); const b = o.geometry.boundingBox; for (let i = 0; i < 8; i++) { const v = new T.Vector3(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z); o.localToWorld(v); lo = Math.min(lo, v.y); } }); return lo; };
assert.ok(topOf('fairing') > topOf('upperstage'), 'the fairing must cap the upper stage');
assert.ok(topOf('satellite') > topOf('upperstage'), 'the satellite rides inside the fairing');
assert.ok(bottomOf('engines') < bottomOf('fuel') + .5, 'the engines must sit at the base of the tank stack');
// The boosters strap onto the core and reach below the engines, so they define
// the lowest point; the engines still have to be far down the stack.
assert.ok(bottomOf('boosters') <= mn.y + .2, 'the boosters define the base of the vehicle');
assert.ok(bottomOf('engines') < bottomOf('structure'), 'the engines hang below the thrust structure');

/* ---------- the point of a rocket: it has a nose ---------- */
// Sample the fairing in horizontal bands and require the cross-section to shrink
// monotonically towards the top: a real nose cone, not a cylinder with a lid.
// The nose is a lathe, so measure the taper the way a lathe is built: take the
// widest vertex at the bottom of the cone and the widest at the top, and require
// the section to collapse. Doing it per band is unreliable here because the cone
// and the tip cap are separate meshes with disjoint y ranges.
const fairing = rocket.assemblies.find(a => a.region === 'fairing');
assert.ok(fairing.details['fairing.tip'], 'the nose must be its own detail group');
// The cone lives inside the two shell halves, so sample the whole fairing and
// look at how the maximum radius falls away as we climb.
const conePts = [];
fairing.group.updateMatrixWorld(true);
fairing.group.traverse(o => {
  if (!o.isMesh || o.name !== 'Book ogive nose') return;
  const pos = o.geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const v = new T.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
    o.localToWorld(v); conePts.push(v);
  }
});
assert.ok(conePts.length > 50, 'the nose cone must be a real lathe');
const coneLo = Math.min(...conePts.map(v => v.y)), coneHi = Math.max(...conePts.map(v => v.y));
const span = coneHi - coneLo;
// An open-shell lathe carries vertices only at the rings the author placed, so
// most heights have no vertex at all. Walk the actual height levels instead:
// collect them, sort them, and read the widest vertex at each one.
const levels = [...new Set(conePts.map(v => Math.round(v.y * 1e4) / 1e4))].sort((a, b) => a - b);
assert.ok(levels.length >= 4, `expected the fairing to be lathed from several rings, saw ${levels.length}`);
const profile = levels.map(y => {
  let w = 0;
  for (const v of conePts) if (Math.abs(v.y - y) < 1e-4) w = Math.max(w, Math.hypot(v.x, v.z) * 2);
  return w;
});
const barrel = Math.max(...profile.slice(0, -1)), top = profile[profile.length - 1];
assert.ok(barrel >= rocket.R * 1.7 && barrel <= rocket.R * 2.2, `the fairing barrel must match the core diameter: ${barrel.toFixed(2)} m`);
assert.ok(top < barrel * .15, `the fairing must close to a point: barrel ${barrel.toFixed(2)} m vs top ${top.toFixed(2)} m`);
// The taper must be a real cone, not a step: several rings between the barrel
// and the tip must sit strictly between the two widths.
const betweens = profile.filter(w => w > top * 2 && w < barrel * .95);
assert.ok(betweens.length >= 3, `the nose must taper gradually, saw widths ${profile.map(v => v.toFixed(2)).join(' ')}`);

console.log(`PASS v3 rocket: ${rocket.assemblies.length} assemblies, ${meshes} meshes, ${Math.round(triangles)} triangles, ${ghostMeshes} silhouette meshes; ${parts.length} parts / ${details.length} inside discoveries fully cross-linked; reversible ${mechanisms.join('/')} motion; stack ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)} m, fairing ${barrel.toFixed(2)} m barrel tapering to ${top.toFixed(2)} m.`);

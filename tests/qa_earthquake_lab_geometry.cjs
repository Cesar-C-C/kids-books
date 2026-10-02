const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const context = { window: {}, console };
vm.createContext(context);
for (const file of [
  'labs/shared/vendor/three.min.js',
  'labs/earthquake/v3/model.js',
  'labs/earthquake/parts.js',
  'labs/earthquake/detail-parts.js',
  'labs/earthquake/v3/geometry.js'
]) vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });

const THREE = context.THREE;
const model = context.window.EarthquakeModel;
const parts = context.window.EARTHQUAKE_PARTS;
const details = context.window.EARTHQUAKE_DETAILS;
const geology = context.window.EarthquakeGeometry.createGeology(THREE);
assert.ok(geology.root.isGroup, 'one stable scene root');
assert.ok(parts.length >= 8 && details.length >= 6, 'inspectable real geology is catalogued');
assert.equal(new Set(parts.map(p => p.id)).size, parts.length);
assert.equal(new Set(details.map(d => d.id)).size, details.length);
const groupIds = new Set();
const detailIds = new Set();
const meshes = [];
geology.root.traverse(object => {
  if (object.userData.partId) groupIds.add(object.userData.partId);
  if (object.userData.detailId) detailIds.add(object.userData.detailId);
  if (object.isMesh) meshes.push(object);
});
for (const part of parts) {
  assert.ok(part.id && part.conceptId && part.region, 'part has stable semantic identity');
  assert.ok(groupIds.has(part.id), `${part.id} must identify real scene geometry`);
}
for (const detail of details) {
  assert.ok(detail.id && detail.conceptId && detail.region, 'detail has stable semantic identity');
  assert.ok(parts.some(p => p.id === detail.region), `${detail.id}: known region`);
  assert.ok(detailIds.has(detail.id), `${detail.id}: selectable detail geometry exists`);
}
assert.ok(meshes.length >= 10, 'actual layered block, fault and evidence markers exist');
assert.equal(groupIds.has('surface-candidates'), false, 'fixed-answer geometry is retired in favor of source projection');

const getAnchor = key => {
  geology.root.updateMatrixWorld(true);
  const p = geology.anchors[key].getWorldPosition(new THREE.Vector3());
  return { x: p.x, y: p.y, z: p.z };
};
const beforeRoot = geology.root;
const before = Object.fromEntries(Object.keys(geology.anchors).map(key => [key, getAnchor(key)]));
assert.ok(Math.abs(before.focus.x - model.FOCUS.x) < 1e-8 && Math.abs(before.focus.y - model.FOCUS.y) < 1e-8);
assert.ok(Math.abs(before.epicenter.x - model.EPICENTER.x) < 1e-8 && Math.abs(before.epicenter.y) < 1e-8);
for (const flag of model.FLAGS) assert.ok(Math.abs(before[flag.id].x - flag.position.x) < 1e-8);
const hanging = geology.root.children.find(object => object.userData.partId === 'hanging-wall');
const marker = hanging.children.find(object => object.name === 'Moving half of the marker');
const soil = hanging.children.find(object => object.name === 'Topsoil follows its own block');
assert.ok(soil && soil.parent === hanging, 'topsoil moves with its block rather than bridging a slipped fault');
const rock = hanging.children.find(object => object.name === 'Continuous right rock wedge');
const restVertices = Array.from(rock.geometry.attributes.position.array);
const locked = Array.from({ length: 3 }).reduce(state => model.stepFault(state, { drive: true }), model.createFault());
geology.renderFault(locked);
assert.equal(hanging.position.y, 0, 'locked rock must not visually slip before threshold');
assert.ok(marker.geometry.attributes.position.getY(0) > marker.geometry.attributes.position.getY(1), 'marker bends near locked seam');
assert.notDeepEqual(Array.from(rock.geometry.attributes.position.array), restVertices, 'stored strain deforms the visible rock proxy, not only its marker');
geology.renderType('normal', 0.6);
assert.deepEqual(Array.from(rock.geometry.attributes.position.array), restVertices, 'independent loading comparison clears elastic deformation');
assert.ok(Math.abs(marker.geometry.attributes.position.getY(0) + 0.18) < 1e-6, 'a separate fault-type preset clears prior elastic bending');
assert.ok(hanging.position.y < 0, 'normal preset moves the hanging wall down');
const fault = Array.from({ length: 20 }, (_, index) => index).reduce(state => model.stepFault(state, { drive: true }), model.createFault());
geology.renderFault(fault);
geology.renderType('strike-slip', 0.6);
geology.renderFocus('epicenter');
geology.renderWave(model.stepWave(model.createWave()));
const particle = geology.root.children.find(object => object.userData.partId === 'particle');
const tracked = particle.children.find(object => object.name === 'Amber tracked particle');
let pWave = model.createWave({ mode: 'p' });
for (let i = 0; i < Math.ceil(pWave.trackedRadius / 0.16) + 2; i++) pWave = model.stepWave(pWave);
geology.renderWave(pWave);
const radial = new THREE.Vector3(model.TRACKED_POINT.x - model.FOCUS.x, model.TRACKED_POINT.y - model.FOCUS.y, 0).normalize();
assert.ok(Math.abs(tracked.position.x * radial.y - tracked.position.y * radial.x) < 1e-7, 'P particle displacement is radial to the diagonal wavefront');
let sWave = model.createWave({ mode: 's' });
for (let i = 0; i < Math.ceil(sWave.trackedRadius / 0.1) + 2; i++) sWave = model.stepWave(sWave);
geology.renderWave(sWave);
assert.ok(Math.abs(tracked.position.x * radial.x + tracked.position.y * radial.y) < 1e-7, 'S particle displacement is transverse to propagation');
const nearFlag = geology.root.children.find(object => object.userData.partId === 'near-flag');
const pArrival = nearFlag.children.find(object => object.name === 'near P arrival');
const sArrival = nearFlag.children.find(object => object.name === 'near S arrival');
const surfaceParticle = nearFlag.children.find(object => object.name === 'near local surface rock');
assert.ok(surfaceParticle, 'surface rock particle is actual geometry, not only an arrival lamp');
let beforeS = model.createWave({ mode: 's' });
for (let i = 0; i < beforeS.arrivalTicks.near.p; i++) beforeS = model.stepWave(beforeS);
geology.renderWave(beforeS);
assert.equal(pArrival.visible, false, 'P evidence is hidden in S-only mode');
assert.equal(sArrival.visible, false, 'S evidence waits for its own arrival');
for (let i = beforeS.tick; i < beforeS.arrivalTicks.near.s; i++) beforeS = model.stepWave(beforeS);
geology.renderWave(beforeS);
assert.equal(sArrival.visible, true, 'S evidence appears at S arrival');
geology.renderWave(beforeS = { ...beforeS, mode: 'combined' });
assert.equal(pArrival.visible, true, 'combined view retains P evidence');
assert.equal(sArrival.visible, true, 'combined view retains S evidence');
const surfaceOffset = model.particleDisplacement(beforeS, model.FLAGS[0].position, 's');
assert.ok(Math.abs(surfaceParticle.position.x - surfaceOffset.x) < 1e-8 && Math.abs(surfaceParticle.position.y - 0.08 - surfaceOffset.y) < 1e-8, 'surface particle follows its own local wave displacement');
for (const source of model.FOCI) {
  geology.setSource(source);
  assert.deepEqual(getAnchor('focus'), { ...source }, 'source is grounded on the selected fault location');
  assert.deepEqual(getAnchor('epicenter'), { x: source.x, y: 0, z: source.z }, 'epicenter is the exact vertical projection, not a fixed answer');
}
let ended = model.createWave();
for (let i = 0; i < 82; i++) ended = model.stepWave(ended);
geology.renderWave(ended);
const fronts = geology.root.children.find(object => object.userData.partId === 'wavefront');
assert.ok(fronts.children.every(front => !front.visible), 'terminal wavefronts leave the scene instead of enclosing it in giant shells');
assert.equal(tracked.position.length(), 0, 'local rock returns to its own rest position');
geology.renderType('reverse', 0);
geology.renderWave(model.createWave());
geology.setCutaway(true);
geology.setCutaway(false);
assert.equal(geology.root, beforeRoot, 'card and cutaway changes keep the same root object');
for (const key of Object.keys(before)) assert.deepEqual(getAnchor(key), before[key], `${key} retains its world coordinate`);
assert.equal(fault.slipOffset > 0, true, 'cutaway cannot alter the pure model snapshot');
const metrics = geology.metrics();
assert.ok(metrics.triangles > 100 && metrics.triangles < 6000, `triangle budget: ${metrics.triangles}`);
assert.ok(metrics.drawCalls > 10 && metrics.drawCalls < 80, `draw-call budget: ${metrics.drawCalls}`);
geology.dispose();
console.log(`Earthquake continuous geology: ${meshes.length} meshes, ${metrics.triangles} triangles, ${metrics.drawCalls} draws PASS`);

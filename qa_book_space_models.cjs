// Book-reference geometry regressions; does not claim browser visual validation.
const fs = require('fs'), vm = require('vm'), assert = require('assert/strict');
const ctx = { window: {}, console }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync('labs/shared/vendor/three.min.js', 'utf8'), ctx);
const T = ctx.THREE;
const models = {};
for (const [id, api] of [['rocket', 'RocketV3'], ['station', 'StationV3']]) {
  vm.runInContext(fs.readFileSync(`labs/${id}/v3/${id}frame.js`, 'utf8'), ctx);
  models[id] = ctx.window[api].create(T);
  models[id].root.updateMatrixWorld(true);
  models[id].root.traverse(o => {
    if (!o.isMesh) return;
    assert.ok(o.userData.region && o.userData.assemblyId, `${id}: selectable mesh tags`);
    for (const n of o.geometry.attributes.position.array) assert.ok(Number.isFinite(n), `${id}: finite vertices`);
  });
}
const meshes = (model, name) => { const out = []; model.root.traverse(o => { if (o.isMesh && o.name === name) out.push(o); }); return out; };
const rocket = models.rocket, station = models.station;
assert.equal(meshes(rocket, 'Main bell nozzle').length, 1, 'book rocket has one main bell');
assert.equal(meshes(rocket, 'Swept tail fin').length, 4, 'ivory tail fins restored');
assert.ok(meshes(rocket, 'Nose band')[0].position.y < meshes(rocket, 'Porthole')[0].position.y, 'orange band sits below the porthole');
assert.equal(rocket.assemblies.find(a => a.id === 'boosters').defaultVisible, false, 'unillustrated boosters are optional');
assert.equal(rocket.assemblies.find(a => a.id === 'structure').detailLayer['structure.skin'], 'exterior');
assert.equal(meshes(station, 'Cross module barrel').length, 2, 'cross station silhouette');
assert.equal(meshes(station, 'Solar panel').length, 4, 'two compact panels per wing');
const solarBox = new T.Box3();
for (const mesh of meshes(station, 'Solar panel')) solarBox.union(new T.Box3().setFromObject(mesh));
assert.ok(solarBox.getSize(new T.Vector3()).z < 11, 'panels no longer dwarf the cabin');
const bag = meshes(station, 'Sleeping bag')[0];
const bagSize = new T.Box3().setFromObject(bag).getSize(new T.Vector3());
assert.ok(bagSize.y > bagSize.z * 3, 'sleeping bag stands along the cabin wall');
const initial = [];
station.update({ mechanism: false, level: 0 });
station.root.traverse(o => initial.push({ o, p: o.position.clone(), q: o.quaternion.clone() }));
for (const a of station.assemblies.filter(a => a.update)) {
  station.update({ region: a.id, mechanism: true, level: 1 });
  station.update({ region: a.id, mechanism: false, level: 0 });
  for (const s of initial) {
    assert.ok(s.p.distanceTo(s.o.position) < 1e-7, `${a.id}: reversible positions`);
    assert.ok(s.q.angleTo(s.o.quaternion) < 1e-7, `${a.id}: reversible rotations`);
  }
}
console.log('PASS book space models: reference silhouette, palette geometry, detail tags, finite meshes and station reset');

const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');
const THREE = require('./labs/shared/vendor/three.min.js');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(__dirname + '/labs/airplane/v3/engine.js', 'utf8'), context);
for (const side of [-1, 1]) {
  const e = context.window.EngineV3.create(THREE, { id: 'engine-' + side, side });
  assert.deepEqual(e.group.position.toArray(), [0, 0, 0]);
  assert.equal(Object.keys(e.details).length, 8);
  let meshes = 0, triangles = 0;
  e.group.traverse(o => {
    if (!o.isMesh) return;
    meshes++;
    assert.ok(Array.from(o.geometry.attributes.position.array).every(Number.isFinite));
    triangles += (o.geometry.index?.count || o.geometry.attributes.position.count) / 3;
  });
  assert.ok(meshes < 220, 'mesh budget');
  for (const [id, part] of Object.entries(e.details)) {
    let pickable = false;
    part.traverse(o => { if (o.isMesh && o.userData.detail === id) pickable = true; });
    assert.ok(pickable, id + ' requires selectable geometry');
  }
  assert.equal(e.ghost.visible, false);
  assert.equal(e.ghost.children.length, 2);
  const flow = e.interior.getObjectByName('flow-indicators');
  assert.equal(flow.visible, false);
  e.update({ time: .1, flow: 'both' });
  const before = flow.children.map(o => o.position.x);
  e.update({ time: .2, flow: 'both' });
  flow.children.forEach((o, i) => { assert.ok(o.position.x > before[i]); assert.ok(o.userData.nonPickable); });
  // The studio clones materials to isolate each assembly's observation state.
  e.group.traverse(o => {if(o.isMesh)o.material=o.material.clone();});
  const flowMaterials=flow.children.map(o=>o.material);
  e.update({ time: 0, flow: 'core', selected: 'engine.shaft' });
  flow.children.forEach((o,i)=>assert.equal(o.material,flowMaterials[i],'Animation must retain renderer material references'));
  e.details['engine.shaft'].traverse(o=>{if(o.isMesh)assert.ok(o.material.emissiveIntensity>0);});
  assert.equal(flow.children.filter(o => o.visible).length, 12);
  assert.ok(e.details['engine.shaft'].children[0].material.emissiveIntensity > 0);
  e.update({ time: 0, flow: 'off' });
  assert.equal(flow.visible, false);
  assert.equal(e.details['engine.shaft'].children[0].material.emissiveIntensity, 0);
  e.group.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(e.group);
  assert.ok(box.min.x >= -1.51 && box.max.x <= 1.32);
  assert.ok(box.max.z <= .66 && box.min.z >= -.66);
  console.log(`PASS side ${side}: ${meshes} meshes, ${triangles} triangles, 8 selectable details, bounds ${box.getSize(new THREE.Vector3()).toArray().map(v => v.toFixed(3))}`);
}

const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');

const context = { window: {}, console };
vm.createContext(context);
for (const file of [
  'labs/shared/vendor/three.min.js',
  'labs/station/v3/reference-details.js',
  'labs/station/v3/stationframe.js'
]) vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });

const T = context.THREE;
const model = context.window.StationV3.create(T);
model.root.updateMatrixWorld(true);
const services = model.assemblies.find(item => item.id === 'interior').details['interior.services'];
const names = new Map();
services.traverse(object => {
  if (object.isMesh) names.set(object.name, (names.get(object.name) || 0) + 1);
});
for (const [name, minimum] of [
  ['Cabin rib', 4],
  ['Ceiling light', 3],
  ['Air return grille', 2],
  ['Handrail', 2],
  ['Access panel', 2]
]) assert.ok((names.get(name) || 0) >= minimum, `${name} adds visible cabin context`);

// The shell radius is 0.645 model units. Context details must sit within it.
services.traverse(object => {
  if (!object.isMesh || !names.has(object.name)) return;
  if (!['Cabin rib', 'Ceiling light', 'Air return grille', 'Handrail', 'Access panel'].includes(object.name)) return;
  const p = object.geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const vertex = new T.Vector3().fromBufferAttribute(p, i).applyMatrix4(object.matrixWorld);
    assert.ok(Math.hypot(vertex.y, vertex.z) < .645, `${object.name} stays inside the pressure cabin`);
  }
});
console.log('PASS station cabin: installed ribs, lights, vents, rails and service panels');

/* Run against real Three.js. Catches missing parts, reversed/mixed airflow,
 * non-deterministic animation, broken cutaway, and sticky selection/isolation. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert/strict');
const THREE = require('./labs/shared/vendor/three.min.js');
const file = path.join(__dirname, 'labs/airplane/engine/model.js');
const context = {window:{}};
if (fs.existsSync(file)) vm.runInNewContext(fs.readFileSync(file, 'utf8'), context, {filename:file});
assert.equal(typeof context.window.EngineModel?.create, 'function', 'EngineModel.create must build the turbofan');
const model = context.window.EngineModel.create(THREE);
const ids = ['inlet','fan','bypass','compressor','combustor','turbine','shaft','nozzle'];
const state = {time:0, open:0, flow:'both', shaft:false, selected:null};
function update(patch) { model.update({...state, ...patch}); model.group.updateMatrixWorld(true); }
function points(flow) { let found; model.group.traverse(o => { if(o.isPoints && o.userData.flow === flow) found=o; }); return found; }
function snapshot() { const result=[]; model.group.traverse(o => { result.push(...o.position.toArray(), ...o.quaternion.toArray(), o.visible); if(o.isPoints) result.push(...o.geometry.attributes.position.array); }); return result; }
assert.ok(model.group.isGroup);
assert.ok(model.pickables.length > 120, 'Detailed engine requires real blades and multiple stages');
for(const id of ids) {
  assert.ok(model.parts[id]?.isObject3D, `Missing part ${id}`);
  assert.ok(model.anchors[id]?.isVector3, `Missing anchor ${id}`);
  assert.ok(model.pickables.some(m => m.userData.part === id), `${id} has no selectable geometry`);
}
for(const m of model.pickables) {
  assert.ok(ids.includes(m.userData.part));
  assert.ok(Array.from(m.geometry.attributes.position.array).every(Number.isFinite));
}
update({});
const bounds = new THREE.Box3().setFromObject(model.group).getSize(new THREE.Vector3());
assert.ok(bounds.x >= 7 && bounds.x < 12 && bounds.y > 3 && bounds.y < 6 && bounds.z > 3 && bounds.z < 6, `Unexpected engine proportions ${bounds.toArray()}`);
const initial=snapshot();
update({time:0.05});
assert.notDeepEqual(snapshot(), initial, 'Running time must animate actual geometry');
for(const flow of ['core','bypass']) {
  const cloud=points(flow); assert.ok(cloud, `Missing ${flow} particles`);
  update({}); const before=Array.from(cloud.geometry.attributes.position.array);
  update({time:0.05}); const after=Array.from(cloud.geometry.attributes.position.array);
  for(let i=0;i<before.length;i+=3) {
    if(before[i] < 3.7) assert.ok(after[i]>before[i], `${flow} must flow from inlet (-X) toward exhaust (+X)`);
    if(before[i]>-1.7 && before[i]<2.5) {
      const r=Math.hypot(before[i+1],before[i+2]);
      assert.ok(flow==='bypass' ? r>1.1 : r<1, `${flow} path crosses the other air stream`);
    }
  }
  update({});
  const coords=cloud.geometry.attributes.position.array, colors=cloud.geometry.attributes.color.array;
  for(let i=0;i<coords.length;i+=3) {
    if(flow==='bypass'||coords[i]<0.15) assert.ok(colors[i+2]>colors[i], 'Bypass and pre-combustion air must stay cool blue');
    if(flow==='core'&&coords[i]>0.75) assert.ok(colors[i]>colors[i+2], 'Core air must warm after the combustor');
  }
}
update({time:1});
assert.equal(model.group.getObjectByName('fan-rotor').rotation.x,model.group.getObjectByName('linked-shaft').rotation.x,'The schematic shared shaft must rotate with the fan');
assert.equal(model.group.getObjectByName('turbine-rotor').rotation.x,model.group.getObjectByName('linked-shaft').rotation.x,'The schematic shared shaft must rotate with the turbine');
update({flow:'core'}); assert.ok(points('core').visible); assert.equal(points('bypass').visible,false);
update({flow:'bypass'}); assert.ok(points('bypass').visible); assert.equal(points('core').visible,false);
update({flow:'off'}); assert.equal(points('core').visible,false); assert.equal(points('bypass').visible,false);
update({open:1}); assert.notDeepEqual(snapshot(),initial,'Cutaway must move shells');
update({}); assert.deepEqual(snapshot(),initial,'Absolute-time reset must restore geometry and flows');
const fanMesh=model.pickables.find(m=>m.userData.part==='fan');
const shaftMesh=model.pickables.find(m=>m.userData.part==='shaft');
const baseEmissive=fanMesh.material.emissive.getHex();
update({selected:'fan'}); assert.notEqual(fanMesh.material.emissive.getHex(),baseEmissive,'Selected part must visibly highlight');
update({shaft:true}); assert.ok(fanMesh.material.opacity < shaftMesh.material.opacity,'Linkage isolation must keep shaft legible');
update({}); assert.equal(fanMesh.material.opacity,1); assert.equal(fanMesh.material.emissive.getHex(),baseEmissive);
console.log(`PASS engine: 8 pickable parts, ${model.pickables.length} meshes; bounds ${bounds.toArray().map(n=>n.toFixed(2)).join(' × ')}; direction, separation, animation, cutaway, selection and reset verified.`);

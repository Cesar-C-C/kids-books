const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');

// A guided route must land in real cabin space, with its camera facing an
// installed discovery. A list of labels alone cannot make the cabin explorable.
const context = { window: {}, console };
vm.createContext(context);
for (const file of [
  'labs/shared/vendor/three.min.js',
  'labs/station/v3/reference-details.js',
  'labs/station/v3/stationframe.js',
  'labs/station/parts.js',
  'labs/station/detail-parts.js',
  'labs/station/v3/tour.js'
]) vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });

const T = context.THREE;
const model = context.window.StationV3.create(T);
model.root.updateMatrixWorld(true);
const tour = context.window.StationTour;
assert.ok(tour, 'station provides a guided interior route');
const stops = tour.stops;
const visited = new Set(stops.map(stop => stop.detail));
for (const id of [
  'interior.racks', 'interior.sleep', 'interior.table',
  'interior.treadmill', 'interior.plants', 'interior.crystals'
]) assert.ok(visited.has(id), `${id} is reachable on the route`);

for (const stop of stops) {
  const detail = context.window.STATION_DETAILS.find(item => item.id === stop.detail);
  assert.ok(detail, `${stop.detail} is a real lesson`);
  assert.equal(detail.region, 'interior', `${stop.detail} stays in the cabin`);
  const group = model.assemblies.find(item => item.id === 'interior').details[stop.detail];
  const anchor = group.getWorldPosition(new T.Vector3());
  const eye = new T.Vector3(...stop.eye);
  const look = new T.Vector3(...stop.look);
  assert.ok(look.distanceTo(anchor) < .22, `${stop.detail} camera faces the installed object`);
  assert.ok(eye.distanceTo(look) > .35 && eye.distanceTo(look) < 1.2, `${stop.detail} is a close view`);
  const inFore = eye.x < -.2 && Math.hypot(eye.y, eye.z) < .58;
  const inCross = eye.x >= -.2 && Math.hypot(eye.x - .2, eye.y) < .58;
  assert.ok(inFore || inCross, `${stop.detail} camera eye stays inside the teaching cabin`);
  const pose = tour.pose(stop);
  const reconstructed = new T.Vector3(
    Math.sin(pose.yaw) * Math.cos(pose.pitch) * pose.distance,
    Math.sin(pose.pitch) * pose.distance,
    Math.cos(pose.yaw) * Math.cos(pose.pitch) * pose.distance
  ).add(look);
  assert.ok(reconstructed.distanceTo(eye) < 1e-6, `${stop.detail} orbit camera reaches the stop`);
}
console.log(`PASS station tour: ${stops.length} installed close views inside the cabin`);

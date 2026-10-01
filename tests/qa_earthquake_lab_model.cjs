const assert = require('node:assert/strict');
const { createFault, stepFault, resetFault, faultMotion, FAULT_DIP, FOCUS, EPICENTER, TRACKED_POINT, FLAGS, createWave, stepWave, particleOffset } = require('../labs/earthquake/v3/model.js');

const run = (preset, inputs) => inputs.reduce((state, drive) => stepFault(state, { drive }), createFault({ contactPreset: preset }));
const driveUntilSlip = preset => {
  let state = createFault({ contactPreset: preset });
  const history = [state];
  for (let i = 0; i < 80 && !state.justSlipped; i++) {
    state = stepFault(state, { drive: true });
    history.push(state);
  }
  return history;
};

const first = driveUntilSlip('low');
const before = first.slice(1, -1);
assert.ok(before.length >= 3, 'locked rock must visibly bend before slip');
assert.ok(before.every(s => s.phase === 'locked' && s.slipOffset === 0), 'locked fault does not creep');
assert.ok(before.every((s, i) => i === 0 || s.elasticStrain > before[i - 1].elasticStrain), 'strain builds under drive');
assert.equal(first.at(-1).phase, 'slipped');
assert.equal(first.at(-1).justSlipped, true);
assert.ok(first.at(-1).slipOffset > 0, 'slip leaves a permanent marker offset');
assert.ok(first.at(-1).elasticStrain < first.at(-2).elasticStrain, 'stored elastic strain partly rebounds');

const paused = run('low', [true, true, false, false, false]);
assert.equal(paused.phase, 'locked', 'releasing the drive cannot schedule late slip');
assert.equal(paused.slipOffset, 0);
assert.equal(paused.elasticStrain, run('low', [true, true]).elasticStrain);
const settled = run('low', [...Array(first.length - 1).fill(true), ...Array(8).fill(false)]);
assert.equal(settled.phase, 'settled');
assert.equal(settled.justSlipped, false);
assert.equal(settled.slipOffset, first.at(-1).slipOffset, 'permanent offset survives settling');
assert.deepEqual(resetFault(settled), createFault({ contactPreset: 'low' }), 'reset clears the experiment');

const sequence = [...Array(30).fill(true), ...Array(12).fill(false)];
assert.deepEqual(run('low', sequence), run('low', sequence), 'same input ticks produce identical state regardless of render cadence');
let longRun = createFault();
for (let i = 0; i < 600; i++) longRun = stepFault(longRun, { drive: i % 3 === 0 });
assert.equal(longRun.tick, 600, 'one input call advances exactly one fixed tick');
for (const value of [longRun.driverDisplacement, longRun.elasticStrain, longRun.slipOffset]) {
  assert.ok(Number.isFinite(value) && value >= 0 && value < 100, '600-tick state remains bounded and finite');
}

const low = driveUntilSlip('low');
const high = driveUntilSlip('high');
assert.ok(high.length > low.length, 'higher static contact limit must delay onset under identical drive');
const lowParams = low[0].parameters;
const highParams = high[0].parameters;
assert.deepEqual(Object.keys(lowParams).sort(), Object.keys(highParams).sort());
for (const key of Object.keys(lowParams)) {
  if (key === 'staticLimit') continue;
  assert.equal(lowParams[key], highParams[key], `${key} must stay fixed across contact presets`);
}
assert.ok(highParams.staticLimit > lowParams.staticLimit, 'static friction limit is the sole changed condition');
assert.ok(high.at(-2).elasticStrain > low.at(-2).elasticStrain, 'later onset stores more illustrative strain');
assert.deepEqual(driveUntilSlip('low'), low, 'contact response is repeatable');
console.log('Earthquake fault model: deterministic loading, slip, rebound, and single-variable contact gate PASS');

const reverse = faultMotion('reverse', 1);
const normal = faultMotion('normal', 1);
const strike = faultMotion('strike-slip', 1);
assert.ok(reverse.hangingWall.x < 0 && reverse.hangingWall.y > 0, 'reverse hanging wall climbs the +X-dipping plane');
assert.ok(normal.hangingWall.x > 0 && normal.hangingWall.y < 0, 'normal hanging wall descends down dip');
assert.ok(Math.abs(reverse.hangingWall.x + FAULT_DIP * reverse.hangingWall.y) < 1e-9, 'reverse movement follows, not crosses, the dipping plane');
assert.ok(Math.abs(normal.hangingWall.x + FAULT_DIP * normal.hangingWall.y) < 1e-9, 'normal movement follows the same plane');
assert.equal(strike.hangingWall.y, 0);
assert.equal(strike.footwall.y, 0);
assert.ok(strike.hangingWall.z * strike.footwall.z < 0, 'strike-slip blocks move in opposite strike directions');
assert.deepEqual(reverse.marker.hangingWall, reverse.hangingWall, 'marker segment follows the moved block');
assert.deepEqual(normal.marker.hangingWall, normal.hangingWall);
assert.ok(reverse.driver.x < 0 && normal.driver.x > 0, 'arrows match compression versus extension');

assert.ok(FOCUS.y < 0, 'focus is below the surface');
assert.ok(Math.abs(FOCUS.x + FAULT_DIP * FOCUS.y) < 1e-9, 'rupture starts on the drawn fault plane');
assert.equal(EPICENTER.y, 0, 'epicenter is on the surface');
assert.equal(FOCUS.x, EPICENTER.x);
assert.equal(FOCUS.z, EPICENTER.z);
const wave = createWave();
const near = wave.arrivalTicks[FLAGS[0].id];
const far = wave.arrivalTicks[FLAGS[1].id];
assert.ok(near.p < far.p && near.s < far.s, 'near flag receives each wave first');
assert.ok(near.p < near.s && far.p < far.s, 'P precedes S at the same flag');
const equal = createWave({ flags: [{ id: 'left', position: { x: -0.92, y: 0, z: 0 } }, { id: 'right', position: { x: 3.08, y: 0, z: 0 } }] });
assert.equal(equal.arrivalTicks.left.p, equal.arrivalTicks.right.p, 'equal-distance flags receive P together');
assert.equal(equal.arrivalTicks.left.s, equal.arrivalTicks.right.s, 'equal-distance flags receive S together');
assert.ok(Math.abs(wave.trackedRadius - Math.hypot(TRACKED_POINT.x - FOCUS.x, TRACKED_POINT.y - FOCUS.y, TRACKED_POINT.z - FOCUS.z)) < 1e-9, 'particle pulse is timed to its own position, not the surface flag');
let atPulse = wave;
for (let i = 0; i < near.p + 2; i++) atPulse = stepWave(atPulse);
const p = particleOffset(atPulse, 'p');
assert.ok(Math.abs(p.radial) > 0.001 && p.tangential === 0, 'P moves the point radially near its fixed origin');
let atS = atPulse;
for (let i = atS.tick; i < near.s + 2; i++) atS = stepWave(atS);
const s = particleOffset(atS, 's');
assert.ok(Math.abs(s.tangential) > 0.001 && s.radial === 0, 'S moves the point transversely');
let after = atS;
for (let i = 0; i < 60; i++) after = stepWave(after);
assert.deepEqual(particleOffset(after, 'p'), { radial: 0, tangential: 0 }, 'P particle returns to origin after the pulse');
assert.deepEqual(particleOffset(after, 's'), { radial: 0, tangential: 0 }, 'S particle returns to origin after the pulse');
console.log('Earthquake fault types, focus projection, arrival order, and local particle motion PASS');

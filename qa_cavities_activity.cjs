const assert = require('node:assert');
const path = require('node:path');

const api = require(path.join(__dirname, 'books/cavities/cavities.js'));

assert.deepEqual(api.BRUSH_ZONES, ['outer', 'inner', 'chewing']);
const empty = {completed: []};
const one = api.markZone(empty, 'outer');
assert.deepEqual(empty, {completed: []});
assert.deepEqual(one, {completed: ['outer']});
assert.deepEqual(api.markZone(one, 'outer'), one);
assert.throws(() => api.markZone(one, 'tongue'), /Unknown brush zone/);
assert.equal(api.remainingMs(1000, 1000, 120000), 120000);
assert.equal(api.remainingMs(1000, 61000, 120000), 60000);
assert.equal(api.remainingMs(1000, 130000, 120000), 0);

function makeClock(initialNow = 1000) {
  let currentNow = initialNow;
  let nextId = 1;
  const active = new Map();
  return {
    now: () => currentNow,
    advance(ms) { currentNow += ms; },
    setInterval(callback) {
      const id = nextId++;
      active.set(id, callback);
      return id;
    },
    clearInterval(id) { active.delete(id); },
    tick() { for (const callback of [...active.values()]) callback(); },
    activeCount: () => active.size
  };
}

{
  const clock = makeClock();
  const updates = [];
  const timer = api.createTimerController({
    durationMs: 120000,
    now: clock.now,
    setInterval: clock.setInterval,
    clearInterval: clock.clearInterval,
    onTick: state => updates.push(state)
  });

  assert.deepEqual(timer.getState(), {status: 'idle', remaining: 120000});
  timer.start();
  timer.start();
  assert.equal(clock.activeCount(), 1, 'repeated starts never create duplicate intervals');
  clock.advance(60000);
  clock.tick();
  assert.deepEqual(timer.getState(), {status: 'running', remaining: 60000});

  timer.pause();
  assert.equal(clock.activeCount(), 0, 'pause clears the active interval');
  clock.advance(10000);
  timer.resume();
  assert.equal(clock.activeCount(), 1, 'resume creates one interval');
  clock.advance(60000);
  clock.tick();
  assert.deepEqual(timer.getState(), {status: 'finished', remaining: 0});
  assert.equal(clock.activeCount(), 0, 'completion clears the interval');
  assert.ok(updates.some(state => state.status === 'finished'));
}

{
  const clock = makeClock();
  const timer = api.createTimerController({
    now: clock.now,
    setInterval: clock.setInterval,
    clearInterval: clock.clearInterval,
    onTick() {}
  });
  timer.start();
  clock.advance(30000);
  clock.tick();
  timer.suspend();
  assert.deepEqual(timer.getState(), {status: 'paused', remaining: 90000});
  assert.equal(clock.activeCount(), 0, 'page exit or visibility suspension clears the interval');
  timer.reset();
  assert.deepEqual(timer.getState(), {status: 'idle', remaining: 120000});
}

console.log('cavities activity: OK');

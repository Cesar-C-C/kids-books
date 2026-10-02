(function (root) {
  'use strict';

  const BASE = Object.freeze({
    driveIncrement: 0.04,
    stiffness: 1,
    dynamicResistance: 0.18,
    mass: 1,
    damping: 0.3,
    settleTicks: 6
  });
  const LIMITS = Object.freeze({ low: 0.48, high: 0.72 });
  const FAULT_DIP = 0.45;
  const round = n => Math.round(n * 1e9) / 1e9;

  function createFault({ contactPreset = 'low' } = {}) {
    const preset = Object.prototype.hasOwnProperty.call(LIMITS, contactPreset) ? contactPreset : 'low';
    return {
      tick: 0,
      phase: 'initial',
      driverDisplacement: 0,
      elasticStrain: 0,
      slipOffset: 0,
      contactPreset: preset,
      justSlipped: false,
      settlingTicks: 0,
      parameters: { ...BASE, staticLimit: LIMITS[preset] }
    };
  }

  function stepFault(state, { drive = false } = {}) {
    const next = { ...state, tick: state.tick + 1, justSlipped: false };
    if (state.phase === 'settled') return next;
    if (state.phase === 'slipped') {
      next.settlingTicks = Math.min(state.settlingTicks + 1, state.parameters.settleTicks);
      if (next.settlingTicks >= state.parameters.settleTicks) next.phase = 'settled';
      return next;
    }
    if (!drive) return next;

    next.driverDisplacement = round(state.driverDisplacement + state.parameters.driveIncrement);
    next.elasticStrain = round(state.elasticStrain + state.parameters.driveIncrement * state.parameters.stiffness);
    if (next.elasticStrain < state.parameters.staticLimit) {
      next.phase = 'locked';
      return next;
    }

    next.phase = 'slipped';
    next.justSlipped = true;
    next.slipOffset = round(next.elasticStrain - state.parameters.dynamicResistance);
    next.elasticStrain = state.parameters.dynamicResistance;
    return next;
  }

  function resetFault(state) {
    return createFault({ contactPreset: state.contactPreset });
  }

  // Dimensionless spring energy for this teaching model, not earthquake magnitude.
  function storedEnergy(state) {
    return round(0.5 * state.parameters.stiffness * state.elasticStrain ** 2);
  }

  function advanceObservation(state) {
    if (state.phase === 'settled') return state;
    const target = state.phase === 'initial' ? 'locked' : state.phase === 'locked' ? 'slipped' : 'settled';
    let next = state;
    for (let i = 0; i < 64; i++) {
      next = stepFault(next, { drive: true });
      if (target === 'locked' ? i >= 7 : next.phase === target) return next;
    }
    return next;
  }

  function faultMotion(type, amount) {
    const level = Math.max(0, Math.min(1, Number(amount) || 0));
    let hangingWall;
    let footwall;
    let driver;
    if (type === 'normal') {
      hangingWall = { x: level * 0.55 * FAULT_DIP, y: -level * 0.55, z: 0 };
      footwall = { x: 0, y: 0, z: 0 };
      driver = { x: level, y: 0, z: 0 };
    } else if (type === 'strike-slip') {
      hangingWall = { x: 0, y: 0, z: level * 0.55 };
      footwall = { x: 0, y: 0, z: -level * 0.55 };
      driver = { x: 0, y: 0, z: level };
    } else {
      hangingWall = { x: -level * 0.55 * FAULT_DIP, y: level * 0.55, z: 0 };
      footwall = { x: 0, y: 0, z: 0 };
      driver = { x: -level, y: 0, z: 0 };
    }
    return { hangingWall, footwall, driver, marker: { hangingWall: { ...hangingWall }, footwall: { ...footwall } } };
  }

  const FOCUS = Object.freeze({ x: 2.4 * FAULT_DIP, y: -2.4, z: 0 });
  const EPICENTER = Object.freeze({ x: FOCUS.x, y: 0, z: FOCUS.z });
  const FOCI = Object.freeze([FOCUS, Object.freeze({ x: 1.4 * FAULT_DIP, y: -1.4, z: 0.8 })]);
  const FLAGS = Object.freeze([
    Object.freeze({ id: 'near', position: Object.freeze({ x: 0.5, y: 0, z: 0 }) }),
    Object.freeze({ id: 'far', position: Object.freeze({ x: 3, y: 0, z: 0 }) })
  ]);
  const TRACKED_POINT = Object.freeze({ x: FLAGS[0].position.x, y: -0.34, z: FLAGS[0].position.z });
  const WAVE_SPEED = Object.freeze({ p: 0.16, s: 0.1 });
  const TRACKED_RADIUS = Math.hypot(TRACKED_POINT.x - FOCUS.x, TRACKED_POINT.y - FOCUS.y, TRACKED_POINT.z - FOCUS.z);

  function distanceFromFocus(point, focus = FOCUS) {
    return Math.hypot(point.x - focus.x, point.y - focus.y, point.z - focus.z);
  }

  function createWave({ mode = 'combined', flags = FLAGS, focus = FOCUS } = {}) {
    const acceptedMode = ['p', 's', 'combined'].includes(mode) ? mode : 'combined';
    const arrivalTicks = {};
    for (const flag of flags) {
      const distance = distanceFromFocus(flag.position, focus);
      arrivalTicks[flag.id] = {
        p: Math.ceil(distance / WAVE_SPEED.p),
        s: Math.ceil(distance / WAVE_SPEED.s)
      };
    }
    return {
      tick: 0,
      focus: { ...focus },
      mode: acceptedMode,
      frontRadius: { p: 0, s: 0 },
      arrivalTicks,
      trackedRadius: distanceFromFocus(TRACKED_POINT, focus)
    };
  }

  function stepWave(state) {
    const tick = state.tick + 1;
    return {
      ...state,
      tick,
      frontRadius: { p: round(tick * WAVE_SPEED.p), s: round(tick * WAVE_SPEED.s) }
    };
  }

  function particleOffset(state, kind, point = TRACKED_POINT) {
    if (kind !== 'p' && kind !== 's') return { radial: 0, tangential: 0 };
    const pulseWidth = 0.9;
    const passed = state.frontRadius[kind] - distanceFromFocus(point, state.focus || FOCUS);
    if (passed <= 0 || passed >= pulseWidth) return { radial: 0, tangential: 0 };
    const displacement = round(Math.sin(2 * Math.PI * passed / pulseWidth) * 0.22);
    return kind === 'p'
      ? { radial: displacement, tangential: 0 }
      : { radial: 0, tangential: displacement };
  }

  function particleDisplacement(state, point, kind) {
    const pulse = particleOffset(state, kind, point);
    if (!pulse.radial && !pulse.tangential) return { x: 0, y: 0, z: 0 };
    const focus = state.focus || FOCUS;
    const dx = point.x - focus.x, dy = point.y - focus.y, dz = point.z - focus.z;
    const length = Math.hypot(dx, dy, dz) || 1;
    const transverseLength = Math.hypot(dx, dy) || 1;
    return {
      x: round(dx / length * pulse.radial - dy / transverseLength * pulse.tangential),
      y: round(dy / length * pulse.radial + dx / transverseLength * pulse.tangential),
      z: round(dz / length * pulse.radial)
    };
  }

  const api = { createFault, stepFault, resetFault, storedEnergy, advanceObservation, faultMotion, FAULT_DIP, FOCUS, FOCI, EPICENTER, TRACKED_POINT, FLAGS, WAVE_SPEED, createWave, stepWave, particleOffset, particleDisplacement };
  root.EarthquakeModel = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);

(function (global) {
  'use strict';
  // Running gear of the teaching train: bogies, traction motors and the
  // pantograph. Each factory publishes the same assembly shape the airframe
  // does, so the controller drives every one of them through a single code path.
  // Axis: length -X (nose to the left), up +Y, right +Z. Metres, schematic.
  //
  // Vertical datum comes from the carriage the airframe draws:
  //   body underside  y = -0.61   (trainframe.js)
  //   bogie frame     y = -0.98   the H-frame the secondary springs stand on
  //   wheel centre    y = -1.24   radius 0.27 -> the tread rests on -1.51
  //   rail head top   y = -1.51
  // so the underframe ends up about 1.2 m above rail and the air spring gets a
  // readable 0.30 m of travel between frame and body.

  const RAIL_TOP = -1.51;
  const AXLE_Y = -1.24;
  const WHEEL_R = .27;
  const FRAME_Y = -.98;
  const MOTOR_Y = -1.26;

  function kit(T) {
    const S = (color, extra) => new T.MeshStandardMaterial(Object.assign({ color, roughness: .42, metalness: .3 }, extra));
    const M = {
      shell: S(0xd6dee2, { metalness: .55, roughness: .32, side: T.DoubleSide }),
      steel: S(0x647883, { metalness: .62, roughness: .32 }),
      dark: S(0x344958, { metalness: .4, roughness: .5 }),
      alloy: S(0xa8bcc4, { metalness: .58, roughness: .34 }),
      silver: S(0xccd9de, { metalness: .5, roughness: .3 }),
      gold: S(0xddb95c, { metalness: .45, roughness: .28 }),
      copper: S(0xb87333, { metalness: .7, roughness: .34 }),
      rubber: S(0x222b34, { roughness: .86, metalness: .06 }),
      orange: S(0xd79556, { metalness: .5, roughness: .36 }),
      glow: S(0xfff4d6, { emissive: 0xffd486, emissiveIntensity: .5, roughness: .25 }),
      ghost: new T.MeshBasicMaterial({ color: 0xbed0d4, transparent: true, opacity: .08, depthWrite: false, side: T.DoubleSide })
    };
    const mesh = (p, g, m, x = 0, y = 0, z = 0) => { const o = new T.Mesh(g, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; p.add(o); return o; };
    const box = (p, m, x, y, z, w, h, d) => mesh(p, new T.BoxGeometry(w, h, d), m, x, y, z);
    const rod = (p, m, a, b, r = .03) => {
      const av = new T.Vector3(...a), bv = new T.Vector3(...b), delta = bv.clone().sub(av);
      const o = mesh(p, new T.CylinderGeometry(r, r, delta.length(), 10), m);
      o.position.copy(av.add(bv).multiplyScalar(.5)); o.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize()); return o;
    };
    const slab = (p, m, x, y, z, w, h, d, r) => {
      const s = new T.Shape(), hw = w / 2, hh = h / 2; r = Math.min(r || .06, hw - .002, hh - .002);
      s.moveTo(-hw + r, -hh); s.lineTo(hw - r, -hh); s.quadraticCurveTo(hw, -hh, hw, -hh + r);
      s.lineTo(hw, hh - r); s.quadraticCurveTo(hw, hh, hw - r, hh);
      s.lineTo(-hw + r, hh); s.quadraticCurveTo(-hw, hh, -hw, hh - r);
      s.lineTo(-hw, -hh + r); s.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
      const g = new T.ExtrudeGeometry(s, { depth: d, bevelEnabled: false, curveSegments: 5 });
      g.translate(0, 0, -d / 2); return mesh(p, g, m, x, y, z);
    };
    // Disc with its axis along Z: the natural shape of a wheel, a gear or a rotor.
    const disc = (p, m, r, t, x, y, z, seg) => mesh(p, new T.CylinderGeometry(r, r, t, seg || 28), m, x, y, z).rotateX(Math.PI / 2);
    // Ring lying in the horizontal plane: flanges, spring seats, winding ends.
    const ring = (p, m, r, t, x, y, z, seg) => mesh(p, new T.TorusGeometry(r, t, 8, seg || 20), m, x, y, z).rotateX(Math.PI / 2);
    // Vertical can: air springs and insulators stand upright.
    const can = (p, m, r, h, x, y, z, seg) => mesh(p, new T.CylinderGeometry(r, r, h, seg || 24), m, x, y, z);
    return { M, mesh, box, rod, slab, disc, ring, can };
  }

  // Same assembly shape the airframe publishes: one group, three layers.
  function shellFor(T) {
    return function (id, region, center, radius, view) {
      const group = new T.Group(); group.name = id; group.userData = { region, assemblyId: id };
      const exterior = new T.Group(), interior = new T.Group(), ghost = new T.Group();
      group.add(exterior, interior, ghost); interior.visible = false; ghost.visible = false;
      return { id, region, group, exterior, interior, ghost, details: {}, center: new T.Vector3(...center), radius, view };
    };
  }

  // The airframe stamps region / detail onto every mesh as it builds. Running
  // gear is added to the root after that pass, so it stamps itself here — the
  // controller and the QA scripts both look these up on the mesh.
  function stamp(a) {
    a.group.traverse(o => {
      if (!o.isMesh) return;
      o.userData.assemblyId = a.id; o.userData.region = a.region;
      for (let p = o.parent; p && p !== a.group; p = p.parent) if (p.userData.detail) { o.userData.detail = p.userData.detail; break; }
    });
  }

  /* ============================================================
     BOGIE — H-frame, two wheelsets, primary springs, air springs
     ============================================================ */
  function createBogie(T, options) {
    const id = options.id, x = options.x;
    const K = kit(T), M = K.M, motions = [], shell = shellFor(T);
    const { mesh, box, rod, slab, disc, ring, can } = K;
    const a = shell(id, 'bogies', [x, -1.15, 0], 1.15, [1.6, -.05]);
    const detail = (name, parent) => { const g = new T.Group(); g.name = name; g.userData = { detail: name, region: 'bogies', assemblyId: id }; (parent || a.interior).add(g); a.details[name] = g; return g; };
    // Axle stations of this bogie: one motor and one gearbox serve each.
    const AX = [-.51, .51];

    // The H frame: two side members over the axleboxes, one cross member in
    // the middle that also carries the air springs.
    const frame = detail('bogies.frame', a.exterior);
    for (const z of [-.90, .90]) slab(frame, M.steel, x, FRAME_Y, z, 1.70, .14, .20, .05);
    slab(frame, M.steel, x, FRAME_Y, 0, .30, .14, 1.82, .05);
    for (const z of [-.90, .90]) {
      for (const dx of [-.72, .72]) box(frame, M.alloy, x + dx, FRAME_Y + .10, z, .16, .07, .22);
      box(frame, M.dark, x, FRAME_Y - .085, z, 1.62, .035, .21);
    }
    // Primary suspension: coil springs standing on the axleboxes.
    const wheelset = detail('bogies.wheelset', a.exterior);
    for (const dx of AX) {
      rod(wheelset, M.silver, [x + dx, AXLE_Y, -.80], [x + dx, AXLE_Y, .80], .070);
      for (const side of [-1, 1]) {
        const wheel = new T.Group(); wheel.position.set(x + dx, AXLE_Y, side * .78); wheelset.add(wheel);
        disc(wheel, M.dark, WHEEL_R, .118, 0, 0, 0, 30);
        disc(wheel, M.steel, WHEEL_R + .018, .028, 0, 0, -side * .064, 30);   // flange, track side inboard
        disc(wheel, M.silver, .105, .022, 0, 0, side * .068, 20);
        for (let b = 0; b < 5; b++) box(wheel, M.steel, Math.cos(b / 5 * 6.2832) * .165, Math.sin(b / 5 * 6.2832) * .165, side * .068, .018, .018, .018);
        motions.push({ group: wheel, region: 'bogies', id: 'bogies.wheelset', kind: 'spin' });
        // Axlebox outboard of each wheel, with the coil stack above it.
        box(wheelset, M.dark, x + dx, AXLE_Y, side * .90, .22, .22, .17);
        disc(wheelset, M.alloy, .108, .055, x + dx, AXLE_Y, side * .99, 20);
        for (let k = 0; k < 3; k++) ring(wheelset, M.silver, .086, .023, x + dx, -1.16 + k * .068, side * .90, 16);
      }
    }
    // Secondary suspension: air springs on the cross member, under the body.
    for (const z of [-.56, .56]) {
      can(a.exterior, M.steel, .195, .030, x, -.905, z, 22);
      ring(a.exterior, M.dark, .195, .017, x, -.888, z, 22);
    }
    const air = detail('bogies.airspring');
    for (const z of [-.56, .56]) {
      can(air, M.rubber, .168, .195, x, -.780, z, 24);
      for (const y of [-.845, -.760]) ring(air, M.rubber, .160, .016, x, y, z, 20);
      can(air, M.steel, .180, .030, x, -.690, z, 22);
      can(air, M.dark, .150, .022, x, -.668, z, 20);
      // Levelling valve and its pipe: the height of the bag is actively held.
      box(air, M.alloy, x - .32, -.812, z, .10, .11, .09);
      rod(air, M.dark, [x - .32, -.862, z], [x - .32, -.960, z], .014);
      rod(air, M.copper, [x - .32, -.780, z], [x - .16, -.780, z], .011);
      box(air, M.steel, x + .30, -.825, z, .13, .10, .10);
    }
    // One coarse outline stands in for the whole bogie when it is context.
    box(a.ghost, M.ghost, x, -1.05, 0, 1.72, .52, 2.02);
    for (const dx of AX) for (const side of [-1, 1]) disc(a.ghost, M.ghost, WHEEL_R + .02, .13, x + dx, AXLE_Y, side * .78, 12);

    function update(state) {
      state = state || {};
      const time = Number(state.time) || 0, live = state.mechanism, level = Math.max(0, Math.min(1, Number(state.level) || 0));
      const speed = live && (state.region === 'bogies' || state.region === undefined) ? (state.spin || 0) * (1 + level * 2.4) : 0;
      for (const m of motions) m.group.rotation.z = time * speed;
    }
    stamp(a);
    return Object.assign(a, { update });
  }

  /* ============================================================
     TRACTION MOTOR — stator, rotor, gearbox and its cooling duct
     ============================================================ */
  function createMotor(T, options) {
    const id = options.id, x = options.x;
    const K = kit(T), M = K.M, motions = [], shell = shellFor(T);
    const { mesh, box, rod, slab, disc, ring, can } = K;
    const a = shell(id, 'motors', [x, -1.15, 0], 1.10, [1.6, -.08]);
    const detail = (name, parent) => { const g = new T.Group(); g.name = name; g.userData = { detail: name, region: 'motors', assemblyId: id }; (parent || a.interior).add(g); a.details[name] = g; return g; };
    const AX = [-.51, .51];                 // the two axles of the bogie above
    const MX = .24;                         // motor axis sits inboard and higher
    const PINION = .105, BULL = .200;       // r_pinion + r_bull == centre distance

    for (const dx of AX) {
      const cx = x + dx + MX, gearZ = -.42;
      // Housing with cooling fins: the outside of a real traction motor.
      disc(a.exterior, M.orange, .190, .66, cx, MOTOR_Y, 0, 26);
      for (const z of [-.19, .19]) ring(a.exterior, M.steel, .196, .017, cx, MOTOR_Y, z, 22);
      rod(a.exterior, M.dark, [cx, MOTOR_Y, -.34], [cx, MOTOR_Y, .34], .036);
      for (const dz of [-.34, .34]) slab(a.exterior, M.alloy, cx, MOTOR_Y - .060, dz, .26, .28, .17, .05);
      // Mounting feet onto the bogie frame.
      rod(a.exterior, M.steel, [cx - .14, MOTOR_Y + .13, -.30], [cx - .14, FRAME_Y - .02, -.30], .026);
      rod(a.exterior, M.steel, [cx + .14, MOTOR_Y + .13, .30], [cx + .14, FRAME_Y - .02, .30], .026);

      const motor = detail('motors.motor');
      mesh(motor, new T.CylinderGeometry(.172, .172, .50, 24, 1, true), M.steel, cx, MOTOR_Y, 0).rotateX(Math.PI / 2);
      for (let k = 0; k < 4; k++) {                                    // stator slots
        const t = k / 4 * 6.2832;
        rod(motor, M.copper, [cx + Math.cos(t) * .164, MOTOR_Y + Math.sin(t) * .164, -.24], [cx + Math.cos(t) * .164, MOTOR_Y + Math.sin(t) * .164, .24], .013);
      }
      for (const z of [-.30, .30]) {                                   // winding end turns
        ring(motor, M.copper, .148, .030, cx, MOTOR_Y, z, 22);
        disc(motor, M.dark, .186, .030, cx, MOTOR_Y, z > 0 ? .34 : -.34, 22);
      }
      const rotor = new T.Group(); rotor.position.set(cx, MOTOR_Y, 0); motor.add(rotor);
      rod(rotor, M.silver, [0, 0, -.34], [0, 0, .34], .046);
      for (const z of [-.13, .13]) disc(rotor, M.dark, .138, .19, 0, 0, z, 24);
      mesh(rotor, new T.CylinderGeometry(.124, .124, .50, 20), M.steel, 0, 0, 0).rotateX(Math.PI / 2);
      motions.push({ group: rotor, region: 'motors', id: 'motors.motor', kind: 'spin', rate: 1.9 });

      // Gearbox: the pinion shares the motor shaft, the bull gear sits on the
      // axle. A faceted rim reads as a toothed wheel far more cheaply than
      // forty little tooth boxes per motor.
      const gear = detail('motors.gearbox');
      mesh(gear, new T.CylinderGeometry(PINION + .013, PINION + .013, .072, 11), M.steel, cx, MOTOR_Y, gearZ).rotateX(Math.PI / 2);
      disc(gear, M.silver, PINION, .090, cx, MOTOR_Y, gearZ, 22);
      mesh(gear, new T.CylinderGeometry(BULL + .015, BULL + .015, .068, 17), M.steel, x + dx, AXLE_Y, gearZ).rotateX(Math.PI / 2);
      disc(gear, M.alloy, BULL, .080, x + dx, AXLE_Y, gearZ, 26);
      // Case spanning both axes, with a breather and the oil pipe.
      slab(gear, M.dark, x + dx + MX * .62, (MOTOR_Y + AXLE_Y) / 2 + .02, gearZ, .76, .58, .20, .06);
      rod(gear, M.copper, [x + dx, AXLE_Y - .17, gearZ], [x + dx, MOTOR_Y + .12, gearZ], .010);
      box(gear, M.alloy, cx, MOTOR_Y + .16, gearZ, .10, .10, .14);
    }

    const cool = detail('motors.cooling');
    box(cool, M.alloy, x, -.795, 0, .80, .13, .30);
    for (const dz of [-.105, 0, .105]) box(cool, M.dark, x, -.795, dz, .74, .10, .035);
    for (const dx of [-.32, .32]) {
      mesh(cool, new T.CylinderGeometry(.095, .095, .05, 18), M.dark, x + dx, -.795, 0).rotateZ(Math.PI / 2);
      for (let b = 0; b < 6; b++) { const t = b / 6 * 6.2832; box(cool, M.silver, x + dx + .030, -.795 + Math.cos(t) * .062, Math.sin(t) * .062, .052, .034, .034); }
    }
    rod(cool, M.steel, [x - .30, -.795, 0], [x - .42, -.795, 0], .026);
    box(a.ghost, M.ghost, x, -1.20, 0, 1.32, .62, 1.24);

    function update(state) {
      state = state || {};
      const time = Number(state.time) || 0, live = state.mechanism, level = Math.max(0, Math.min(1, Number(state.level) || 0));
      const speed = live && (state.region === 'motors' || state.region === undefined) ? 1.2 + level * 2.4 : 0;
      for (const m of motions) m.group.rotation.z = time * speed * m.rate;
    }
    stamp(a);
    return Object.assign(a, { update });
  }

  /* ============================================================
     PANTOGRAPH — insulators, folding arms and the contact head
     ============================================================ */
  function createPantograph(T, options) {
    const x = options.x == null ? 2.55 : options.x, BASE = 1.30;
    const K = kit(T), M = K.M, shell = shellFor(T);
    const { mesh, box, rod, slab, disc, ring, can } = K;
    const a = shell('pantograph', 'pantograph', [x, 1.75, 0], 1.05, [1.15, .32]);
    const detail = (name, parent) => { const g = new T.Group(); g.name = name; g.userData = { detail: name, region: 'pantograph', assemblyId: 'pantograph' }; (parent || a.interior).add(g); a.details[name] = g; return g; };
    const L1 = .60, L2 = .60;

    // Roof frame and the four insulators that hold the live parts clear.
    slab(a.exterior, M.steel, x, BASE, 0, 1.06, .055, 1.00, .05);
    const ins = detail('panto.insulator');
    for (const dx of [-.42, .42]) for (const z of [-.38, .38]) {
      can(ins, M.silver, .050, .17, x + dx, BASE - .105, z, 16);
      for (let k = 0; k < 3; k++) ring(ins, M.silver, .060, .018, x + dx, BASE - .165 + k * .050, z, 14);
      disc(ins, M.steel, .075, .022, x + dx, BASE - .022, z, 16);
      disc(ins, M.steel, .075, .022, x + dx, BASE - .190, z, 16);
    }
    box(ins, M.alloy, x, BASE - .215, 0, .96, .035, .90);

    // One folding chain drives both arm pairs; the detail groups own the moving
    // geometry so "fold the arm" and "the contact head" each pick the real thing.
    const pivot = new T.Group(); pivot.position.set(x, BASE + .03, 0); a.exterior.add(pivot);
    const arm = detail('panto.arm', pivot);
    const lower = new T.Group(); arm.add(lower);
    const knee = new T.Group(); knee.position.y = L1; lower.add(knee);
    const upper = new T.Group(); knee.add(upper);
    const head = new T.Group(); head.position.y = L2; upper.add(head);
    const hd = detail('panto.head', head);
    for (const z of [-.26, .26]) {
      rod(lower, M.steel, [0, 0, z], [0, L1, z], .043);
      rod(lower, M.silver, [0, 0, z], [0, L1 * .55, z], .022);
      rod(upper, M.gold, [0, 0, z], [0, L2, z], .030);
      rod(upper, M.steel, [0, 0, z], [0, L2 * .5, z], .017);
    }
    rod(lower, M.dark, [0, 0, -.26], [0, 0, .26], .034);              // knee pin
    box(knee, M.alloy, 0, 0, 0, .10, .05, .60);
    rod(lower, M.dark, [0, L1 * .58, -.43], [0, L1 * .58, .43], .018); // tie rod, wide enough to brace the pair
    rod(lower, M.steel, [0, -.02, -.43], [0, L1 * .58, -.43], .014);
    rod(lower, M.steel, [0, -.02, .43], [0, L1 * .58, .43], .014);
    // Collector head riding on the contact wire.
    box(hd, M.dark, 0, .030, 0, .17, .050, 1.08);
    for (const dz of [-.19, .19]) {
      box(hd, M.dark, 0, .064, dz, .15, .040, 1.05);
      box(hd, M.alloy, 0, .030, dz, .12, .032, 1.03);
    }
    for (const z of [-.58, .58]) {
      mesh(hd, new T.SphereGeometry(.048, 14, 12), M.alloy, 0, .045, z);
      rod(hd, M.steel, [0, -.02, z * .82], [0, -.20, z * .72], .016);
    }
    rod(hd, M.steel, [0, -.20, -.42], [0, -.20, .42], .018);
    slab(a.ghost, M.ghost, x, 1.90, 0, 1.06, 1.32, .76, .05);

    function update(state) {
      state = state || {};
      const live = state.mechanism, level = Math.max(0, Math.min(1, Number(state.level) || 0));
      const t = (live && (state.region === 'pantograph' || state.region === undefined)) ? level : 0;
      pivot.rotation.z = -(1 - t) * 1.45;
      knee.rotation.z = (1 - t) * 2.90;
    }
    stamp(a);
    return Object.assign(a, { update });
  }

  /* ============================================================
     TRACK — stationary display scenery, never part of the model
     ============================================================ */
  // Deliberately built outside the assembly tree: the rails must not be
  // pickable, highlighted, labelled or carried away by the explosion.
  function createTrack(T, options) {
    const from = options && options.from != null ? options.from : -6.3;
    const to = options && options.to != null ? options.to : 5.7;
    const group = new T.Group(); group.name = 'train-display-track';
    const slab = (color, metal, x, y, z, w, h, d) => {
      const m = new T.Mesh(new T.BoxGeometry(w, h, d), new T.MeshStandardMaterial({ color, roughness: .74, metalness: metal }));
      m.position.set(x, y, z); m.receiveShadow = true; m.castShadow = true; group.add(m); return m;
    };
    const mid = (from + to) / 2, len = to - from;
    const count = Math.round(len / .525);
    for (let i = 0; i < count; i++) slab(0xa5a698, 0, from + .30 + i * .525, -1.600, 0, .16, .070, 2.10);
    for (const z of [-.78, .78]) {
      slab(0x899897, .35, mid, -1.554, z, len, .022, .145);   // rail foot
      slab(0x788b91, .40, mid, -1.537, z, len, .014, .030);   // web
      slab(0xa6b4b6, .55, mid, -1.520, z, len, .020, .095);   // head, the tread rests on -1.51
    }
    // A length of catenary, so the raised pantograph is reaching for something
    // real: the contact wire sits just above the collector head (2.62 at rest
    // reach) with the messenger wire and two masts above the track.
    const wireMat = new T.MeshStandardMaterial({ color: 0x6d7b84, roughness: .58, metalness: .55 });
    for (const y of [2.665, 2.860]) {
      const m = new T.Mesh(new T.CylinderGeometry(.014, .014, len, 8), wireMat);
      m.position.set(mid, y, 0); m.rotation.z = Math.PI / 2; m.castShadow = true; group.add(m);
    }
    for (const x of [from + .35, to - .35]) {
      slab(0x8e9aa0, .45, x, .55, -1.44, .11, 4.10, .11);      // mast
      slab(0x8e9aa0, .45, x, 2.60, -.74, .07, .07, 1.42);      // cantilever arm
      slab(0x8e9aa0, .45, x, -1.560, -1.44, .34, .10, .34);    // base
    }
    return group;
  }

  global.RunningGearV3 = { createBogie, createMotor, createPantograph, createTrack, RAIL_TOP, AXLE_Y, FRAME_Y, MOTOR_Y };
})(typeof window !== 'undefined' ? window : globalThis);

/* Little Space Station — v3 model of the picture-book space station: a row of
   round pressurised modules joined end to end through a spherical node, a long
   lattice truss carrying two solar wings and a pair of radiators, a two-segment
   robot arm with a gripper, and a docking port on the nose where a crew ship
   comes alongside.

   Everything is described in metres around the station's own origin. The station
   table below is the single source of truth: the shell, the interior, the truss
   and the wings all read their positions from these constants, so a change here
   moves the whole station at once instead of drifting part by part.

   Axes, chosen so the studio's camera formula reads the flank:
     X  the long axis — the nose (docking port) is at -X, the tail at +X
     Y  "up" in the drawing — the cupola faces -Y and the radiators +Y
     Z  the truss axis — the two solar wings sit at +-Z

   Reference: books/station/assets/02_overview_c_r2.webp (whole station),
   05_solar_c_r2 (wing), 06_arm_c_r2 (arm and gripper), 07_docking_c_r2 (port),
   03_living_c_r2 / 09_float_c_r2 (cabin). Colours are sampled from those images.
   The book gives no engineering dimensions, so the proportions are read off the
   illustrations and rounded to round numbers.

   Station table (x, metres):
     nose / docking face   -2.95            tail        +2.70
     module radius          0.645           node radius  0.72
     truss axis             -0.20           wing centre  z +-2.55
     radiator centre        +1.35           arm shoulder x +1.95
*/
window.StationV3 = { create(T) {
  const assemblies = [];
  const root = new T.Group(); root.name = 'Picture-book space station';
  const materials = new Map();
  // Sampled from books/station/assets: silver-white aluminium barrels with a
  // faint warm sheen, brass/gold foil on the joints and rings, deep navy solar
  // cells with gold grid lines, pale radiators, a wide blue Earth below.
  const palette = {
    hull: 0xd8d5c8, hullPale: 0xe5e0d2, hullWarm: 0xc6c1ae, hullDark: 0x9ea3a6,
    gold: 0xb08a3c, goldLite: 0xd0ac5e, goldDark: 0x8a6a2e,
    ink: 0x24282c, black: 0x1d2124, dark: 0x39424a, steel: 0x9aa2a7,
    cell: 0x2f4b8f, cellDeep: 0x24396f, cellLite: 0x3d5fa8,
    glass: 0x3f6b93, glassLite: 0x5c8cb4, glassDark: 0x2f5677,
    radiator: 0xe2e4e3, radiatorEdge: 0xc8cccc, foil: 0xcbb994,
    floor: 0xc2b59b, floorDark: 0x8d8a80, rack: 0xc8bea7, rackDark: 0x928b79,
    blue: 0x2f5f96, blueDark: 0x274e7d, bag: 0x3b6ea8, lamp: 0xf0e0a8,
    green: 0x5f8f3f, greenLite: 0x7fb055, purple: 0x8a6fc0,
    shield: 0xb9a37c, shieldDark: 0x9c885f, white: 0xeef0ef
  };
  const mat = (key, r = .55, m = 0) => {
    const k = key + '|' + r + '|' + m;
    if (!materials.has(k)) materials.set(k, new T.MeshStandardMaterial({ color: palette[key], roughness: r, metalness: m }));
    return materials.get(k);
  };
  // Glazing is a thin plate sitting just outside the shell, so from the side you
  // see its front face but from behind the far window you see its back face. A
  // front-side-only material vanishes when a wall turns away, so glass is
  // double-sided. The studio clones materials per surface and restores them from
  // materialOriginal, so this flag survives either way.
  const glassMat = key => {
    const k = 'glass|' + key;
    if (!materials.has(k)) materials.set(k, new T.MeshStandardMaterial({ color: palette[key], roughness: .18, metalness: .25, side: T.DoubleSide }));
    return materials.get(k);
  };
  const ghostMat = new T.MeshBasicMaterial({ color: 0xa8bab8, transparent: true, opacity: .065, depthWrite: false, side: T.DoubleSide });

  /* ---------- the assembly contract the studio relies on ---------- */
  // Detail groups default to the EXTERIOR layer: a discovery visible on the
  // outside of the part must be on screen from the start. Pass 'interior' for
  // discoveries that only exist once the shell is opened.
  function assembly(id, region, center, radius, view, detailSpec) {
    const group = new T.Group(), exterior = new T.Group(), interior = new T.Group(), ghost = new T.Group();
    group.name = id;
    group.userData = { assemblyId: id, region };
    group.add(exterior, interior, ghost);
    interior.visible = ghost.visible = false;
    root.add(group);
    const a = {
      id, region, group, exterior, interior, ghost,
      center: new T.Vector3(center[0], center[1], center[2]), radius, view,
      details: {}, detailLayer: {}
    };
    (detailSpec || []).forEach(spec => {
      const d = typeof spec === 'string' ? spec : spec.id;
      const layer = typeof spec === 'string' ? 'exterior' : (spec.layer || 'exterior');
      const g = new T.Group(); g.name = d;
      g.userData = { detail: d, region, assemblyId: id };
      (layer === 'interior' ? interior : exterior).add(g);
      a.details[d] = g;
      a.detailLayer[d] = layer;
    });
    assemblies.push(a);
    return a;
  }
  // Every mesh carries region + assembly + (optionally) the detail it belongs to.
  function add(a, parent, geo, colorKey, opts) {
    const o = opts || {};
    const mesh = new T.Mesh(geo, o.glass
      ? glassMat(colorKey)
      : mat(colorKey, o.roughness != null ? o.roughness : .55, o.metalness != null ? o.metalness : 0));
    if (o.name) mesh.name = o.name;
    mesh.userData = { region: a.region, assemblyId: a.id };
    if (o.detail) mesh.userData.detail = o.detail;
    if (o.pos) mesh.position.set(o.pos[0], o.pos[1], o.pos[2]);
    if (o.rot) mesh.rotation.set(o.rot[0], o.rot[1], o.rot[2]);
    mesh.castShadow = o.castShadow !== false;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  // A mesh that belongs to a named discovery goes into that detail group, so the
  // studio can isolate one part without knowing how the assembly was built.
  function into(a, layer, detailId, geo, colorKey, opts) {
    const parent = detailId
      ? a.details[detailId]
      : (layer === 'interior' ? a.interior : layer === 'ghost' ? a.ghost : a.exterior);
    if (!parent) throw new Error(a.id + ': unknown detail ' + detailId);
    const mesh = add(a, parent, geo, colorKey, Object.assign(layer === 'ghost' ? {} : { detail: detailId }, opts || {}));
    if (layer === 'ghost') {
      mesh.material = ghostMat;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
    }
    return mesh;
  }

  /* ---------- primitives ---------- */
  const cyl = (rt, rb, h, seg = 32, open = false, thetaStart = 0, thetaLength = Math.PI * 2) =>
    new T.CylinderGeometry(rt, rb, h, seg, 1, open, thetaStart, thetaLength);
  const box = (w, h, d) => new T.BoxGeometry(w, h, d);
  const torus = (r, t, seg = 40, arc = Math.PI * 2) => new T.TorusGeometry(r, t, 8, seg, arc);
  const sph = (r, seg = 28) => new T.SphereGeometry(r, seg, Math.max(8, seg / 2));
  function mergeNonIndexed(T, geos) {
    const pos = [], norm = [], uv = [];
    for (const g of geos) {
      const ng = g.index ? g.toNonIndexed() : g;
      const p = ng.attributes.position, n = ng.attributes.normal, u = ng.attributes.uv;
      for (let i = 0; i < p.count; i++) {
        pos.push(p.getX(i), p.getY(i), p.getZ(i));
        if (n) norm.push(n.getX(i), n.getY(i), n.getZ(i));
        if (u) uv.push(u.getX(i), u.getY(i));
      }
    }
    const out = new T.BufferGeometry();
    out.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    if (norm.length) out.setAttribute('normal', new T.Float32BufferAttribute(norm, 3));
    if (uv.length) out.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    out.computeVertexNormals();
    return out;
  }
  // roundPanel: a rectangle with rounded corners, extruded along Z. So a side
  // wall is (length, height, thickness) and an end panel is (width, height,
  // thickness) turned a quarter turn about Y.
  function roundPanel(T, w, h, d, r) {
    const rr = Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3);
    const s = new T.Shape();
    const x0 = -w / 2, y0 = -h / 2, x1 = w / 2, y1 = h / 2;
    s.moveTo(x0 + rr, y0);
    s.lineTo(x1 - rr, y0); s.quadraticCurveTo(x1, y0, x1, y0 + rr);
    s.lineTo(x1, y1 - rr); s.quadraticCurveTo(x1, y1, x1 - rr, y1);
    s.lineTo(x0 + rr, y1); s.quadraticCurveTo(x0, y1, x0, y1 - rr);
    s.lineTo(x0, y0 + rr); s.quadraticCurveTo(x0, y0, x0 + rr, y0);
    return new T.ExtrudeGeometry(s, { depth: d, bevelEnabled: false, curveSegments: 6, steps: 1 });
  }
  function softBox(T, w, h, d, r) {
    const g = roundPanel(T, w, h, d, r);
    g.translate(0, 0, -d / 2);
    return g;
  }
  // A bar from point a to point b — used for every strut, rail and pipe.
  function rod(T, a3, b3, r, seg = 12) {
    const a = new T.Vector3(a3[0], a3[1], a3[2]), b = new T.Vector3(b3[0], b3[1], b3[2]);
    const d = b.clone().sub(a), g = cyl(r, r, d.length(), seg);
    const m = new T.Mesh(g, mat('steel', .45, .45));
    m.position.copy(a).addScaledVector(d, .5);
    m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.clone().normalize());
    return m;
  }

  /* ---------- the station table: every position in the station comes from here ---------- */
  const RM = 0.645;              // module radius
  const NOSE_X = -2.95;          // docking face of the forward module
  const TAIL_X = 2.70;           // aft end of the rear module
  const NODE_X = 0.20;           // centre of the spherical node (also the origin of the truss)
  const NODE_R = 0.72;
  const TRUSS_Y = -0.20;         // truss axis height
  const WING_Z = 3.70;           // compact panel wings beside the cross modules
  const WING_X = 0.20;           // wings ride the truss at the node's x
  const ARM_X = 1.95, ARM_Y = 0.02, ARM_Z = 0.46;
  const RAD_Z = 1.35, RAD_Y = 1.35;

  // Cylinders here are BARRELS lying along X, so every one of them is turned a
  // quarter turn about Z. Building one and forgetting the rotation stands it up
  // on end and puts its length on Y, which makes the station three metres tall
  // and half a metre long.
  const barrel = (len, r, seg = 36) => ({ geo: cyl(r, r, len, seg), rot: [0, 0, Math.PI / 2] });

  /* ---------- 1. modules: the row of pressurised barrels ---------- */
  const modules = assembly('modules', 'modules', [0, 0, 0], 2.6,
    [-1.62, .20], ['modules.skin', 'modules.ring', 'modules.port', 'modules.handhold', 'modules.mmu']);
  {
    // Two stacks meet at the node: one long module poking towards -X (the nose
    // runs past the node) and one towards +X. They are registered end to end so
    // there is no gap at the node for the eye to fall through.
    const FORE_X0 = NOSE_X + .26, FORE_X1 = NODE_X - .24;
    const AFT_X0 = NODE_X + .30, AFT_X1 = TAIL_X - .30;
    const hx = -NODE_X / 2 + .02;
    for (const [x0, x1] of [[FORE_X0, FORE_X1], [AFT_X0, AFT_X1]]) {
      const len = x1 - x0, mid = (x0 + x1) / 2;
      into(modules, 'exterior', 'modules.skin', barrel(len, RM).geo, 'hull',
        { name: 'Module barrel', pos: [mid, 0, 0], rot: [0, 0, Math.PI / 2], roughness: .42, metalness: .32 });
      // Stiffening rings: the hoops that keep a thin shell from bowing out.
      const rings = Math.max(2, Math.round(len / .62));
      for (let i = 1; i <= rings; i++) {
        into(modules, 'exterior', 'modules.ring', torus(RM + .018, .028, 30), 'hullWarm',
          { name: 'Stiffening ring', pos: [x0 + len * i / (rings + 1), 0, 0], rot: [0, Math.PI / 2, 0], roughness: .45, metalness: .35 });
      }
      // The gold collar where the barrel meets a joint — the warm accent that
      // reads all over the illustration.
      for (const x of [x0 + .03, x1 - .03]) {
        into(modules, 'exterior', 'modules.ring', torus(RM + .026, .05, 30), 'gold',
          { name: 'Joint collar', pos: [x, 0, 0], rot: [0, Math.PI / 2, 0], roughness: .38, metalness: .62 });
      }
    }
    // Both overview and cover show transverse pressurised barrels meeting the
    // node. A bare lattice alone loses the characteristic T/cross silhouette.
    for (const side of [-1, 1]) {
      const z0 = NODE_R - .12, z1 = 2.02, mid = side * (z0 + z1) / 2;
      into(modules, 'exterior', 'modules.skin', cyl(RM, RM, z1 - z0, 36), 'hull',
        { name: 'Cross module barrel', pos: [NODE_X, 0, mid], rot: [Math.PI / 2, 0, 0], roughness: .45, metalness: .32 });
      for (const z of [z0 + .04, 1.25, z1 - .04]) {
        into(modules, 'exterior', 'modules.ring', torus(RM + .025, .035, 32), z === 1.25 ? 'hullWarm' : 'gold',
          { name: 'Cross module collar', pos: [NODE_X, 0, side * z], roughness: .45, metalness: .45 });
      }
      into(modules, 'exterior', 'modules.port', cyl(.135, .135, .04, 24), 'glass',
        { name: 'Cross module porthole', pos: [NODE_X - RM - .015, 0, mid], rot: [0, 0, Math.PI / 2], glass: true });
      into(modules, 'exterior', 'modules.port', torus(.16, .026, 24), 'gold',
        { name: 'Cross porthole rim', pos: [NODE_X - RM - .04, 0, mid], rot: [0, Math.PI / 2, 0], metalness: .5 });
    }
    // Portholes: a ring of thick glass every module, set into a heavy frame. The
    // frame is a torus about the barrel's normal, so it needs no rotation
    // beyond the barrel's own quarter turn about X (its axis is already Z).
    const ports = [[-1.70, 0], [1.48, 0]];
    for (const [x] of ports) {
      for (const th of [Math.PI * .18, Math.PI * .82]) {
        const z = Math.cos(th) * (RM + .03), y = Math.sin(th) * (RM + .03);
        const nx = z / (RM + .03), ny = y / (RM + .03);
        const g = new T.Group(); g.position.set(x, y, z);
        g.lookAt(x + 0, y + ny, z + nx);
        modules.exterior.add(g);
        const pane = new T.Mesh(cyl(.115, .115, .05, 20), glassMat('glass'));
        pane.name = 'Porthole glass';
        pane.userData = { region: 'modules', assemblyId: 'modules', detail: 'modules.port' };
        pane.castShadow = false; pane.receiveShadow = true;
        pane.rotation.x = Math.PI / 2;
        g.add(pane);
        const frame = new T.Mesh(torus(.135, .035, 22), mat('gold', .4, .5));
        frame.name = 'Porthole frame';
        frame.userData = { region: 'modules', assemblyId: 'modules', detail: 'modules.port' };
        frame.castShadow = frame.receiveShadow = true;
        g.add(frame);
      }
    }
    // Handholds: little yellow grips all over the outside, the way an EVA crew
    // moves about. Yellow because that is what the illustration uses.
    for (let i = 0; i < 7; i++) {
      const x = NOSE_X + .60 + i * .78;
      for (const th of [Math.PI * .30, Math.PI * .70]) {
        const z = Math.cos(th) * (RM + .05), y = Math.sin(th) * (RM + .05);
        into(modules, 'exterior', 'modules.handhold', cyl(.026, .026, .26, 10), 'goldLite',
          { name: 'Handhold', pos: [x, y, z], rot: [0, 0, Math.PI / 2], roughness: .5, metalness: .4 });
      }
    }
    // Thrusters: small clusters of nozzles that keep the station pointing right.
    for (const x of [-2.42, 2.16]) {
      for (const th of [Math.PI * .25, Math.PI * .75]) {
        const z = Math.cos(th) * (RM + .07), y = Math.sin(th) * (RM + .07);
        const g = new T.Group(); g.position.set(x, y, z);
        g.lookAt(x, y + Math.sin(th), z + Math.cos(th));
        modules.exterior.add(g);
        for (const s of [0, 1]) {
          const n = new T.Mesh(cyl(.038, .058, .10, 12), mat('steel', .35, .55));
          n.name = 'Thruster nozzle';
          n.userData = { region: 'modules', assemblyId: 'modules', detail: 'modules.mmu' };
          n.castShadow = n.receiveShadow = true;
          n.rotation.x = Math.PI / 2; n.position.set(s ? .085 : -.085, 0, .05);
          g.add(n);
        }
      }
    }
    // Interior lining: a cylinder, so a child looking down the barrel sees the
    // far wall instead of straight through the station.
    for (const [x0, x1] of [[FORE_X0, FORE_X1], [AFT_X0, AFT_X1]]) {
      into(modules, 'interior', 'modules.skin', cyl(RM - .05, RM - .05, (x1 - x0) - .06, 32, true), 'floor',
        { name: 'Cabin lining', pos: [(x0 + x1) / 2, 0, 0], rot: [0, 0, Math.PI / 2], castShadow: false, roughness: .8 });
    }
    into(modules, 'ghost', null, box(FORE_X1 - NOSE_X, RM * 2, RM * 2), 'hull', { pos: [(NOSE_X + FORE_X1) / 2, 0, 0] });
    into(modules, 'ghost', null, box(TAIL_X - AFT_X0, RM * 2, RM * 2), 'hull', { pos: [(AFT_X0 + TAIL_X) / 2, 0, 0] });
  }

  /* ---------- 2. node: the ball where every module meets ---------- */
  const node = assembly('node', 'node', [NODE_X, 0, 0], .95,
    [-1.30, .22], ['node.hatch', 'node.ring', 'node.light']);
  {
    into(node, 'exterior', 'node.ring', sph(NODE_R, 32), 'hullPale',
      { name: 'Node sphere', pos: [NODE_X, 0, 0], roughness: .40, metalness: .34 });
    // The darker waist band where the two hemispheres bolt together.
    into(node, 'exterior', 'node.ring', cyl(NODE_R + .012, NODE_R + .012, .10, 32), 'hullDark',
      { name: 'Node waist', pos: [NODE_X, 0, 0], rot: [Math.PI / 2, 0, 0], roughness: .45, metalness: .3 });
    // Hatches: round doors facing fore and aft, and two on the flanks.
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const g = new T.Group(); g.position.set(NODE_X + dx * (NODE_R + .01), 0, dz * (NODE_R + .01));
      if (!dx) g.rotation.y = Math.PI / 2;
      else if (dx < 0) g.rotation.y = Math.PI;
      node.exterior.add(g);
      const door = new T.Mesh(cyl(.30, .30, .06, 24), mat('hullPale', .45, .3));
      door.name = 'Hatch';
      door.userData = { region: 'node', assemblyId: 'node', detail: 'node.hatch' };
      door.castShadow = door.receiveShadow = true;
      door.rotation.x = Math.PI / 2;
      g.add(door);
      const rim = new T.Mesh(torus(.325, .035, 24), mat('gold', .4, .55));
      rim.name = 'Hatch rim';
      rim.userData = { region: 'node', assemblyId: 'node', detail: 'node.hatch' };
      rim.castShadow = rim.receiveShadow = true;
      g.add(rim);
    }
    // Two berthing rings left empty, waiting for the next module. They face up
    // and down, so each ring lies flat: a quarter turn about X, not Y.
    for (const dy of [1, -1]) {
      into(node, 'exterior', 'node.ring', torus(.34, .045, 24), 'goldDark',
        { name: 'Berthing ring', pos: [NODE_X, dy * (NODE_R + .02), 0], rot: [Math.PI / 2, 0, 0], roughness: .42, metalness: .6 });
    }
    // Interior: soft lamps, because sunlight through portholes is not enough and
    // the station crosses the terminator sixteen times a day.
    for (let i = 0; i < 3; i++) {
      into(node, 'interior', 'node.light', box(.22, .04, .22), 'lamp',
        { name: 'Interior lamp', pos: [NODE_X - .22 + i * .22, NODE_R - .12, 0], castShadow: false, roughness: .5 });
    }
    into(node, 'interior', 'node.ring', cyl(NODE_R - .05, NODE_R - .05, NODE_R * 1.9, 28, true), 'floor',
      { name: 'Node lining', pos: [NODE_X, 0, 0], rot: [Math.PI / 2, 0, 0], castShadow: false, roughness: .8 });
    into(node, 'ghost', null, box(NODE_R * 2, NODE_R * 2, NODE_R * 2), 'hullPale', { pos: [NODE_X, 0, 0] });
  }

  /* ---------- 3. truss: the spine that carries the wings ---------- */
  const truss = assembly('truss', 'truss', [WING_X, TRUSS_Y, 0], 3.0,
    [-.20, .34], ['truss.beam', 'truss.cable', 'truss.joint']);
  {
    // The truss runs ACROSS the station, along Z, from one wing to the other.
    // A lattice, not a tube: four long booms plus triangulated diagonals, which
    // is what makes it light and still enormously stiff.
    const T0 = NODE_R + .18, T1 = 4.30, TSPAN = T1 - T0, TMID = (T0 + T1) / 2;
    // Four booms at the corners of a square section, each one long in Z — so the
    // box is (thickness, thickness, length) and needs no rotation at all.
    for (const dx of [.17, -.17]) for (const dy of [.17, -.17]) {
      for (const s of [1, -1]) {
        into(truss, 'exterior', 'truss.beam', box(.09, .09, TSPAN), 'hull',
          { name: 'Truss boom', pos: [NODE_X + dx, TRUSS_Y + dy, s * TMID], roughness: .48, metalness: .34 });
      }
    }
    // Cross ties in each bay, plus the diagonals that stop the lattice racking.
    const bays = 7;
    for (let i = 0; i <= bays; i++) {
      const z = T0 + TSPAN * i / bays;
      for (const s of [1, -1]) {
        // The square ring at this bay: two bars along X and two along Y.
        for (const dy of [.17, -.17]) {
          into(truss, 'exterior', 'truss.beam', box(.34, .055, .055), 'hullDark',
            { name: 'Truss tie', pos: [NODE_X, TRUSS_Y + dy, s * z], roughness: .48, metalness: .34 });
        }
        for (const dx of [.17, -.17]) {
          into(truss, 'exterior', 'truss.beam', box(.055, .34, .055), 'hullDark',
            { name: 'Truss tie', pos: [NODE_X + dx, TRUSS_Y, s * z], roughness: .48, metalness: .34 });
        }
      }
    }
    for (let i = 0; i < bays; i++) {
      for (const s of [1, -1]) {
        const z0 = T0 + TSPAN * i / bays, z1 = T0 + TSPAN * (i + 1) / bays;
        for (const side of [1, -1]) {
          for (const [a, b] of [[.17, -.17], [-.17, .17]]) {
            truss.exterior.add(rod(T, [NODE_X + side * .17, TRUSS_Y + a, s * z0], [NODE_X + side * .17, TRUSS_Y + b, s * z1], .032, 8));
          }
        }
        for (const side of [1, -1]) {
          for (const [a, b] of [[.17, -.17], [-.17, .17]]) {
            truss.exterior.add(rod(T, [NODE_X + a, TRUSS_Y + side * .17, s * z0], [NODE_X + b, TRUSS_Y + side * .17, s * z1], .032, 8));
          }
        }
      }
    }
    // Every bar just added by hand still has to declare itself, or the studio
    // cannot tell which discovery it belongs to.
    truss.exterior.children.forEach(o => {
      if (!o.isMesh || o.userData.region) return;
      o.userData = { region: 'truss', assemblyId: 'truss', detail: 'truss.beam' };
      o.name = 'Truss diagonal';
      o.castShadow = true; o.receiveShadow = true;
    });
    // Coupling joints, the bolted rings that let the truss be assembled in orbit.
    for (let i = 0; i <= 5; i++) {
      const z = T0 + TSPAN * i / 5;
      for (const s of [1, -1]) {
        into(truss, 'exterior', 'truss.joint', cyl(.14, .14, .17, 14), 'goldDark',
          { name: 'Coupling joint', pos: [NODE_X, TRUSS_Y, s * z], rot: [Math.PI / 2, 0, 0], roughness: .45, metalness: .5 });
      }
    }
    // Power cables: thick lines running the length of the truss back to the
    // modules. They follow the lattice, sagging in gentle arcs.
    for (const s of [1, -1]) {
      const pts = [];
      for (let i = 0; i <= 6; i++) {
        const z = T0 + TSPAN * i / 6;
        pts.push([NODE_X, TRUSS_Y - .42 - Math.sin(i / 6 * Math.PI) * .09, s * z]);
      }
      for (let i = 1; i < pts.length; i++) {
        const seg = rod(T, pts[i - 1], pts[i], .028, 8);
        seg.userData = { region: 'truss', assemblyId: 'truss', detail: 'truss.cable' };
        seg.name = 'Power cable'; seg.castShadow = true; seg.receiveShadow = true;
        truss.exterior.add(seg);
      }
    }
    into(truss, 'ghost', null, box(.44, .54, T1 * 2), 'hull', { pos: [NODE_X, TRUSS_Y, 0] });
  }

  /* ---------- 4. solar: the two wings that make the electricity ---------- */
  const solar = assembly('solar', 'solar', [WING_X, 0, WING_Z], 2.4,
    [.48, .30], ['solar.panel', 'solar.cell', 'solar.boom', 'solar.horn']);
  {
    // Each wing hangs off the truss through a rotary joint that follows the Sun.
    // The wing itself is a lattice of four blanket panels: cells on the front,
    // a pale backing behind, gold hinge lines between.
    const PANEL_W = 1.88, PANEL_L = 1.08, PANELS = 2, GAP = .05;
    const wingPivots = [];
    for (const side of [-1, 1]) {
      const pivot = new T.Group();
      pivot.position.set(WING_X, 0, side * 2.02);
      solar.exterior.add(pivot);
      wingPivots.push({ pivot, side });
      // The rotary joint housing and its gold collar.
      const joint = new T.Mesh(cyl(.24, .24, .34, 22), mat('hullPale', .42, .34));
      joint.name = 'Rotary joint';
      joint.userData = { region: 'solar', assemblyId: 'solar', detail: 'solar.boom' };
      joint.castShadow = joint.receiveShadow = true;
      joint.rotation.x = Math.PI / 2; joint.position.set(0, 0, side * .16);
      pivot.add(joint);
      const collar = new T.Mesh(torus(.26, .045, 22), mat('gold', .38, .6));
      collar.name = 'Joint collar';
      collar.userData = { region: 'solar', assemblyId: 'solar', detail: 'solar.boom' };
      collar.position.set(0, 0, side * .30); collar.castShadow = true;
      pivot.add(collar);
      // The mast: the long white boom that carries the whole wing.
      const mast = new T.Mesh(box(.16, .16, PANEL_L * PANELS + .30), mat('white', .48, .3));
      mast.name = 'Mast';
      mast.userData = { region: 'solar', assemblyId: 'solar', detail: 'solar.boom' };
      mast.position.set(0, 0, side * (PANEL_L * PANELS / 2 + .70));
      mast.castShadow = mast.receiveShadow = true;
      pivot.add(mast);
      // Four panels out along the mast, each one cell-side up.
      for (let i = 0; i < PANELS; i++) {
        const z = side * (.85 + i * (PANEL_L + GAP) + PANEL_L / 2);
        const panel = new T.Mesh(box(PANEL_W, .045, PANEL_L), mat('cell', .35, .25));
        panel.name = 'Solar panel';
        panel.userData = { region: 'solar', assemblyId: 'solar', detail: 'solar.panel' };
        panel.position.set(0, 0, z);
        panel.castShadow = panel.receiveShadow = true;
        pivot.add(panel);
        // The fine gold grid that gathers the current. Thin ribs across the sheet.
        for (let g = 1; g < 6; g++) {
          const rib = new T.Mesh(box(PANEL_W, .052, .016), mat('goldLite', .4, .55));
          rib.name = 'Cell grid';
          rib.userData = { region: 'solar', assemblyId: 'solar', detail: 'solar.cell' };
          rib.position.set(0, 0, z - (PANEL_L / 2) + PANEL_L * g / 6);
          rib.castShadow = false;
          pivot.add(rib);
        }
        for (let g = 1; g < 8; g++) {
          const rib = new T.Mesh(box(.016, .052, PANEL_L), mat('goldLite', .4, .55));
          rib.name = 'Cell grid';
          rib.userData = { region: 'solar', assemblyId: 'solar', detail: 'solar.cell' };
          rib.position.set(-(PANEL_W / 2) + PANEL_W * g / 8, 0, z);
          rib.castShadow = false;
          pivot.add(rib);
        }
        // Folding hinges at the tip of every panel: the wings arrived folded.
        const hinge = new T.Mesh(cyl(.055, .055, PANEL_W + .06, 12), mat('gold', .4, .6));
        hinge.name = 'Folding hinge';
        hinge.userData = { region: 'solar', assemblyId: 'solar', detail: 'solar.horn' };
        hinge.rotation.z = Math.PI / 2;
        hinge.position.set(0, 0, z - side * (PANEL_L / 2 + GAP / 2));
        hinge.castShadow = true;
        pivot.add(hinge);
      }
      // A single hinge block at the shoulder, plus the tip fitting.
      const rootH = new T.Mesh(cyl(.07, .07, PANEL_W + .10, 12), mat('goldDark', .42, .58));
      rootH.name = 'Folding hinge';
      rootH.userData = { region: 'solar', assemblyId: 'solar', detail: 'solar.horn' };
      rootH.rotation.z = Math.PI / 2;
      rootH.position.set(0, 0, side * .78);
      rootH.castShadow = true;
      pivot.add(rootH);
    }
    solar.wings = wingPivots;
    into(solar, 'ghost', null, box(PANEL_W + .2, .30, PANEL_L * PANELS * 2 + 2), 'cell',
      { pos: [WING_X, TRUSS_Y, 0] });
  }
  // Mechanism: the wings turn about their masts to follow the Sun, in opposite
  // directions like the two vanes of a weathercock. Gated on this region so the
  // station resets exactly to the pose the picture book draws.
  solar.update = state => {
    const k = state.mechanism && state.region === 'solar' ? (state.level || 0) : 0;
    for (const w of solar.wings) w.pivot.rotation.z = w.side * k * .95;
  };

  /* ---------- 5. arm: the two-segment robot arm ---------- */
  const arm = assembly('arm', 'arm', [ARM_X, .70, ARM_Z], 2.4,
    [.40, .30], ['arm.shoulder', 'arm.boom', 'arm.elbow', 'arm.wrist', 'arm.gripper']);
  {
    // Built as a chain of nested groups, so the studio's single "level" value can
    // articulate it and the pose resets exactly. At rest the arm lies folded back
    // along the modules, the way the illustration parks it.
    const shoulder = new T.Group();
    shoulder.position.set(ARM_X, ARM_Y, ARM_Z);
    arm.exterior.add(shoulder);
    // Base plate bolted to the module wall.
    const base = new T.Mesh(cyl(.20, .24, .22, 22), mat('hullPale', .42, .34));
    base.name = 'Shoulder joint';
    base.userData = { region: 'arm', assemblyId: 'arm', detail: 'arm.shoulder' };
    base.position.set(0, .10, 0); base.castShadow = base.receiveShadow = true;
    shoulder.add(base);
    const bCollar = new T.Mesh(torus(.22, .04, 22), mat('gold', .38, .6));
    bCollar.name = 'Shoulder collar';
    bCollar.userData = { region: 'arm', assemblyId: 'arm', detail: 'arm.shoulder' };
    bCollar.position.set(0, .22, 0); bCollar.rotation.x = Math.PI / 2; bCollar.castShadow = true;
    shoulder.add(bCollar);
    // The upper arm: a white barrel along Y, so no rotation is needed — a
    // cylinder's axis already runs up Y.
    const upper = new T.Group();
    upper.position.set(0, .24, 0);
    shoulder.add(upper);
    const boom = new T.Mesh(cyl(.105, .105, 1.30, 20), mat('white', .42, .3));
    boom.name = 'Arm boom';
    boom.userData = { region: 'arm', assemblyId: 'arm', detail: 'arm.boom' };
    boom.position.set(0, .65, 0); boom.castShadow = boom.receiveShadow = true;
    upper.add(boom);
    // Elbow.
    const elbow = new T.Group();
    elbow.position.set(0, 1.30, 0);
    upper.add(elbow);
    const eJoint = new T.Mesh(sph(.155, 22), mat('hullPale', .42, .34));
    eJoint.name = 'Elbow joint';
    eJoint.userData = { region: 'arm', assemblyId: 'arm', detail: 'arm.elbow' };
    eJoint.castShadow = eJoint.receiveShadow = true;
    elbow.add(eJoint);
    const eRing = new T.Mesh(torus(.16, .035, 22), mat('gold', .38, .6));
    eRing.name = 'Elbow collar';
    eRing.userData = { region: 'arm', assemblyId: 'arm', detail: 'arm.elbow' };
    eRing.rotation.y = Math.PI / 2; eRing.castShadow = true;
    elbow.add(eRing);
    // The fore arm: a thinner barrel, then the wrist, then the gripper.
    const fore = new T.Group();
    fore.position.set(0, .08, 0);
    elbow.add(fore);
    const foreBoom = new T.Mesh(cyl(.082, .082, .95, 18), mat('white', .42, .3));
    foreBoom.name = 'Fore arm';
    foreBoom.userData = { region: 'arm', assemblyId: 'arm', detail: 'arm.boom' };
    foreBoom.position.set(0, .48, 0); foreBoom.castShadow = foreBoom.receiveShadow = true;
    fore.add(foreBoom);
    const wrist = new T.Group();
    wrist.position.set(0, .95, 0);
    fore.add(wrist);
    const wJoint = new T.Mesh(sph(.10, 18), mat('hullPale', .42, .34));
    wJoint.name = 'Wrist';
    wJoint.userData = { region: 'arm', assemblyId: 'arm', detail: 'arm.wrist' };
    wJoint.castShadow = wJoint.receiveShadow = true;
    wrist.add(wJoint);
    const wRing = new T.Mesh(torus(.105, .022, 18), mat('gold', .38, .6));
    wRing.name = 'Wrist collar';
    wRing.userData = { region: 'arm', assemblyId: 'arm', detail: 'arm.wrist' };
    wRing.rotation.x = Math.PI / 2; wRing.position.set(0, .06, 0); wRing.castShadow = true;
    wrist.add(wRing);
    // Gripper: two curved metal fingers that close like a hand.
    for (const s of [1, -1]) {
      const f = new T.Mesh(box(.055, .34, .09), mat('steel', .35, .55));
      f.name = 'Gripper finger';
      f.userData = { region: 'arm', assemblyId: 'arm', detail: 'arm.gripper' };
      f.position.set(s * .09, .22, 0); f.rotation.z = s * .16;
      f.castShadow = f.receiveShadow = true;
      wrist.add(f);
      const tip = new T.Mesh(box(.055, .10, .09), mat('steel', .35, .55));
      tip.name = 'Gripper tip';
      tip.userData = { region: 'arm', assemblyId: 'arm', detail: 'arm.gripper' };
      tip.position.set(s * .13, .40, 0); tip.rotation.z = s * .55;
      tip.castShadow = true;
      wrist.add(tip);
    }
    const gBody = new T.Mesh(cyl(.075, .06, .12, 16), mat('hullPale', .4, .4));
    gBody.name = 'Gripper body';
    gBody.userData = { region: 'arm', assemblyId: 'arm', detail: 'arm.gripper' };
    gBody.position.set(0, .12, 0); gBody.castShadow = true;
    wrist.add(gBody);
    arm.chain = { shoulder, upper, elbow, fore, wrist };
    into(arm, 'ghost', null, box(.60, 2.40, .60), 'white', { pos: [ARM_X, 1.10, ARM_Z] });
  }
  // Mechanism: the arm reaches out and comes back, exactly reversing so the
  // folded pose is the default. Two joints move in opposite senses, which is how
  // a real arm keeps its tip on a straight line.
  arm.update = state => {
    const k = state.mechanism && state.region === 'arm' ? (state.level || 0) : 0;
    const c = arm.chain;
    c.shoulder.rotation.y = -k * .55;
    c.upper.rotation.z = k * .70;
    c.elbow.rotation.z = .35 - k * 1.15;
    c.fore.rotation.z = -k * .25;
    c.wrist.rotation.z = k * .55;
  };

  /* ---------- 6. docking: the ringed port where ships come alongside ---------- */
  const docking = assembly('docking', 'docking', [NOSE_X - .10, 0, 0], .95,
    [-2.00, .16], ['docking.ring', 'docking.tunnel', 'docking.light', 'docking.target']);
  {
    // The port sits on the nose of the forward module, facing -X, so every ring
    // about it is turned a quarter turn about Y.
    for (const [x, r, t, key, name] of [
      [NOSE_X - .02, RM + .02, .055, 'gold', 'Docking collar'],
      [NOSE_X - .16, .54, .060, 'goldLite', 'Docking ring'],
      [NOSE_X - .26, .46, .045, 'gold', 'Latch ring']
    ]) {
      into(docking, 'exterior', 'docking.ring', torus(r, t, 30), key,
        { name, pos: [x, 0, 0], rot: [0, Math.PI / 2, 0], roughness: .40, metalness: .60 });
    }
    // Twelve latches around the ring — the hooks that pull the two faces tight.
    for (let i = 0; i < 12; i++) {
      const th = i / 12 * Math.PI * 2;
      into(docking, 'exterior', 'docking.ring', box(.09, .13, .07), 'hullDark',
        { name: 'Latch', pos: [NOSE_X - .22, Math.sin(th) * .52, Math.cos(th) * .52],
          rot: [-th, 0, 0], roughness: .42, metalness: .45 });
    }
    // The tunnel through the middle, with its inner lining so a child looking in
    // sees a corridor rather than daylight through the station.
    into(docking, 'exterior', 'docking.tunnel', cyl(.40, .40, .46, 26), 'dark',
      { name: 'Docking tunnel', pos: [NOSE_X - .04, 0, 0], rot: [0, 0, Math.PI / 2], roughness: .8 });
    into(docking, 'exterior', 'docking.tunnel', cyl(.36, .36, .48, 24, true), 'floor',
      { name: 'Tunnel lining', pos: [NOSE_X - .04, 0, 0], rot: [0, 0, Math.PI / 2], castShadow: false, roughness: .8 });
    // The aiming cross painted on the outer face of the ring: one bar across,
    // one bar up. Both are thin plates on the -X face, so their long sides run
    // on Z and on Y and neither needs a rotation.
    into(docking, 'exterior', 'docking.target', box(.02, .05, .60), 'white',
      { name: 'Target cross', pos: [NOSE_X - .28, 0, 0], roughness: .6 });
    into(docking, 'exterior', 'docking.target', box(.02, .60, .05), 'white',
      { name: 'Target cross', pos: [NOSE_X - .28, 0, 0], roughness: .6 });
    // Approach light: a small green lamp beside the ring, showing the pilot how
    // the ship is lined up.
    into(docking, 'exterior', 'docking.light', cyl(.05, .05, .06, 14), 'greenLite',
      { name: 'Approach light', pos: [NOSE_X - .20, .62, .18], rot: [0, 0, Math.PI / 2], roughness: .3 });
    into(docking, 'exterior', 'docking.light', cyl(.055, .055, .07, 12), 'steel',
      { name: 'Approach light housing', pos: [NOSE_X - .14, .62, .18], rot: [0, 0, Math.PI / 2], roughness: .4, metalness: .5 });
    // Antennas beside the port, the little white dishes the book draws there.
    for (const s of [1, -1]) {
      into(docking, 'exterior', 'docking.ring', cyl(.02, .02, .30, 10), 'white',
        { name: 'Antenna mast', pos: [NOSE_X + .30, .10, s * .72], roughness: .5 });
      into(docking, 'exterior', 'docking.ring', cyl(.12, .12, .04, 18), 'white',
        { name: 'Antenna dish', pos: [NOSE_X + .30, .26, s * .72], rot: [0, 0, Math.PI / 2], roughness: .4 });
    }
    into(docking, 'ghost', null, box(.60, RM * 2, RM * 2), 'gold', { pos: [NOSE_X - .10, 0, 0] });
  }

  /* ---------- 7. cupola: the bubble of windows that looks straight down ---------- */
  const cupola = assembly('cupola', 'cupola', [.20, -RM - .18, 0], .80,
    [-1.30, -.34], ['cupola.glass', 'cupola.shutter', 'cupola.rail']);
  {
    // She faces -Y, so every ring about her is turned a quarter turn about X.
    const CY = -RM - .02;
    const housing = new T.Mesh(cyl(.52, .58, .30, 30), mat('hullPale', .42, .34));
    housing.name = 'Cupola housing';
    housing.userData = { region: 'cupola', assemblyId: 'cupola', detail: 'cupola.glass' };
    housing.position.set(NODE_X, CY - .14, 0);
    housing.castShadow = housing.receiveShadow = true;
    cupola.exterior.add(housing);
    // Seven windows: one on the axis and six around, like the petals of a flower.
    // The cupola faces -Y, so its axis is Y and the top pane is a disc lying flat
    // about that axis — a quarter turn about X.
    into(cupola, 'exterior', 'cupola.glass', cyl(.17, .17, .05, 20), 'glass',
      { name: 'Top window', pos: [NODE_X, CY - .30, 0], glass: true });
    // Six petals around the rim. Each sits on the cone face and leans outward, so
    // its normal points away and down: build a group whose -Z looks that way and
    // hang a flat disc in it.
    for (let i = 0; i < 6; i++) {
      const th = i / 6 * Math.PI * 2;
      const r = .30;
      const g = new T.Group();
      g.position.set(NODE_X + Math.sin(th) * r, CY - .27, Math.cos(th) * r);
      // Aim the group outward and slightly down, then roll the pane flat.
      g.lookAt(NODE_X + Math.sin(th) * (r + 1), CY - .75, Math.cos(th) * (r + 1));
      cupola.exterior.add(g);
      const pane = new T.Mesh(cyl(.115, .115, .05, 18), glassMat('glass'));
      pane.name = 'Window petal';
      pane.userData = { region: 'cupola', assemblyId: 'cupola', detail: 'cupola.glass' };
      pane.rotation.x = Math.PI / 2; pane.castShadow = false; pane.receiveShadow = true;
      g.add(pane);
      const fr = new T.Mesh(torus(.135, .032, 20), mat('gold', .4, .55));
      fr.name = 'Petal frame';
      fr.userData = { region: 'cupola', assemblyId: 'cupola', detail: 'cupola.glass' };
      fr.castShadow = fr.receiveShadow = true;
      g.add(fr);
    }
    // The metal shield that can close over the glass to keep out flying grit.
    for (const s of [1, -1]) {
      into(cupola, 'exterior', 'cupola.shutter', softBox(T, .46, .04, .30, .04), 'shield',
        { name: 'Shield cover', pos: [NODE_X + s * .30, CY - .18, 0], rot: [0, s > 0 ? .30 : Math.PI - .30, 0], roughness: .55, metalness: .3 });
    }
    into(cupola, 'exterior', 'cupola.shutter', cyl(.50, .50, .06, 28), 'shieldDark',
      { name: 'Shield ring', pos: [NODE_X, CY - .40, 0], roughness: .55, metalness: .3 });
    // The control rail just inside the glass: this is where the robot arm is
    // driven from, looking straight out at the arm itself.
    into(cupola, 'exterior', 'cupola.rail', box(.34, .07, .52), 'dark',
      { name: 'Control rail', pos: [NODE_X, CY - .04, 0], roughness: .6 });
    for (let i = 0; i < 3; i++) {
      into(cupola, 'exterior', 'cupola.rail', cyl(.028, .028, .05, 10), 'greenLite',
        { name: 'Rail button', pos: [NODE_X - .06 + i * .06, CY - .00, .16], roughness: .3 });
    }
    into(cupola, 'exterior', 'cupola.rail', cyl(.022, .022, .12, 10), 'steel',
      { name: 'Rail stick', pos: [NODE_X, CY + .06, -.14], roughness: .4, metalness: .5 });
    into(cupola, 'ghost', null, box(1.10, .62, 1.10), 'glass', { pos: [NODE_X, CY - .18, 0] });
  }

  /* ---------- 8. windows: the thick portholes set into every module ---------- */
  const windows = assembly('windows', 'windows', [-1.70, .52, 0], 1.5,
    [-1.95, .10], ['windows.frame', 'windows.inner', 'windows.drape']);
  {
    // The big glazed openings on the top of the barrels, framed in a heavy gold
    // ring — the picture book gives every module a generous skylight.
    for (const [x, w, l] of [[-1.70, .34, .62], [1.32, .34, .58]]) {
      into(windows, 'exterior', 'windows.frame', softBox(T, l, .10, w, .05), 'gold',
        { name: 'Window frame', pos: [x, RM + .02, 0], roughness: .42, metalness: .55 });
      into(windows, 'exterior', 'windows.inner', softBox(T, l - .12, .06, w - .10, .04), 'glass',
        { name: 'Inner pane', pos: [x, RM + .06, 0], glass: true });
      // The soft shade stowed beside the opening: a crew must be able to block
      // the light, because sunrise comes sixteen times a day.
      into(windows, 'exterior', 'windows.drape', box(.30, .10, .05), 'blue',
        { name: 'Sun shade', pos: [x - .44, RM + .02, 0], roughness: .8 });
      for (const s of [1, -1]) {
        into(windows, 'exterior', 'windows.frame', box(.30, .06, .07), 'goldDark',
          { name: 'Window frame', pos: [x, RM + .02, s * (w / 2 + .04)], roughness: .42, metalness: .55 });
      }
      for (const s of [1, -1]) {
        into(windows, 'exterior', 'windows.frame', box(.07, .06, w + .12), 'goldDark',
          { name: 'Window frame', pos: [x + s * (l / 2 + .04), RM + .02, 0], roughness: .42, metalness: .55 });
      }
    }
    into(windows, 'ghost', null, box(1.60, .30, .50), 'glass', { pos: [-.20, RM + .02, 0] });
  }

  /* ---------- 9. interior: the cabin the crew lives in ---------- */
  const interior = assembly('interior', 'interior', [.60, 0, 0], 2.2,
    [-1.62, .12], ['interior.racks', 'interior.sleep', 'interior.table', 'interior.treadmill', 'interior.plants']);
  {
    // Equipment racks: square lockers filling the curved wall, exactly the way
    // the illustration lines the barrel. Every rack is one standard size, so the
    // station can be fitted out one drawer at a time.
    const RACKS = 5, RX0 = -.95, RGAP = .56;
    for (let i = 0; i < RACKS; i++) {
      const x = RX0 + i * RGAP;
      for (const th of [Math.PI * .22, Math.PI * .78, Math.PI * 1.22, Math.PI * 1.78]) {
        const y = Math.sin(th) * (RM - .16), z = Math.cos(th) * (RM - .16);
        const g = new T.Group(); g.position.set(x, y, z);
        g.lookAt(x, y + Math.sin(th), z + Math.cos(th));
        interior.details['interior.racks'].add(g);
        const r = new T.Mesh(box(.46, .40, .22), mat('rack', .62));
        r.name = 'Equipment rack';
        r.userData = { region: 'interior', assemblyId: 'interior', detail: 'interior.racks' };
        r.position.set(0, 0, -.09); r.castShadow = r.receiveShadow = true;
        g.add(r);
        const face = new T.Mesh(box(.42, .06, .05), mat('rackDark', .6));
        face.name = 'Rack handle';
        face.userData = { region: 'interior', assemblyId: 'interior', detail: 'interior.racks' };
        face.position.set(0, -.10, .03); face.castShadow = true;
        g.add(face);
        for (let b = 0; b < 3; b++) {
          const led = new T.Mesh(box(.05, .03, .03), mat(b % 2 ? 'greenLite' : 'lamp', .35));
          led.name = 'Rack indicator';
          led.userData = { region: 'interior', assemblyId: 'interior', detail: 'interior.racks' };
          led.position.set(-.14 + b * .14, .14, .03); led.castShadow = false;
          g.add(led);
        }
      }
    }
    // The sleeping bag: a long blue bag strapped upright to the wall. In free
    // fall there is no "lying down", so a crew member simply zips in and floats.
    into(interior, 'interior', 'interior.sleep', softBox(T, .46, 1.06, .22, .17), 'bag',
      { name: 'Sleeping bag', pos: [-1.70, 0, -RM + .18], roughness: .78 });
    for (let i = 0; i < 3; i++) {
      into(interior, 'interior', 'interior.sleep', box(.48, .05, .05), 'goldLite',
        { name: 'Bag strap', pos: [-1.70, -.32 + i * .30, -RM + .31], roughness: .7 });
    }
    // The galley table with its food pouches taped down.
    into(interior, 'interior', 'interior.table', softBox(T, .60, .06, .40, .05), 'white',
      { name: 'Galley table', pos: [.34, -.42, -.20], roughness: .6 });
    into(interior, 'interior', 'interior.table', cyl(.05, .05, .46, 12), 'steel',
      { name: 'Table post', pos: [.34, -.66, -.20], roughness: .4, metalness: .5 });
    for (let i = 0; i < 4; i++) {
      into(interior, 'interior', 'interior.table', softBox(T, .16, .03, .12, .02), i % 2 ? 'shield' : 'rack',
        { name: 'Food pouch', pos: [.16 + (i % 2) * .30, -.38, -.32 + Math.floor(i / 2) * .22], roughness: .7 });
    }
    // The treadmill, with its harness: without the straps the runner would simply
    // push off and float away.
    into(interior, 'interior', 'interior.treadmill', softBox(T, .54, .07, .36, .04), 'dark',
      { name: 'Treadmill belt', pos: [1.28, -.58, .16], roughness: .8 });
    into(interior, 'interior', 'interior.treadmill', box(.54, .05, .04), 'steel',
      { name: 'Treadmill rail', pos: [1.28, .02, .34], roughness: .4, metalness: .5 });
    for (const s of [1, -1]) {
      into(interior, 'interior', 'interior.treadmill', box(.05, .60, .05), 'steel',
        { name: 'Treadmill post', pos: [1.28 + s * .24, -.30, .34], roughness: .4, metalness: .5 });
      into(interior, 'interior', 'interior.treadmill', box(.05, .05, .46), 'blue',
        { name: 'Harness strap', pos: [1.28 + s * .12, .18, .12], rot: [.55, 0, 0], roughness: .75 });
    }
    // The plant box: green lettuce under purple lamps. Leaves absorb mostly red
    // and blue, so the lamp that feeds them looks violet to us.
    into(interior, 'interior', 'interior.plants', softBox(T, .62, .34, .44, .05), 'dark',
      { name: 'Plant box', pos: [-1.02, -.60, .30], roughness: .7 });
    into(interior, 'interior', 'interior.plants', box(.58, .03, .40), 'floorDark',
      { name: 'Soil tray', pos: [-1.02, -.44, .30], roughness: .85 });
    for (let i = 0; i < 6; i++) {
      const s = new T.Mesh(sph(.085, 10), mat('greenLite', .8));
      s.name = 'Lettuce plant';
      s.userData = { region: 'interior', assemblyId: 'interior', detail: 'interior.plants' };
      s.scale.set(1, .8, 1);
      s.position.set(-1.22 + (i % 3) * .20, -.36 + (i > 2 ? .02 : 0), .16 + Math.floor(i / 3) * .18);
      s.castShadow = true;
      interior.details['interior.plants'].add(s);
    }
    for (let i = 0; i < 4; i++) {
      into(interior, 'interior', 'interior.plants', box(.10, .02, .04), 'purple',
        { name: 'Grow lamp', pos: [-1.22 + i * .14, -.22, .30], castShadow: false, roughness: .4 });
    }
    into(interior, 'ghost', null, box(3.40, RM * 1.7, RM * 1.7), 'rack', { pos: [.55, 0, 0] });
  }

  /* ---------- 10. radiator: the pale panels that throw the heat away ---------- */
  const radiator = assembly('radiator', 'radiator', [.20, RAD_Y, 0], 2.2,
    [-1.20, .52], ['radiator.panel', 'radiator.loop']);
  {
    // Radiators stand off the node on the +Y side, where they never look at the
    // Sun. In a vacuum there is no air to carry heat away, so the station has to
    // radiate it — which is why these panels are large and pale.
    for (const s of [1, -1]) {
      const g = new T.Group();
      g.position.set(NODE_X, RAD_Y, s * .34);
      g.rotation.x = s > 0 ? -2.20 : 2.20;
      radiator.exterior.add(g);
      for (let i = 0; i < 3; i++) {
        const p = new T.Mesh(box(.44, .035, 1.45), mat('radiator', .55, .18));
        p.name = 'Radiator panel';
        p.userData = { region: 'radiator', assemblyId: 'radiator', detail: 'radiator.panel' };
        p.position.set(-.20 + i * .48, 0, s * .74);
        p.castShadow = p.receiveShadow = true;
        g.add(p);
        const edge = new T.Mesh(box(.46, .045, .05), mat('radiatorEdge', .5, .2));
        edge.name = 'Radiator edge';
        edge.userData = { region: 'radiator', assemblyId: 'radiator', detail: 'radiator.panel' };
        edge.position.set(-.20 + i * .48, 0, s * 1.46);
        edge.castShadow = true;
        g.add(edge);
      }
      // The coolant loop: the pipe pair that carries hot fluid out and cool fluid
      // back, so the racks never overheat.
      for (const dz of [-.10, .10]) {
        const pipe = rod(T, [NODE_X - .66, RAD_Y, s * .30 + dz], [NODE_X + .66, RAD_Y, s * 1.30 + dz], .035, 10);
        pipe.userData = { region: 'radiator', assemblyId: 'radiator', detail: 'radiator.loop' };
        pipe.name = 'Coolant pipe'; pipe.castShadow = true;
        g.add(pipe);
      }
      for (const x of [-.20, .28, .76]) {
        const c = new T.Mesh(cyl(.055, .055, 1.45, 12), mat('steel', .4, .5));
        c.name = 'Coolant pipe';
        c.userData = { region: 'radiator', assemblyId: 'radiator', detail: 'radiator.loop' };
        c.rotation.x = Math.PI / 2;
        c.position.set(-.20 + x, -.02, s * .74);
        c.castShadow = true;
        g.add(c);
      }
    }
    into(radiator, 'ghost', null, box(1.30, .30, 3.20), 'radiator', { pos: [NODE_X, RAD_Y, 0] });
  }

  /* ---------- frame update + the numbers the studio and QA both read ---------- */
  function update(state) {
    for (const a of assemblies) if (a.update) a.update(state);
  }
  // Counts are computed from the graph, not asserted by hand.
  let meshes = 0, triangles = 0;
  root.traverse(o => {
    if (!o.isMesh || !o.geometry) return;
    meshes++;
    const g = o.geometry, n = g.index ? g.index.count : g.attributes.position.count;
    triangles += n / 3;
  });

  return {
    root, assemblies, counts: { assemblies: assemblies.length, meshes, triangles },
    RM, NOSE_X, TAIL_X, NODE_X, NODE_R, TRUSS_Y, WING_X, WING_Z, ARM_X, ARM_Y, ARM_Z,
    RAD_Y, RAD_Z, update
  };
} };

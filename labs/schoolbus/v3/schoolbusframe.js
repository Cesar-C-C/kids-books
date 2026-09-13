/* Little School Bus — v3 model of the picture-book school bus (US Type C
   "conventional": a van front end with the engine ahead of the windshield, and a
   long flat-sided passenger box behind it).

   Everything is described in metres around the bus's own origin. The station
   table below is the single source of truth: the shell, the interior, the
   chassis and the wheels all read their heights from these six constants, so a
   change here moves the whole bus at once instead of drifting part by part.

   Reference: books/schoolbus/assets/01_parts_c_v2.webp (side), 05_stopsign_c_v2
   (front three-quarter), 03_inside_c_v2 (cabin). Colours are visually matched to those
   images; the book gives no engineering dimensions, so the proportions are read
   off the side view and rounded to round numbers.

   Station table (y, metres):
     ground               -2.02
     chassis rail         -1.62 .. -1.36
     floor                -1.30            ceiling  0.96
     roof crown            1.42
     hood top             -0.45
     nose tip             x -4.90          tail    x +4.20
*/
window.SchoolBusV3 = { create(T) {
  const assemblies = [];
  const root = new T.Group(); root.name = 'Picture-book school bus';
  const materials = new Map();
  // Visually matched to books/schoolbus/assets: the National School Bus Glossy Yellow
  // shell, a slightly paler roof, blue vinyl bench seats, black rub rails and
  // bumpers, and the red octagon of the stop arm.
  const palette = {
    yellow: 0xf2b719, yellowDim: 0xd09c14, yellowPale: 0xf4e5bd, yellowDark: 0xb98410,
    cream: 0xf2e6c4, ink: 0x24282c, black: 0x1d2124, dark: 0x2d3940,
    glass: 0x2f4d63, glassLite: 0x3d6076, seat: 0x2f5f96, seatDim: 0x274e7d,
    floor: 0x5a6674, floorDark: 0x47525e, steel: 0x8a959c, chrome: 0xc3cbd0,
    rubber: 0x1d2124, red: 0xc0392b, amber: 0xe8622a, lamp: 0xf0e0a8,
    copper: 0xb8823d, oil: 0x4a4238, mirror: 0x9fb0bb
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
  // A bar from point a to point b — used for every pole, rail and pipe.
  function rod(T, a3, b3, r, seg = 12) {
    const a = new T.Vector3(a3[0], a3[1], a3[2]), b = new T.Vector3(b3[0], b3[1], b3[2]);
    const d = b.clone().sub(a), g = cyl(r, r, d.length(), seg);
    const m = new T.Mesh(g, mat('steel', .45, .45));
    m.position.copy(a).addScaledVector(d, .5);
    m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.clone().normalize());
    return m;
  }

  /* ---------- the station table: every height in the bus comes from here ---------- */
  const HALF_LEN = 4.20;         // tail at +HALF_LEN
  const HALF_W = 1.22;           // body half width
  const NOSE_X = -4.90;          // front bumper face
  const BOX_X = -2.60;           // windshield plane: where the box begins
  const FLOOR = -1.30, CEIL = 0.96;
  const ROOF_TOP = 1.26;
  const RAIL_Y = -1.49;          // chassis rail centre
  const AXLE_F = -3.52, AXLE_R = 2.30;
  const WHEEL_R = .50;
  const HOOD_TOP = -0.45;        // hood crown at the nose (measured, not assumed)
  const COWL_Y = -0.15;          // where the cowl meets the base of the windshield
  const BELT_Y = -1.62;          // bottom of the yellow shell / top of the skirt

  /* ---------- 1. body: the yellow shell around the passenger box ---------- */
  const body = assembly('body', 'body', [.4, -.20, 0], 4.8,
    [-1.62, .18], ['body.shell', 'body.windows', 'body.rubrail', 'body.skirt']);
  {
    // Side wall: one plate per side, spanning box from the windshield to the tail
    // and from the belt line up to the eaves. The hood is drawn by the hood
    // assembly, so the box side stops where the hood begins.
    const len = HALF_LEN - BOX_X, mid = (BOX_X + HALF_LEN) / 2;
    const hgt = CEIL - BELT_Y, ymid = (CEIL + BELT_Y) / 2;
    for (const side of [-1, 1]) {
      const z = side * HALF_W;
      // The plate is pulled inboard of HALF_W so its outer face is the recess the
      // glazing sits in; z = HALF_W is the bus's true outer skin.
      into(body, 'exterior', 'body.shell', roundPanel(T, len, hgt, .10, .10), 'yellow',
        { name: 'Side wall', pos: [mid, ymid, z - side * .05], rot: [0, side > 0 ? 0 : Math.PI, 0], roughness: .5 });
      // Glazing bays: the illustration runs them nearly edge to edge, so the span
      // is measured inward from the windshield and the tail rather than guessed.
      const W0 = BOX_X + .28, W1 = HALF_LEN - .34, SPAN = W1 - W0, BAYS = 6, BAY_W = SPAN / BAYS - .12;
      for (let i = 0; i < BAYS; i++) {
        const x = W0 + SPAN * (i + .5) / BAYS;
        if (side < 0 && i === 0) continue; // front passenger doorway
        into(body, 'exterior', 'body.windows', softBox(T, BAY_W, .86, .07, .05), 'glass',
          { name: 'Side window', pos: [x, .30, z + side * .05], rot: [0, side > 0 ? 0 : Math.PI, 0], glass: true });
        into(body, 'exterior', 'body.windows', box(BAY_W + .08, .06, .07), 'ink',
          { name: 'Window post', pos: [x, .30, z + side * .10], rot: [0, side > 0 ? 0 : Math.PI, 0] });
      }
      // Two rub rails: the black bars that take the bumps instead of the paint.
      // The upper one doubles as the window sill line in the illustration.
      for (const [y, h] of [[-.16, .11], [-.90, .09]]) {
        into(body, 'exterior', 'body.rubrail', box(len + .10, h, .05), 'black',
          { name: 'Rub rail', pos: [mid, y, z + side * .05] });
      }
      // Skirt below the belt line, with a wheel arch cut over each axle.
      into(body, 'exterior', 'body.skirt', box(len + .06, .10, .10), 'yellowDark',
        { name: 'Skirt panel', pos: [mid, (BELT_Y + RAIL_Y - .10) / 2, z], rot: [0, side > 0 ? 0 : Math.PI, 0] });
      for (const ax of [AXLE_F, AXLE_R]) {
        // A wheel arch is a half-ring in the XY plane opening downward. Turning it
        // about X would swing the radius into Z and push it outside the body.
        into(body, 'exterior', 'body.skirt', torus(WHEEL_R + .09, .055, 32, Math.PI), 'yellowDim',
          { name: 'Wheel arch', pos: [ax, RAIL_Y - .34, z + side * .015] });
      }
    }
    // The tail closes the box. A bulkhead spans the WIDTH, so it is
    // (width, height, thickness) turned a quarter turn about Y.
    into(body, 'exterior', 'body.shell', roundPanel(T, HALF_W * 2, hgt, .12, .24), 'yellow',
      { name: 'Rear panel', pos: [HALF_LEN - .06, ymid, 0], rot: [0, Math.PI / 2, 0], roughness: .5 });
    // Roof cap strip along the crown, and the inner lining of the cabin.
    into(body, 'exterior', 'body.shell', box(len - .30, .12, HALF_W * 2 - .24), 'yellowPale',
      { name: 'Roof cap', pos: [mid, CEIL + .18, 0] });
    into(body, 'interior', 'body.shell', box(len - .50, .06, HALF_W * 2 - .30), 'cream',
      { name: 'Ceiling lining', pos: [mid, CEIL - .04, 0], castShadow: false });
    into(body, 'ghost', null, box(len, hgt + .30, HALF_W * 2 + .02), 'yellow', { pos: [mid, ymid + .10, 0] });
  }

  /* ---------- 2. roof: the gently arched cover ---------- */
  const roof = assembly('roof', 'roof', [.4, ROOF_TOP, 0], 4.4,
    [-1.62, .48], ['roof.panel', 'roof.hatch', 'roof.beacon']);
  {
    // A domed cap across the width, extruded along the length of the box. The
    // illustration's cap is much rounder than a shallow crown but nowhere near a
    // semicircle: it rises about a fifth of the width. A superellipse (k=.62)
    // gives that flat-topped, gently shouldered "bread loaf" section; a plain arc
    // of radius HALF_W would stand a whole 1.2 m proud and dwarf the bus.
    const CAP_RISE = .30;
    const cap = new T.Shape();
    cap.moveTo(-HALF_W, 0);
    for (let i = 1; i <= 22; i++) {
      const t = Math.PI * i / 22;
      cap.lineTo(-HALF_W * Math.cos(t), CAP_RISE * Math.pow(Math.max(0, Math.sin(t)), .62));
    }
    cap.lineTo(-HALF_W, 0);
    const len = HALF_LEN - BOX_X - .18, mid = (BOX_X + HALF_LEN) / 2 - .10;
    const rg = new T.ExtrudeGeometry(cap, { depth: len, bevelEnabled: false, curveSegments: 22, steps: 1 });
    rg.translate(0, 0, -len / 2); rg.rotateY(Math.PI / 2);
    into(roof, 'exterior', 'roof.panel', rg, 'yellowPale', { name: 'Roof panel', pos: [mid, CEIL, 0], roughness: .5 });
    // Two hatches open upward as emergency exits. They sit ON the dome, so their
    // y rides the crown of the arc rather than the flat ceiling line.
    for (const x of [-1.30, .70]) {
      const crown = CAP_RISE;
      into(roof, 'exterior', 'roof.hatch', box(.62, .07, .44), 'cream',
        { name: 'Roof hatch', pos: [x, CEIL + crown - .02, 0], roughness: .6 });
    }
    into(roof, 'ghost', null, box(len, .48, HALF_W * 2 + .02), 'yellow', { pos: [mid, CEIL + .18, 0] });
  }

  /* ---------- 3. hood: the van front end with the engine under it ---------- */
  const hood = assembly('hood', 'hood', [-3.75, -.30, 0], 1.7,
    [-2.05, .12], ['hood.cover', 'hood.grille', 'hood.headlight', 'hood.bumper']);
  {
    // The hood stops short of BOX_X: the windshield plate sits ON that plane, so
    // a hood that ran all the way to it would swallow the glass.
    const HX0 = NOSE_X + .06, HX1 = BOX_X - .30, HL = HX1 - HX0, HM = (HX0 + HX1) / 2;
    const HW = HALF_W - .06;          // the hood is slightly narrower than the box
    // The hood is a slab from the belt line up to HOOD_TOP, then a sloping panel
    // runs from the hood top up to the windshield base.
    into(hood, 'exterior', 'hood.cover', softBox(T, HL, HOOD_TOP - BELT_Y, HW * 2, .10), 'yellow',
      { name: 'Hood block', pos: [HM, (HOOD_TOP + BELT_Y) / 2, 0], roughness: .5 });
    // Cowl joint: the band of body between the back of the hood (HX1) and the
    // windshield plane (BOX_X). Leaving it out opens a visible slot right through
    // the bus at the A-pillar, which is what the picture book never shows. Two
    // full-height side cheeks plus a top panel close it off.
    const jointLen = BOX_X - HX1, jointMid = (HX1 + BOX_X) / 2;
    for (const side of [-1, 1]) {
      into(hood, 'exterior', 'hood.cover', softBox(T, jointLen + .04, COWL_Y - BELT_Y, .10, .04), 'yellow',
        { name: 'Cowl cheek', pos: [jointMid, (COWL_Y + BELT_Y) / 2, side * (HALF_W - .05)],
          rot: [0, side > 0 ? 0 : Math.PI, 0], roughness: .5 });
    }
    into(hood, 'exterior', 'hood.cover', box(jointLen + .04, .09, HALF_W * 2 - .06), 'yellow',
      { name: 'Cowl top', pos: [jointMid, COWL_Y - .04, 0], roughness: .5 });
    // The sloping shoulder from the hood top up to the base of the windshield.
    // It is a plate whose long axis is X, so a rotation about Z tips its far end
    // up towards the windscreen.
    // The sloping shoulder from the hood crown up to the base of the windshield.
    // A plate whose long axis is X, tipped about Z so its far end rises to COWL_Y.
    const cowlLen = Math.hypot(BOX_X - HX1, COWL_Y - HOOD_TOP);
    into(hood, 'exterior', 'hood.cover', box(cowlLen, .08, HW * 2 - .02), 'yellow',
      { name: 'Cowl', pos: [(HX1 + BOX_X) / 2, (HOOD_TOP + COWL_Y) / 2, 0],
        rot: [0, 0, Math.atan2(COWL_Y - HOOD_TOP, BOX_X - HX1)], roughness: .5 });
    // Fenders: a rounded lobe over each front wheel, blended into the hood side.
    for (const side of [-1, 1]) {
      into(hood, 'exterior', 'hood.cover', softBox(T, 1.30, .62, .26, .18), 'yellow',
        { name: 'Front fender', pos: [AXLE_F + .06, -.72, side * (HW - .02)], rot: [0, side > 0 ? 0 : Math.PI, 0], roughness: .5 });
    }
    // Grille: horizontal slats across the nose.
    into(hood, 'exterior', 'hood.grille', box(.10, .52, 1.16), 'steel',
      { name: 'Grille panel', pos: [NOSE_X + .13, -.72, 0], roughness: .35, metalness: .6 });
    for (let i = 0; i < 5; i++) {
      into(hood, 'exterior', 'hood.grille', box(.05, .05, 1.08), 'chrome',
        { name: 'Grille slat', pos: [NOSE_X + .08, -.92 + i * .10, 0], roughness: .3, metalness: .7 });
    }
    // Round headlights either side of the grille.
    for (const side of [-1, 1]) {
      into(hood, 'exterior', 'hood.headlight', cyl(.15, .15, .10, 20), 'lamp',
        { name: 'Headlight', pos: [NOSE_X + .14, -.78, side * .74], rot: [0, 0, Math.PI / 2], roughness: .25 });
      into(hood, 'exterior', 'hood.headlight', torus(.155, .022, 20), 'chrome',
        { name: 'Headlight ring', pos: [NOSE_X + .18, -.78, side * .74], rot: [0, Math.PI / 2, 0], roughness: .3, metalness: .7 });
    }
    // A thick black bumper is the first thing to meet a bump. It runs across the
    // nose, so it is thin in X (the direction of travel), tall in Y and long in
    // Z. softBox already puts its width on X and its depth on Z, so this needs no
    // rotation at all — rotating it would swap the length into the height.
    into(hood, 'exterior', 'hood.bumper', softBox(T, .34, .34, HALF_W * 2 - .02, .08), 'black',
      { name: 'Front bumper', pos: [NOSE_X + .17, -1.26, 0], roughness: .7 });
    into(hood, 'ghost', null, box(HL + .20, 1.90, HALF_W * 2), 'yellow', { pos: [HM, -.45, 0] });
  }

  /* ---------- 4. cab: the driving position at the front of the box ---------- */
  const cab = assembly('cab', 'cab', [-2.05, -.10, 0], 1.9,
    [-1.90, .16], ['cab.wheel', 'cab.dash', 'cab.seat', 'cab.glass', 'cab.mirror']);
  {
    // A flat, nearly upright windshield that spans the body front. On a Type-C
    // the screen IS the front plane of the box: the roof cap arches over the top
    // of it and the yellow below it is only a shallow cowl, not a wall. So the
    // glass is one wide pane on BOX_X, with black corner panels either side of it
    // narrowing it to the pillar line.
    const WS_TOP = .70, WS_BOT = -.16, WS_W = HALF_W * 2 - .10;
    into(cab, 'exterior', 'cab.glass', softBox(T, .07, WS_TOP - WS_BOT, WS_W, .05), 'glass',
      { name: 'Windshield pane', pos: [BOX_X - .02, (WS_TOP + WS_BOT) / 2, 0], roughness: .18, metalness: .25, glass: true });
    // Corner panels: the A-pillars that visibly narrow the glass on the outside.
    for (const side of [-1, 1]) {
      into(cab, 'exterior', 'cab.glass', box(.09, WS_TOP - WS_BOT + .04, .16),
        'ink', { name: 'Windshield pillar', pos: [BOX_X - .03, (WS_TOP + WS_BOT) / 2, side * (HALF_W - .06)] });
    }
    into(cab, 'exterior', 'cab.glass', softBox(T, .10, .13, WS_W + .04, .04), 'yellow',
      { name: 'Windshield header', pos: [BOX_X - .01, WS_TOP + .07, 0], roughness: .5 });
    // The driver's door and its side window, on the left-hand side.
    into(cab, 'exterior', 'cab.glass', softBox(T, .62, .56, .05, .05), 'glass',
      { name: 'Driver window', pos: [BOX_X + 1.05, .30, HALF_W + .06], roughness: .18, metalness: .25, glass: true });
    // Steering wheel, raked back towards the driver.
    into(cab, 'interior', 'cab.wheel', torus(.24, .035, 28), 'ink',
      { name: 'Steering wheel', pos: [BOX_X + .95, -.24, .42], rot: [1.05, 0, 0], roughness: .5 });
    into(cab, 'interior', 'cab.wheel', cyl(.035, .035, .40, 12), 'ink',
      { name: 'Steering column', pos: [BOX_X + .88, -.44, .42], rot: [0, 0, .35] });
    // Dashboard: a shelf of dials under the windshield. softBox already puts its
    // width on X (fore-and-aft) and its depth on Z (across the cab), so this needs
    // NO rotation. A quarter turn about Y swapped those axes and sent the 2.18 m
    // width down the length of the bus, poking a slab out through the windshield.
    into(cab, 'interior', 'cab.dash', softBox(T, .40, .30, HALF_W * 2 - .26, .07), 'ink',
      { name: 'Dashboard', pos: [BOX_X + .50, -.06, 0], roughness: .6 });
    for (let i = 0; i < 3; i++) {
      into(cab, 'interior', 'cab.dash', cyl(.075, .075, .04, 16), 'glassLite',
        { name: 'Dial', pos: [BOX_X + .40, .02, .18 + i * .16], rot: [0, 0, Math.PI / 2], roughness: .3 });
    }
    // Driver seat: high, with a back that reaches the child's shoulder height.
    into(cab, 'interior', 'cab.seat', softBox(T, .52, .14, .58, .06), 'seat',
      { name: 'Seat cushion', pos: [BOX_X + 1.20, -.52, .42] });
    into(cab, 'interior', 'cab.seat', softBox(T, .16, .74, .60, .07), 'seatDim',
      { name: 'Seat back', pos: [BOX_X + 1.46, -.12, .42] });
    // Crossing mirror: the little round mirror that shows the blind spot right at
    // the bumper. Without it a driver cannot see a child standing in front. The
    // disc faces FORWARD, so its axis is X — turned about Z, not left lying in
    // XY, which would swing its radius out past the nose.
    for (const side of [-1, 1]) {
      into(cab, 'exterior', 'cab.mirror', cyl(.115, .115, .035, 20), 'mirror',
        { name: 'Crossing mirror', pos: [NOSE_X + 1.55, .34, side * (HALF_W + .16)], rot: [0, 0, Math.PI / 2], roughness: .2, metalness: .5 });
      into(cab, 'exterior', 'cab.mirror', box(.05, .58, .05), 'ink',
        { name: 'Mirror stalk', pos: [NOSE_X + 1.55, .06, side * (HALF_W + .16)] });
      // Tall side mirror on a swing arm, just outside the driver's window. The
      // arm is long in Z (out from the body) and the head is a thin plate.
      into(cab, 'exterior', 'cab.mirror', softBox(T, .16, .48, .05, .02), 'ink',
        { name: 'Side mirror', pos: [BOX_X + .30, .34, side * (HALF_W + .21)], rot: [0, side > 0 ? 0 : Math.PI, 0], roughness: .5 });
      into(cab, 'exterior', 'cab.mirror', box(.05, .05, .28), 'ink',
        { name: 'Mirror arm', pos: [BOX_X + .30, .60, side * (HALF_W + .08)] });
    }
    into(cab, 'ghost', null, box(1.90, 1.50, HALF_W * 2), 'yellow', { pos: [BOX_X + 1.00, -.16, 0] });
  }

  /* ---------- 5. doors: the folding entrance behind the front wheel ---------- */
  const DOOR_X = -1.72;
  const doorLeaves = [];
  const doors = assembly('doors', 'doors', [DOOR_X, -.20, -HALF_W], 1.5,
    [-2.05, .08], ['doors.leaf', 'doors.glass', 'doors.step', 'doors.emergency']);
  {
    const leaves = doorLeaves;
    // Two half-doors hinged at the outer edges, folding at the centre line. Each
    // leaf is half the doorway wide, so together they close it exactly.
    for (const dir of [-1, 1]) {
      const pivot = new T.Group();
      pivot.position.set(DOOR_X, -.17, -HALF_W + .04);
      doors.exterior.add(pivot);
      const LEAF_W = .44;
      const leaf = new T.Mesh(softBox(T, LEAF_W, 2.12, .07, .04), mat('ink', .5));
      leaf.name = 'Door leaf';
      leaf.userData = { region: 'doors', assemblyId: 'doors', detail: 'doors.leaf' };
      leaf.castShadow = leaf.receiveShadow = true;
      leaf.position.set(dir * LEAF_W / 2, 0, .02);
      pivot.add(leaf);
      const gl = new T.Mesh(softBox(T, LEAF_W - .14, .70, .03, .04), glassMat('glass'));
      gl.userData = { region: 'doors', assemblyId: 'doors', detail: 'doors.glass' };
      gl.position.set(0, .52, -.055);
      const lowerGlass = gl.clone();
      lowerGlass.position.set(0, -.43, -.055);
      leaf.add(lowerGlass);
      leaf.add(gl);
      leaves.push({ pivot, dir });
    }
    // Entry steps: two wide treads up to the cabin floor.
    for (const [y, d] of [[-.92, .46], [-.52, .46]]) {
      into(doors, 'exterior', 'doors.step', box(.80, .07, d), 'floorDark',
        { name: 'Entry step', pos: [DOOR_X, y, -HALF_W + d / 2 - .02] });
    }
    // Emergency door at the tail, with its own window and push bar.
    into(doors, 'exterior', 'doors.emergency', softBox(T, .84, 1.36, .09, .05), 'yellow',
      { name: 'Emergency door', pos: [HALF_LEN - .04, -.17, .62], rot: [0, Math.PI / 2, 0], roughness: .5 });
    into(doors, 'exterior', 'doors.emergency', softBox(T, .52, .46, .05, .04), 'glass',
      { name: 'Emergency window', pos: [HALF_LEN + .01, .28, .62], rot: [0, Math.PI / 2, 0], glass: true });
    into(doors, 'exterior', 'doors.emergency', box(.05, .06, .60), 'red',
      { name: 'Push bar', pos: [HALF_LEN + .01, -.52, .62] });
  }
  // Mechanism: the leaves fold outward about their hinges. Driven by the studio's
  // single "level" value for this region, so it resets exactly to closed.
  doors.update = state => {
    const k = state.mechanism && state.region === 'doors' ? (state.level || 0) : 0;
    doorLeaves.forEach(l => { l.pivot.rotation.y = l.dir * k * 1.20; });
  };

  /* ---------- 6. seats: blue benches down both sides ---------- */
  const seats = assembly('seats', 'seats', [.5, -.60, 0], 4.0,
    [-1.62, .14], [{ id: 'seats.cushion', layer: 'interior' }, { id: 'seats.back', layer: 'interior' },
      { id: 'seats.belt', layer: 'interior' }, 'seats.frame']);
  {
    const SX0 = BOX_X + 2.20, ROWS = 5, GAP = .76;
    for (const side of [-1, 1]) {
      for (let row = 0; row < ROWS; row++) {
        const x = SX0 + row * GAP;
        // Cushion: a firm board, not a soft sofa, so a child is not thrown up in
        // a crash and cannot sink into it.
        into(seats, 'interior', 'seats.cushion', softBox(T, .58, .13, .78, .05), 'seat',
          { name: 'Seat cushion', pos: [x, -.78, side * .62] });
        // The tall back doubles as the wall that catches a child thrown forward.
        into(seats, 'interior', 'seats.back', softBox(T, .15, .96, .80, .07), 'seatDim',
          { name: 'Seat back', pos: [x + .30, -.30, side * .62] });
        into(seats, 'interior', 'seats.belt', box(.07, .09, .70), 'ink',
          { name: 'Seat belt', pos: [x + .28, -.32, side * .62], rot: [.55, 0, 0], roughness: .6 });
        into(seats, 'interior', 'seats.frame', box(.06, .50, .08), 'steel',
          { name: 'Seat leg', pos: [x, -1.06, side * .30], roughness: .4, metalness: .5 });
        into(seats, 'interior', 'seats.frame', box(.06, .50, .08), 'steel',
          { name: 'Seat leg', pos: [x, -1.06, side * .94], roughness: .4, metalness: .5 });
      }
    }
    // The rearmost bench runs the full width across the tail, tucked in far
    // enough that its back does not poke through the rear panel.
    into(seats, 'interior', 'seats.cushion', softBox(T, .58, .13, HALF_W * 2 - .36, .05), 'seat',
      { name: 'Rear bench', pos: [HALF_LEN - .96, -.78, 0] });
    into(seats, 'interior', 'seats.back', softBox(T, .15, .96, HALF_W * 2 - .36, .07), 'seatDim',
      { name: 'Rear bench back', pos: [HALF_LEN - .70, -.30, 0] });
    into(seats, 'ghost', null, box(HALF_LEN - BOX_X - .60, 1.10, HALF_W * 2 - .30), 'seat',
      { pos: [(BOX_X + HALF_LEN) / 2 + .20, -.70, 0] });
  }

  /* ---------- 7. aisle: the straight walkway down the middle ---------- */
  const aisle = assembly('aisle', 'aisle', [.5, -1.20, 0], 4.0,
    [-1.62, -.10], ['aisle.floor', 'aisle.handrail', 'aisle.rear']);
  {
    const len = HALF_LEN - BOX_X - .30, mid = (BOX_X + HALF_LEN) / 2 + .10;
    into(aisle, 'exterior', 'aisle.floor', box(len, .10, HALF_W * 2 - .24), 'floor',
      { name: 'Walkway floor', pos: [mid, FLOOR + .04, 0], roughness: .75 });
    // Ribbed rubber: a few narrow strips standing slightly proud of the floor.
    for (let i = 0; i < 8; i++) {
      into(aisle, 'exterior', 'aisle.floor', box(.06, .025, HALF_W * 2 - .30), 'floorDark',
        { name: 'Floor rib', pos: [BOX_X + .70 + i * .78, FLOOR + .10, 0], castShadow: false });
    }
    // Handrail along the aisle, and the clear path to the rear door.
    for (const side of [-1, 1]) {
      into(aisle, 'exterior', 'aisle.handrail', cyl(.028, .028, len - .20, 12), 'steel',
        { name: 'Handrail', pos: [mid, -.16, side * .30], rot: [0, 0, Math.PI / 2], roughness: .4, metalness: .45 });
      for (const x of [BOX_X + 1.10, HALF_LEN - 1.10]) {
        into(aisle, 'exterior', 'aisle.handrail', cyl(.025, .025, .50, 10), 'steel',
          { name: 'Rail post', pos: [x, -.41, side * .30], roughness: .4, metalness: .45 });
      }
    }
    into(aisle, 'exterior', 'aisle.rear', box(1.20, .07, 1.10), 'floorDark',
      { name: 'Rear landing', pos: [HALF_LEN - .70, FLOOR + .04, 0], roughness: .75 });
    into(aisle, 'ghost', null, box(len, .12, 1.10), 'floor', { pos: [mid, FLOOR + .04, 0] });
  }

  /* ---------- 8. stopsign: the swing-out stop arm ---------- */
  const stopArm = assembly('stopsign', 'stopsign', [0.20, -.05, -HALF_W], 1.4,
    [-1.20, .10], ['stopsign.blade', 'stopsign.arm', 'stopsign.lamp']);
  {
    const ARM_X = 0.30, ARM_Y = .05;
    // The arm rides folded against the body at rest and swings out on a hinge.
    // It is built already folded (hinge rotated to its deployed-off position) so
    // the model's default state matches the bus in the book, parked with the sign
    // stowed — and so the bounding box reflects the bus, not the deployed arm.
    const hinge = new T.Group();
    hinge.position.set(ARM_X, ARM_Y, -HALF_W - .04);
    hinge.rotation.y = Math.PI / 2;
    stopArm.exterior.add(hinge);
    const armMesh = new T.Mesh(box(.60, .07, .07), mat('black', .6));
    armMesh.name = 'Stop arm'; armMesh.castShadow = armMesh.receiveShadow = true;
    armMesh.userData = { region: 'stopsign', assemblyId: 'stopsign', detail: 'stopsign.arm' };
    armMesh.position.set(0, 0, -.30);
    hinge.add(armMesh);
    // The octagon: an 8-sided cylinder with its axis along Z, so the flat faces
    // point sideways like a road sign seen from a car behind.
    const oct = new T.Mesh(cyl(.30, .30, .05, 8), mat('red', .55));
    oct.name = 'Stop sign'; oct.castShadow = oct.receiveShadow = true;
    oct.userData = { region: 'stopsign', assemblyId: 'stopsign', detail: 'stopsign.blade' };
    oct.rotation.set(Math.PI / 2, 0, Math.PI / 8);
    oct.position.set(0, 0, -.60);
    hinge.add(oct);
    const lampMesh = new T.Mesh(cyl(.055, .055, .05, 12), mat('red', .35));
    lampMesh.name = 'Arm lamp'; lampMesh.castShadow = true;
    lampMesh.userData = { region: 'stopsign', assemblyId: 'stopsign', detail: 'stopsign.lamp' };
    lampMesh.rotation.set(Math.PI / 2, 0, 0);
    lampMesh.position.set(-.36, 0, -.30);
    hinge.add(lampMesh);
    stopArm.arm = hinge;
  }
  stopArm.update = state => {
    const k = state.mechanism && state.region === 'stopsign' ? (state.level || 0) : 0;
    // Stowed flat against the body at rest; swung out square to the road when on.
    // The mesh is built folded, so the drive subtracts back from that pose.
    stopArm.arm.rotation.y = (1 - k) * (Math.PI / 2);
  };

  /* ---------- 9. lights: the warning lamps on the roof ---------- */
  const lights = assembly('lights', 'lights', [BOX_X + .35, CEIL + .30, 0], 1.2,
    [-2.05, .30], ['lights.red', 'lights.amber', 'lights.bracket']);
  {
    for (const side of [-1, 1]) {
      // Amber pair outboard, red pair inboard — the order the illustration uses.
      into(lights, 'exterior', 'lights.amber', cyl(.10, .10, .09, 16), 'amber',
        { name: 'Amber light', pos: [BOX_X + .30, CEIL + .30, side * .96], rot: [0, 0, Math.PI / 2], roughness: .3 });
      into(lights, 'exterior', 'lights.red', cyl(.10, .10, .09, 16), 'red',
        { name: 'Red light', pos: [BOX_X + .30, CEIL + .30, side * .62], rot: [0, 0, Math.PI / 2], roughness: .3 });
      for (const z of [side * .96, side * .62]) {
        into(lights, 'exterior', 'lights.bracket', box(.16, .14, .16), 'black',
          { name: 'Light housing', pos: [BOX_X + .30, CEIL + .30, z], roughness: .7 });
      }
    }
    into(lights, 'exterior', 'lights.bracket', box(.10, .05, HALF_W * 2 - .40), 'black',
      { name: 'Light bar', pos: [BOX_X + .30, CEIL + .24, 0] });
    into(lights, 'ghost', null, box(.30, .30, HALF_W * 2), 'red', { pos: [BOX_X + .30, CEIL + .30, 0] });
  }

  /* ---------- 10. wheels: four tires on the road ---------- */
  const wheels = assembly('wheels', 'wheels', [0, -1.52, 0], 4.0,
    [.40, -.14], ['wheels.tire', 'wheels.tread', 'wheels.hub', 'wheels.arch']);
  {
    for (const ax of [AXLE_F, AXLE_R]) {
      for (const side of [-1, 1]) {
        const z = side * (HALF_W - .08);
        // A wheel is a cylinder whose axis is Z, so it must be turned about X.
        // Turning it about Y would stand the cylinder up and push its radius
        // into Z, which makes the bus twice as wide as it should be.
        into(wheels, 'exterior', 'wheels.tire', cyl(WHEEL_R, WHEEL_R, .30, 28), 'rubber',
          { name: 'Tire', pos: [ax, -1.52, z], rot: [Math.PI / 2, 0, 0], roughness: .82 });
        into(wheels, 'exterior', 'wheels.tread', torus(WHEEL_R - .05, .05, 28), 'black',
          { name: 'Tread band', pos: [ax, -1.52, z], roughness: .85 });
        into(wheels, 'exterior', 'wheels.hub', cyl(.26, .26, .32, 20), 'steel',
          { name: 'Wheel hub', pos: [ax, -1.52, z + side * .02], rot: [Math.PI / 2, 0, 0], roughness: .35, metalness: .6 });
        into(wheels, 'exterior', 'wheels.hub', cyl(.09, .09, .34, 12), 'chrome',
          { name: 'Hub nut', pos: [ax, -1.52, z + side * .03], rot: [Math.PI / 2, 0, 0], roughness: .25, metalness: .75 });
      }
      // Axle beam across the pair.
      into(wheels, 'exterior', 'wheels.hub', cyl(.08, .08, HALF_W * 2 - .30, 12), 'steel',
        { name: 'Axle', pos: [ax, -1.52, 0], rot: [0, 0, Math.PI / 2], roughness: .4, metalness: .5 });
    }
    into(wheels, 'ghost', null, box(HALF_LEN + 1.20, .90, HALF_W * 2), 'rubber', { pos: [-.10, -1.56, 0] });
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
    HALF_LEN, HALF_W, NOSE_X, BOX_X, FLOOR, CEIL, ROOF_TOP, RAIL_Y, AXLE_F, AXLE_R, WHEEL_R,
    DOOR_X, update
  };
} };

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
    if (!materials.has(k)) materials.set(k, new T.MeshPhysicalMaterial({ color: 0xb9dbe3, roughness: .035, metalness: 0, transmission: .94, thickness: .025, ior: 1.5, transparent: true, opacity: 1, depthWrite: false, side: T.DoubleSide, clearcoat: 1, clearcoatRoughness: .07, envMapIntensity: .75 }));
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
    mesh.castShadow = !o.glass && o.castShadow !== false;
    if(o.glass) { mesh.userData.glass=true; mesh.renderOrder=2; }
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
  function windowFrame(w,h,d,border=.045) {
    const s=new T.Shape();s.moveTo(-w/2,-h/2);s.lineTo(w/2,-h/2);s.lineTo(w/2,h/2);s.lineTo(-w/2,h/2);s.closePath();
    const hole=new T.Path();hole.moveTo(-w/2+border,-h/2+border);hole.lineTo(-w/2+border,h/2-border);hole.lineTo(w/2-border,h/2-border);hole.lineTo(w/2-border,-h/2+border);hole.closePath();s.holes.push(hole);
    const g=new T.ExtrudeGeometry(s,{depth:d,bevelEnabled:false});g.translate(0,0,-d/2);return g;
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

  // Book reconstruction primitives: longitudinal lofts have continuous rounded
  // shoulders; side skins follow the wheel clearance instead of covering tires.
  function bookLoft(sections, segments = 48) {
    const vertices = [], indices = [];
    sections.forEach(([x, bottom, top, width, power = .45]) => {
      for (let j = 0; j < segments; j++) {
        const a = j / segments * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
        vertices.push(x, (top + bottom) / 2 + (top - bottom) / 2 * Math.sign(s) * Math.pow(Math.abs(s), power), width * Math.sign(c) * Math.pow(Math.abs(c), power));
      }
    });
    for (let i = 0; i < sections.length - 1; i++) for (let j = 0; j < segments; j++) {
      const a = i * segments + j, b = i * segments + (j + 1) % segments, c = b + segments, d = a + segments;
      indices.push(a, d, b, b, d, c);
    }
    for (const [ring, reverse] of [[0, true], [sections.length - 1, false]]) {
      const sec = sections[ring], center = vertices.length / 3;
      vertices.push(sec[0], (sec[1] + sec[2]) / 2, 0);
      for (let j = 0; j < segments; j++) {
        const a = ring * segments + j, b = ring * segments + (j + 1) % segments;
        indices.push(center, reverse ? a : b, reverse ? b : a);
      }
    }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(vertices, 3)); g.setIndex(indices); g.computeVertexNormals();
    return g;
  }
  function bookSide(x0, x1, bottom, top, axles, wheelY, clearance, depth = .075, apertures = []) {
    const s = new T.Shape(); s.moveTo(x0, bottom);
    for (const axle of axles) {
      const dx = Math.sqrt(Math.max(0, clearance * clearance - (bottom - wheelY) ** 2));
      if (axle - dx <= x0 || axle + dx >= x1) continue;
      s.lineTo(axle - dx, bottom);
      const a0 = Math.atan2(bottom - wheelY, -dx), a1 = Math.atan2(bottom - wheelY, dx);
      const start = a0 < 0 ? a0 + Math.PI * 2 : a0;
      const end = a1;
      for (let j = 1; j <= 32; j++) { const a = start + (end - start) * j / 32; s.lineTo(axle + clearance * Math.cos(a), wheelY + clearance * Math.sin(a)); }
    }
    s.lineTo(x1, bottom); s.lineTo(x1, top - .15); s.quadraticCurveTo(x1, top, x1 - .15, top);
    s.lineTo(x0 + .15, top); s.quadraticCurveTo(x0, top, x0, top - .15); s.closePath();
    for(const [x,y,w,h] of apertures){const hole=new T.Path();hole.moveTo(x-w/2,y-h/2);hole.lineTo(x-w/2,y+h/2);hole.lineTo(x+w/2,y+h/2);hole.lineTo(x+w/2,y-h/2);hole.closePath();s.holes.push(hole);}
    return new T.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 12 });
  }
  function clearBookExterior(a) {
    for (const child of [...a.exterior.children]) {
      if (Object.values(a.details).includes(child)) child.clear(); else a.exterior.remove(child);
    }
  }
  function bookWheel(a, ax, side, y, radius, width) {
    const z = side * (HALF_W - .08);
    into(a, 'exterior', 'wheels.tire', cyl(radius - .045, radius - .045, width, 48), 'rubber', { name: 'Tire', pos: [ax, y, z], rot: [Math.PI / 2, 0, 0], roughness: .87 });
    for (const face of [-1, 1]) into(a, 'exterior', 'wheels.tread', torus(radius - .075, .075, 48), 'rubber', { name: 'Rounded tire shoulder', pos: [ax, y, z + face * (width / 2 - .055)], roughness: .87 });
    into(a, 'exterior', 'wheels.hub', cyl(radius * .57, radius * .57, .04, 40), 'steel', { name: 'Wheel hub', pos: [ax, y, z + side * (width / 2 + .012)], rot: [Math.PI / 2, 0, 0], roughness: .37, metalness: .55 });
    into(a, 'exterior', 'wheels.hub', torus(radius * .57, .027, 40), 'steel', { name: 'Rim lip', pos: [ax, y, z + side * (width / 2 + .038)], metalness: .5 });
    for (let i = 0; i < 8; i++) {
      const angle = i * Math.PI / 4;
      into(a, 'exterior', 'wheels.hub', cyl(.037, .037, .025, 10), 'dark', { name: 'Rim recess', pos: [ax + Math.cos(angle) * radius * .43, y + Math.sin(angle) * radius * .43, z + side * (width / 2 + .04)], rot: [Math.PI / 2, 0, 0] });
    }
    into(a, 'exterior', 'wheels.hub', cyl(radius * .20, radius * .20, .065, 24), 'steel', { name: 'Hub cap', pos: [ax, y, z + side * (width / 2 + .06)], rot: [Math.PI / 2, 0, 0], metalness: .55 });
  }

  /* Canonical silhouette: 01_parts_c_v2.webp. See docs/buses-book-reference.md. */
  for (const a of [body, roof, hood, lights, wheels]) clearBookExterior(a);
  const BOOK_WHEEL_Y = -1.63, BOOK_WHEEL_R = .65, BOOK_EAVES = 1.14;
  for (const side of [-1, 1]) {
    into(body, 'exterior', 'body.shell', bookSide(BOX_X, HALF_LEN, -1.70, BOOK_EAVES, [AXLE_R], BOOK_WHEEL_Y, .72,.075,[...Array.from({length:5},(_,i)=>[-.82+i*.95,.42,.81,1]),...(side>0?[[-1.73,.42,.88,1.07]]:[[-1.72,-.32,.94,2.67]])]), 'yellow', { name: 'Continuous wheel-cut side skin', pos: [0, 0, side * (HALF_W - .045) - .035] });
    // Five near-square passenger windows plus the front driver/entrance bay.
    const start = -.82, pitch = .95;
    for (let i = 0; i < 5; i++) {
      const x = start + i * pitch;
      into(body, 'exterior', 'body.windows', windowFrame(.89,1.08,.032,.05), 'ink', { name: 'Black window surround', pos: [x, .42, side * (HALF_W + .013)] });
      into(body, 'exterior', 'body.windows', softBox(T, .81, 1.0, .021, .02), 'glassLite', { name: 'Side window', pos: [x, .42, side * (HALF_W + .040)], glass: true });
      into(body, 'exterior', 'body.windows', box(.80, .035, .028), 'ink', { name: 'Sliding window divider', pos: [x, .43, side * (HALF_W + .057)] });
    }
    for (const y of [-.25, -.72]) into(body, 'exterior', 'body.rubrail', box(5.15, .085, .07), 'black', { name: 'Rub rail', pos: [1.54, y, side * (HALF_W + .03)] });
    into(body, 'exterior', 'body.skirt', box(2.72, .10, .075), 'black', { name: 'Lower protective rail', pos: [.16, -1.57, side * (HALF_W + .02)] });
    into(body, 'exterior', 'body.skirt', torus(.72, .037, 48, Math.PI), 'yellow', { name: 'Rear wheel arch lip', pos: [AXLE_R, BOOK_WHEEL_Y, side * (HALF_W + .04)] });
  }
  into(body, 'exterior', 'body.shell', softBox(T, .10, 2.82, HALF_W * 2, .045), 'yellow', { name: 'Rounded rear closure', pos: [HALF_LEN - .045, -.28, 0] });
  // One roof piece touches the eaves; rounded end sections remove the old floating loaf.
  into(roof, 'exterior', 'roof.panel', bookLoft([[BOX_X - .025, 1.08, 1.29, 1.14], [BOX_X + .15, 1.08, 1.48, 1.22], [BOX_X + .36, 1.08, 1.52, 1.22], [HALF_LEN - .32, 1.08, 1.52, 1.22], [HALF_LEN - .12, 1.08, 1.46, 1.20], [HALF_LEN, 1.08, 1.25, 1.12]]), 'yellowPale', { name: 'Roof panel', roughness: .63 });
  // Low rounded bonnet, narrowing toward the nose rather than a rectangular block.
  into(hood, 'exterior', 'hood.cover', bookLoft([[-4.86, -1.51, -.60, .78, .65], [-4.68, -1.57, -.35, .82, .56], [-4.35, -1.60, -.25, .90, .50], [-3.60, -1.60, -.15, .92, .46], [-2.66, -1.58, -.08, 1.11, .43]]), 'yellow', { name: 'Sculpted bonnet', roughness: .46 });
  // The bonnet's wheel-facing sides are hidden inside curved fender skins with an open arch.
  for (const side of [-1, 1]) {
    into(hood, 'exterior', 'hood.cover', bookSide(-4.45, -2.66, -1.66, -.52, [AXLE_F], BOOK_WHEEL_Y, .73), 'yellow', { name: 'Curved front fender skin', pos: [0, 0, side * 1.20 - .04] });
    into(hood, 'exterior', 'hood.cover', torus(.75, .105, 48, Math.PI), 'yellow', { name: 'Rounded front fender crown', pos: [AXLE_F, BOOK_WHEEL_Y, side * 1.20] });
    into(hood, 'exterior', 'hood.headlight', cyl(.155, .155, .075, 32), 'chrome', { name: 'Headlight rim', pos: [-4.935, -1.08, side * .81], rot: [0, 0, Math.PI / 2], metalness: .6 });
    into(hood, 'exterior', 'hood.headlight', cyl(.122, .122, .080, 32), 'lamp', { name: 'Headlight', pos: [-4.952, -1.08, side * .81], rot: [0, 0, Math.PI / 2] });
  }
  into(hood, 'exterior', 'hood.grille', softBox(T, .075, .65, 1.19, .035), 'chrome', { name: 'Grille surround', pos: [-4.88, -.93, 0], metalness: .6 });
  into(hood, 'exterior', 'hood.grille', box(.085, .54, 1.06), 'ink', { name: 'Dark grille recess', pos: [-4.90, -.93, 0] });
  for (let i = 0; i < 5; i++) into(hood, 'exterior', 'hood.grille', box(.03, .035, 1.01), 'steel', { name: 'Grille slat', pos: [-4.955, -1.13 + i * .10, 0], metalness: .5 });
  into(hood, 'exterior', 'hood.bumper', bookLoft([[-5.02,-1.74,-1.40,1.02],[-4.91,-1.76,-1.37,1.23],[-4.74,-1.75,-1.39,1.24]]), 'black', { name: 'Wraparound front bumper' });
  // Align the front glazing top with the side-window row in the canonical view.
  cab.details['cab.glass'].traverse(o => {
    if (!o.isMesh) return;
    if (o.name === 'Windshield pane') { o.geometry = softBox(T,.07,1.09,2.25,.045); o.position.y=.40; }
    if (o.name === 'Windshield pillar') { o.geometry=box(.09,1.13,.12); o.position.y=.40; }
    if (o.name === 'Windshield header') o.position.y=1.015;
  });
  // The entrance is a surface outside the opaque skin, with two full-height
  // glazed leaves and a sill reaching the lower skirt as in the parts plate.
  for (const item of doorLeaves) {
    item.pivot.position.z = -HALF_W - .09;
    item.pivot.traverse(o => {
      if (!o.isMesh) return;
      if (o.name === 'Door leaf') { o.geometry=softBox(T,.44,2.64,.06,.035); o.position.y=-.15; }
      if (o.userData.detail === 'doors.glass') { o.geometry=softBox(T,.33,1.08,.025,.025); o.position.y=o.position.y>0?.64:-.64; }
    });
  }
  cab.details['cab.glass'].traverse(o => {
    if(o.name==='Driver window') { o.geometry=softBox(T,.88,1.07,.025,.02); o.position.set(-1.73,.42,HALF_W+.04); }
  });
  into(cab,'exterior','cab.glass',windowFrame(.94,1.13,.022,.04),'ink',{name:'Driver window surround',pos:[-1.73,.42,HALF_W+.012]});
  into(lights,'exterior','lights.bracket',softBox(T,.07,.42,2.36,.025),'yellow',{name:'Yellow warning header',pos:[BOX_X-.014,1.13,0]});
  // Warning lights sit in the header, not as unmounted boxes on the roof.
  for (const side of [-1, 1]) {
    into(lights, 'exterior', 'lights.bracket', softBox(T, .08, .28, .57, .035), 'black', { name: 'Recessed warning-light panel', pos: [BOX_X - .04, 1.17, side * .81] });
    for (const [detail, z, color] of [['lights.red', side * .65, 'red'], ['lights.amber', side * .96, 'amber']]) into(lights, 'exterior', detail, cyl(.09,.09,.06,24), color, { name: 'Header warning light', pos: [BOX_X - .095,1.17,z],rot:[0,0,Math.PI/2] });
  }
  for (const ax of [AXLE_F, AXLE_R]) for (const side of [-1, 1]) bookWheel(wheels, ax, side, BOOK_WHEEL_Y, BOOK_WHEEL_R, .30);

  /* Detail audit: real apertures, installed interiors and reversible mechanisms. */
  function bar(a,id,p,q,r=.025,color='steel',parent=a.details[id]) {
    const mesh=rod(T,p,q,r);mesh.material=mat(color,.35,.45);mesh.name=id+' connection';mesh.userData={region:a.region,assemblyId:a.id,detail:id};parent.add(mesh);return mesh;
  }
  function newDetail(a,id,layer='interior') { const g=new T.Group();g.name=id;g.userData={region:a.region,assemblyId:a.id,detail:id};a[layer].add(g);a.details[id]=g;a.detailLayer[id]=layer;return g; }
  const rear=body.exterior.getObjectByName('Rounded rear closure');
  rear.geometry=bookSide(-HALF_W,HALF_W,-1.70,1.13,[],0,0,.10,[[0,-.12,.90,2.22],[-.84,.45,.47,.76],[.84,.45,.47,.76]]);
  rear.position.set(4.13,0,0);rear.rotation.y=Math.PI/2;
  for(const z of [-.84,.84]) {
    into(body,'exterior','body.windows',windowFrame(.53,.82,.04),'ink',{name:'Rear window seal',pos:[4.24,.45,z],rot:[0,Math.PI/2,0]});
    into(body,'exterior','body.windows',softBox(T,.46,.75,.022,.02),'glassLite',{name:'Rear window',pos:[4.25,.45,z],rot:[0,Math.PI/2,0],glass:true});
  }
  for(const side of [-1,1]){
    into(hood,'exterior','hood.headlight',cyl(.16,.16,.12,32),'yellow',{name:'Headlight mount',pos:[-4.88,-1.08,side*.81],rot:[0,0,Math.PI/2]});
    const lens=new T.SphereGeometry(.124,24,16);lens.scale(.15,1,1);
    into(hood,'exterior','hood.headlight',lens,'glassLite',{name:'Headlight glass lens',pos:[-5.003,-1.08,side*.81],glass:true});
  }
  // The windscreen has a visible seal, divider and two installed wiper blades.
  into(cab,'exterior','cab.glass',windowFrame(2.34,1.18,.045),'ink',{name:'Windshield seal',pos:[BOX_X-.07,.40,0],rot:[0,Math.PI/2,0]});
  into(cab,'exterior','cab.glass',box(.045,1.10,.035),'ink',{name:'Windshield divider',pos:[BOX_X-.066,.40,0]});
  for(const z of [-.56,.56]) {bar(cab,'cab.glass',[BOX_X-.09,-.08,z],[BOX_X-.09,.12,z+.13],.017,'ink');bar(cab,'cab.glass',[BOX_X-.095,.12,z-.15],[BOX_X-.095,.12,z+.36],.019,'ink');}
  // Side mirrors now have a glossy reflective face on the driver-facing side.
  for(const side of [-1,1])into(cab,'exterior','cab.mirror',softBox(T,.012,.40,.035,.004),'mirror',{name:'Side mirror face',pos:[BOX_X+.39,.34,side*(HALF_W+.21)],metalness:1,roughness:.08});
  // Dials face the driver (+X); raised needles and dial rims read in close-up.
  cab.details['cab.dash'].children.filter(o=>o.name==='Dial').forEach((o,i)=>{
    o.position.x=BOX_X+.716;o.material=mat('cream');
    into(cab,'interior','cab.dash',torus(.076,.009,24),'chrome',{name:'Dial rim',pos:[BOX_X+.742,.02,.18+i*.16],rot:[0,Math.PI/2,0]});
    bar(cab,'cab.dash',[BOX_X+.748,.02,.18+i*.16],[BOX_X+.748,.057,.205+i*.16],.006,'red');
  });
    const marks=[];for(let i=0;i<3;i++)for(let k=0;k<9;k++){
    const a=-2.35+k*.59,g=box(.006,.012,.003);g.rotateX(a);g.translate(BOX_X+.750,.02+Math.cos(a)*.060,.18+i*.16+Math.sin(a)*.060);marks.push(g);
  }
  into(cab,'interior','cab.dash',mergeNonIndexed(T,marks),'ink',{name:'Instrument tick marks'});
  const steeringMesh=cab.details['cab.wheel'].getObjectByName('Steering wheel');
  const column=cab.details['cab.wheel'].getObjectByName('Steering column');column.removeFromParent();
  const axis=new T.Vector3(.3,.7,0).normalize();steeringMesh.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),axis);
  bar(cab,'cab.wheel',steeringMesh.position.toArray(),steeringMesh.position.clone().addScaledVector(axis,-.66).toArray(),.034,'ink');
  for(let i=0;i<3;i++) {const angle=i*Math.PI*2/3;bar(cab,'cab.wheel',[0,0,0],[Math.cos(angle)*.22,Math.sin(angle)*.22,0],.014,'ink',steeringMesh);}
  into(cab,'interior','cab.seat',box(.32,.60,.36),'steel',{name:'Driver seat pedestal',pos:[-1.40,-.94,.42]});
  for(const z of [.24,.55])into(cab,'interior','cab.wheel',box(.16,.035,.13),'ink',{name:'Pedal',pos:[-2.15,-1.13,z],rot:[0,0,-.25]});
  // Paired entry leaves are hinged at the two outer jambs, not at the middle.
  for(const l of doorLeaves){
    l.pivot.position.set(DOOR_X+l.dir*.45,-.32,-HALF_W-.09);
    const leaf=l.pivot.getObjectByName('Door leaf');leaf.geometry=windowFrame(.44,2.64,.06,.045);leaf.position.set(-l.dir*.22,0,0);
    leaf.children.filter(o=>o.isMesh).forEach(o=>{o.geometry=softBox(T,.355,1.27,.025,.008);o.position.y=o.position.y>0?.65:-.65;o.position.z=0;o.material=glassMat('glass');o.userData.glass=true;o.castShadow=false;o.renderOrder=2;});
    add(doors,leaf,box(.37,.065,.065),'ink',{name:'Door middle rail',detail:'doors.leaf'});
    for(const y of [-1,.9])add(doors,l.pivot,cyl(.025,.025,.16,12),'chrome',{name:'Entry hinge',detail:'doors.leaf',pos:[0,y,0]});
  }
  doors.details['doors.step'].clear();
  for(const [y,z,depth]of[[-1.72,-1.09,.50],[-1.48,-.63,.44],[-1.24,-.20,.42]]) {
    into(doors,'exterior','doors.step',box(.86,.08,depth),'floorDark',{name:'Entry step',pos:[DOOR_X,y,z]});
    into(doors,'exterior','doors.step',box(.84,.02,.045),'yellow',{name:'Step safety edge',pos:[DOOR_X,y+.048,z-.18]});
    into(doors,'exterior','doors.step',box(.86,y<-1.3?.24:.065,.045),'floorDark',{name:'Step riser',pos:[DOOR_X,y+(y<-1.3?.12:-.02),z+depth/2]});
    for(let i=0;i<5;i++)into(doors,'exterior','doors.step',box(.012,.013,.24),'ink',{name:'Step grip',pos:[DOOR_X-.32+i*.16,y+.049,z]});
  }
  // Central rear exit aligns with a clear aisle and has an actual opening behind it.
  doors.details['doors.emergency'].clear();const emergency=new T.Group();emergency.name='Rear door hinge';emergency.position.set(4.25,0,.43);doors.details['doors.emergency'].add(emergency);
  add(doors,emergency,windowFrame(.84,2.16,.06,.07),'yellow',{name:'Emergency door',detail:'doors.emergency',pos:[0,-.12,-.43],rot:[0,Math.PI/2,0]});
  add(doors,emergency,box(.07,1.16,.73),'yellow',{name:'Emergency lower panel',detail:'doors.emergency',pos:[0,-.59,-.43]});
  add(doors,emergency,softBox(T,.71,.92,.022,.008),'glassLite',{name:'Emergency window',detail:'doors.emergency',pos:[.01,.445,-.43],rot:[0,Math.PI/2,0],glass:true});
  bar(doors,'doors.emergency',[-.08,-.22,-.75],[-.08,-.22,-.11],.025,'red',emergency);
  bar(doors,'doors.emergency',[.085,-.17,-.70],[.085,-.17,-.49],.02,'red',emergency);
  for(const y of [-.8,.7])add(doors,emergency,cyl(.035,.035,.18,16),'steel',{name:'Rear door hinge pin',detail:'doors.emergency',pos:[0,y,0]});
  doors.update=state=>{const k=state.region==='doors'&&state.mechanism?state.level||0:0;doorLeaves.forEach(l=>l.pivot.rotation.y=l.dir*(state.detail==='doors.emergency'?0:k)*1.42);emergency.rotation.y=state.detail==='doors.emergency'?-k*1.42:0;};
  // A full-width rear bench previously blocked the emergency route.
  for(const id of ['seats.cushion','seats.back'])for(const o of [...seats.details[id].children])if(o.name.startsWith('Rear bench'))o.removeFromParent();
  seats.details['seats.belt'].clear();
  // Belts lie on the front of each backrest, with a lap strap and visible buckle.
  for(const side of [-1,1])for(let row=0;row<5;row++){
    const x=-.40+row*.76,z=side*.62;
    const ribbon=box(.024,.055,.97);ribbon.rotateX(side*.84);
    into(seats,'interior','seats.belt',ribbon,'ink',{name:'Shoulder belt',pos:[x+.213,-.32,z]});
    for(const [p,q] of [[[x+.213,-.682,z-side*.343],[x-.18,-.69,z-side*.25]],[[x-.18,-.69,z-side*.25],[x-.18,-.69,z+side*.25]]]){const v=new T.Vector3(...q).sub(new T.Vector3(...p)),g=box(v.length(),.018,.045);const strap=into(seats,'interior','seats.belt',g,'ink',{name:'Lap belt',pos:new T.Vector3(...p).addScaledVector(v,.5).toArray()});strap.quaternion.setFromUnitVectors(new T.Vector3(1,0,0),v.normalize());}
    into(seats,'interior','seats.belt',softBox(T,.09,.045,.085,.012),'red',{name:'Seat belt buckle',pos:[x-.18,-.69,z-side*.25]});
    for(const legZ of [side*.30,side*.94])into(seats,'interior','seats.frame',box(.16,.045,.16),'steel',{name:'Seat foot plate',pos:[x,-1.185,legZ]});
  }
  // Remove lengthwise bars that intersected every seat back. Short grasp rails serve the entry.
  aisle.details['aisle.handrail'].clear();
  for(const x of [-2.22,-1.20]){bar(aisle,'aisle.handrail',[x,-1.16,-.58],[x,-.30,-.58]);bar(aisle,'aisle.handrail',[x,-.30,-.58],[x,-.30,-1.09]);bar(aisle,'aisle.handrail',[x,-.30,-1.09],[x,-1.12,-1.09]);}
  const floorMesh=aisle.details['aisle.floor'].getObjectByName('Walkway floor');
  floorMesh.geometry=bookSide(BOX_X+.15,4.10,-1.10,1.10,[],0,0,.10,[[-1.72,-.56,.94,1.06]]);floorMesh.rotation.x=Math.PI/2;floorMesh.position.set(0,-1.21,0);
  // All ribs are on the clear center strip, above the floor instead of crossing seat feet.
  aisle.details['aisle.floor'].children.filter(o=>o.name==='Floor rib').forEach(o=>{o.geometry=box(.035,.014,.43);o.position.y=-1.195;});
  const landing=aisle.details['aisle.rear'].getObjectByName('Rear landing');landing.geometry=box(.94,.02,.43);landing.position.set(3.58,-1.195,0);
  // Real tread blocks are merged per wheel, so close-up detail doesn't multiply draw calls.
  for(const side of [-1,1])for(const ax of [AXLE_F,AXLE_R]){
    const geos=[];for(let i=0;i<48;i++)for(const z of [-.065,.065]){const a=i*Math.PI/24;const g=box(.057,.018,.105);g.rotateZ(-a);g.translate(Math.sin(a)*.609,Math.cos(a)*.609,z);geos.push(g);}
    into(wheels,'exterior','wheels.tread',mergeNonIndexed(T,geos),'rubber',{name:'Tread blocks',pos:[ax,BOOK_WHEEL_Y,side*(HALF_W-.08)],roughness:.88});
    into(wheels,'exterior','wheels.arch',torus(ax===AXLE_F?.76:.725,.027,48,Math.PI),'ink',{name:'Wheel arch liner',pos:[ax,BOOK_WHEEL_Y,side*(HALF_W+.062)]});
  }
  // Stop arm plate stays outside the bus throughout its 90-degree swing.
  clearBookExterior(stopArm);const hinge=new T.Group();hinge.name='Stop arm hinge';hinge.position.set(.20,-.32,-1.35);stopArm.exterior.add(hinge);stopArm.arm=hinge;
  const stopAdd=(geo,col,name,id,pos,rot)=>add(stopArm,hinge,geo,col,{name,detail:id,pos,rot});
  stopAdd(box(.40,.055,.07),'ink','Stop arm','stopsign.arm',[.19,0,.07]);
  stopAdd(cyl(.035,.035,.40,16),'steel','Hinge pin','stopsign.arm',[0,0,0]);
  stopAdd(cyl(.32,.32,.035,8),'cream','Stop border','stopsign.blade',[.40,0,0],[Math.PI/2,0,0]);
  stopAdd(cyl(.288,.288,.041,8),'red','Stop sign','stopsign.blade',[.40,0,0],[Math.PI/2,0,0]);
  for(const y of [-.22,.22])stopAdd(cyl(.042,.042,.04,16),'red','Arm lamp','stopsign.lamp',[.40,y,-.03],[Math.PI/2,0,0]);
  // Tiny vector lettering remains crisp without network fonts or image textures.
  const letters=[[[1,1,0,1],[0,1,0,0],[0,0,1,0],[1,0,1,-1],[1,-1,0,-1]],[[0,1,1,1],[.5,1,.5,-1]],[[0,1,1,1],[1,1,1,-1],[1,-1,0,-1],[0,-1,0,1]],[[0,-1,0,1],[0,1,1,1],[1,1,1,0],[1,0,0,0]]];
  letters.forEach((segs,i)=>segs.forEach(([x,y,u,v])=>bar(stopArm,'stopsign.blade',[.55-i*.08-x*.05,y*.07,-.027],[.55-i*.08-u*.05,v*.07,-.027],.006,'cream',hinge)));
  stopArm.update=state=>{hinge.rotation.y=state.region==='stopsign'&&state.mechanism?(state.level||0)*Math.PI/2:0;};
  // The hidden engine compartment now contains connected teaching geometry.
  for(const id of ['hood.engine','hood.radiator'])newDetail(hood,id);
  into(hood,'interior','hood.engine',softBox(T,1.15,.52,.58,.08),'steel',{name:'Engine block',pos:[-3.58,-.80,0],metalness:.5});
  into(hood,'interior','hood.engine',softBox(T,1.04,.13,.49,.05),'dark',{name:'Valve cover',pos:[-3.58,-.49,0]});
  for(let i=0;i<6;i++) {into(hood,'interior','hood.engine',cyl(.035,.035,.06,12),'chrome',{name:'Valve cover bolt',pos:[-4+i*.16,-.39,.18]});bar(hood,'hood.engine',[-4+i*.16,-.76,.32],[-4+i*.16,-.60,.48],.035,'copper');}
  for(const z of [-.53,.53])into(hood,'interior','hood.engine',box(1.75,.12,.10),'dark',{name:'Engine mount rail',pos:[-3.65,-1.18,z]});
  into(hood,'interior','hood.radiator',box(.13,.65,1.0),'dark',{name:'Radiator core',pos:[-4.44,-.82,0]});
  const fins=[];for(let i=0;i<20;i++){const g=box(.025,.56,.012);g.translate(-4.52,-.82,-.45+i*.047);fins.push(g);}into(hood,'interior','hood.radiator',mergeNonIndexed(T,fins),'steel',{name:'Cooling fins'});
  bar(hood,'hood.radiator',[-4.40,-.55,.43],[-3.92,-.55,.43],.04,'rubber');bar(hood,'hood.radiator',[-4.40,-1.07,-.43],[-3.95,-1.07,-.43],.04,'rubber');
  const fan=new T.Group();fan.name='Radiator fan';hood.details['hood.radiator'].add(fan);fan.position.set(-4.28,-.82,0);
  for(let i=0;i<6;i++)add(hood,fan,box(.045,.24,.07),'steel',{name:'Fan blade',detail:'hood.radiator',pos:[0,Math.cos(i*Math.PI/3)*.13,Math.sin(i*Math.PI/3)*.13],rot:[i*Math.PI/3,0,0]});
  hood.update=state=>{fan.rotation.x=state.region==='hood'&&state.mechanism?(state.level||0)*Math.PI*4:0;};
  for(const x of [-3.99,-3.20])for(const side of [-1,1]){
    bar(hood,'hood.engine',[x,-.96,side*.28],[x,-1.15,side*.53],.047,'dark');
    into(hood,'interior','hood.engine',cyl(.052,.052,.065,12),'rubber',{name:'Mount bushing',pos:[x,-1.15,side*.53]});
  }
  bar(hood,'hood.engine',[-4.03,-.60,.48],[-3.13,-.60,.48],.045,'copper');
  for(const side of [-1,1])bar(hood,'hood.radiator',[-4.44,-1.12,side*.43],[-4.44,-1.18,side*.53],.035,'steel');
  add(hood,fan,cyl(.05,.05,.16,20),'dark',{name:'Fan hub',detail:'hood.radiator',rot:[0,0,Math.PI/2]});
  for(const x of [-4.48,-2.8])into(hood,'interior','hood.engine',box(.10,.12,1.16),'steel',{name:'Mount crossmember',pos:[x,-1.18,0]});
  // Roof teaching parts: framed emergency hatch and structural roof bows.
  for(const x of [-.65,2.10]){
    into(roof,'exterior','roof.hatch',windowFrame(.68,.55,.06,.045),'ink',{name:'Hatch seal',pos:[x,1.53,0],rot:[-Math.PI/2,0,0]});
    into(roof,'exterior','roof.hatch',box(.61,.045,.48),'cream',{name:'Roof hatch',pos:[x,1.57,0]});
    for(const dx of [-.10,.10])into(roof,'exterior','roof.hatch',box(.045,.052,.045),'steel',{name:'Hatch handle mount',pos:[x+dx,1.61,0]});
    bar(roof,'roof.hatch',[x-.1,1.64,0],[x+.1,1.64,0],.018,'red');
    for(const z of [-.15,.15])into(roof,'exterior','roof.hatch',cyl(.026,.026,.11,12),'steel',{name:'Hatch hinge',pos:[x-.29,1.57,z],rot:[Math.PI/2,0,0]});
  }
  // Named roof bows replace the previous empty 'roof cap' entry.
  roof.details['roof.beacon'].removeFromParent();roof.interior.add(roof.details['roof.beacon']);roof.detailLayer['roof.beacon']='interior';
  for(const x of [-1.9,-.65,.6,1.85,3.1]){
    const points=[];for(let i=0;i<=20;i++){const z=-1.12+i*.112;points.push(new T.Vector3(x,1.30-.24*(z/1.12)**4,z));}
    into(roof,'interior','roof.beacon',new T.TubeGeometry(new T.CatmullRomCurve3(points),24,.027,8,false),'steel',{name:'Roof bow'});
  }
  // Link ALL documented details to their actual meshes, including moving subtrees.
  for(const a of assemblies){a.detailMeshes={};a.group.traverse(o=>{if(o.isMesh&&o.userData.detail)(a.detailMeshes[o.userData.detail]??=[]).push(o);});}

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

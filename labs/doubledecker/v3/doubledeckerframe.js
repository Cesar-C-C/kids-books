/* Picture-book double-decker bus. X runs along the length (the bus faces -X),
   Y is up and Z is the width. Proportions follow books/bus/assets: a two-storey
   red shell, a rounded glazed front, a staircase on the passenger side and a
   rear engine bay. No engineering dimensions are claimed from painted artwork. */
(() => {
 'use strict';

 /* ---------- small geometry helpers (shared by every assembly) ---------- */
 function mergeNonIndexed(T, geos) {
  const positions = [], normals = [];
  geos.forEach(g => {
    const ng = g.index ? g.toNonIndexed() : g;
    positions.push(...ng.attributes.position.array);
    normals.push(...ng.attributes.normal.array);
  });
  const out = new T.BufferGeometry();
  out.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  out.setAttribute('normal', new T.Float32BufferAttribute(normals, 3));
  out.computeBoundingSphere();
  return out;
 }
 // A plate with rounded corners, extruded along Z: the workhorse for panels.
 function roundPanel(T, w, h, d, r) {
  const rr = Math.min(r, w / 2, h / 2), a = -w / 2, b = -h / 2;
  const s = new T.Shape();
  s.moveTo(a + rr, b); s.lineTo(a + w - rr, b); s.quadraticCurveTo(a + w, b, a + w, b + rr);
  s.lineTo(a + w, b + h - rr); s.quadraticCurveTo(a + w, b + h, a + w - rr, b + h);
  s.lineTo(a + rr, b + h); s.quadraticCurveTo(a, b + h, a, b + h - rr);
  s.lineTo(a, b + rr); s.quadraticCurveTo(a, b, a + rr, b);
  const g = new T.ExtrudeGeometry(s, { depth: d, bevelEnabled: true, bevelSize: .016, bevelThickness: .016, bevelSegments: 2, curveSegments: 6, steps: 1 });
  g.translate(0, 0, -d / 2);
  return g;
 }
 // A soft box: a rounded plate extruded in depth, then stood up on its axis.
 function softBox(T, w, h, d, r) { return roundPanel(T, w, h, d, r); }

 window.DoubleDeckerV3 = { create(T) {
  const assemblies = [];
  const root = new T.Group(); root.name = 'Picture-book double-decker';
  const materials = new Map();
  // Visually matched to books/bus/assets: a bright red shell, a pale cream roof lining,
  // teal seat moquette and yellow grab poles. No measured paint codes.
  const palette = {
    red: 0xe63c26, redDim: 0xb32e23, redDark: 0x9c281e, cream: 0xece4d2,
    creamDim: 0xd8cfb8, ink: 0x293c45, steel: 0x8a959c, dark: 0x2d3940,
    glass: 0x4a7f96, seat: 0x287b87, seatDim: 0x246874, pole: 0xe8b93c,
    poleDim: 0xc99a26, floor: 0x6d7c84, rubber: 0x2d3940, amber: 0xe89a2e,
    copper: 0xb8823d, alum: 0xa9b1b5, oil: 0x4a4238
  };
  const mat = (key, r = .55, m = 0) => {
    const k = key + '|' + r + '|' + m;
    if (!materials.has(k)) materials.set(k, new T.MeshStandardMaterial({ color: palette[key], roughness: r, metalness: m }));
    return materials.get(k);
  };
  // Glazing is a thin plate sitting on the OUTSIDE of the red side wall, so from
  // the side you see its front face and from behind the far window you see its
  // back face. A front-side-only material disappears when a wall turns away, so
  // the glass is double-sided. The studio clones materials per surface and
  // restores them from materialOriginal, so this flag is preserved either way.
  const glassMat = key => {
    const k = 'glass|' + key;
    if (!materials.has(k)) {
      const m = new T.MeshStandardMaterial({ color: palette[key], roughness: .22, metalness: .2, side: T.DoubleSide });
      materials.set(k, m);
    }
    return materials.get(k);
  };
  const ghostMat = new T.MeshBasicMaterial({ color: 0xa8bab8, transparent: true, opacity: .065, depthWrite: false, side: T.DoubleSide });

  /* ---------- the assembly contract the studio relies on ---------- */
  // Detail groups default to the EXTERIOR layer: a discovery that is visible on
  // the outside of the part must be on screen from the start. Pass 'interior' for
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
    // Ghost layers are always the same faint material: no shadow pass, no depth.
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
  const torus = (r, t, seg = 40, arc = Math.PI * 2) => new T.TorusGeometry(r, t, 8, seg, arc);
  const box = (w, h, d) => new T.BoxGeometry(w, h, d);
  // A bar from point a to point b — used for every pole, rail and pipe.
  function rod(T, a3, b3, r, seg = 12) {
    const a = new T.Vector3(a3[0], a3[1], a3[2]), b = new T.Vector3(b3[0], b3[1], b3[2]);
    const d = b.clone().sub(a), g = cyl(r, r, d.length(), seg);
    const m = new T.Mesh(g, mat('steel', .45, .45));
    m.position.copy(a).add(b).multiplyScalar(.5);
    m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize());
    return m;
  }

  /* ================= bus proportions (picture-book, metres) =================
     One station table drives every assembly, so nothing is a hand-typed absolute.
       ground           -2.10
       chassis rail     -1.32 ..  -1.06
       lower deck floor -1.02            ceiling -0.02
       upper deck floor  0.10            ceiling  1.14
       roof arch top     1.60
       body tail        +4.30            nose tip -4.30                       */
  const HALF_LEN = 4.30;         // nose tip at -HALF_LEN, tail at +HALF_LEN
  const HALF_W = 1.24;           // body half width
  const DECK_LOW = -1.02, DECK_MID = 0.10, DECK_TOP = 1.14;
  const ROOF_TOP = 1.60;
  const RAIL_Y = -1.19;          // chassis rail centre
  const AXLE_F = -2.62, AXLE_R = 2.42;
  const WHEEL_R = .52;

  /* ---------- 1. body: the red shell around both decks ---------- */
  const body = assembly('body', 'body', [0, .1, 0], 4.6,
    [-1.62, .18], ['body.shell', 'body.windows', 'body.skirt', 'body.livery']);
  {
    // Side wall: one plate per side spanning both decks, the full length of the
    // bus. Window bays are punched by leaving gaps between the panels we place on
    // top. roundPanel extrudes along Z, so a side wall is built as
    // (length, height, thickness) and then turned to face outward.
    for (const side of [-1, 1]) {
      const z = side * HALF_W;
      into(body, 'exterior', 'body.shell', roundPanel(T, 2 * HALF_LEN - .40, 2.44, .12, .30), 'red',
        { name: 'Side wall', pos: [0, .02, z], rot: [0, side > 0 ? 0 : Math.PI, 0], roughness: .52 });
      // Glazing bays are spread across the passenger part of the body. The
      // illustration runs its windows almost edge to edge, so the usable span is
      // measured from the bulkheads inward rather than guessed per bay.
      const W0 = -HALF_LEN + .60, W1 = HALF_LEN - .60;
      const SPAN = W1 - W0, BAYS = 6, BAY_W = SPAN / BAYS - .14;
      // Lower deck glazing: the bay over the doorway is left open on the
      // passenger side so the doors are not glazed over.
      for (let i = 0; i < BAYS; i++) {
        const x = W0 + SPAN * (i + .5) / BAYS;
        if (side < 0 && (i === 0 || i === 3)) continue; // front and middle entrance bays
        // The book draws the lower windows noticeably taller than the upper row.
        into(body, 'exterior', 'body.windows', softBox(T, BAY_W, .88, .06, .06), 'glass',
          { name: 'Lower window', pos: [x, -.54, z + side * .07], rot: [0, side > 0 ? 0 : Math.PI, 0], roughness: .22, metalness: .2, glass: true });
        into(body, 'exterior', 'body.windows', box(BAY_W + .08, .05, .09), 'ink',
          { name: 'Window frame', pos: [x, -.07, z + side * .07], rot: [0, side > 0 ? 0 : Math.PI, 0] });
      }
      // Upper deck glazing: six bays across the top deck.
      for (let i = 0; i < BAYS; i++) {
        const x = W0 + SPAN * (i + .5) / BAYS;
        into(body, 'exterior', 'body.windows', softBox(T, BAY_W, .76, .06, .06), 'glass',
          { name: 'Upper window', pos: [x, .58, z + side * .07], rot: [0, side > 0 ? 0 : Math.PI, 0], roughness: .22, metalness: .2, glass: true });
        into(body, 'exterior', 'body.windows', box(BAY_W + .08, .05, .09), 'ink',
          { name: 'Window frame', pos: [x, .99, z + side * .07], rot: [0, side > 0 ? 0 : Math.PI, 0] });
      }
      // The two floor lines that separate the decks.
      for (const y of [DECK_LOW - .06, DECK_MID - .06]) {
        into(body, 'exterior', 'body.livery', box(2 * HALF_LEN - .38, .13, .055), 'red',
          { name: 'Deck line', pos: [0, y, z + side * .07] });
      }
      // Skirt below the floor, and a wheel arch cut over each axle.
      into(body, 'exterior', 'body.skirt', box(2 * HALF_LEN - .40, .46, .10), 'redDark',
        { name: 'Skirt panel', pos: [0, -1.28, z], rot: [0, side > 0 ? 0 : Math.PI, 0] });
      // The wheel arch itself is owned by the wheels assembly (wheels.arch) so it
      // can sit in the tire's own plane; drawing a second one here just doubled
      // the ring and pushed it out past the tire.
    }
    // The cover's second doorway sits between the axles, behind the front
    // entrance, on the same passenger side (-Z). It is a closed shell feature,
    // owned by body.windows so it moves away with the exhibit's body exterior.
    // The existing animated front-door assembly remains the mechanism example.
    const MIDDLE_DOOR_X = .62, MIDDLE_DOOR_Z = -HALF_W - .14;
    into(body, 'exterior', 'body.windows', softBox(T, 1.16, 1.52, .06, .035), 'ink',
      { name: 'Middle doorway frame', pos: [MIDDLE_DOOR_X, -.76, MIDDLE_DOOR_Z] });
    for (const side of [-1, 1]) {
      into(body, 'exterior', 'body.windows', softBox(T, .47, 1.34, .025, .025), 'glass',
        { name: 'Middle door glazing', pos: [MIDDLE_DOOR_X + side * .27, -.75, MIDDLE_DOOR_Z - .05], glass: true });
      into(body, 'exterior', 'body.windows', box(.035, .54, .025), 'pole',
        { name: 'Middle door grab handle', pos: [MIDDLE_DOOR_X + side * .105, -.71, MIDDLE_DOOR_Z - .075] });
    }
    into(body, 'exterior', 'body.windows', box(.055, 1.48, .04), 'ink',
      { name: 'Middle door center seam', pos: [MIDDLE_DOOR_X, -.76, MIDDLE_DOOR_Z - .055] });
    into(body, 'exterior', 'body.windows', box(1.10, .035, .05), 'pole',
      { name: 'Middle door threshold', pos: [MIDDLE_DOOR_X, -1.48, MIDDLE_DOOR_Z - .04] });
    // Front and rear bulkheads close the box. A bulkhead spans the WIDTH, so it is
    // (width, height, thickness) turned a quarter turn about Y.
    into(body, 'exterior', 'body.shell', roundPanel(T, 2.48, 2.44, .12, .30), 'red',
      { name: 'Rear panel', pos: [HALF_LEN - .06, .02, 0], rot: [0, Math.PI / 2, 0], roughness: .52 });
    into(body, 'exterior', 'body.shell', roundPanel(T, 2.48, 2.44, .12, .30), 'red',
      { name: 'Front panel', pos: [-HALF_LEN + .06, .02, 0], rot: [0, Math.PI / 2, 0], roughness: .52 });
    for (const side of [-1, 1]) into(body, 'exterior', 'body.shell', box(2 * HALF_LEN - .40, .16, .10), 'red',
      { name: 'Body floor band', pos: [0, DECK_MID - .16, side * (HALF_W - .05)] });
    into(body, 'interior', 'body.shell', box(2 * HALF_LEN - .60, .05, 2.30), 'creamDim',
      { name: 'Inner lining', pos: [0, DECK_TOP - .04, 0], castShadow: false });
    into(body, 'ghost', null, box(2 * HALF_LEN - .34, 2.50, 2.54), 'red', { pos: [0, .02, 0] });
  }

  /* ---------- 2. roof: the domed crown over the top deck ---------- */
  // The picture book draws one continuous rounded crown that runs the whole
  // length and curves down into the side walls — a fully enclosed upper deck,
  // no sightseeing well. So the arch spans nose to tail and lifts higher in the
  // middle than a shallow slab would.
  const ROOF_X0 = -HALF_LEN + .16, ROOF_X1 = HALF_LEN - .16;
  const roof = assembly('roof', 'roof', [-.60, ROOF_TOP, 0], 4.2,
    [-1.62, .46], ['roof.panel', 'roof.hatch', 'roof.rail']);
  {
    // A superellipse crown: flat-ish across the top, then turning down steeply
    // into the walls. A quadratic bulge here reads as a flat slab; the power
    // curve is what gives the book's fat rounded roof.
    const RISE = .46, P = .68, SEG = 26;
    const cap = new T.Shape();
    cap.moveTo(-HALF_W, 0);
    for (let i = 1; i < SEG; i++) {
      const t = Math.PI * i / SEG;                 // 0 -> pi, left wall to right wall
      const x = -HALF_W * Math.cos(t);
      // Math.pow() of a value that lands a hair below zero returns NaN, and the
      // shape then extrudes into a mesh full of NaN vertices. Clamp the base.
      const y = RISE * Math.pow(Math.max(0, Math.sin(t)), P);
      cap.lineTo(x, y);
    }
    cap.lineTo(HALF_W, 0);
    cap.lineTo(-HALF_W, 0);
    const rg = new T.ExtrudeGeometry(cap, { depth: ROOF_X1 - ROOF_X0, bevelEnabled: false, curveSegments: 8, steps: 1 });
    rg.translate(0, 0, -ROOF_X1); rg.rotateY(Math.PI / 2);
    into(roof, 'exterior', 'roof.panel', rg, 'red', { name: 'Roof panel', pos: [0, DECK_TOP, 0], roughness: .55 });
    // Two roof hatches that let the upper deck breathe.
    for (const x of [-1.90, 1.10]) {
      into(roof, 'exterior', 'roof.hatch', box(.70, .06, .62), 'cream',
        { name: 'Roof hatch', pos: [x, DECK_TOP + RISE - .02, 0], roughness: .6 });
    }
    // Educational roof-service housing; the book does not specify an AC duct. It must
    // sit ON the crown, so its centre is dropped by half its own height rather
    // than floated a clear gap above the roof line.
    into(roof, 'exterior', 'roof.rail', box(.86, .16, 1.28), 'redDark',
      { name: 'Roof duct', pos: [HALF_LEN - .78, DECK_TOP + RISE - .04, 0], roughness: .55 });
    // Drip rails down each side where the crown meets the wall — the dark seam
    // the illustration draws right under the roof edge.
    for (const z of [-HALF_W + .02, HALF_W - .02]) {
      into(roof, 'exterior', 'roof.rail', box(2 * HALF_LEN - .34, .07, .07), 'redDim',
        { name: 'Drip rail', pos: [0, DECK_TOP + .02, z], roughness: .5 });
    }
    into(roof, 'ghost', null, box(2 * HALF_LEN - .38, .62, 2.54), 'red', { pos: [0, DECK_TOP + .26, 0] });
  }

  /* ---------- 3. upper deck: seats, walkway, poles ---------- */
  const upper = assembly('upper', 'upper', [-.60, .62, 0], 3.9,
    [-1.62, .16], [{ id: 'upper.seats', layer: 'interior' }, 'upper.aisle', 'upper.poles', 'upper.rail', { id: 'upper.floor', layer: 'interior' }]);
  {
    // Floor of the upper deck IS the ceiling of the lower one. This is structure,
    // not a thing a child discovers, so it belongs to the shell group rather than
    // to one of the named discovery groups.
    // Three solid floor sections leave a real stair opening on the entrance side.
    // The illustrated stairwell cannot terminate through an unbroken upper floor.
    for (const [x0, x1, z0, z1] of [[-4, -2.90, -1.17, 1.17], [-2.90, -1.20, -.27, 1.17], [-1.20, 4, -1.17, 1.17]]) {
      into(upper, 'interior', 'upper.floor', box(x1 - x0, .10, z1 - z0), 'floor',
        { name: 'Upper floor', pos: [(x0 + x1) / 2, DECK_MID + .02, (z0 + z1) / 2], roughness: .75 });
      into(upper, 'interior', 'upper.floor', box(x1 - x0, .06, z1 - z0), 'creamDim',
        { name: 'Deck underside', pos: [(x0 + x1) / 2, DECK_MID - .06, (z0 + z1) / 2], castShadow: false });
    }
    // Seat pairs: two abreast each side, five rows, facing forward (-X).
    for (const side of [-1, 1]) {
      for (let row = 0; row < 5; row++) {
        const x = -1.10 + row * .92;
        into(upper, 'interior', 'upper.seats', softBox(T, .56, .14, .82, .06), 'seat',
          { name: 'Seat cushion', pos: [x, DECK_MID + .28, side * .66] });
        into(upper, 'interior', 'upper.seats', softBox(T, .16, .78, .84, .07), 'seat',
          { name: 'Seat back', pos: [x + .32, DECK_MID + .72, side * .66] });
        into(upper, 'interior', 'upper.seats', softBox(T, .055, .07, .70, .025), 'ink',
          { name: 'Seat piping', pos: [x + .30, DECK_MID + .62, side * .66], roughness: .5 });
      }
    }
    // Vertical grab poles, floor to ceiling.
    for (const [x, z] of [[1.10, -.30], [1.10, .30], [-.80, -.30], [-.80, .30], [-2.60, -.30]]) {
      into(upper, 'exterior', 'upper.poles', cyl(.035, .035, 1.06, 14), 'pole',
        { name: 'Grab pole', pos: [x, DECK_MID + .55, z], roughness: .4, metalness: .35 });
    }
    // The overhead handrail along both sides.
    for (const z of [-.34, .34]) {
      into(upper, 'exterior', 'upper.rail', cyl(.030, .030, 2 * HALF_LEN - 1.20, 12), 'pole',
        { name: 'Handrail', pos: [-.30, DECK_MID + .92, z], rot: [0, 0, Math.PI / 2], roughness: .4, metalness: .35 });
    }
    into(upper, 'ghost', null, box(2 * HALF_LEN - .60, 1.04, 2.34), 'seat', { pos: [0, DECK_MID + .52, 0] });
  }

  /* ---------- 4. lower deck: seats, walkway, priority bay ---------- */
  const lower = assembly('lower', 'lower', [-.60, -.46, 0], 3.9,
    [-1.62, .10], [{ id: 'lower.seats', layer: 'interior' }, { id: 'lower.floor', layer: 'interior' }, 'lower.stroller', 'lower.priority']);
  {
    into(lower, 'interior', 'lower.floor', box(2 * HALF_LEN - .60, .10, 2.34), 'floor',
      { name: 'Lower floor', pos: [0, DECK_LOW, 0], roughness: .78 });
    for (const side of [-1, 1]) {
      for (let row = 0; row < 5; row++) {
        const x = -1.10 + row * .92;
        into(lower, 'interior', 'lower.seats', softBox(T, .56, .14, .82, .06), 'seat',
          { name: 'Seat cushion', pos: [x, DECK_LOW + .30, side * .66] });
        into(lower, 'interior', 'lower.seats', softBox(T, .16, .78, .84, .07), 'seat',
          { name: 'Seat back', pos: [x + .32, DECK_LOW + .74, side * .66] });
        into(lower, 'interior', 'lower.seats', softBox(T, .055, .07, .70, .025), 'ink',
          { name: 'Seat piping', pos: [x + .30, DECK_LOW + .64, side * .66], roughness: .5 });
      }
    }
    // The priority bay: a clear patch just inside the door, marked on the floor.
    into(lower, 'exterior', 'lower.stroller', box(.80, .05, .80), 'seatDim',
      { name: 'Wheelchair bay floor', pos: [-3.28, DECK_LOW + .07, -.65], roughness: .7 });
    into(lower, 'exterior', 'lower.priority', softBox(T, .56, .14, .82, .06), 'seatDim',
      { name: 'Priority cushion', pos: [-2.10, DECK_LOW + .30, .66] });
    into(lower, 'exterior', 'lower.priority', softBox(T, .16, .78, .84, .07), 'seatDim',
      { name: 'Priority back', pos: [-1.78, DECK_LOW + .74, .66] });
    for (const [x, z] of [[-1.20, -.30], [-1.20, .30], [.40, -.30], [.40, .30], [1.90, -.30]]) {
      into(lower, 'exterior', 'lower.seats', cyl(.032, .032, 1.00, 14), 'pole',
        { name: 'Grab pole', pos: [x, DECK_LOW + .52, z], roughness: .4, metalness: .35 });
    }
    into(lower, 'ghost', null, box(2 * HALF_LEN - .60, .98, 2.34), 'seat', { pos: [0, DECK_LOW + .49, 0] });
  }

  /* ---------- 5. staircase: joins the two decks ---------- */
  const STAIR_X = -2.05, STAIR_Z = -.74;
  const stairs = assembly('stairs', 'stairs', [STAIR_X, 0, STAIR_Z], 1.5,
    [-1.20, .30], ['stairs.treads', 'stairs.rail', 'stairs.well']);
  {
    const steps = 6, rise = (DECK_MID - DECK_LOW) / steps, run = .26;
    for (let i = 0; i < steps; i++) {
      const y = DECK_LOW + rise * (i + .5), x = STAIR_X + .62 - i * run;
      into(stairs, 'exterior', 'stairs.treads', box(run + .03, .05, .74), 'floor',
        { name: 'Step tread', pos: [x, y, STAIR_Z], roughness: .72 });
      into(stairs, 'exterior', 'stairs.treads', box(.03, rise, .74), 'ink',
        { name: 'Step riser', pos: [x + run / 2, y - rise / 2, STAIR_Z] });
      into(stairs, 'exterior', 'stairs.treads', box(.045, .015, .74), 'pole',
        { name: 'Step nosing', pos: [x + run / 2, y + .03, STAIR_Z], roughness: .45, metalness: .3 });
    }
    // The handrail follows the same slope, on both sides of the flight.
    for (const z of [STAIR_Z - .40, STAIR_Z + .40]) {
      into(stairs, 'exterior', 'stairs.rail', cyl(.030, .030, 1.72, 12), 'pole',
        { name: 'Stair handrail', pos: [STAIR_X + .08, DECK_LOW + .95, z], rot: [0, 0, -.72], roughness: .4, metalness: .35 });
      for (const [px, py] of [[STAIR_X + .62, DECK_LOW + .42], [STAIR_X - .68, DECK_MID + .42]]) {
        into(stairs, 'exterior', 'stairs.rail', cyl(.024, .024, .58, 10), 'pole',
          { name: 'Rail post', pos: [px, py, z], roughness: .4, metalness: .35 });
      }
    }
    into(stairs, 'exterior', 'stairs.well', box(1.70, .06, .07), 'ink',
      { name: 'Stairwell edge', pos: [STAIR_X, DECK_MID + .05, -.27] });
    into(stairs, 'ghost', null, box(1.60, 1.16, .90), 'pole', { pos: [STAIR_X, DECK_LOW + .58, STAIR_Z] });
  }

  /* ---------- 6. cab: the driver's place at the front ---------- */
  const cab = assembly('cab', 'cab', [-3.30, -.20, 0], 2.0,
    [-2.10, .20], ['cab.wheel', 'cab.dash', 'cab.seat', 'cab.glass', 'cab.mirror']);
  {
    // The wraparound windscreen, split into two curved panes.
    for (const side of [-1, 1]) {
      into(cab, 'exterior', 'cab.glass', softBox(T, .10, 1.30, 1.02, .10), 'glass',
        { name: 'Windscreen pane', pos: [-HALF_LEN + .10, .42, side * .56], rot: [0, side * .32, 0], roughness: .2, metalness: .2 });
    }
    into(cab, 'exterior', 'cab.glass', box(.09, .06, 2.30), 'ink',
      { name: 'Screen divider', pos: [-HALF_LEN + .16, .42, 0] });
    into(cab, 'exterior', 'cab.glass', softBox(T, .07, .70, 2.12, .03), 'glass',
      { name: 'Upper front windscreen', pos: [-HALF_LEN - .025, .70, 0], glass: true });
    into(cab, 'exterior', 'cab.glass', box(.075, .18, 2.14), 'ink',
      { name: 'Front destination panel', pos: [-HALF_LEN - .03, .22, 0] });
    for (const side of [-1, 1]) {
      into(body, 'exterior', 'body.livery', softBox(T, .08, .25, .60, .06), 'ink',
        { name: 'Headlight surround', pos: [-HALF_LEN - .025, -.94, side * .80] });
      for (let i = 0; i < 3; i++) {
        into(body, 'exterior', 'body.livery', cyl(.075 - i * .009, .075 - i * .009, .04, 16), 'cream',
          { name: 'Front lamp', pos: [-HALF_LEN - .085, -.91 - i * .03, side * (.62 + i * .17)], rot: [0, 0, Math.PI / 2] });
      }
      for (let i = 0; i < 6; i++) {
        into(body, 'exterior', 'body.livery', box(.54, .035, .04), 'ink',
          { name: 'Rear ventilation slat', pos: [HALF_LEN - .48, -.65 + i * .10, side * (HALF_W + .085)] });
      }
    }
    // Dashboard and the big steering wheel above it.
    into(cab, 'exterior', 'cab.dash', box(.44, .22, 2.10), 'ink',
      { name: 'Dashboard', pos: [-HALF_LEN + .42, -.30, 0], roughness: .6 });
    for (const [dz, dy] of [[-.40, .04], [-.18, .04], [.04, .04]]) {
      into(cab, 'exterior', 'cab.dash', cyl(.09, .09, .05, 18), 'amber',
        { name: 'Dial', pos: [-HALF_LEN + .21, -.10 + dy, dz], rot: [0, 0, Math.PI / 2], roughness: .4 });
    }
    const sw = into(cab, 'exterior', 'cab.wheel', torus(.27, .032, 24), 'ink',
      { name: 'Steering wheel', pos: [-HALF_LEN + .48, .16, -.62], rot: [0, Math.PI / 2, 0], roughness: .5 });
    sw.rotation.z = -.42;
    into(cab, 'exterior', 'cab.wheel', cyl(.030, .030, .54, 10), 'ink',
      { name: 'Steering column', pos: [-HALF_LEN + .62, .04, -.62], rot: [0, 0, 1.16] });
    for (const a of [0, Math.PI / 3, -Math.PI / 3]) {
      into(cab, 'exterior', 'cab.wheel', box(.03, .50, .03), 'ink',
        { name: 'Wheel spoke', pos: [-HALF_LEN + .48, .16, -.62], rot: [a, Math.PI / 2, 0] });
    }
    // Driver seat, higher than a passenger seat and set close to the wheel.
    into(cab, 'exterior', 'cab.seat', softBox(T, .62, .16, .66, .07), 'dark',
      { name: 'Driver cushion', pos: [-HALF_LEN + .92, -.18, -.62] });
    into(cab, 'exterior', 'cab.seat', softBox(T, .18, .96, .68, .08), 'dark',
      { name: 'Driver back', pos: [-HALF_LEN + 1.26, .26, -.62] });
    // Mirrors on both sides of the nose: they sit just outside the body line, as
    // the book draws them, not on long outriggers.
    for (const side of [-1, 1]) {
      into(cab, 'exterior', 'cab.mirror', cyl(.026, .026, .42, 10), 'ink',
        { name: 'Mirror arm', pos: [-HALF_LEN + .34, .86, side * 1.14], rot: [side * .62, 0, 0] });
      into(cab, 'exterior', 'cab.mirror', softBox(T, .10, .54, .22, .05), 'ink',
        { name: 'Mirror housing', pos: [-HALF_LEN + .22, .66, side * 1.30], rot: [0, side * .20, 0] });
      into(cab, 'exterior', 'cab.mirror', softBox(T, .03, .46, .17, .04), 'glass',
        { name: 'Mirror glass', pos: [-HALF_LEN + .18, .66, side * 1.32], rot: [0, side * .20, 0], roughness: .16, metalness: .6 });
    }
    into(cab, 'ghost', null, box(1.90, 2.40, 2.44), 'glass', { pos: [-HALF_LEN + .95, .02, 0] });
  }

  /* ---------- 7. doors: two folding leaves on the passenger side ---------- */
  const DOOR_Z = -HALF_W - .02;
  const doors = assembly('doors', 'doors', [-3.30, -.40, DOOR_Z], 1.6,
    [-2.10, .06], ['doors.leaf', 'doors.glass', 'doors.step', 'doors.emergency']);
  const leaves = [];
  {
    // Front leaf folds forward, rear leaf folds back: a classic bi-fold doorway.
    [[-.24, -1], [.30, 1]].forEach(([dx, dir]) => {
      const pivot = new T.Group();
      pivot.position.set(-3.30 + dx + dir * .27, DECK_LOW, DOOR_Z);
      pivot.userData = { region: 'doors', assemblyId: 'doors', detail: 'doors.leaf' };
      const leaf = new T.Mesh(softBox(T, .54, 2.00, .07, .03), mat('red', .5));
      leaf.position.set(-dir * .27, 1.00, 0);
      leaf.userData = { region: 'doors', assemblyId: 'doors', detail: 'doors.leaf' };
      leaf.castShadow = true;
      const up = new T.Mesh(softBox(T, .42, .72, .025, .04), mat('glass', .2, .2));
      up.position.set(-dir * .27, 1.48, -.05);
      up.userData = { region: 'doors', assemblyId: 'doors', detail: 'doors.glass' };
      const lo = new T.Mesh(softBox(T, .42, .70, .025, .04), mat('glass', .2, .2));
      lo.position.set(-dir * .27, .62, -.05);
      lo.userData = { region: 'doors', assemblyId: 'doors', detail: 'doors.glass' };
      pivot.add(leaf, up, lo);
      doors.details['doors.leaf'].add(pivot);
      leaves.push({ pivot, dir });
    });
    // The entry step just inside the doorway.
    for (let i = 0; i < 2; i++) {
      into(doors, 'exterior', 'doors.step', box(.80, .06, .60), 'floor',
        { name: 'Entry step', pos: [-3.30, DECK_LOW - .16 - i * .20, -.72], roughness: .75 });
    }
    // Rear emergency exit panel, clearly outlined on the tail.
    into(doors, 'exterior', 'doors.emergency', softBox(T, 1.16, 1.06, .05, .05), 'ink',
      { name: 'Emergency outline', pos: [HALF_LEN - .01, -.42, .40], rot: [0, Math.PI / 2, 0] });
    into(doors, 'exterior', 'doors.emergency', softBox(T, 1.04, .94, .03, .04), 'redDark',
      { name: 'Emergency panel', pos: [HALF_LEN - .04, -.42, .40], rot: [0, Math.PI / 2, 0] });
    into(doors, 'exterior', 'doors.emergency', softBox(T, .40, .34, .02, .03), 'glass',
      { name: 'Emergency glass', pos: [HALF_LEN - .06, -.30, .40], rot: [0, Math.PI / 2, 0], roughness: .2, metalness: .2 });
    into(doors, 'exterior', 'doors.emergency', box(.05, .10, .26), 'ink',
      { name: 'Exit handle', pos: [HALF_LEN - .07, -.72, .40] });
    doors.update = state => {
      const k = state.mechanism && state.region === 'doors' ? (state.level || 0) : 0;
      // Each leaf swings about its own hinge; the pair opens outward together.
      leaves.forEach(l => { l.pivot.rotation.y = l.dir * k * 1.15; });
    };
  }

  /* ---------- 8. engine: the power unit in the tail ---------- */
  const engine = assembly('engine', 'engine', [3.28, -.55, 0], 1.9,
    [1.20, .10], ['engine.block', 'engine.fan', 'engine.pipes', 'engine.tank']);
  {
    into(engine, 'exterior', 'engine.block', softBox(T, .96, .62, .88, .07), 'copper',
      { name: 'Engine block', pos: [3.30, -.62, -.18], rot: [0, .18, 0], roughness: .5, metalness: .3 });
    into(engine, 'exterior', 'engine.block', softBox(T, .78, .16, .74, .05), 'oil',
      { name: 'Cylinder head', pos: [3.30, -.25, -.18], rot: [0, .18, 0], roughness: .55 });
    for (let i = 0; i < 4; i++) {
      into(engine, 'exterior', 'engine.block', cyl(.055, .055, .40, 12), 'alum',
        { name: 'Injector line', pos: [3.02 + i * .19, -.06, -.18], rot: [0, 0, .18], roughness: .4, metalness: .5 });
    }
    // Radiator and its fan, hung on the rear face where the book draws them.
    into(engine, 'exterior', 'engine.fan', box(.10, .78, .96), 'ink',
      { name: 'Radiator', pos: [3.86, -.62, -.18], roughness: .6 });
    into(engine, 'exterior', 'engine.fan', cyl(.34, .34, .10, 26), 'steel',
      { name: 'Fan shroud', pos: [3.74, -.62, -.18], rot: [0, 0, Math.PI / 2], roughness: .5, metalness: .4 });
    for (let i = 0; i < 7; i++) {
      into(engine, 'exterior', 'engine.fan', box(.04, .30, .14), 'alum',
        { name: 'Fan blade', pos: [3.70, -.62, -.18], rot: [i * Math.PI / 3.5, 0, 0], roughness: .45, metalness: .45 });
    }
    into(engine, 'exterior', 'engine.fan', cyl(.09, .09, .12, 16), 'dark',
      { name: 'Fan hub', pos: [3.69, -.62, -.18], rot: [0, 0, Math.PI / 2], roughness: .5 });
    // Curved pipework looping over the block.
    into(engine, 'exterior', 'engine.pipes', cyl(.055, .055, .86, 12), 'alum',
      { name: 'Coolant pipe', pos: [3.34, -.20, .22], rot: [0, 0, Math.PI / 2], roughness: .4, metalness: .5 });
    into(engine, 'exterior', 'engine.pipes', torus(.16, .045, 20, Math.PI), 'alum',
      { name: 'Pipe bend', pos: [3.76, -.20, .22], rot: [Math.PI / 2, 0, 0], roughness: .4, metalness: .5 });
    into(engine, 'exterior', 'engine.pipes', cyl(.048, .048, .70, 12), 'alum',
      { name: 'Fuel line', pos: [3.34, -.10, -.52], rot: [0, 0, Math.PI / 2], roughness: .4, metalness: .5 });
    // The fuel tank sits beside the engine, strapped down.
    into(engine, 'exterior', 'engine.tank', softBox(T, .86, .54, .70, .08), 'steel',
      { name: 'Fuel tank', pos: [3.30, -.68, .70], rot: [0, .18, 0], roughness: .55, metalness: .35 });
    for (const dx of [-.24, .24]) {
      into(engine, 'exterior', 'engine.tank', box(.06, .60, .74), 'ink',
        { name: 'Tank strap', pos: [3.30 + dx, -.68, .70], rot: [0, .18, 0] });
    }
    into(engine, 'exterior', 'engine.tank', cyl(.06, .06, .12, 12), 'ink',
      { name: 'Filler cap', pos: [3.30, -.38, .70], roughness: .5 });
    into(engine, 'ghost', null, box(1.00, .80, .94), 'copper', { pos: [3.30, -.62, -.18] });
    into(engine, 'ghost', null, box(.90, .58, .74), 'steel', { pos: [3.30, -.68, .70] });
  }

  /* ---------- 9. chassis: the frame under both decks ---------- */
  const chassis = assembly('chassis', 'chassis', [0, RAIL_Y, 0], 4.4,
    [-1.62, -.16], ['chassis.rail', 'chassis.cross', 'chassis.axle']);
  {
    for (const z of [-.62, .62]) {
      into(chassis, 'exterior', 'chassis.rail', box(2 * HALF_LEN - .30, .26, .16), 'ink',
        { name: 'Chassis rail', pos: [0, RAIL_Y, z] });
    }
    for (const x of [-3.20, -1.80, -.40, 1.00, 2.40, 3.70]) {
      into(chassis, 'exterior', 'chassis.cross', box(.14, .20, 1.40), 'steel',
        { name: 'Cross member', pos: [x, RAIL_Y, 0], roughness: .5, metalness: .4 });
    }
    for (const ax of [AXLE_F, AXLE_R]) {
      into(chassis, 'exterior', 'chassis.axle', cyl(.10, .10, 2.60, 16), 'ink',
        { name: 'Axle', pos: [ax, RAIL_Y - .30, 0], rot: [Math.PI / 2, 0, 0] });
    }
    into(chassis, 'exterior', 'chassis.rail', cyl(.07, .07, 4.60, 12), 'steel',
      { name: 'Prop shaft', pos: [.30, RAIL_Y - .28, 0], rot: [0, 0, Math.PI / 2], roughness: .45, metalness: .5 });
    into(chassis, 'ghost', null, box(2 * HALF_LEN - .30, .30, 1.70), 'ink', { pos: [0, RAIL_Y, 0] });
  }

  /* ---------- 10. wheels ---------- */
  const wheels = assembly('wheels', 'wheels', [0, RAIL_Y - .30, 0], 3.2,
    [-1.62, -.24], ['wheels.tire', 'wheels.tread', 'wheels.hub', 'wheels.arch']);
  {
    const spots = [[AXLE_F, -1], [AXLE_F, 1], [AXLE_R, -1], [AXLE_R, 1]];
    spots.forEach(([ax, side]) => {
      const z = side * (HALF_W - .22);
      // Rear axle runs twins on each side, as a heavy bus does.
      const offsets = ax === AXLE_R ? [-.16, .16] : [0];
      offsets.forEach(dz => {
        // A tire is a cylinder whose AXIS lies along Z, so it turns a quarter turn
        // about X (a Y turn would leave it standing on its rim).
        into(wheels, 'exterior', 'wheels.tire', cyl(WHEEL_R, WHEEL_R, .30, 26), 'rubber',
          { name: 'Tire', pos: [ax, RAIL_Y - .30, z + dz], rot: [Math.PI / 2, 0, 0], roughness: .82 });
        for (let i = 0; i < 26; i++) {
          const a = i / 26 * Math.PI * 2;
          into(wheels, 'exterior', 'wheels.tread', box(.05, .07, .31), 'dark',
            { name: 'Tread block', pos: [ax + Math.cos(a) * (WHEEL_R + .02), RAIL_Y - .30 + Math.sin(a) * (WHEEL_R + .02), z + dz], rot: [0, 0, a], castShadow: false });
        }
        into(wheels, 'exterior', 'wheels.hub', cyl(.30, .30, .06, 22), 'steel',
          { name: 'Hubcap', pos: [ax, RAIL_Y - .30, z + dz + side * .18], rot: [Math.PI / 2, 0, 0], roughness: .3, metalness: .6 });
        for (let i = 0; i < 6; i++) {
          const a = i / 6 * Math.PI * 2;
          into(wheels, 'exterior', 'wheels.hub', cyl(.045, .045, .05, 10), 'dark',
            { name: 'Hub nut', pos: [ax + Math.cos(a) * .19, RAIL_Y - .30 + Math.sin(a) * .19, z + dz + side * .21], rot: [Math.PI / 2, 0, 0], castShadow: false });
        }
      });
      // The arch must sit in the same plane as the tire it covers. Placing it at
      // the body's outer skin (HALF_W - .02) instead of the tire line left the
      // ring hanging outside the wheel with nothing under it.
      into(wheels, 'exterior', 'wheels.arch', torus(WHEEL_R + .06, .045, 32, Math.PI), 'ink',
        { name: 'Wheel arch', pos: [ax, RAIL_Y - .30, z], castShadow: false });
    });
    // Ghost silhouettes span the wheel track only, so they do not inflate the
    // model's overall width past the body line.
    into(wheels, 'ghost', null, box(.32, 1.06, 2.46), 'rubber', { pos: [AXLE_F, RAIL_Y - .30, 0] });
    into(wheels, 'ghost', null, box(.32, 1.06, 2.46), 'rubber', { pos: [AXLE_R, RAIL_Y - .30, 0] });
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
  function bookSide(x0, x1, bottom, top, axles, wheelY, clearance, depth = .075, clearanceY = clearance) {
    const s = new T.Shape(); s.moveTo(x0, bottom);
    for (const axle of axles) {
      const dx = clearance * Math.sqrt(Math.max(0, 1 - ((bottom - wheelY) / clearanceY) ** 2));
      if (axle - dx <= x0 || axle + dx >= x1) continue;
      s.lineTo(axle - dx, bottom);
      const a0 = Math.atan2((bottom - wheelY) / clearanceY, -dx / clearance), a1 = Math.atan2((bottom - wheelY) / clearanceY, dx / clearance);
      const start = a0 < 0 ? a0 + Math.PI * 2 : a0;
      const end = a1;
      for (let j = 1; j <= 32; j++) { const a = start + (end - start) * j / 32; s.lineTo(axle + clearance * Math.cos(a), wheelY + clearanceY * Math.sin(a)); }
    }
    s.lineTo(x1, bottom); s.lineTo(x1, top - .15); s.quadraticCurveTo(x1, top, x1 - .15, top);
    s.lineTo(x0 + .15, top); s.quadraticCurveTo(x0, top, x0, top - .15); s.closePath();
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

  /* Canonical exterior: books/bus/assets/00_cover_c_r2.webp. */
  for (const a of [body, roof, wheels]) clearBookExterior(a);
  cab.details['cab.glass'].clear();
  // Two full-height storeys: raise the cabin structure, while retaining round
  // tires and the chassis datum. All dimensions remain illustration proportions.
  const BOOK_DECK_SCALE = 1.42, BOOK_TIRE_R = .61;
  const localWheelY = (RAIL_Y - .30 - DECK_LOW) / BOOK_DECK_SCALE + DECK_LOW;
  for (const side of [-1, 1]) {
    into(body, 'exterior', 'body.shell', bookSide(-4.08, 4.08, -1.42, 1.19, [AXLE_F, AXLE_R], localWheelY, .69, .075, .69 / BOOK_DECK_SCALE), 'red', { name: 'Continuous wheel-cut side skin', pos: [0,0,side * (HALF_W - .035) - .035] });
    // Continuous dark framing under the side glazing reads as the illustrated
    // window ribbon rather than six blue boxes pasted onto a red wall.
    into(body, 'exterior', 'body.windows', softBox(T,7.80,.78,.028,.11),'ink',{name:'Upper glazing surround',pos:[0,.76,side*(HALF_W+.018)]});
    for(let i=0;i<6;i++) {
      const x=-3.24+i*1.30;
      into(body,'exterior','body.windows',softBox(T,1.21,.68,.023,.045),'glass',{name:'Upper window',pos:[x,.76,side*(HALF_W+.043)],glass:true});
    }
    for (const [x,w] of (side < 0 ? [[-1.52,1.70],[2.54,2.55]] : [[-3.18,1.42],[-1.12,2.30],[1.92,3.02]])) {
      into(body,'exterior','body.windows',softBox(T,w,.81,.026,.055),'ink',{name:'Lower glazing surround',pos:[x,-.48,side*(HALF_W+.018)]});
      into(body,'exterior','body.windows',softBox(T,w-.10,.71,.023,.035),'glass',{name:'Lower window',pos:[x,-.48,side*(HALF_W+.043)],glass:true});
      if(w>2) into(body,'exterior','body.windows',box(.035,.71,.027),'ink',{name:'Lower window mullion',pos:[x,-.48,side*(HALF_W+.062)]});
    }
    into(body,'exterior','body.livery',box(7.98,.23,.035),'red',{name:'Wide interdeck red band',pos:[0,.20,side*(HALF_W+.019)]});
    for(let i=0;i<9;i++) into(body,'exterior','body.livery',box(.40,.024,.025),'redDark',{name:'Rear ventilation slat',pos:[3.78,-.95+i*.08,side*(HALF_W+.055)]});
  }
  // Smooth front/rear corners join the sidewalls without the old oversized slabs.
  into(body,'exterior','body.shell',bookLoft([[-4.39,-1.41,1.16,1.05,.36],[-4.30,-1.44,1.20,1.18,.35],[-4.06,-1.44,1.20,1.24,.30]]),'red',{name:'Rounded front body'});
  into(body,'exterior','body.shell',bookLoft([[4.04,-1.43,1.18,1.24,.30],[4.24,-1.40,1.18,1.18,.36],[4.30,-1.33,1.12,1.06,.42]]),'red',{name:'Rounded rear body'});
  // Roof is a shallow crown continuous with the red shoulders, not a tall tube.
  into(roof,'exterior','roof.panel',bookLoft([[-4.39,1.12,1.25,1.03],[-4.24,1.10,1.40,1.20],[-4.03,1.10,1.44,1.24],[4.00,1.10,1.44,1.24],[4.22,1.10,1.37,1.18],[4.30,1.10,1.22,1.05]]),'red',{name:'Roof panel'});
  for(const [name,low,high] of [['Lower front windscreen',-.85,-.02],['Upper front windscreen',.52,1.22]]) {
    into(cab,'exterior','cab.glass',bookLoft([[-4.43,low,high,1.04,.30],[-4.37,low-.025,high+.025,1.13,.30]]),'ink',{name:name+' surround'});
    into(cab,'exterior','cab.glass',bookLoft([[-4.455,low+.035,high-.035,1.005,.32],[-4.43,low+.015,high-.015,1.07,.32]]),'glass',{name,glass:true});
  }
  into(cab,'exterior','cab.glass',softBox(T,.05,.27,2.16,.02),'ink',{name:'Front destination panel',pos:[-4.43,.32,0]});
  for(const side of [-1,1]) {
    into(body,'exterior','body.livery',softBox(T,.04,.19,.58,.018),'ink',{name:'Headlight surround',pos:[-4.43,-1.08,side*.82]});
    for(let i=0;i<3;i++) into(body,'exterior','body.livery',cyl(.065-i*.008,.065-i*.008,.045,24),'cream',{name:'Front lamp',pos:[-4.47,-1.04-i*.035,side*(.63+i*.16)],rot:[0,0,Math.PI/2]});
  }
  // Middle door follows the same exterior layer as the shell and window ribbon.
  const mdx=.62, mdz=-HALF_W-.10;
  into(body,'exterior','body.windows',softBox(T,1.08,1.36,.035,.025),'ink',{name:'Middle doorway frame',pos:[mdx,-.75,mdz]});
  for(const side of [-1,1]) {
    into(body,'exterior','body.windows',softBox(T,.45,1.21,.023,.025),'glass',{name:'Middle door glazing',pos:[mdx+side*.25,-.75,mdz-.032],glass:true});
    into(body,'exterior','body.windows',box(.022,.48,.024),'pole',{name:'Middle door grab handle',pos:[mdx+side*.10,-.69,mdz-.05]});
  }
  into(body,'exterior','body.windows',box(1.02,.028,.04),'pole',{name:'Middle door threshold',pos:[mdx,-1.405,mdz-.028]});
  // Fit the animated entrance to the lower deck instead of reaching into the upper windows.
  for (const item of leaves) {
    item.pivot.position.y=-1.40;
    const panes=[];
    item.pivot.traverse(o=>{if(o.isMesh && o.userData.detail==='doors.glass') panes.push(o);});
    item.pivot.traverse(o=>{
      if(!o.isMesh || o.userData.detail!=='doors.leaf') return;
      o.geometry=softBox(T,.54,1.67,.06,.025);o.material=mat('ink');o.position.y=.835;
    });
    panes.forEach((o,i)=>{
      if(i>0){o.parent.remove(o);return;}
      o.geometry=softBox(T,.43,1.51,.025,.025);o.position.y=.835;
    });
  }
  // Entry treads are interior teaching parts; they must not float through the
  // front wheel opening when the entrance is closed.
  doors.interior.add(doors.details['doors.step']);
  doors.detailLayer['doors.step']='interior';
  lower.interior.add(lower.details['lower.stroller']);
  lower.detailLayer['lower.stroller']='interior';
  for(const ax of [AXLE_F,AXLE_R]) for(const side of [-1,1]) bookWheel(wheels,ax,side,RAIL_Y-.30,BOOK_TIRE_R,.30);
  for(const a of assemblies) {
    if(a===wheels || a===chassis) continue;
    // Bake the height change into local vertices (including rotated rails), so
    // exhibit pivots keep unit scale and mechanisms retain valid quaternions.
    a.group.traverse(o => {
      if (o === a.group) return;
      o.position.y *= BOOK_DECK_SCALE;
      if (!o.isMesh) return;
      const r = new T.Matrix4().makeRotationFromQuaternion(o.quaternion);
      const localStretch = r.clone().invert().multiply(new T.Matrix4().makeScale(1, BOOK_DECK_SCALE, 1)).multiply(r);
      o.geometry = o.geometry.clone().applyMatrix4(localStretch);
    });
    a.group.position.y=DECK_LOW*(1-BOOK_DECK_SCALE);
    a.center.y=DECK_LOW+(a.center.y-DECK_LOW)*BOOK_DECK_SCALE;
  }

  /* ---------- count what we built, for the geometry contract ---------- */
  let meshes = 0, triangles = 0;
  root.traverse(o => {
    if (!o.isMesh) return;
    meshes++;
    const g = o.geometry;
    triangles += (g.index ? g.index.count : g.attributes.position.count) / 3;
  });
  const counts = { assemblies: assemblies.length, meshes, triangles: Math.round(triangles) };

  return {
    root, assemblies, counts,
    HALF_LEN, HALF_W, DECK_LOW, DECK_MID, ROOF_TOP, RAIL_Y, WHEEL_R,
    // Motion is region-gated: only the assembly named by the studio animates.
    update(state) {
      for (const a of assemblies) if (a.update) a.update(state || {});
    }
  };
 }};
})();

/* Picture-book launch vehicle. Up is +Y; the stack stands on the pad.
   Proportions follow the picture-book illustrations: a slim cylinder, two slim
   optional teaching boosters, a pointed fairing and a single main bell.
   No engineering dimensions are claimed from painted artwork. */
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
 function roundedBox(T, w, h, d, r) {
  const g = new T.BoxGeometry(w, h, d, 2, 2, 2), pos = g.attributes.position;
  const inner = [w / 2 - r, h / 2 - r, d / 2 - r];
  for (let i = 0; i < pos.count; i++) {
    const v = new T.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
    const c = new T.Vector3(
      Math.max(-inner[0], Math.min(inner[0], v.x)),
      Math.max(-inner[1], Math.min(inner[1], v.y)),
      Math.max(-inner[2], Math.min(inner[2], v.z))
    );
    v.sub(c).normalize().multiplyScalar(r).add(c);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
 }

 window.RocketV3 = { create(T) {
  const assemblies = [];
  const root = new T.Group(); root.name = 'Picture-book rocket';
  const materials = new Map();
  // Sampled from books/rocket/assets: an ivory body, a BLUE nose cone seated on an
  // ORANGE band, a blue lower (oxidizer) tank over an ivory upper (fuel) tank and
  // bare-metal nozzles. Nothing here is a measured engineering colour.
  const palette = {
    shell: 0xe8e3d6, shellDim: 0xd4cec0, fairing: 0xe8e3d6, fairingIn: 0xcdc7b8,
    band: 0xdd8950, ink: 0x33434c, metal: 0x9aa5ad, dark: 0x4a5a64, frame: 0xcfd6da,
    fuel: 0xe8e3d6, fuelDim: 0xd4cec0, ox: 0x508dab, oxDim: 0x427a96, green: 0x579f94,
    blue: 0x547ea4, nose: 0x3d6f96, gold: 0xbd922e, panel: 0x3d6f96, copper: 0xb5763f
  };
  const mat = (key, r = .55, m = 0) => {
    const k = key + '|' + r + '|' + m;
    if (!materials.has(k)) materials.set(k, new T.MeshStandardMaterial({ color: palette[key], roughness: r, metalness: m }));
    return materials.get(k);
  };
  const ghostMat = new T.MeshBasicMaterial({ color: 0xa8bab8, transparent: true, opacity: .065, depthWrite: false, side: T.DoubleSide });

  /* ---------- the assembly contract the studio relies on ---------- */
  // Detail groups default to the EXTERIOR layer: a discovery that is visible on
  // the outside of the part (a fairing half, a nozzle, a booster case) must be
  // on screen from the start. Pass 'interior' for discoveries that only exist
  // once the shell is opened (a tank, a frame, a pump).
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
    const mesh = new T.Mesh(geo, mat(colorKey, o.roughness != null ? o.roughness : .55, o.metalness != null ? o.metalness : 0));
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
  // Pass a layer only for meshes that have no detail of their own.
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
  const cyl = (rt, rb, h, seg = 40, open = false, thetaStart = 0, thetaLength = Math.PI * 2) =>
    new T.CylinderGeometry(rt, rb, h, seg, 1, open, thetaStart, thetaLength);
  const torus = (r, t, seg = 44, arc = Math.PI * 2) => new T.TorusGeometry(r, t, 8, seg, arc);
  // A pressure vessel: a barrel closed by two hemispherical domes.
  function tank(r, h, seg = 40) {
    const cap = new T.SphereGeometry(r, seg, 18, 0, Math.PI * 2, 0, Math.PI / 2);
    const top = cap.clone(); top.translate(0, h / 2, 0);
    const bot = cap.clone(); bot.rotateX(Math.PI); bot.translate(0, -h / 2, 0);
    return mergeNonIndexed(T, [cyl(r, r, h, seg, true), top, bot]);
  }

  /* ================= stack proportions (picture-book, metres) =================
     One station table drives every assembly, so each part is anchored to the one
     below it instead of to a hand-typed absolute height.
       pad            -4.30
       engine skirt   -1.23
       body           -0.92 .. 1.70
       interstage      1.70 .. 2.22
       upper stage     2.22 .. 3.42
       fairing base    3.42
       fairing tip     5.82                                                            */
  const R = .60;            // main body radius
  const FR = .60;           // book nose continues the slender core diameter
  const BODY_BOT = -.92, BODY_TOP = 1.70;
  const BODY_H = BODY_TOP - BODY_BOT, BODY_MID = (BODY_BOT + BODY_TOP) / 2;

  /* ---------- 1. structure: the load-bearing shell ---------- */
  const structure = assembly('structure', 'structure', [0, BODY_MID, 0], 2.7,
    [-.62, .22], [{ id: 'structure.frame', layer: 'interior' }, { id: 'structure.stringers', layer: 'interior' }, 'structure.skin', 'structure.separation']);
  {
    into(structure, 'exterior', 'structure.skin', cyl(R, R, BODY_H, 44, true), 'shell',
      { name: 'Outer skin', pos: [0, BODY_MID, 0], roughness: .62 });
    // Ring frames every 0.40 m; longitudinal stringers between them: semimonocoque.
    for (let y = BODY_BOT + .22; y < BODY_TOP - .10; y += .40) {
      into(structure, 'exterior', 'structure.frame', torus(R + .012, .022, 40), 'frame',
        { name: 'Ring frame', pos: [0, y, 0], rot: [Math.PI / 2, 0, 0] });
    }
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2;
      const s = new T.BoxGeometry(.035, BODY_H - .20, .035);
      s.translate(Math.sin(a) * (R + .018), 0, Math.cos(a) * (R + .018));
      into(structure, 'exterior', 'structure.stringers', s, 'frame',
        { name: 'Stringer', pos: [0, BODY_MID, 0] });
    }
    // The stage separation plane, marked by a flange at the join.
    into(structure, 'exterior', 'structure.separation', torus(R + .03, .028, 48), 'ink',
      { name: 'Separation line', pos: [0, -.30, 0], rot: [Math.PI / 2, 0, 0] });
    // Interior skeleton, so the cutaway reads from the inside too.
    for (let y = BODY_BOT + .22; y < BODY_TOP - .10; y += .80) {
      into(structure, 'interior', 'structure.frame', torus(R - .02, .018, 32), 'frame',
        { name: 'Inner frame', pos: [0, y, 0], rot: [Math.PI / 2, 0, 0], castShadow: false });
    }
    into(structure, 'interior', 'structure.skin', cyl(R - .022, R - .022, BODY_H - .02, 40, true), 'shellDim',
      { name: 'Inner wall', pos: [0, BODY_MID, 0], roughness: .72, castShadow: false });
    into(structure, 'ghost', null, cyl(R + .02, R + .02, BODY_H, 20, true), 'shell', { name: 'Body silhouette' });
  }

  /* ---------- 2. oxidizer tank (the larger, lower vessel) ---------- */
  const OX_H = 1.50, OX_Y = -.42;
  const oxidizer = assembly('oxidizer', 'oxidizer', [0, OX_Y, 0], 1.5,
    [-.55, .16], [{ id: 'oxidizer.tank', layer: 'interior' }, 'oxidizer.insulation']);
  {
    into(oxidizer, 'exterior', 'oxidizer.tank', tank(R - .045, OX_H), 'ox',
      { name: 'Oxidizer tank', pos: [0, OX_Y, 0], roughness: .5 });
    for (const y of [OX_Y - .48, OX_Y + .48]) {
      into(oxidizer, 'exterior', 'oxidizer.insulation', torus(R - .04, .035, 44), 'shell',
        { name: 'Insulation collar', pos: [0, y, 0], rot: [Math.PI / 2, 0, 0] });
    }
    into(oxidizer, 'interior', 'oxidizer.tank', cyl(R - .068, R - .068, OX_H - .2, 36, true), 'oxDim',
      { name: 'Tank inner wall', pos: [0, OX_Y, 0], roughness: .62, castShadow: false });
    into(oxidizer, 'ghost', null, cyl(R - .02, R - .02, OX_H, 18, true), 'ox', {});
  }
  /* ---------- 3. fuel tank (the smaller, ivory upper vessel) ---------- */
  // The book paints the UPPER vessel ivory and the LOWER one blue — the reverse of
  // the usual "fuel above oxidiser" intuition, so the colours follow the artwork.
  const FU_H = 1.10, FU_Y = 1.05;
  const fuel = assembly('fuel', 'fuel', [0, FU_Y, 0], 1.4,
    [-.55, .16], [{ id: 'fuel.tank', layer: 'interior' }, 'fuel.dome', 'fuel.pipe']);
  {
    into(fuel, 'exterior', 'fuel.tank', tank(R - .045, FU_H), 'fuel',
      { name: 'Fuel tank', pos: [0, FU_Y, 0], roughness: .62 });
    for (const y of [FU_Y - .36, FU_Y + .36]) {
      into(fuel, 'exterior', 'fuel.dome', torus(R - .06, .022, 40), 'shellDim',
        { name: 'Dome weld line', pos: [0, y, 0], rot: [Math.PI / 2, 0, 0] });
    }
    // The line that carries fuel down past the oxidizer tank to the engines.
    into(fuel, 'exterior', 'fuel.pipe', cyl(.075, .075, 1.90, 14), 'metal',
      { name: 'Feed line', pos: [.34, -.55, .18], roughness: .4, metalness: .45 });
    into(fuel, 'interior', 'fuel.tank', cyl(R - .068, R - .068, FU_H - .18, 32, true), 'fuelDim',
      { name: 'Tank inner wall', pos: [0, FU_Y, 0], roughness: .68, castShadow: false });
    into(fuel, 'ghost', null, cyl(R - .02, R - .02, FU_H, 18, true), 'fuel', {});
  }

  /* ---------- 4. interstage: the hollow joint between the stages ---------- */
  const IS_H = .52, IS_Y = BODY_TOP + IS_H / 2;
  const interstage = assembly('interstage', 'interstage', [0, IS_Y, 0], 1.05,
    [-.62, .18], ['interstage.ring', { id: 'interstage.cavity', layer: 'interior' }]);
  {
    into(interstage, 'exterior', null, cyl(R, R, IS_H, 40, true), 'shell',
      { name: 'Interstage shell', pos: [0, IS_Y, 0], roughness: .6 });
    for (const y of [IS_Y - IS_H / 2 + .04, IS_Y + IS_H / 2 - .04]) {
      into(interstage, 'exterior', 'interstage.ring', torus(R + .022, .032, 44), 'metal',
        { name: 'Connector ring', pos: [0, y, 0], rot: [Math.PI / 2, 0, 0], roughness: .4, metalness: .5 });
    }
    into(interstage, 'interior', 'interstage.cavity', cyl(R - .05, R - .05, IS_H - .02, 32, true), 'dark',
      { name: 'Engine space', pos: [0, IS_Y, 0], roughness: .72, castShadow: false });
    into(interstage, 'ghost', null, cyl(R, R, IS_H + .02, 18, true), 'shell', {});
  }

  /* ---------- 5. upper stage: sits on the interstage ---------- */
  const US_BOT = IS_Y + IS_H / 2, US_H = 1.20, US_SHOULDER = .32;
  const US_Y = US_BOT + (US_H + US_SHOULDER) / 2;
  const FAIR_BASE = US_BOT + US_H + US_SHOULDER;
  const upperstage = assembly('upperstage', 'upperstage', [0, US_Y, 0], 1.5,
    [-.55, .2], ['upperstage.engine', { id: 'upperstage.tanks', layer: 'interior' }]);
  {
    // The book paints the whole upper stage ivory; only the lower tank below it is
    // blue, so this section stays in the body colour instead of picking a new hue.
    into(upperstage, 'exterior', null, cyl(R - .06, R - .06, US_H, 36, true), 'shell',
      { name: 'Upper stage shell', pos: [0, US_BOT + US_H / 2, 0], roughness: .6 });
    into(upperstage, 'exterior', null, cyl(FR - .06, R - .06, US_SHOULDER, 36, true), 'shell',
      { name: 'Upper stage shoulder', pos: [0, US_BOT + US_H + US_SHOULDER / 2, 0], roughness: .6 });
    // Its own small bell nozzle, pointing down into the interstage cavity.
    into(upperstage, 'exterior', 'upperstage.engine', cyl(.10, .21, .34, 26, true), 'metal',
      { name: 'Upper engine nozzle', pos: [0, IS_Y - .02, 0], roughness: .34, metalness: .5 });
    into(upperstage, 'interior', 'upperstage.tanks', tank(.30, .46, 26), 'oxDim',
      { name: 'Upper oxidizer tank', pos: [0, US_BOT + .42, 0], castShadow: false });
    into(upperstage, 'interior', 'upperstage.tanks', tank(.30, .46, 26), 'fuelDim',
      { name: 'Upper fuel tank', pos: [0, US_BOT + US_H - .18, 0], castShadow: false });
    into(upperstage, 'ghost', null, cyl(R - .04, R - .04, US_H + US_SHOULDER, 18, true), 'shell',
      { pos: [0, US_Y, 0] });
  }

  /* ---------- 6. satellite: the cargo inside the fairing ---------- */
  // The bus is centred in the fairing barrel; the dish peers into the nose cone.
  const SAT_Y = FAIR_BASE + .62;
  const satellite = assembly('satellite', 'satellite', [0, SAT_Y, 0], 1.2,
    [-.62, .3], ['satellite.body', 'satellite.panels', 'satellite.dish']);
  const wings = [];
  {
    // The nose has the book's core-width profile; keep the folded payload within
    // its circular shell instead of letting cube corners pierce the ivory wall.
    for (const group of Object.values(satellite.details)) group.scale.set(.78, 1, .78);
    into(satellite, 'exterior', 'satellite.body', roundedBox(T, .86, .92, .86, .07), 'gold',
      { name: 'Satellite bus', pos: [0, SAT_Y, 0], roughness: .42, metalness: .3 });
    for (const y of [SAT_Y - .28, SAT_Y + .28]) {
      into(satellite, 'exterior', 'satellite.body', roundedBox(T, .90, .05, .90, .02), 'gold',
        { name: 'Equipment shelf', pos: [0, y, 0], roughness: .42, metalness: .3 });
    }
    // Solar wings on hinges: they stay folded against the bus inside the fairing
    // and swing out when the satellite mechanism runs. Folded width must stay
    // inside the fairing radius (FR = .74) or the panels poke through the shell.
    for (const side of [-1, 1]) {
      const pivot = new T.Group();
      pivot.position.set(0, SAT_Y, side * .12);
      pivot.userData = { region: 'satellite', assemblyId: 'satellite', detail: 'satellite.panels' };
      const panel = new T.Mesh(roundedBox(T, .66, .05, .66, .02), mat('panel', .38, .25));
      panel.position.set(0, 0, side * .34);
      panel.userData = { region: 'satellite', assemblyId: 'satellite', detail: 'satellite.panels' };
      panel.castShadow = true;
      const edge = new T.Mesh(roundedBox(T, .68, .04, .08, .015), mat('metal', .4, .5));
      edge.position.set(0, 0, side * .68);
      edge.userData = { region: 'satellite', assemblyId: 'satellite', detail: 'satellite.panels' };
      pivot.add(panel, edge);
      satellite.details['satellite.panels'].add(pivot);
      wings.push({ pivot, side, base: side * .12, open: side * 1.26 });
    }
    into(satellite, 'exterior', 'satellite.dish', cyl(.045, .045, .55, 12), 'metal',
      { name: 'Antenna mast', pos: [0, SAT_Y + .62, 0], roughness: .4, metalness: .5 });
    into(satellite, 'exterior', 'satellite.dish', cyl(.30, .05, .16, 26), 'shell',
      { name: 'Antenna dish', pos: [0, SAT_Y + .90, 0], roughness: .4, metalness: .3 });
    into(satellite, 'ghost', null, roundedBox(T, .95, 1.0, .95, .07), 'gold', { pos: [0, SAT_Y, 0] });
    satellite.update = state => {
      const k = state.mechanism && state.region === 'satellite' ? (state.level || 0) : 0;
      wings.forEach(w => { w.pivot.position.z = w.base + (w.open - w.base) * k; });
    };
  }

  /* ---------- 7. fairing: two halves that swing open ---------- */
  // The hinge sits at the fairing base, so every child is positioned relative to
  // it. FAIR_BASE is derived from the upper stage above.
  const NOSE_H = 1.30, BARREL_H = .98;
  const FAIR_Y = FAIR_BASE + (BARREL_H + NOSE_H) / 2;
  const FAIR_TIP = FAIR_BASE + BARREL_H + NOSE_H + .12;
  const fairing = assembly('fairing', 'fairing', [0, FAIR_Y, 0], 1.9,
    [-.62, .26], ['fairing.half', 'fairing.tip', { id: 'fairing.skin', layer: 'interior' }, 'fairing.seam']);
  const halves = [];
  {
    // Each half is a half-cylinder barrel plus a half-cone nose, hinged at the base.
    // Painting follows the book: an ivory barrel carrying an ORANGE band, closed by
    // a BLUE nose cone. The nose is its own detail so the studio can name it.
    for (const side of [-1, 1]) {
      const pivot = new T.Group();
      pivot.position.set(0, FAIR_BASE, 0);
      pivot.userData = { region: 'fairing', assemblyId: 'fairing', detail: 'fairing.half' };
      const theta = side > 0 ? 0 : Math.PI;
      const barrel = new T.Mesh(cyl(FR, R, BARREL_H, 30, true, theta, Math.PI), mat('fairing', .6));
      barrel.position.y = BARREL_H / 2;
      barrel.userData = { region: 'fairing', assemblyId: 'fairing', detail: 'fairing.half' };
      barrel.castShadow = true;
      const nose = new T.Mesh(cyl(.03, FR, NOSE_H, 30, true, theta, Math.PI), mat('nose', .55));
      nose.position.y = BARREL_H + NOSE_H / 2;
      nose.userData = { region: 'fairing', assemblyId: 'fairing', detail: 'fairing.tip' };
      nose.castShadow = true;
      const tip = new T.Mesh(cyl(.03, .04, .12, 30, true, theta, Math.PI), mat('nose', .55));
      tip.position.y = BARREL_H + NOSE_H + .06;
      tip.userData = { region: 'fairing', assemblyId: 'fairing', detail: 'fairing.tip' };
      pivot.add(barrel, nose, tip);
      fairing.details['fairing.half'].add(pivot);
      halves.push({ pivot, side });
    }
    // The orange band where the blue nose seats onto the ivory barrel.
    into(fairing, 'exterior', 'fairing.tip', cyl(FR + .008, FR + .008, .12, 34), 'band',
      { name: 'Nose band', pos: [0, FAIR_BASE + .06, 0], roughness: .55 });
    // A round porthole on the barrel, exactly as the book draws it.
    into(fairing, 'exterior', 'fairing.half', cyl(.15, .15, .06, 22), 'nose',
      { name: 'Porthole', pos: [0, FAIR_BASE + .52, FR - .02], rot: [Math.PI / 2, 0, 0], roughness: .3, metalness: .2 });
    into(fairing, 'exterior', 'fairing.half', torus(.16, .022, 26), 'metal',
      { name: 'Porthole rim', pos: [0, FAIR_BASE + .52, FR - .01], roughness: .4, metalness: .5 });
    // The vertical seam where the two halves are bolted together.
    for (const side of [-1, 1]) {
      into(fairing, 'exterior', 'fairing.seam', roundedBox(T, .012, BARREL_H, .012, .004), 'shellDim',
        { name: 'Fairing seam', pos: [side * FR, FAIR_BASE + BARREL_H / 2, 0], roughness: .5 });
    }
    into(fairing, 'interior', 'fairing.skin', cyl(FR - .04, R - .04, NOSE_H + BARREL_H - .12, 30, true), 'fairingIn',
      { name: 'Fairing liner', pos: [0, FAIR_BASE + (BARREL_H + NOSE_H) / 2 - .04, 0], roughness: .72, castShadow: false });
    into(fairing, 'ghost', null, cyl(FR, R, NOSE_H + BARREL_H, 18, true), 'fairing', { pos: [0, FAIR_Y, 0] });
    fairing.update = state => {
      const k = state.mechanism && state.region === 'fairing' ? (state.level || 0) : 0;
      halves.forEach(h => { h.pivot.rotation.x = -h.side * k * .62; });
    };
  }

  /* ---------- 8. boosters: two strap-on side rockets ---------- */
  const B = { r: .30, yBot: -3.05, yTop: 1.42, z: 1.62 };
  const boosters = assembly('boosters', 'boosters', [0, .2, 0], 3.7,
    [1.15, .1], ['boosters.case', 'boosters.nozzle']);
  boosters.defaultVisible = false;
  boosters.group.userData.optional = true;
  boosters.group.userData.referenceNote = 'Teaching extension; no strap-on boosters in the inspected book illustrations';
  {
    const h = B.yTop - B.yBot, mid = (B.yTop + B.yBot) / 2;
    for (const side of [-1, 1]) {
      const z = side * B.z;
      into(boosters, 'exterior', 'boosters.case', cyl(B.r, B.r, h, 32), 'shell',
        { name: 'Booster case', pos: [0, mid, z], roughness: .6 });
      into(boosters, 'exterior', 'boosters.case', cyl(.06, B.r, .46, 32), 'shell',
        { name: 'Booster nose', pos: [0, B.yTop + .23, z], roughness: .6 });
      into(boosters, 'exterior', 'boosters.case', cyl(B.r + .014, B.r + .014, .18, 32), 'shell',
        { name: 'Booster band', pos: [0, .58, z], roughness: .6 });
      // Two attachment struts tie each booster back to the core body.
      for (const y of [-1.55, .42]) {
        into(boosters, 'exterior', 'boosters.case', roundedBox(T, B.z - R, .09, .09, .03), 'metal',
          { name: 'Attachment strut', pos: [0, y, z / 2], roughness: .4, metalness: .5 });
      }
      into(boosters, 'exterior', 'boosters.nozzle', cyl(.11, .24, .40, 26, true), 'metal',
        { name: 'Booster nozzle', pos: [0, B.yBot - .20, z], roughness: .34, metalness: .5 });
      into(boosters, 'ghost', null, cyl(B.r, B.r, h, 14), 'shell', { pos: [0, mid, z] });
    }
  }

  /* ---------- 9. main engines ---------- */
  const ENG_Y = -1.60;
  const engines = assembly('engines', 'engines', [0, -2.6, 0], 1.7,
    [1.05, -.05], ['engines.nozzle','engines.chamber','engines.turbopump','engines.gimbal']);
  const bells = [];
  {
    // The skirt closes the bottom of the body around the engines.
    into(engines, 'exterior', null, cyl(R, R + .04, .34, 40, true), 'ink',
      { name: 'Engine skirt', pos: [0, -1.06, 0], roughness: .5, metalness: .3 });
    // Cover, launch, cutaway and staging images consistently show one main bell.
    const lay = [[0, 0]];
    lay.forEach(([dx, dz], i) => {
      const pivot = new T.Group();
      pivot.position.set(dx, -1.28, dz);
      pivot.userData = { region: 'engines', assemblyId: 'engines', detail: 'engines.gimbal' };
      const motor = new T.Group();
      motor.userData = { region: 'engines', assemblyId: 'engines', detail: 'engines.gimbal' };
      const chamber = new T.Mesh(cyl(.17, .17, .30, 24), mat('copper', .42, .4));
      chamber.position.y = -.15;
      chamber.userData = { region: 'engines', assemblyId: 'engines', detail: 'engines.chamber' };
      chamber.castShadow = true;
      const nozzle = new T.Mesh(cyl(.16, .49, .86, 40, true), mat('metal', .34, .55));
      nozzle.name = 'Main bell nozzle';
      nozzle.position.y = -.73;
      nozzle.userData = { region: 'engines', assemblyId: 'engines', detail: 'engines.nozzle' };
      nozzle.castShadow = true;
      const collar = new T.Mesh(torus(.26, .025, 28), mat('metal', .4, .5));
      collar.rotation.x = Math.PI / 2; collar.position.y = -.34;
      collar.userData = { region: 'engines', assemblyId: 'engines', detail: 'engines.nozzle' };
      motor.add(chamber, nozzle, collar);
      pivot.add(motor);
      engines.details['engines.gimbal'].add(pivot);
      // Turbopump with visible impeller vanes, hung beside each chamber.
      const px = .22 * (i === 0 ? -1 : 1);
      const pump = new T.Mesh(roundedBox(T, .22, .24, .22, .05), mat('metal', .4, .55));
      pump.position.set(px, -1.40, dz);
      pump.userData = { region: 'engines', assemblyId: 'engines', detail: 'engines.turbopump' };
      pump.castShadow = true;
      engines.details['engines.turbopump'].add(pump);
      for (let k = 0; k < 8; k++) {
        const blade = new T.Mesh(roundedBox(T, .05, .15, .02, .008), mat('copper', .45, .4));
        blade.position.set(px, -1.40, dz);
        blade.rotation.y = k * Math.PI / 4;
        blade.userData = { region: 'engines', assemblyId: 'engines', detail: 'engines.turbopump' };
        engines.details['engines.turbopump'].add(blade);
      }
      bells.push(pivot);
    });
    // Swept ivory tail fins give the book rocket its recognisable lower outline.
    // These are surfaces on the existing structure discovery, not extra engines.
    const finShape = new T.Shape();
    finShape.moveTo(R - .02, -.55);
    finShape.lineTo(1.12, -1.32);
    finShape.lineTo(1.12, -2.12);
    finShape.lineTo(R - .02, -1.78);
    finShape.closePath();
    const finGeo = new T.ExtrudeGeometry(finShape, { depth: .055, bevelEnabled: true, bevelSize: .012, bevelThickness: .012, bevelSegments: 1, steps: 1 });
    finGeo.translate(0, 0, -.0275);
    for (let i = 0; i < 4; i++) {
      into(structure, 'exterior', 'structure.separation', finGeo, 'shell',
        { name: 'Swept tail fin', rot: [0, i * Math.PI / 2, 0], roughness: .6 });
    }
    into(engines, 'ghost', null, cyl(.60, .40, 1.6, 16, true), 'ink', { pos: [0, -2.0, 0] });
    engines.update = state => {
      const k = state.mechanism && state.region === 'engines' ? (state.level || 0) : 0;
      // Gimbal steering: the nozzles tilt a few degrees together.
      bells.forEach((b, i) => {
        b.rotation.z = (i === 0 ? 1 : -1) * k * .10;
        b.rotation.x = Math.sin(k * Math.PI * 2 + i) * .06;
      });
    };
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
    R, FR, B, BODY_BOT, BODY_TOP, FAIR_BASE, FAIR_TIP,
    // Motion is region-gated: only the assembly named by the studio animates.
    update(state) {
      for (const a of assemblies) if (a.update) a.update(state || {});
    }
  };
 }};
})();

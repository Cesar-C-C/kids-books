(function () {
  'use strict';
  // Purpose-built teaching high-speed leading carriage. Metres; nose points to -X,
  // up +Y, right +Z. One continuous super-ellipse shell is cut into cab / roof /
  // cabin so the controller can peel a single layer and find the cabin inside.
  window.TrainV3 = { create: function (T) {
    const root = new T.Group(); root.name = 'Teaching high-speed train / continuous shell';
    const assemblies = [], motions = [];
    const mat = (color, extra) => new T.MeshStandardMaterial(Object.assign({color, roughness:.42, metalness:.14}, extra));
    const white = mat(0xf5f8f6, { side: T.DoubleSide, roughness: .28 });
    const silver = mat(0xccd9de, { metalness: .5, roughness: .3 });
    const blue = mat(0x23658f, { metalness: .3, roughness: .34 });
    const gold = mat(0xddb95c, { metalness: .45, roughness: .28 });
    const glass = mat(0x183e56, { metalness: .35, roughness: .15, side: T.DoubleSide });
    const pane = mat(0x2c5f7d, { metalness: .2, roughness: .1, transparent: true, opacity: .58, side: T.DoubleSide });
    const steel = mat(0x647883, { metalness: .62, roughness: .32 });
    const dark = mat(0x344958, { metalness: .4, roughness: .5 });
    const alloy = mat(0xa8bcc4, { metalness: .58, roughness: .34 });
    const copper = mat(0xb87333, { metalness: .7, roughness: .34 });
    const seatBlue = mat(0x397e9c, { roughness: .62 });
    const warm = mat(0xe9d8b0, { roughness: .7 });
    const cabinMat = mat(0xeff3ee, { side: T.DoubleSide, roughness: .6 });
    const foam = mat(0xe4dcc2, { roughness: .88 });
    const carpet = mat(0x8fa3a8, { roughness: .92 });
    const rubber = mat(0x222b34, { roughness: .86 });
    const lamp = mat(0xfff4d6, { emissive: 0xffd486, emissiveIntensity: .55, roughness: .25 });
    const ghostMat = new T.MeshBasicMaterial({ color: 0xbed0d4, transparent: true, opacity: .08, depthWrite: false, side: T.DoubleSide });

    function assembly(id, region, center, radius, view) {
      const group = new T.Group(), exterior = new T.Group(), interior = new T.Group(), ghost = new T.Group();
      group.name = id; group.userData = { region, assemblyId: id }; root.add(group); group.add(exterior, interior, ghost);
      interior.visible = false; ghost.visible = false;
      const a = { id, region, group, exterior, interior, ghost, details: {}, center: new T.Vector3(...center), radius, view: view || [1.1, .3] };
      assemblies.push(a); return a;
    }
    function detail(a, id, parent) {
      const g = new T.Group(); g.name = id; g.userData = { detail: id, region: a.region, assemblyId: a.id };
      (parent || a.interior).add(g);
      if (a.details[id]) a.details[id] = [].concat(a.details[id], g); else a.details[id] = g;
      return g;
    }
    function mesh(parent, geo, m, x = 0, y = 0, z = 0) {
      const o = new T.Mesh(geo, m); o.position.set(x, y, z);
      o.castShadow = true; o.receiveShadow = true; parent.add(o); return o;
    }
    function box(p, m, x, y, z, w, h, d) { return mesh(p, new T.BoxGeometry(w, h, d), m, x, y, z); }
    function rod(p, m, a, b, r = .025) {
      const av = new T.Vector3(...a), bv = new T.Vector3(...b), delta = bv.clone().sub(av);
      const o = mesh(p, new T.CylinderGeometry(r, r, delta.length(), 10), m);
      o.position.copy(av.add(bv).multiplyScalar(.5)); o.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize()); return o;
    }
    function tube(p, m, pts, r = .024, closed = false) {
      const curve = new T.CatmullRomCurve3(pts.map(v => new T.Vector3(...v)), closed);
      return mesh(p, new T.TubeGeometry(curve, Math.max(20, pts.length * 3), r, 7, closed), m);
    }
    // Rounded slab: a real fillet silhouette instead of a hard box corner.
    function slab(p, m, x, y, z, w, h, d, r) {
      const s = new T.Shape(), hw = w / 2, hh = h / 2; r = Math.min(r || .06, hw - .002, hh - .002);
      s.moveTo(-hw + r, -hh); s.lineTo(hw - r, -hh); s.quadraticCurveTo(hw, -hh, hw, -hh + r);
      s.lineTo(hw, hh - r); s.quadraticCurveTo(hw, hh, hw - r, hh);
      s.lineTo(-hw + r, hh); s.quadraticCurveTo(-hw, hh, -hw, hh - r);
      s.lineTo(-hw, -hh + r); s.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
      const g = new T.ExtrudeGeometry(s, { depth: d, bevelEnabled: false, curveSegments: 5 });
      g.translate(0, 0, -d / 2); return mesh(p, g, m, x, y, z);
    }
    function sphere(p, m, x, y, z, sx, sy, sz) { return mesh(p, new T.SphereGeometry(1, 18, 14), m, x, y, z).scale.set(sx, sy, sz); }

    /* ---------- continuous shell ---------- */
    // Station = [x, centreY, halfHeight, halfWidth]; an exponent of .72 flattens
    // the flank the way a high-speed nose is flattened, instead of a pipe.
    const P = .72;
    const SHELL = [
      [-5.28, -.33, .045, .070], [-5.20, -.31, .150, .245], [-4.97, -.26, .240, .430],
      [-4.64, -.19, .330, .590], [-4.24, -.09, .460, .700], [-3.84, .060, .640, .800],
      [-3.44, .190, .780, .880], [-3.00, .245, .845, .912], [-2.55, .290, .900, .940],
      [-1.20, .290, .900, .940], [1.60, .290, .900, .940], [3.94, .290, .900, .940],
      [4.16, .290, .870, .910], [4.34, .285, .830, .875]
    ];
    const CUT = -3.05;                                   // cab / cabin split
    function ringAt(x) {
      const S = SHELL;
      if (x <= S[0][0]) return S[0].slice();
      if (x >= S[S.length - 1][0]) return S[S.length - 1].slice();
      let k = 0; while (k < S.length - 2 && x > S[k + 1][0]) k++;
      const a = S[k], b = S[k + 1], t = (x - a[0]) / (b[0] - a[0]);
      return [x, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, a[3] + (b[3] - a[3]) * t];
    }
    function slice(x0, x1) {
      const out = [ringAt(x0)];
      for (const r of SHELL) if (r[0] > x0 && r[0] < x1) out.push(r.slice());
      out.push(ringAt(x1)); return out;
    }
    function point(r, a, grow) {
      const co = Math.cos(a), si = Math.sin(a), g = grow || 1;
      return [r[0], r[1] + r[2] * g * Math.sign(co) * Math.pow(Math.abs(co), P), r[3] * g * Math.sign(si) * Math.pow(Math.abs(si), P)];
    }
    function surfaceZ(x, y, grow) {
      const r = ringAt(x), h = Math.max(1e-4, r[2]);
      const t = Math.min(1, Math.abs(y - r[1]) / h), c = Math.pow(t, 1 / P), s = Math.sqrt(Math.max(0, 1 - c * c));
      return r[3] * Math.pow(s, P) * (grow || 1);
    }
    // Angle sweep along stations. a=0 is the crown, a=PI/2 the right flank, a=PI the belly.
    function arcGeo(stations, a0, a1, segments, grow) {
      const v = [], idx = [];
      for (const r of stations) for (let j = 0; j <= segments; j++) v.push(...point(r, a0 + (a1 - a0) * j / segments, grow));
      for (let i = 0; i < stations.length - 1; i++) for (let j = 0; j < segments; j++) {
        const q = i * (segments + 1) + j; idx.push(q, q + segments + 1, q + 1, q + 1, q + segments + 1, q + segments + 2);
      }
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(v, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
    }
    // Closed shell with real end caps, so a cutaway shows a section, never a hole.
    function loftGeo(stations, segments, caps) {
      const v = [], idx = [];
      for (const r of stations) for (let j = 0; j <= segments; j++) v.push(...point(r, j / segments * Math.PI * 2, 1));
      for (let i = 0; i < stations.length - 1; i++) for (let j = 0; j < segments; j++) {
        const q = i * (segments + 1) + j; idx.push(q, q + segments + 1, q + 1, q + 1, q + segments + 1, q + segments + 2);
      }
      if (caps !== false) {
        const first = ringAt(stations[0][0]), last = stations[stations.length - 1];
        const c0 = v.length / 3; v.push(first[0], first[1], 0);
        for (let j = 0; j < segments; j++) idx.push(c0, j + 1, j);
        const base = (stations.length - 1) * (segments + 1), c1 = v.length / 3; v.push(last[0], last[1], 0);
        for (let j = 0; j < segments; j++) idx.push(c1, base + j, base + j + 1);
      }
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(v, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
    }
    // Flank patch addressed in (x, y): a window or stripe hugs the real surface.
    function patch(parent, m, x0, x1, y0, y1, side, segX, segY, grow) {
      const pos = [], idx = [];
      for (let i = 0; i <= segX; i++) { const x = x0 + (x1 - x0) * i / segX;
        for (let j = 0; j <= segY; j++) { const y = y0 + (y1 - y0) * j / segY; pos.push(x, y, side * surfaceZ(x, y, grow)); } }
      for (let i = 0; i < segX; i++) for (let j = 0; j < segY; j++) { const a = i * (segY + 1) + j;
        if (side > 0) idx.push(a, a + segY + 1, a + 1, a + 1, a + segY + 1, a + segY + 2);
        else idx.push(a, a + 1, a + segY + 1, a + 1, a + segY + 2, a + segY + 1); }
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return mesh(parent, g, m);
    }
    // Angled patch: the band narrows toward the nose, giving a wrap windscreen.
    function quad(parent, m, x0, x1, a0a, a1a, a0b, a1b, segX, segA, grow) {
      const pos = [], idx = [];
      for (let i = 0; i <= segX; i++) { const t = i / segX, r = ringAt(x0 + (x1 - x0) * t);
        const lo = a0a + (a0b - a0a) * t, hi = a1a + (a1b - a1a) * t;
        for (let j = 0; j <= segA; j++) pos.push(...point(r, lo + (hi - lo) * j / segA, grow)); }
      for (let i = 0; i < segX; i++) for (let j = 0; j < segA; j++) { const a = i * (segA + 1) + j;
        idx.push(a, a + segA + 1, a + 1, a + 1, a + segA + 1, a + segA + 2); }
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return mesh(parent, g, m);
    }
    function silhouette(a, geo) { mesh(a.ghost, geo, ghostMat); }

    /* ============================================================
       CAB — nose shell, wrap windscreen, lamps, the driver's place
       ============================================================ */
    const cabStations = slice(-5.28, CUT);
    const cab = assembly('cab', 'cab', [-4.2, .02, 0], 1.95, [1.05, .3]);
    mesh(cab.exterior, loftGeo(cabStations, 56, true), white);
    silhouette(cab, loftGeo(cabStations, 14, true));
    // Livery follows the nose curve instead of sitting on it as a flat decal.
    for (const side of [-1, 1]) {
      const base = side > 0 ? Math.PI / 2 : Math.PI * 1.5;
      const bl = [], gd = [];
      for (const r of cabStations) { bl.push(point(r, base + side * .300, 1.004)); gd.push(point(r, base + side * .245, 1.004)); }
      tube(cab.exterior, blue, bl, .052); tube(cab.exterior, gold, gd, .019);
    }
    // Wrap windscreen: narrow over the nose, broad at the driver's shoulders.
    quad(cab.exterior, glass, -4.02, -3.34, -.52, .52, -1.06, 1.06, 14, 22, 1.012);
    quad(cab.exterior, steel, -4.06, -4.00, -.55, .55, -.60, .60, 2, 16, 1.016);
    quad(cab.exterior, steel, -3.36, -3.30, -1.06, 1.06, -1.10, 1.10, 2, 18, 1.016);
    for (const side of [-1, 1]) {
      patch(cab.exterior, glass, -3.30, -3.07, .58, .96, side, 6, 8, 1.012);   // driver window
      rod(cab.exterior, dark, [-3.42, .56, side * surfaceZ(-3.42, .56, 1.03)], [-3.24, .83, side * surfaceZ(-3.24, .83, 1.03)], .011);
      sphere(cab.exterior, lamp, -4.62, -.085, side * surfaceZ(-4.62, -.085, 1.01), .15, .048, .052);
      sphere(cab.exterior, lamp, -4.88, -.175, side * surfaceZ(-4.88, -.175, 1.01), .09, .032, .034);
    }
    box(cab.interior, cabinMat, -3.98, -.345, 0, 1.90, .05, 1.52);
    const cseat = detail(cab, 'cab.seat');
    slab(cseat, seatBlue, -3.70, -.19, 0, .42, .12, .44, .05);
    slab(cseat, seatBlue, -3.93, -.03, 0, .11, .52, .44, .05).rotation.z = .13;
    slab(cseat, seatBlue, -3.99, .20, 0, .10, .15, .32, .04);
    for (const z of [-.17, .17]) rod(cseat, alloy, [-3.70, -.25, z], [-3.70, -.34, z], .028);
    const cdesk = detail(cab, 'cab.desk');
    box(cdesk, dark, -4.42, -.305, 0, .32, .09, 1.30);
    box(cdesk, dark, -4.36, -.10, 0, .22, .40, 1.24).rotation.z = .30;
    for (const z of [-.44, -.15, .15, .44]) {
      rod(cdesk, steel, [-4.46, -.02, z], [-4.24, .10, z], .030);
      box(cdesk, alloy, -4.32, .13, z, .05, .06, .10);
    }
    rod(cdesk, steel, [-4.30, -.36, .30], [-4.10, -.30, .30], .026);
    box(cdesk, steel, -4.12, -.385, -.52, .16, .05, .24);
    box(cdesk, steel, -4.12, -.385, .52, .16, .05, .24);
    const cdisp = detail(cab, 'cab.displays');
    for (const z of [-.36, 0, .36]) {
      box(cdisp, dark, -4.24, .06, z, .03, .20, .30).rotation.z = .30;
      box(cdisp, glass, -4.215, .062, z, .012, .155, .255).rotation.z = .30;
      box(cdisp, lamp, -4.205, .09, z, .008, .022, .10).rotation.z = .30;
      box(cdisp, blue, -4.205, .03, z, .008, .012, .07).rotation.z = .30;
    }
    box(cdisp, alloy, -4.19, -.17, 0, .28, .05, 1.16);

    /* ============================================================
       BODY — cabin flanks and underframe (the roof owns the crown)
       ============================================================ */
    const cabinStations = slice(CUT, 4.34);
    const body = assembly('cabin-body', 'body', [.6, .05, 0], 4.0, [1.12, .22]);
    mesh(body.exterior, arcGeo(cabinStations, Math.PI / 2, Math.PI * 1.5, 56, 1), white);
    silhouette(body, arcGeo(cabinStations, Math.PI / 2, Math.PI * 1.5, 14, 1));
    for (const side of [-1, 1]) {
      patch(body.exterior, blue, -3.00, 4.30, .245, .360, side, 20, 3, 1.005);
      patch(body.exterior, gold, -3.00, 4.30, .360, .392, side, 20, 2, 1.005);
      patch(body.exterior, silver, -3.00, 4.30, -.595, -.430, side, 18, 4, 1.005);
    }
    for (const z of [-.45, .45]) rod(body.exterior, steel, [-3.0, -.585, z], [4.30, -.585, z], .050);
    const bs = detail(body, 'body.skin');
    for (let i = 0; i < 15; i++) {
      const x = -2.98 + i * .525, r = ringAt(x), pts = [];
      for (let j = 0; j < 44; j++) pts.push(point([x, r[1], r[2] * .965, r[3] * .965], j / 44 * Math.PI * 2, 1));
      tube(bs, alloy, pts, .019, true);
    }
    for (const a of [Math.PI * .34, Math.PI * 1.32, Math.PI * 1.66]) {
      const pts = [];
      for (let i = 0; i <= 12; i++) { const x = -3.0 + i * .61, r = ringAt(x); pts.push(point([x, r[1], r[2] * .945, r[3] * .945], a, 1)); }
      tube(bs, alloy, pts, .015);
    }
    const bf = detail(body, 'body.floor');
    box(bf, cabinMat, .6, -.360, 0, 7.4, .055, 1.60);
    box(bf, carpet, .6, -.328, 0, 7.4, .012, .42);
    for (const z of [-.76, -.26, .26, .76]) box(bf, alloy, .6, -.398, z, 7.3, .055, .045);
    for (let i = 0; i < 10; i++) box(bf, alloy, -3.0 + i * .82, -.415, 0, .05, .095, 1.54);
    const blg = detail(body, 'body.luggage');
    for (const side of [-1, 1]) {
      box(blg, warm, .6, 1.005, side * .57, 7.2, .055, .26);
      box(blg, alloy, .6, .975, side * .690, 7.2, .12, .028);
      for (let i = 0; i < 7; i++) rod(blg, alloy, [-2.8 + i * 1.15, 1.035, side * .50], [-2.8 + i * 1.15, .845, side * .60], .014);
    }

    /* ============================================================
       ROOF — crown shell, air-conditioning set, supply duct
       ============================================================ */
    const roof = assembly('roof', 'roof', [.6, 1.15, 0], 3.7, [1.15, .75]);
    mesh(roof.exterior, arcGeo(cabinStations, -Math.PI / 2, Math.PI / 2, 56, 1), white);
    silhouette(roof, arcGeo(cabinStations, -Math.PI / 2, Math.PI / 2, 14, 1));
    slab(roof.exterior, silver, .55, 1.255, 0, 2.10, .30, 1.34, .10);
    for (let i = 0; i < 5; i++) box(roof.exterior, steel, .55, 1.408, -.50 + i * .25, 1.98, .014, .10);
    box(roof.exterior, silver, -2.55, 1.215, 0, .50, .06, .22);
    box(roof.exterior, steel, -2.55, 1.275, 0, .30, .06, .05);
    const ru = detail(roof, 'roof.unit');
    for (let i = 0; i < 9; i++) { const x = -.30 + i * .18; rod(ru, alloy, [x, 1.20, -.50], [x, 1.20, .50], .014); }
    for (const z of [-.50, .50]) rod(ru, copper, [-.30, 1.20, z], [1.14, 1.20, z], .017);
    for (const x of [-.30, 1.14]) for (const z of [-.52, .52]) rod(ru, alloy, [x, 1.13, z], [x, 1.27, z], .013);
    for (const x of [-.62, .78]) {
      mesh(ru, new T.CylinderGeometry(.175, .175, .10, 22), dark, x, 1.205, 0).rotation.x = Math.PI / 2;
      for (let b = 0; b < 10; b++) { const t = b / 10 * Math.PI * 2; box(ru, alloy, x + Math.cos(t) * .105, 1.205 + Math.sin(t) * .105, 0, .05, .05, .105); }
    }
    const rd = detail(roof, 'roof.duct');
    for (const z of [-.30, .30]) {
      box(rd, cabinMat, .6, 1.075, z, 6.6, .125, .34);
      for (let i = 0; i < 9; i++) box(rd, alloy, -2.7 + i * .74, 1.012, z, .28, .012, .30);
    }
    rod(rd, alloy, [-2.9, 1.148, 0], [4.05, 1.148, 0], .028);

    /* ============================================================
       WINDOWS — six openings a side, glazing and blinds inside
       ============================================================ */
    const WX = [-2.60, -1.65, -.70, .25, 1.20, 2.15];
    const windows = assembly('windows', 'windows', [.6, .78, 0], 3.4, [1.2, .10]);
    for (const side of [-1, 1]) WX.forEach((x) => {
      patch(windows.exterior, dark, x - .40, x + .40, .500, 1.010, side, 6, 6, 1.007);
      patch(windows.exterior, glass, x - .335, x + .335, .565, .950, side, 6, 6, 1.013);
    });
    const wp = detail(windows, 'windows.pane');
    for (const side of [-1, 1]) [-2.60, -.70, 1.20].forEach((x) => {
      patch(wp, pane, x - .315, x + .315, .575, .940, side, 4, 5, .974);
      patch(wp, pane, x - .315, x + .315, .575, .940, side, 4, 5, .958);
      for (const y of [.585, .930]) patch(wp, dark, x - .315, x + .315, y - .012, y + .012, side, 4, 1, .966);
      patch(wp, dark, x - .315, x + .315, .752, .764, side, 4, 1, .966);
    });
    const wsh = detail(windows, 'windows.shade');
    for (const side of [-1, 1]) [-2.60, -.70, 1.20].forEach((x) => {
      mesh(wsh, new T.CylinderGeometry(.028, .028, .64, 12), alloy, x, 1.005, side * surfaceZ(x, 1.005, .952)).rotation.z = Math.PI / 2;
      // The fabric unrolls from the roller: scale.y is the blind position, so
      // fully down it covers the glazing instead of hanging below it.
      const blind = new T.Group(); blind.position.set(x, 1.005, side * surfaceZ(x, 1.005, .950)); wsh.add(blind);
      box(blind, warm, 0, -.22, 0, .60, .44, .012);
      motions.push({ group: blind, region: 'windows', id: 'windows.shade', kind: 'blind' });
    });

    /* ============================================================
       SEATS — six rows of four, with the padding cut open
       ============================================================ */
    const seats = assembly('seats', 'seats', [.6, -.12, 0], 2.6, [.35, .72]);
    for (let row = 0; row < 6; row++) for (const z of [-.62, -.31, .31, .62]) {
      const x = -2.30 + row * .90;
      slab(seats.exterior, seatBlue, x, -.090, z, .50, .125, .285, .045);
      slab(seats.exterior, seatBlue, x + .215, .130, z, .12, .55, .285, .045).rotation.z = -.09;
      slab(seats.exterior, warm, x + .145, .360, z, .025, .13, .23, .012);
      for (const dz of [-.15, .15]) slab(seats.exterior, silver, x, .055, z + dz, .35, .055, .035, .015);
      box(seats.exterior, steel, x, -.255, z, .10, .22, .075);
    }
    const sc = detail(seats, 'seats.cushion');
    [-2.30, -1.40].forEach((x) => {
      box(sc, foam, x, -.102, -.62, .48, .078, .27);
      box(sc, alloy, x, -.156, -.62, .46, .020, .25);
      for (let k = 0; k < 4; k++) rod(sc, steel, [x - .18 + k * .12, -.168, -.62], [x - .18 + k * .12, -.086, -.62], .020);
    });
    const sb = detail(seats, 'seats.back');
    [-1.40].forEach((x) => {
      box(sb, foam, x + .22, .130, -.62, .09, .48, .27);
      for (const y of [-.05, .13, .31]) box(sb, alloy, x + .22, y, -.62, .075, .022, .26);
      slab(sb, warm, x + .115, .395, -.62, .34, .030, .24, .010);
    });

    /* ============================================================
       DOORS — a pair of leaves a side, sliding apart
       ============================================================ */
    const doors = assembly('doors', 'doors', [3.62, .30, 0], 1.70, [1.05, .12]);
    for (const side of [-1, 1]) {
      patch(doors.exterior, gold, 3.24, 4.04, -.40, 1.02, side, 6, 8, 1.007);
      for (const [dir, x0, x1] of [[-1, 3.26, 3.60], [1, 3.64, 3.98]]) {
        const hinge = new T.Group(); doors.exterior.add(hinge);
        // The detail group owns the whole leaf, so "door leaf" picks the door
        // itself rather than the thin seal strips around it.
        const leaf = detail(doors, 'doors.leaf', hinge);
        const mid = (x0 + x1) / 2, zAt = (x, y, g) => side * surfaceZ(x, y, g);
        // The leaf is a thin skin on a curved flank, so panel, glazing and every
        // fitting ride the shell: nothing floats off the door, and nothing sinks
        // to the centre line where the near leaf would read as transparent.
        patch(leaf, white, x0, x1, -.36, 1.00, side, 4, 12, 1.009);
        patch(leaf, glass, x0 + .045, x1 - .045, .560, .900, side, 4, 6, 1.015);
        box(leaf, blue, mid, -.185, zAt(mid, -.185, 1.013), x1 - x0 - .06, .075, .014);
        box(leaf, silver, dir > 0 ? x0 + .035 : x1 - .035, -.270, zAt(dir > 0 ? x0 + .035 : x1 - .035, -.270, 1.013), .05, .11, .020);
        sphere(leaf, lamp, mid, .500, zAt(mid, .500, 1.022), .026, .026, .014);
        for (const x of [x0 + .011, x1 - .011]) patch(leaf, rubber, x - .011, x + .011, -.36, 1.00, side, 1, 12, 1.014);
        for (const y of [-.350, .990]) box(leaf, rubber, mid, y, zAt(mid, y, 1.013), x1 - x0, .022, .020);
        for (let k = 0; k < 3; k++) { const x = x0 + .07 + k * .093; patch(leaf, alloy, x - .025, x + .025, -.320, .490, side, 1, 10, 1.013); }
        motions.push({ group: hinge, region: 'doors', id: 'doors.leaf', kind: 'slide', base: 0, away: dir * .42, out: side * .085 });
      }
    }
    const ds = detail(doors, 'doors.sensor');
    for (const side of [-1, 1]) {
      box(ds, dark, 3.995, .62, side * surfaceZ(3.995, .62, .986), .045, .34, .026);
      sphere(ds, lamp, 3.995, .80, side * surfaceZ(3.995, .80, .986), .026, .026, .020);
      box(ds, steel, 3.995, .42, side * surfaceZ(3.995, .42, .986), .030, .16, .022);
      box(ds, alloy, 3.24, .92, side * surfaceZ(3.24, .92, .986), .03, .06, .022);
    }

    /* ============================================================
       COUPLER — head, knuckle and the energy absorber behind it
       ============================================================ */
    const coupler = assembly('coupler', 'coupler', [4.66, -.58, 0], .62, [1.25, .10]);
    box(coupler.exterior, steel, 4.50, -.585, 0, .50, .17, .21);
    slab(coupler.exterior, dark, 4.88, -.585, 0, .26, .38, .40, .08);
    rod(coupler.exterior, silver, [4.88, -.425, 0], [4.88, -.745, 0], .046);
    sphere(coupler.exterior, gold, 5.04, -.585, 0, .085, .085, .115);
    for (const z of [-.26, .26]) rod(coupler.exterior, steel, [4.32, -.80, z], [4.64, -.80, z], .022);
    const ch = detail(coupler, 'coupler.head');
    const knuckle = new T.Group(); knuckle.position.set(4.90, -.585, 0); ch.add(knuckle);
    for (const z of [-.09, .09]) box(knuckle, steel, -.02, .05, z, .18, .16, .10);
    motions.push({ group: knuckle, region: 'coupler', id: 'coupler.head', kind: 'swing', axis: 'y', amplitude: .40 });
    rod(ch, alloy, [4.78, -.585, 0], [4.99, -.585, 0], .030);
    box(ch, dark, 4.80, -.50, 0, .08, .10, .12);
    const cb = detail(coupler, 'coupler.buffer');
    for (let k = 0; k < 4; k++) box(cb, rubber, 4.42 + k * .055, -.585, 0, .040, .30, .32);
    rod(cb, silver, [4.36, -.585, 0], [4.64, -.585, 0], .052);
    box(cb, alloy, 4.34, -.585, 0, .06, .34, .36);

    /* ---------- identity + budget ---------- */
    root.traverse(o => {
      if (!o.isMesh) return; let p = o;
      while (p) { if (p.userData.detail) { o.userData.detail = p.userData.detail; break; } p = p.parent; }
      p = o; while (p) { if (p.userData.assemblyId) { o.userData.assemblyId = p.userData.assemblyId; o.userData.region = p.userData.region; break; } p = p.parent; }
    });
    let meshCount = 0, triangles = 0;
    root.traverse(o => { if (o.isMesh) { meshCount++; triangles += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; } });

    function update(state) {
      state = state || {};
      const time = Number(state.time) || 0, live = state.mechanism, level = Math.max(0, Math.min(1, Number(state.level) || 0));
      for (const m of motions) {
        const match = live && (state.region === m.region || state.region === undefined);
        if (m.kind === 'slide') { m.group.position.x = m.base + (match ? level * m.away : 0); m.group.position.z = (m.out || 0) * (match ? level : 0); }
        else if (m.kind === 'swing') m.group.quaternion.setFromAxisAngle(new T.Vector3(0, 1, 0), match ? Math.sin(time * 1.6) * m.amplitude : 0);
        else if (m.kind === 'blind') m.group.scale.y = match ? Math.max(.02, level) : .02;
      }
    }
    return { root, assemblies, update, counts: { assemblies: assemblies.length, meshes: meshCount, triangles: Math.round(triangles) } };
  } };
})();

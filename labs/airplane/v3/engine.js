/* Original v3 teaching turbofan. Axis: inlet -X, exhaust +X; metres schematic. */
(function (global) {
  'use strict';
  function create(THREE, options = {}) {
    const id = options.id || 'engine-right';
    const side = options.side || 1;
    const group = new THREE.Group();
    group.name = id;
    // The overview's short, broad pods replace the former long tapered tubes.
    // Apply the same reconstruction transform to shell, rotor and installed core.
    group.scale.set(.74, .90, .90);
    group.userData = { region: 'engines', assemblyId: id };
    const exterior = new THREE.Group(), interior = new THREE.Group(), ghost = new THREE.Group();
    exterior.name = 'nacelle-shell'; interior.name = 'installed-engine-internals'; ghost.name = 'nacelle-context';
    ghost.visible = false; interior.visible = false;
    group.add(exterior, interior, ghost);
    const details = {};
    for (const key of ['inlet', 'fan', 'bypass', 'compressor', 'combustor', 'turbine', 'shaft', 'nozzle']) {
      const part = new THREE.Group();
      part.name = 'engine.' + key;
      part.userData = { detail: part.name, region: 'engines', assemblyId: id };
      interior.add(part); details[part.name] = part;
    }
    const mat = (color, metalness = .65, roughness = .32, extra = {}) => new THREE.MeshStandardMaterial({ color, metalness, roughness, side: THREE.DoubleSide, ...extra });
    const M = {
      shell: mat(0x087bc5, .38, .26), pylon: mat(0xf4f5f0, .35, .32), lip: mat(0xc5d5e0, .9, .2), dark: mat(0x293c49, .68, .36),
      fan: mat(0x29343f, .76, .3), compressor: mat(0x609fa9, .7, .32), stator: mat(0xb5c7cc, .8, .27),
      chamber: mat(0xb7794e, .67, .36), liner: mat(0x6b4938, .6, .4), fire: mat(0xe1a269, .3, .3, { emissive: 0x8b3210, emissiveIntensity: .32 }),
      turbine: mat(0x9088ab, .75, .3), shaft: mat(0xcbb985, .8, .23), exhaust: mat(0x526575, .85, .29),
      hole: mat(0x242c32, .15, .7), ghost: mat(0xabbcc5, .05, .8, { transparent: true, opacity: .08, depthWrite: false }),
      bypassFlow: mat(0x69cfdd, .1, .35, { emissive: 0x25828d, emissiveIntensity: .5 }),
      coreFlow: mat(0xf4b56d, .1, .35, { emissive: 0xa75c21, emissiveIntensity: .5 })
    };
    function mesh(parent, geometry, material) {
      const o = new THREE.Mesh(geometry, material);
      o.castShadow = true; o.receiveShadow = true;
      if (parent.userData.detail) o.userData = { ...parent.userData };
      parent.add(o); return o;
    }
    // Lathed profiles have real inner walls and rounded lips, never capped solid cylinders.
    function lathe(parent, profile, material, start = 0, length = Math.PI * 2, segments = 64) {
      const geometry = new THREE.LatheGeometry(profile.map(p => new THREE.Vector2(p[1], p[0])), segments, start, length);
      geometry.rotateZ(-Math.PI / 2);
      return mesh(parent, geometry, material);
    }
    function tube(parent, a, b, radius, material, endRadius = radius, segments = 32) {
      const g = new THREE.CylinderGeometry(endRadius, radius, b - a, segments, 1, false);
      g.rotateZ(-Math.PI / 2); g.translate((a + b) / 2, 0, 0);
      return mesh(parent, g, material);
    }
    function ring(parent, x, radius, thickness, material) {
      const g = new THREE.TorusGeometry(radius, thickness, 8, 64);
      g.rotateY(Math.PI / 2); g.translate(x, 0, 0); return mesh(parent, g, material);
    }
    function rod(parent, p1, p2, r, material) {
      const a = new THREE.Vector3(...p1), b = new THREE.Vector3(...p2), delta = b.clone().sub(a);
      const o = mesh(parent, new THREE.CylinderGeometry(r, r, delta.length(), 7), material);
      o.position.copy(a.add(b).multiplyScalar(.5)); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize()); return o;
    }
    // One indexed mesh per blade row. Each aerofoil has swept radial stations,
    // twisted chord, a pressure face, a suction face and closed root/tip edges.
    function blades(parent, count, x, root, tip, chord, sweep, twist, material) {
      const positions = [], indices = [], nr = 9, nc = 5;
      for (let blade = 0; blade < count; blade++) {
        const offset = positions.length / 3;
        for (let face = 0; face < 2; face++) for (let i = 0; i <= nr; i++) {
          const u = i / nr, r = root + (tip - root) * u;
          const c = chord * (.68 + .5 * Math.sin(u * Math.PI * .75));
          const pitch = twist * (1 - .65 * u);
          for (let j = 0; j <= nc; j++) {
            const v = j / nc, q = (v - .5) * c;
            const thick = (face ? -1 : 1) * .016 * Math.sin(Math.PI * v) * (.6 + .4 * u);
            const theta = blade * Math.PI * 2 / count + sweep * u * u + q * Math.cos(pitch) / r;
            positions.push(x + .07 * u * u + q * Math.sin(pitch) + thick, r * Math.cos(theta), r * Math.sin(theta));
          }
        }
        const stride = nc + 1, sheet = (nr + 1) * stride;
        const quad = (a, b, c, d) => indices.push(offset + a, offset + b, offset + c, offset + a, offset + c, offset + d);
        for (let i = 0; i < nr; i++) for (let j = 0; j < nc; j++) {
          const n = i * stride + j; quad(n, n + stride, n + stride + 1, n + 1);
          quad(n + sheet, n + sheet + 1, n + sheet + stride + 1, n + sheet + stride);
        }
        for (let i = 0; i < nr; i++) {
          const a = i * stride, b = a + nc;
          quad(a, a + sheet, a + sheet + stride, a + stride); quad(b, b + stride, b + stride + sheet, b + sheet);
        }
        for (let j = 0; j < nc; j++) {
          quad(j, j + 1, j + 1 + sheet, j + sheet);
          const a = nr * stride + j; quad(a, a + sheet, a + sheet + 1, a + 1);
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); g.setIndex(indices); g.computeVertexNormals();
      return mesh(parent, g, material);
    }
    const shellProfile = [[-1.42,.565],[-1.48,.588],[-1.46,.617],[-1.39,.638],[-1.17,.658],[-.78,.676],[-.28,.676],[.12,.651],[.48,.604],[.76,.524],[1.02,.427],[1.05,.395],[.98,.395],[.72,.493],[.44,.573],[.10,.620],[-.28,.645],[-.78,.645],[-1.18,.628],[-1.38,.601],[-1.42,.565]];
    const farShell = new THREE.Group(), nearShell = new THREE.Group();
    farShell.name = 'nacelle-far-half'; nearShell.name = 'nacelle-near-half';
    exterior.add(farShell, nearShell);
    // Expose both halves for parent-controlled full / sectional inspection.
    exterior.userData.farHalf = farShell.name; exterior.userData.nearHalf = nearShell.name;
    lathe(farShell, shellProfile, M.shell, side > 0 ? Math.PI : 0, Math.PI);
    lathe(nearShell, shellProfile, M.shell, side > 0 ? 0 : Math.PI, Math.PI);
    const pylonShape = new THREE.Shape();
    pylonShape.moveTo(-.52, .51); pylonShape.lineTo(-.36, .74); pylonShape.lineTo(.51, .74); pylonShape.lineTo(.68, .47); pylonShape.closePath();
    const pg = new THREE.ExtrudeGeometry(pylonShape, { depth: .14, bevelEnabled: true, bevelThickness: .035, bevelSize: .035, bevelSegments: 2, steps: 1 });
    pg.translate(0, 0, -.07); mesh(exterior, pg, M.pylon).name = 'White wing pylon';
    lathe(ghost, [[-1.47, .603], [-1.17, .64], [-.65, .624], [.12, .574], [.73, .489], [1.04, .38]], M.ghost, 0, Math.PI * 2, 20);
    mesh(ghost, pg.clone(), M.ghost);
    const inlet = details['engine.inlet'];
    lathe(inlet, [[-1.43,.562],[-1.50,.583],[-1.49,.617],[-1.43,.648],[-1.29,.653],[-1.27,.642],[-1.39,.626],[-1.42,.593],[-1.43,.562]], M.lip).name='Broad rolled inlet lip';
    lathe(inlet, [[-1.42, .563], [-1.20, .553], [-1.16, .548]], M.dark);
    const fan = details['engine.fan'], fanRotor = new THREE.Group(); fanRotor.userData = { ...fan.userData }; fan.add(fanRotor);
    blades(fanRotor, 22, -1.12, .12, .538, .14, .26, .74, M.fan);
    lathe(fanRotor, [[-1.48, .003], [-1.43, .052], [-1.32, .098], [-1.13, .128], [-1.01, .117], [-1.00, .035]], M.fan);
    ring(fan, -.995, .542, .013, M.stator);
    const bypass = details['engine.bypass'];
    // Splitter separates the real outer annulus from the compressor core.
    lathe(bypass, [[-.91, .295], [-.78, .294], [-.60, .31], [-.05, .317], [.44, .285], [.66, .247], [.67, .23]], M.dark, Math.PI * .20, Math.PI * 1.18);
    ring(bypass, -.87, .3, .013, M.stator);
    blades(bypass, 12, -.86, .31, .556, .075, -.04, -.28, M.stator);
    const compressor = details['engine.compressor'], compressorRotor = new THREE.Group(); compressorRotor.userData = { ...compressor.userData }; compressor.add(compressorRotor);
    for (let stage = 0; stage < 4; stage++) {
      const x = -.72 + stage * .16, r = .269 - stage * .018;
      tube(compressorRotor, x - .025, x + .027, .11 + stage * .01, M.compressor);
      blades(compressorRotor, 28 + stage * 2, x, .106 + stage * .009, r, .063, .1, .72, M.compressor);
      blades(compressor, 25 + stage * 2, x + .077, .119 + stage * .008, r - .005, .05, -.045, -.53, M.stator);
      ring(compressor, x + .077, r, .009, M.stator);
    }
    const combustor = details['engine.combustor'];
    ring(combustor, -.035, .211, .014, M.chamber); ring(combustor, .415, .213, .014, M.chamber);
    // Annular chamber surrounds shaft; open longitudinal section exposes its liner.
    const openStart = side > 0 ? Math.PI * .12 : Math.PI * 1.12;
    lathe(combustor, [[-.06, .197], [.02, .245], [.30, .24], [.43, .20]], M.chamber, openStart, Math.PI * 1.25);
    lathe(combustor, [[-.025, .155], [.045, .181], [.29, .179], [.405, .154]], M.liner, openStart, Math.PI * 1.25);
    lathe(combustor, [[-.05, .103], [.42, .097]], M.chamber);
    for (let n = 0; n < 12; n++) {
      const theta = n * Math.PI * 2 / 12;
      const y = Math.cos(theta), z = Math.sin(theta);
      rod(combustor, [-.025, y * .24, z * .24], [.035, y * .166, z * .166], .009, M.shaft);
      const glow = mesh(combustor, new THREE.SphereGeometry(.024, 8, 6), M.fire);
      glow.position.set(.095, y * .144, z * .144); glow.scale.set(3.1, .72, .72);
    }
    // Cooling-hole marks follow only the remaining liner, two staggered axial rows.
    const holeGeometry = new THREE.CircleGeometry(.006, 7);
    const holes = new THREE.InstancedMesh(holeGeometry, M.hole, 42), dummy = new THREE.Object3D();
    holes.userData = { ...combustor.userData }; combustor.add(holes);
    for (let n = 0; n < 42; n++) {
      const row = Math.floor(n / 14), angle = openStart + .04 + (n % 14 + (row % 2) * .4) / 14 * Math.PI * 1.16;
      // Lathe rotation maps angular coordinates to y=sin(theta), z=cos(theta).
      const y = Math.sin(angle), z = Math.cos(angle);
      dummy.position.set(.075 + row * .104, y * .241, z * .241);
      dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, y, z)); dummy.updateMatrix(); holes.setMatrixAt(n, dummy.matrix);
    }
    const turbine = details['engine.turbine'], turbineRotor = new THREE.Group(); turbineRotor.userData = { ...turbine.userData }; turbine.add(turbineRotor);
    for (let n = 0; n < 2; n++) {
      const x = .49 + n * .18, r = .219 - n * .006;
      blades(turbine, 26, x - .041, .092, r, .057, -.06, -.52, M.stator);
      ring(turbine, x - .041, r, .008, M.turbine);
      tube(turbineRotor, x, x + .055, .102, M.turbine);
      blades(turbineRotor, 30, x + .025, .10, r, .065, .09, .7, M.turbine);
    }
    const shaft = details['engine.shaft'];
    const shaftMaterial = M.shaft.clone();
    tube(shaft, -1.11, .76, .037, shaftMaterial);
    ring(shaft, -.95, .053, .012, shaftMaterial); ring(shaft, .744, .052, .011, shaftMaterial);
    const nozzle = details['engine.nozzle'];
    lathe(nozzle, [[.75, .236], [.94, .224], [1.23, .169], [1.25, .15], [1.21, .145], [.94, .202], [.75, .215]], M.exhaust, openStart, Math.PI * 1.4);
    ring(nozzle, 1.235, .159, .011, M.lip);
    lathe(nozzle, [[.72, .078], [.85, .095], [1.02, .072], [1.29, .009], [1.30, 0]], M.turbine);
    ring(nozzle, .94, .389, .012, M.lip);
    // Flow indicators are supplementary, not new selectable components.
    const flowGroup = new THREE.Group(); flowGroup.name = 'flow-indicators'; flowGroup.userData.nonPickable = true; flowGroup.visible = false; interior.add(flowGroup);
    const flowItems = [];
    for (const path of ['bypass', 'core']) for (let lane = 0; lane < 3; lane++) for (let step = 0; step < 4; step++) {
      const geometry = new THREE.ConeGeometry(path === 'bypass' ? .025 : .019, .095, 7);
      geometry.rotateZ(-Math.PI / 2);
      const arrow = mesh(flowGroup, geometry, (path === 'bypass' ? M.bypassFlow : M.coreFlow).clone());
      arrow.userData.nonPickable = true; arrow.raycast = function () {};
      flowItems.push({ arrow, path, lane, phase: step / 4 });
    }
    function update({ time = 0, mechanism = true, flow = 'off', selected = null } = {}) {
      fanRotor.rotation.x = time * (mechanism ? 2.2 : .45);
      compressorRotor.rotation.x = fanRotor.rotation.x;
      turbineRotor.rotation.x = fanRotor.rotation.x;
      shaft.rotation.x = fanRotor.rotation.x;
      shaft.traverse(o => { if (!o.isMesh) return; for (const m of [].concat(o.material)) { m.emissive.setHex(selected === 'engine.shaft' ? 0xb97816 : 0x000000); m.emissiveIntensity = selected === 'engine.shaft' ? .65 : 0; } });
      flowGroup.visible = flow !== 'off' && flow !== false;
      if (!flowGroup.visible) return;
      for (const item of flowItems) {
        item.arrow.visible = flow === 'both' || flow === true || flow === item.path;
        const t = (time * .24 + item.phase) % 1, x = -1.36 + t * 2.63;
        const tint = item.path === 'core' && x > .03 ? M.coreFlow : M.bypassFlow;
        item.arrow.material.color.copy(tint.color); item.arrow.material.emissive.copy(tint.emissive);
        const theta = (item.lane / 3) * Math.PI * 2 + .37;
        let r;
        if (item.path === 'bypass') r = x < -.8 ? .43 : .43 - Math.max(0, x + .3) * .065;
        else r = x < -.8 ? .22 : x < -.08 ? .19 : x < .43 ? .143 : .139;
        item.arrow.position.set(x, Math.cos(theta) * r, Math.sin(theta) * r);
      }
    }
    // The inlet lip, fan face and nozzle are visible from outside a real nacelle.
    // Keep them attached as detailed exterior parts while the core stays inside.
    for (const name of ['engine.inlet','engine.fan','engine.nozzle']) exterior.add(details[name]);
    update();
    return { id, region: 'engines', group, exterior, interior, ghost, details, center: new THREE.Vector3(0, 0, 0), radius: 1.7, view: [-.65, .25], update };
  }
  global.EngineV3 = { create };
})(typeof window !== 'undefined' ? window : globalThis);

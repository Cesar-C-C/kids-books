(function (root) {
  'use strict';

  function createGeology(THREE) {
    const model = root.EarthquakeModel;
    if (!model) throw new Error('EarthquakeModel must load before geometry');
    const scene = new THREE.Group();
    scene.name = 'One continuous geology model';
    const colors = {
      ground: 0x7a9b83, foot: 0xb59a77, hanging: 0xc9a981,
      clay: 0xd8b97f, rust: 0x973f32, dark: 0x422a2b,
      waveP: 0x43b5c7, waveS: 0x357ca7, amber: 0xf7b547
    };
    const group = (name, id, parent = scene) => {
      const object = new THREE.Group();
      object.name = name;
      object.userData.partId = id;
      parent.add(object);
      return object;
    };
    const material = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.93, metalness: 0.02, ...extra });
    const mesh = (parent, name, geometry, mat, detail) => {
      const object = new THREE.Mesh(geometry, mat);
      object.name = name;
      if (detail) object.userData.detailId = detail;
      parent.add(object);
      return object;
    };
    const line = (parent, name, coordinates, color, detail) => {
      const geometry = new THREE.BufferGeometry().setFromPoints(coordinates.map(p => new THREE.Vector3(...p)));
      const object = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color }));
      object.name = name;
      if (detail) object.userData.detailId = detail;
      parent.add(object);
      return object;
    };
    const prism = (points, depth) => {
      const shape = new THREE.Shape();
      shape.moveTo(points[0][0], points[0][1]);
      for (const [x, y] of points.slice(1)) shape.lineTo(x, y);
      shape.closePath();
      const geometry = new THREE.ExtrudeGeometry(shape, { depth, steps: 1, bevelEnabled: false, curveSegments: 1 });
      geometry.translate(0, 0, -depth / 2);
      return geometry;
    };

    const surface = group('Surface terrain', 'surface');
    const ground = mesh(surface, 'Quiet topsoil', new THREE.BoxGeometry(8, 0.075, 4.2), material(colors.ground));
    ground.position.y = 0.055;
    const footwall = group('Footwall rock volume', 'footwall');
    const hangingWall = group('Hanging wall rock volume', 'hanging-wall');
    const faultBottom = 3 * model.FAULT_DIP;
    mesh(footwall, 'Continuous left rock wedge', prism([[-4, 0], [0, 0], [faultBottom, -3], [-4, -3]], 4), material(colors.foot));
    mesh(hangingWall, 'Continuous right rock wedge', prism([[0, 0], [4, 0], [4, -3], [faultBottom, -3]], 4), material(colors.hanging));

    const strata = [
      { y: -0.55, color: 0xf1d9a2 },
      { y: -1.15, color: 0xa4674b },
      { y: -2.05, color: 0xe7bd73 }
    ];
    for (const layer of strata) {
      const seam = -layer.y * model.FAULT_DIP;
      const thick = 0.085;
      const left = mesh(footwall, `Footwall stratum ${layer.y}`, new THREE.BoxGeometry(seam + 4, thick, 0.06), material(layer.color));
      left.position.set((-4 + seam) / 2, layer.y, 2.035);
      const right = mesh(hangingWall, `Hanging stratum ${layer.y}`, new THREE.BoxGeometry(4 - seam, thick, 0.06), material(layer.color));
      right.position.set((4 + seam) / 2, layer.y, 2.035);
    }

    const markerLeft = line(footwall, 'Fixed half of the marker', [[-2.8, -0.18, 2.08], [-0.04, -0.18, 2.08]], colors.dark, 'strata-bend');
    markerLeft.userData.partId = 'marker-line';
    const markerRight = line(hangingWall, 'Moving half of the marker', [[0.04, -0.18, 2.08], [2.8, -0.18, 2.08]], colors.dark);
    markerRight.userData.partId = 'marker-line';
    const fault = group('Dipping fault plane', 'fault-plane');
    const faultPane = mesh(fault, 'Fault dipping toward +X', prism([[0, 0], [0.07, 0], [faultBottom + 0.07, -3], [faultBottom, -3]], 4.06), material(colors.rust, { side: THREE.DoubleSide, transparent: true, opacity: 0.82 }), 'fault-dip');
    faultPane.position.z = 0;
    const lock = mesh(fault, 'Local locked patch', new THREE.BoxGeometry(0.23, 0.52, 0.5), material(colors.dark), 'fault-locked');
    lock.position.set(0.65, -1.45, 0);
    lock.rotation.z = -0.42;

    const driverLeft = mesh(footwall, 'Compression arrow left', new THREE.ConeGeometry(0.16, 0.45, 8), material(colors.rust));
    driverLeft.position.set(-3.2, 0.35, -1.4);
    driverLeft.rotation.z = -Math.PI / 2;
    const driverRight = mesh(hangingWall, 'Compression arrow right', new THREE.ConeGeometry(0.16, 0.45, 8), material(colors.rust));
    driverRight.position.set(3.2, 0.35, -1.4);
    driverRight.rotation.z = Math.PI / 2;

    const anchors = {};
    const anchor = (name, position) => {
      const object = new THREE.Object3D();
      object.name = `${name} invariant anchor`;
      object.position.set(position.x, position.y, position.z);
      scene.add(object);
      anchors[name] = object;
      return object;
    };
    anchor('focus', model.FOCUS);
    anchor('epicenter', model.EPICENTER);
    for (const flag of model.FLAGS) anchor(flag.id, flag.position);
    const focus = group('Underground rupture origin', 'focus');
    focus.position.copy(anchors.focus.position);
    const focusNucleus = mesh(focus, 'Focus nucleus', new THREE.SphereGeometry(0.19, 12, 8), material(0xeb674d, { emissive: 0x691b0e }), 'focus-depth');
    focusNucleus.renderOrder = 5;
    const epicenter = group('Surface projection', 'epicenter');
    epicenter.position.copy(anchors.epicenter.position);
    const epicenterRing = mesh(epicenter, 'Epicenter surface ring', new THREE.TorusGeometry(0.24, 0.045, 6, 20), material(colors.rust));
    epicenterRing.rotation.x = -Math.PI / 2;
    const projection = line(epicenter, 'Vertical projection', [[0, 0, 0], [0, model.FOCUS.y, 0]], colors.rust, 'epicenter-projection');
    projection.visible = false;
    const candidates = group('A B C surface candidates', 'surface-candidates');
    const candidatePositions = { A: -1.5, B: model.EPICENTER.x, C: 3 };
    for (const [letter, x] of Object.entries(candidatePositions)) {
      const ring = mesh(candidates, 'Surface candidate ' + letter, new THREE.TorusGeometry(0.21, 0.05, 6, 16), material(letter === 'B' ? colors.amber : colors.waveP));
      ring.position.set(x, 0.14, 0);
      ring.rotation.x = -Math.PI / 2;
    }
    candidates.visible = false;

    const flags = {};
    const arrivalMarkers = {};
    for (const flag of model.FLAGS) {
      const flagGroup = group(`${flag.id} arrival flag`, `${flag.id}-flag`);
      flagGroup.position.copy(anchors[flag.id].position);
      const pole = mesh(flagGroup, `${flag.id} pole`, new THREE.CylinderGeometry(0.025, 0.025, 0.62, 6), material(colors.dark));
      pole.position.y = 0.31;
      const banner = mesh(flagGroup, `${flag.id} banner`, new THREE.BoxGeometry(0.32, 0.18, 0.035), material(flag.id === 'near' ? colors.waveP : colors.waveS), flag.id === 'far' ? 'flag-distance' : null);
      banner.position.set(0.16, 0.52, 0);
      arrivalMarkers[flag.id] = {};
      for (const [kind, x, color] of [['p', -0.11, colors.waveP], ['s', 0.11, colors.waveS]]) {
        const marker = mesh(flagGroup, flag.id + ' ' + kind.toUpperCase() + ' arrival', new THREE.SphereGeometry(0.095, 8, 6), material(color, { emissive: color }));
        marker.position.set(x, 0.74, 0);
        marker.visible = false;
        arrivalMarkers[flag.id][kind] = marker;
      }
      flags[flag.id] = flagGroup;
    }

    const waves = group('Travelling disturbance fronts', 'wavefront');
    const waveMat = color => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.25, wireframe: true, depthWrite: false });
    const pFront = mesh(waves, 'P wavefront shell', new THREE.SphereGeometry(1, 18, 12), waveMat(colors.waveP), 'p-front');
    const sFront = mesh(waves, 'S wavefront shell', new THREE.SphereGeometry(1, 18, 12), waveMat(colors.waveS));
    for (const front of [pFront, sFront]) { front.position.copy(anchors.focus.position); front.visible = false; }
    const particle = group('Tracked rock particle', 'particle');
    particle.position.set(model.TRACKED_POINT.x, model.TRACKED_POINT.y, model.TRACKED_POINT.z);
    const particleOrigin = mesh(particle, 'Stationary outline', new THREE.TorusGeometry(0.19, 0.025, 6, 16), new THREE.MeshBasicMaterial({ color: colors.dark }), 'particle-origin');
    particleOrigin.rotation.x = -Math.PI / 2;
    const tracked = mesh(particle, 'Amber tracked particle', new THREE.SphereGeometry(0.12, 10, 8), material(colors.amber));
    particleOrigin.renderOrder = 4;
    tracked.renderOrder = 5;

    function applyMotion(type, amount) {
      const motion = model.faultMotion(type, amount);
      hangingWall.position.set(motion.hangingWall.x, motion.hangingWall.y, motion.hangingWall.z);
      footwall.position.set(motion.footwall.x, motion.footwall.y, motion.footwall.z);
      driverLeft.rotation.set(0, 0, type === 'normal' ? Math.PI / 2 : -Math.PI / 2);
      driverRight.rotation.set(0, 0, type === 'normal' ? -Math.PI / 2 : Math.PI / 2);
      if (type === 'strike-slip') {
        driverLeft.rotation.set(Math.PI / 2, 0, 0);
        driverRight.rotation.set(-Math.PI / 2, 0, 0);
      }
    }

    function renderFault(state) {
      // Elastic bending is not fault slip: only the permanent offset moves a block.
      applyMotion('reverse', Math.min(1, state.slipOffset));
      const bend = Math.min(0.22, state.elasticStrain * 0.32);
      markerLeft.geometry.attributes.position.setY(1, -0.18 + bend);
      markerRight.geometry.attributes.position.setY(0, -0.18 + bend);
      markerLeft.geometry.attributes.position.needsUpdate = true;
      markerRight.geometry.attributes.position.needsUpdate = true;
    }
    function renderType(type, amount) {
      applyMotion(type, amount);
      markerLeft.geometry.attributes.position.setY(1, -0.18);
      markerRight.geometry.attributes.position.setY(0, -0.18);
      markerLeft.geometry.attributes.position.needsUpdate = true;
      markerRight.geometry.attributes.position.needsUpdate = true;
    }
    function renderFocus(selection) {
      projection.visible = selection === 'epicenter';
      candidates.visible = selection !== null;
    }
    function setCard(card) {
      focus.visible = card === 'focus-epicenter' || card === 'waves';
      epicenter.visible = card === 'focus-epicenter' || card === 'waves';
      particle.visible = card === 'waves';
      waves.visible = card === 'waves';
      for (const flag of Object.values(flags)) flag.visible = card === 'waves';
    }
    function renderWave(state) {
      for (const [kind, front] of [['p', pFront], ['s', sFront]]) {
        const radius = state.frontRadius[kind];
        front.visible = radius > 0.05 && (state.mode === 'combined' || state.mode === kind);
        front.scale.setScalar(Math.max(0.001, radius));
      }
      const p = model.particleOffset(state, 'p');
      const s = model.particleOffset(state, 's');
      const dx = model.TRACKED_POINT.x - model.FOCUS.x;
      const dy = model.TRACKED_POINT.y - model.FOCUS.y;
      const length = Math.hypot(dx, dy);
      const radial = state.mode === 's' ? 0 : p.radial;
      const transverse = state.mode === 'p' ? 0 : s.tangential;
      tracked.position.set((dx * radial - dy * transverse) / length, (dy * radial + dx * transverse) / length, 0);
      for (const flag of model.FLAGS) {
        const arrival = state.arrivalTicks[flag.id];
        for (const kind of ['p', 's']) arrivalMarkers[flag.id][kind].visible = (state.mode === 'combined' || state.mode === kind) && state.tick >= arrival[kind];
      }
    }
    function setCutaway(on) {
      ground.visible = !on;
      faultPane.material.opacity = on ? 0.12 : 0.82;
      faultPane.material.depthWrite = !on;
      faultPane.material.needsUpdate = true;
      lock.visible = !on;
      for (const rock of [footwall, hangingWall]) {
        rock.traverse(o => {
          if (!o.isMesh || !o.material || !o.material.isMeshStandardMaterial) return;
          o.material.transparent = !!on;
          o.material.opacity = on ? 0.18 : 1;
          o.material.depthWrite = !on;
          o.material.needsUpdate = true;
        });
      }
      for (const region of [focus, particle]) region.traverse(o => { if (o.isMesh) { o.material.depthTest = !on; o.material.needsUpdate = true; } });
    }
    function metrics() {
      let triangles = 0;
      let drawCalls = 0;
      scene.traverse(o => {
        if (!o.isMesh && !o.isLine) return;
        drawCalls++;
        if (!o.isMesh) return;
        const geometry = o.geometry;
        triangles += geometry.index ? geometry.index.count / 3 : geometry.attributes.position.count / 3;
      });
      return { triangles: Math.ceil(triangles), drawCalls };
    }
    function dispose() {
      scene.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          for (const mat of Array.isArray(o.material) ? o.material : [o.material]) mat.dispose();
        }
      });
    }
    return { root: scene, anchors, renderFault, renderType, renderFocus, renderWave, setCard, setCutaway, metrics, dispose };
  }

  root.EarthquakeGeometry = { createGeology };
})(typeof window !== 'undefined' ? window : globalThis);

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
      waveP: 0x43d0de, waveS: 0xb393f4, amber: 0xf7b547
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
    const footwall = group('Footwall rock volume', 'footwall');
    const hangingWall = group('Hanging wall rock volume', 'hanging-wall');
    const faultBottom = 3 * model.FAULT_DIP;
    const deformable = [];
    const remember = object => {
      deformable.push({ object, rest: Array.from(object.geometry.attributes.position.array) });
      return object;
    };
    remember(mesh(footwall, 'Continuous left rock wedge', prism([[-4, 0], [0, 0], [faultBottom, -3], [-4, -3]], 4), material(colors.foot)));
    remember(mesh(hangingWall, 'Continuous right rock wedge', prism([[0, 0], [4, 0], [4, -3], [faultBottom, -3]], 4), material(colors.hanging)));
    const ground = [footwall, hangingWall].map((parent, index) => {
      const soil = remember(mesh(parent, 'Topsoil follows its own block', new THREE.BoxGeometry(4, 0.075, 4.2, 12, 1, 1), material(colors.ground)));
      soil.position.set(index ? 2 : -2, 0.055, 0);
      return soil;
    });

    const strata = [
      { y: -0.55, color: 0xf1d9a2 },
      { y: -1.15, color: 0xa4674b },
      { y: -2.05, color: 0xe7bd73 }
    ];
    for (const layer of strata) {
      const seam = -layer.y * model.FAULT_DIP;
      const thick = 0.085;
      const left = remember(mesh(footwall, `Footwall stratum ${layer.y}`, new THREE.BoxGeometry(seam + 4, thick, 0.06, 12, 1, 1), material(layer.color)));
      left.position.set((-4 + seam) / 2, layer.y, 2.035);
      const right = remember(mesh(hangingWall, `Hanging stratum ${layer.y}`, new THREE.BoxGeometry(4 - seam, thick, 0.06, 12, 1, 1), material(layer.color)));
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

    const arrow = (name, position, color) => {
      const object = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(...position), 0.85, color, 0.25, 0.18);
      object.name = name; scene.add(object); return object;
    };
    const driverLeft = arrow('Remote loading left', [-3.2, 0.5, 1.25], colors.waveP);
    const driverRight = arrow('Remote loading right', [3.2, 0.5, 1.25], colors.waveP);
    const slipLeft = arrow('Relative slip left', [-1.8, -1.05, 2.3], colors.amber);
    const slipRight = arrow('Relative slip right', [2.5, -1.05, 2.3], colors.amber);

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
    anchor('marker', { x: -1.4, y: -0.18, z: 2.1 });
    anchor('lock', { x: 0.65, y: -1.45, z: 0 });
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

    const flags = {};
    const arrivalMarkers = {};
    const surfaceParticles = {};
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
      const point = mesh(flagGroup, flag.id + ' local surface rock', new THREE.SphereGeometry(0.1, 10, 8), material(colors.amber, { emissive: 0x523a0a }));
      point.position.y = 0.08;
      surfaceParticles[flag.id] = point;
      if (flag.id === 'near') anchors.surface = point;
    }

    const waves = group('Travelling disturbance fronts', 'wavefront');
    const waveMat = color => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false });
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
    anchors.particle = tracked;
    const particleP = arrow('P propagation direction', [model.TRACKED_POINT.x, model.TRACKED_POINT.y, model.TRACKED_POINT.z], colors.waveP);
    const particleS = arrow('S transverse direction', [model.TRACKED_POINT.x, model.TRACKED_POINT.y, model.TRACKED_POINT.z], colors.waveS);
    let activeCard = '', isCutaway = false;
    function deform(bend) {
      // A visible geometric proxy tied to the scalar spring state, not a 3D stress solver.
      for (const { object, rest } of deformable) {
        const positions = object.geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
          const x = rest[3 * i], y = rest[3 * i + 1];
          const across = x + object.position.x + model.FAULT_DIP * (y + object.position.y);
          const dy = bend * Math.exp(-across * across / 1.6);
          positions.setXYZ(i, x - model.FAULT_DIP * dy, y + dy, rest[3 * i + 2]);
        }
        positions.needsUpdate = true;
        object.geometry.computeVertexNormals();
      }
    }
    function setSource(point) {
      anchors.focus.position.set(point.x, point.y, point.z);
      anchors.epicenter.position.set(point.x, 0, point.z);
      focus.position.copy(anchors.focus.position);
      epicenter.position.copy(anchors.epicenter.position);
      projection.geometry.attributes.position.setY(1, point.y);
      projection.geometry.attributes.position.needsUpdate = true;
      for (const front of [pFront, sFront]) front.position.copy(anchors.focus.position);
    }

    function applyMotion(type, amount) {
      const motion = model.faultMotion(type, amount);
      hangingWall.position.set(motion.hangingWall.x, motion.hangingWall.y, motion.hangingWall.z);
      footwall.position.set(motion.footwall.x, motion.footwall.y, motion.footwall.z);
      const loading = type === 'strike-slip' ? new THREE.Vector3(0, 0, -1) : new THREE.Vector3(type === 'normal' ? -1 : 1, 0, 0);
      driverLeft.setDirection(loading);
      driverRight.setDirection(loading.clone().negate());
      slipLeft.visible = amount > 0 && type === 'strike-slip';
      slipRight.visible = amount > 0;
      slipLeft.setDirection(new THREE.Vector3(0, 0, -1));
      const rightDirection = new THREE.Vector3(motion.hangingWall.x, motion.hangingWall.y, motion.hangingWall.z);
      if (rightDirection.lengthSq()) slipRight.setDirection(rightDirection.normalize());
    }

    function renderFault(state) {
      // Elastic bending is not fault slip: only the permanent offset moves a block.
      applyMotion('reverse', Math.min(1, state.slipOffset));
      const bend = Math.min(0.35, state.elasticStrain * 0.7);
      deform(bend);
      lock.visible = isCutaway && state.phase === 'locked';
      markerLeft.geometry.attributes.position.setY(1, -0.18 + bend);
      markerRight.geometry.attributes.position.setY(0, -0.18 + bend);
      markerLeft.geometry.attributes.position.needsUpdate = true;
      markerRight.geometry.attributes.position.needsUpdate = true;
    }
    function renderType(type, amount) {
      applyMotion(type, amount);
      deform(0);
      markerLeft.geometry.attributes.position.setY(1, -0.18);
      markerRight.geometry.attributes.position.setY(0, -0.18);
      markerLeft.geometry.attributes.position.needsUpdate = true;
      markerRight.geometry.attributes.position.needsUpdate = true;
    }
    function renderFocus(selection) {
      projection.visible = selection === 'epicenter';
    }
    function setCard(card) {
      activeCard = card;
      driverLeft.visible = driverRight.visible = card === 'elastic-rebound' || card === 'fault-types';
      focus.visible = card === 'focus-epicenter' || card === 'waves';
      epicenter.visible = card === 'focus-epicenter' || card === 'waves';
      particle.visible = card === 'waves';
      waves.visible = card === 'waves';
      for (const flag of Object.values(flags)) flag.visible = card === 'waves';
    }
    function renderWave(state) {
      setSource(state.focus || model.FOCUS);
      for (const [kind, front] of [['p', pFront], ['s', sFront]]) {
        const radius = state.frontRadius[kind];
        front.visible = radius > 0.05 && radius < 6 && (state.mode === 'combined' || state.mode === kind);
        front.material.opacity = 0.12 * Math.min(1, Math.max(0, (6 - radius) / 2));
        front.scale.setScalar(Math.max(0.001, radius));
      }
      const movePoint = point => {
        const p = state.mode === 's' ? { x: 0, y: 0, z: 0 } : model.particleDisplacement(state, point, 'p');
        const s = state.mode === 'p' ? { x: 0, y: 0, z: 0 } : model.particleDisplacement(state, point, 's');
        return new THREE.Vector3(p.x + s.x, p.y + s.y, p.z + s.z);
      };
      tracked.position.copy(movePoint(model.TRACKED_POINT));
      const source = state.focus || model.FOCUS;
      const direction = new THREE.Vector3(model.TRACKED_POINT.x - source.x, model.TRACKED_POINT.y - source.y, model.TRACKED_POINT.z - source.z).normalize();
      particleP.setDirection(direction);
      particleS.setDirection(new THREE.Vector3(-direction.y, direction.x, 0).normalize());
      particleP.visible = activeCard === 'waves' && state.mode === 'p';
      particleS.visible = activeCard === 'waves' && state.mode === 's';
      for (const flag of model.FLAGS) {
        const arrival = state.arrivalTicks[flag.id];
        surfaceParticles[flag.id].position.copy(movePoint(flag.position));
        surfaceParticles[flag.id].position.y += 0.08;
        for (const kind of ['p', 's']) arrivalMarkers[flag.id][kind].visible = (state.mode === 'combined' || state.mode === kind) && state.tick >= arrival[kind];
      }
    }
    function setCutaway(on) {
      isCutaway = on;
      for (const soil of ground) soil.visible = !on;
      faultPane.material.opacity = on ? 0.12 : 0.82;
      faultPane.material.depthWrite = !on;
      faultPane.material.needsUpdate = true;
      lock.visible = false;
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
    return { root: scene, anchors, renderFault, renderType, renderFocus, renderWave, setSource, setCard, setCutaway, metrics, dispose };
  }

  root.EarthquakeGeometry = { createGeology };
})(typeof window !== 'undefined' ? window : globalThis);

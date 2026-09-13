/* Original picture-book cabin geometry. Forward is -X; dimensions are schematic. */
(function () {
  'use strict';
  window.BookTrainInteriors = { create: function (T) {
    const assemblies = [], batches = new Map();
    const palette = {
      blue: 0x47779e, deep: 0x294e70, head: 0xf8f2df, cream: 0xe4d8be,
      metal: 0x9aaab2, dark: 0x354c5b, floor: 0x929fa6, aisle: 0x697f90,
      screen: 0x72bace, green: 0x8cb77c, orange: 0xe9aa67, light: 0xfff6cb
    };
    const materials = {};
    Object.keys(palette).forEach(k => materials[k] = new T.MeshStandardMaterial({
      color: palette[k], roughness: k === 'metal' ? .48 : .83, metalness: k === 'metal' ? .25 : 0
    }));
    function assembly(id, region, center, radius, ids) {
      const a = {id, region, group: new T.Group(), exterior: new T.Group(), interior: new T.Group(), ghost: new T.Group(), details: {}, center: new T.Vector3(...center), radius};
      a.group.name = id;
      a.group.add(a.exterior, a.interior, a.ghost);
      a.interior.visible = a.ghost.visible = false;
      a.group.userData = {region, assemblyId: id};
      ids.forEach(detail => {
        const g = new T.Group(); g.name = detail; g.userData = {region, assemblyId: id, detail};
        a.interior.add(g); a.details[detail] = g;
      });
      assemblies.push(a); return a;
    }
    const seats = assembly('seats', 'seats', [1,.35,0], 5.9, ['seats.cushion','seats.back']);
    const cab = assembly('cab', 'cab', [-6.8,.4,0], 1.6, ['cab.seat','cab.desk','cab.displays']);
    const roof = assembly('roof', 'roof', [1,1.45,0], 6, ['roof.unit','roof.duct']);
    const body = assembly('cabin-body', 'body', [0,.45,0], 8, ['body.skin','body.floor','body.luggage']);

    // Batch equal-material pieces within a detail/layer. All vertices remain in train coordinates.
    function piece(a, detail, color, geometry, p, rot, outside) {
      geometry = geometry.index ? geometry.toNonIndexed() : geometry;
      const matrix = new T.Matrix4().compose(new T.Vector3(...p), new T.Quaternion().setFromEuler(new T.Euler(...(rot || [0,0,0]))), new T.Vector3(1,1,1));
      geometry.applyMatrix4(matrix);
      const key = [a.id, detail, color, outside ? 'outside' : 'inside'].join('|');
      if (!batches.has(key)) batches.set(key, {a, detail, color, outside, geometries: []});
      batches.get(key).geometries.push(geometry);
    }
    function rounded(w,h,d,r) {
      const g = new T.BoxGeometry(w,h,d,2,2,2), pos = g.attributes.position;
      const inner = [w/2-r,h/2-r,d/2-r];
      for (let i=0;i<pos.count;i++) {
        const v = new T.Vector3(pos.getX(i),pos.getY(i),pos.getZ(i));
        const c = new T.Vector3(Math.max(-inner[0],Math.min(inner[0],v.x)),Math.max(-inner[1],Math.min(inner[1],v.y)),Math.max(-inner[2],Math.min(inner[2],v.z)));
        v.sub(c).normalize().multiplyScalar(r).add(c); pos.setXYZ(i,v.x,v.y,v.z);
      }
      g.computeVertexNormals(); return g;
    }
    function box(a,id,c,p,s,r=0,rot=null,out=false) {piece(a,id,c,r ? rounded(...s,r) : new T.BoxGeometry(...s),p,rot,out);}
    function rod(a,id,c,start,end,r=.025) {
      const from = new T.Vector3(...start), to = new T.Vector3(...end), v = to.clone().sub(from);
      const geo = new T.CylinderGeometry(r,r,v.length(),8);
      geo.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),v.normalize()));
      piece(a,id,c,geo,from.add(to).multiplyScalar(.5).toArray());
    }
    // Eight rows, two seats on each side; the central aisle stays completely clear.
    for (let row=0;row<8;row++) for (const z of [-.87,-.47,.47,.87]) {
      const x = -4.15 + row*1.42;
      for (const out of [true,false]) {
        box(seats,'seats.cushion','blue',[x,.015,z],[.55,.17,.36],.065,null,out);
        box(seats,'seats.back','deep',[x+.24,.44,z],[.145,.81,.38],.065,[0,0,-.09],out);
        box(seats,'seats.back','blue',[x+.155,.44,z],[.075,.65,.31],.035,[0,0,-.09],out);
        box(seats,'seats.back','head',[x+.12,.735,z],[.052,.19,.29],.025,[0,0,-.09],out);
        for (const side of [-1,1]) box(seats,'seats.cushion','cream',[x+.015,.23,z+side*.182],[.45,.065,.045],.02,null,out);
        box(seats,'seats.cushion','metal',[x+.08,-.195,z],[.12,.27,.16],.018,null,out);
        box(seats,'seats.cushion','dark',[x+.04,-.322,z],[.41,.045,.28],.015,null,out);
      }
      // Revealed structural ribs behind the fabric on the rear face.
      for (const y of [.23,.41,.59]) box(seats,'seats.back','metal',[x+.325,y,z],[.032,.03,.27]);
    }
    box(body,'body.floor','floor',[.05,-.4,0],[15.35,.10,2.18]);
    box(body,'body.floor','aisle',[.9,-.343,0],[11.65,.015,.47]);
    for(const z of [-.82,.82]) box(body,'body.floor','metal',[.1,-.52,z],[15.15,.13,.075]);
    for(let x=-7.2;x<7.3;x+=1.42) box(body,'body.floor','metal',[x,-.53,0],[.07,.14,2.08]);
    // Wall-hugging rings: vertical wall sections and short sloped roof shoulders.
    for(let x=-4.85;x<7;x+=1.42) {
      for(const s of [-1,1]) {
        rod(body,'body.skin','cream',[x,-.34,s*1.075],[x,1.02,s*1.075],.038);
        rod(body,'body.skin','cream',[x,1.02,s*1.075],[x,1.49,s*.82],.038);
        rod(body,'body.skin','cream',[x,1.49,s*.82],[x,1.59,s*.4],.038);
      }
      rod(body,'body.skin','cream',[x,1.59,-.4],[x,1.59,.4],.038);
    }
    for(const s of [-1,1]) {
      box(body,'body.skin','cream',[1,1.02,s*1.08],[11.7,.055,.055]);
      box(body,'body.luggage','cream',[.95,1.12,s*.865],[11.6,.075,.43],.025);
      box(body,'body.luggage','metal',[.95,1.195,s*.647],[11.6,.045,.025],.012);
      for(let x=-4.5;x<6.5;x+=1.42) rod(body,'body.luggage','cream',[x,1.15,s*.66],[x,1.41,s*1.025],.022);
      box(roof,'roof.duct','cream',[.95,1.49,s*.61],[11.6,.13,.3],.04);
      box(roof,'roof.duct','light',[.95,1.413,s*.43],[11.5,.025,.055],.009);
      for(let x=-4.2;x<6.5;x+=.71) box(roof,'roof.duct','dark',[x,1.418,s*.67],[.21,.015,.095],.007);
    }
    box(roof,'roof.unit','cream',[1.6,1.68,0],[2.7,.13,.7],.055);
    for(const x of [.85,2.35]) {
      piece(roof,'roof.unit','metal',new T.CylinderGeometry(.26,.26,.025,20),[x,1.758,0]);
      for(let k=0;k<4;k++) box(roof,'roof.unit','dark',[x,1.777,0],[.44,.012,.035],.005,[0,k*Math.PI/4,0]);
    }
    // A compact blue chair faces the tapered nose (-X).
    box(cab,'cab.seat','dark',[-6.13,-.15,0],[.25,.35,.25],.025);
    box(cab,'cab.seat','metal',[-6.13,-.32,0],[.65,.045,.62],.02);
    box(cab,'cab.seat','blue',[-6.17,.09,0],[.64,.19,.64],.07);
    box(cab,'cab.seat','deep',[-5.87,.55,0],[.16,.92,.66],.07,[0,0,-.08]);
    box(cab,'cab.seat','blue',[-5.94,.99,0],[.15,.23,.45],.05);
    for(const z of [-.35,.35]) box(cab,'cab.seat','cream',[-6.14,.36,z],[.5,.075,.07],.025);
    box(cab,'cab.desk','dark',[-7.12,.015,0],[.8,.69,1.67],.075);
    box(cab,'cab.desk','metal',[-7.12,.42,0],[.98,.12,1.9],.05);
    box(cab,'cab.desk','dark',[-7.4,.65,0],[.18,.43,1.78],.035,[0,0,.32]);
    for(const z of [-.55,0,.55]) {
      box(cab,'cab.displays','deep',[-7.278,.685,z],[.045,.30,.44],.018,[0,0,.32]);
      box(cab,'cab.displays','screen',[-7.25,.69,z],[.013,.237,.356],.008,[0,0,.32]);
      for(let j=0;j<3;j++) box(cab,'cab.displays',j===0?'light':'green',[-7.238,.64+j*.055,z-.08+j*.04],[.009,.022,.10],.002,[0,0,.32]);
    }
    for (const z of [-.7,.7]) {
      box(cab,'cab.desk','deep',[-6.91,.50,z],[.23,.04,.20],.012);
      rod(cab,'cab.desk','dark',[-6.91,.5,z],[-6.97,.7,z],.025);
      box(cab,'cab.desk','dark',[-6.97,.7,z],[.08,.065,.16],.026);
    }
    for(let i=0;i<7;i++) box(cab,'cab.desk',i%3===0?'orange':'green',[-6.82,.49,-.43+i*.14],[.065,.025,.065],.013);

    batches.forEach(b => {
      const length = b.geometries.reduce((n,g)=>n+g.attributes.position.array.length,0);
      const positions = new Float32Array(length), normals = new Float32Array(length); let offset=0;
      b.geometries.forEach(g=>{positions.set(g.attributes.position.array,offset);normals.set(g.attributes.normal.array,offset);offset+=g.attributes.position.array.length;g.dispose();});
      const g = new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(positions,3));g.setAttribute('normal',new T.BufferAttribute(normals,3));g.computeBoundingSphere();
      const mesh = new T.Mesh(g,materials[b.color]); mesh.name=b.detail+'-'+b.color;
      mesh.userData={region:b.a.region,assemblyId:b.a.id,detail:b.detail};mesh.castShadow=true;mesh.receiveShadow=true;
      (b.outside?b.a.exterior:b.a.details[b.detail]).add(mesh);
    });
    return {assemblies, update: function () { /* Cabin geometry remains fixed in the train frame. */ }};
  }};
})();

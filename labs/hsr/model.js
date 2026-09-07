/* A generic high-speed leading carriage. X is length, nose points to -X. */
window.buildLabModel = ({T,addPart,mesh,mat,sphere,box,panel,model,scene}) => {
  const c={white:'#f5f8f6',silver:'#ccd9de',blue:'#23658f',gold:'#ddb95c',glass:'#183e56',steel:'#647883',dark:'#344958',seat:'#397e9c',warm:'#e9d8b0',orange:'#d79556'};
  const metal=color=>mat(color,{metalness:0.48,roughness:0.32});
  // Each cross-section is [x, centreY, halfHeight, halfWidth]. Smoothly rounded,
  // superellipse sections give the head its flattened beak and broad shoulders.
  function shell(g,rings,start=0,end=Math.PI*2,color=c.white,power=0.72) {
    const pos=[],idx=[],steps=56;
    rings.forEach(([x,y,h,w])=>{
      for(let j=0;j<=steps;j++) {
        const a=start+(end-start)*j/steps,co=Math.cos(a),si=Math.sin(a);
        pos.push(x,y+h*Math.sign(co)*Math.pow(Math.abs(co),power),w*Math.sign(si)*Math.pow(Math.abs(si),power));
      }
    });
    for(let i=0;i<rings.length-1;i++) for(let j=0;j<steps;j++) {
      const a=i*(steps+1)+j,b=a+steps+1; idx.push(a,b,a+1,b,b+1,a+1);
    }
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setIndex(idx);geo.computeVertexNormals();
    return mesh(g,geo,mat(color,{side:T.DoubleSide,roughness:0.28}));
  }
  function rounded(g,pos,size,color,r=.08) {
    const [w,h,d]=size,s=new T.Shape(),x=-w/2,y=-h/2;
    r=Math.min(r,w/2-.001,h/2-.001);
    s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);
    s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);
    s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);
    const geo=new T.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,curveSegments:5});geo.translate(0,0,-d/2);
    return mesh(g,geo,mat(color),pos);
  }
  function rod(g,a,b,r,color) {
    const from=new T.Vector3(...a),to=new T.Vector3(...b),delta=to.clone().sub(from);
    const m=mesh(g,new T.CylinderGeometry(r,r,delta.length(),12),metal(color),from.add(to).multiplyScalar(.5).toArray());
    m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return m;
  }
  const body=addPart('body',[0,0,0],[0,0,0],[-3.85,.15,.5]);
  const head=[[-5.28,-.35,.02,.035],[-5.20,-.32,.15,.25],[-4.98,-.27,.24,.43],[-4.65,-.20,.33,.59],[-4.25,-.1,.46,.70],[-3.85,.06,.64,.8],[-3.45,.19,.78,.88],[-3.05,.27,.86,.92],[-2.55,.29,.9,.94]];
  shell(body,head);
  // Lower shell stays below the window openings; interior really is hollow.
  shell(body,[[-2.55,.29,.90,.94],[3.92,.29,.90,.94],[4.15,.29,.87,.91],[4.32,.29,.83,.87]],Math.PI/2,Math.PI*1.5);
  box(body,[.80,-.48,0],[6.98,.13,1.69],c.silver);
  for(const z of [-.936,.936]) {
    box(body,[.80,.15,z],[6.98,.35,.065],c.white);
    box(body,[.80,.28,z*1.017],[6.98,.095,.024],c.blue);
    box(body,[.80,.355,z*1.017],[6.98,.028,.026],c.gold);
    // Window pillars and continuous upper rails frame open apertures.
    for(const x of [-2.49,-1.59,-.69,.21,1.11,2.01,2.91,4.2]) box(body,[x,.78,z],[.14,.85,.065],c.white);
    box(body,[.81,1.20,z*.984],[6.98,.14,.075],c.white);
    box(body,[3.48,1.10,z],[.87,.18,.065],c.white);
    box(body,[3.47,-.35,z],[.87,.14,.07],c.white);
  }
  // A narrow blue/gold sweep follows the nose rather than a rectangular decal.
  for(const side of [-1,1]) {
    for(let i=2;i<head.length-1;i++) {
      const a=head[i],b=head[i+1];rod(body,[a[0],a[1]-.07,side*a[3]*1.002],[b[0],b[1]-.07,side*b[3]*1.002],.032,c.blue);
    }
    sphere(body,[-4.65,-.075,side*.53],[.23,.055,.06],c.glass);
    sphere(body,[-4.69,-.057,side*.55],[.14,.025,.035],'#fff2c2');
  }
  // Flat rear bulkhead, rounded by a slim end collar; rear vestibule window.
  rounded(body,[4.29,.24,0],[1.72,1.7,.07],c.white,.27).rotation.y=Math.PI/2;
  rounded(body,[4.34,.38,0],[.63,1.27,.045],c.dark,.12).rotation.y=Math.PI/2;
  rounded(body,[4.37,.42,0],[.42,.91,.04],c.silver,.08).rotation.y=Math.PI/2;

  const cab=addPart('cab',[0,0,0],[-1.25,1.45,0],[-3.53,.93,.24]);
  // Sloping windshield conforms to the tapered shoulder of the aerodynamic head.
  const windshield=new T.BufferGeometry();
  windshield.setAttribute('position',new T.Float32BufferAttribute([-3.98,.665,-.49,-3.98,.665,.49,-3.35,1.025,.62,-3.35,1.025,-.62],3));
  windshield.setIndex([0,1,2,0,2,3]);windshield.computeVertexNormals();
  mesh(cab,windshield,mat(c.glass,{side:T.DoubleSide,roughness:.19,metalness:.3}));
  rod(cab,[-3.98,.678,0],[-3.35,1.04,0],.018,c.silver);
  rod(cab,[-3.86,.75,.10],[-3.62,.87,.42],.014,c.dark);
  rod(cab,[-3.86,.75,-.10],[-3.62,.87,-.42],.014,c.dark);
  for(const z of [-.897,.897]) {
    const p=panel(cab,[[-3.18,.68],[-2.74,.70],[-2.74,1.05],[-3.15,1.01]],.025,c.glass,'xy');p.position.z=z;
  }

  const roof=addPart('roof',[0,0,0],[0,2.40,0],[.3,1.34,.15]);
  shell(roof,[[-2.56,1.15,.04,.94],[-2.20,1.15,.20,.94],[3.94,1.15,.20,.94],[4.19,1.12,.20,.91],[4.32,1.09,.19,.87]],-Math.PI/2,Math.PI/2);
  // Roof hardware stays with the removable shell, while the collector is separate.
  rounded(roof,[.45,1.40,0],[1.65,.13,.95],c.silver,.06);
  for(let x=-.19;x<1.08;x+=.16) box(roof,[x,1.474,0],[.055,.017,.78],c.steel);
  for(const z of [-.78,.78]) rod(roof,[-2.1,1.285,z],[4.08,1.285,z],.013,c.silver);

  for(const side of [-1,1]) {
    const win=addPart('windows',[0,0,0],[0,.85,side*1.85],[.18,.78,side*.98]);
    for(let i=0;i<6;i++) {
      const x=-2.04+i*.90;
      rounded(win,[x,.79,side*.973],[.76,.57,.042],c.dark,.09);
      rounded(win,[x,.80,side*1.000],[.66,.47,.017],c.glass,.065);
      rounded(win,[x-.12,.94,side*1.014],[.29,.035,.008],'#5c8da6',.015);
    }
  }

  const seats=addPart('seats',[0,0,0],[0,.30,-3.25],[.2,.35,0]);
  box(seats,[.31,-.378,0],[5.57,.085,1.67],c.warm);
  box(seats,[.31,-.329,0],[5.49,.015,.29],'#c2b28c');
  for(let row=0;row<6;row++) for(const z of [-.65,-.33,.33,.65]) {
    const x=-1.96+row*.9;
    rounded(seats,[x,-.09,z],[.46,.12,.275],c.seat,.045);
    rounded(seats,[x+.20,.15,z],[.115,.53,.275],c.seat,.04);
    rounded(seats,[x+.137,.34,z],[.023,.13,.22],'#f4efdf',.011);
    box(seats,[x,-.26,z],[.095,.23,.075],c.steel);
    for(const dz of [-.147,.147]) box(seats,[x,.075,z+dz],[.34,.06,.035],c.silver);
  }

  for(const side of [-1,1]) {
    const door=addPart('doors',[3.48,0,side*.952],[1.3,.35,side*2.2],[0,.42,side*.08]);
    rounded(door,[0,.33,0],[.79,1.40,.075],c.gold,.10);
    rounded(door,[0,.33,side*.047],[.68,1.30,.037],c.white,.07);
    rounded(door,[0,.71,side*.072],[.37,.49,.025],c.glass,.065);
    box(door,[.255,.15,side*.087],[.032,.13,.025],c.blue);
    sphere(door,[.25,.32,side*.095],[.032,.032,.012],'#5ba698');
    box(door,[0,-.425,side*.025],[.75,.055,.20],c.steel);
    box(door,[0,.04,side*.077],[.68,.08,.024],c.blue);
  }

  for(const bx of [-2.45,2.73]) {
    const bogie=addPart('bogies',[bx,-1.09,0],[0,0,2.15],[0,-.03,.93]);
    for(const z of [-.56,.56]) rounded(bogie,[0,.05,z],[1.54,.25,.16],c.steel,.065);
    box(bogie,[0,.12,0],[.48,.18,1.14],c.dark);
    for(const x of [-.51,.51]) {
      rod(bogie,[x,-.12,-.82],[x,-.12,.82],.075,c.silver);
      for(const side of [-1,1]) {
        const wheel=mesh(bogie,new T.CylinderGeometry(.36,.36,.15,36),metal(c.steel),[x,-.12,side*.78]);wheel.rotation.x=Math.PI/2;
        const flange=mesh(bogie,new T.CylinderGeometry(.39,.39,.032,36),metal(c.dark),[x,-.12,side*.696]);flange.rotation.x=Math.PI/2;
        const hub=mesh(bogie,new T.CylinderGeometry(.14,.14,.018,24),metal(c.silver),[x,-.12,side*.868]);hub.rotation.x=Math.PI/2;
        for(let y=.21;y<.4;y+=.065) {
          const spring=mesh(bogie,new T.TorusGeometry(.085,.022,6,14),metal(c.silver),[x,y,side*.48]);spring.rotation.x=Math.PI/2;
        }
      }
    }
    const motors=addPart('motors',[bx,-1.0,0],[-.6,-.35,-2.05],[.12,0,.18]);
    for(const x of [-.24,.24]) {
      const motor=mesh(motors,new T.CylinderGeometry(.20,.20,.61,24),metal(c.orange),[x,0,0]);motor.rotation.x=Math.PI/2;
      for(const z of [-.23,0,.23]) {
        const band=mesh(motors,new T.CylinderGeometry(.207,.207,.035,24),metal(c.steel),[x,0,z]);band.rotation.x=Math.PI/2;
      }
      rounded(motors,[x<0?-.45:.45,-.04,.38],[.27,.31,.19],c.gold,.04);
      rod(motors,[x,0,.26],[x<0?-.51:.51,-.21,.38],.055,c.steel);
    }
  }

  const panto=addPart('pantograph',[2.53,1.40,0],[.60,2.75,0],[0,.83,0]);
  for(const x of [-.46,.46]) for(const z of [-.33,.33]) {
    rod(panto,[x,-.015,z],[x,.15,z],.056,c.warm);
    for(const y of [.03,.08,.13]) {const ins=mesh(panto,new T.TorusGeometry(.069,.018,6,12),mat(c.warm),[x,y,z]);ins.rotation.x=Math.PI/2;}
  }
  box(panto,[0,.15,0],[1.18,.08,.80],c.steel);
  for(const z of [-.26,.26]) {
    rod(panto,[-.43,.19,z],[.35,.79,z],.045,c.gold);
    rod(panto,[.35,.79,z],[-.22,1.37,z],.033,c.steel);
    sphere(panto,[.35,.79,z],[.065,.065,.065],c.dark);
  }
  rod(panto,[-.22,1.37,-.62],[-.22,1.37,.62],.037,c.steel);
  box(panto,[-.22,1.42,0],[.19,.052,1.18],c.dark);
  rod(panto,[-.22,1.37,-.62],[-.22,1.25,-.78],.023,c.steel);
  rod(panto,[-.22,1.37,.62],[-.22,1.25,.78],.023,c.steel);

  const coupler=addPart('coupler',[4.35,-.61,0],[1.9,-.12,0],[.46,0,0]);
  box(coupler,[.21,0,0],[.54,.15,.19],c.steel);
  rounded(coupler,[.49,.01,0],[.23,.33,.37],c.dark,.07);
  rod(coupler,[.49,.01,-.22],[.49,.01,.22],.046,c.silver);
  sphere(coupler,[.61,.01,0],[.075,.075,.10],c.gold);

  // Stationary display infrastructure: deliberately outside model/addPart/mesh,
  // so rails cannot be picked, highlighted, labelled or exploded with the train.
  const track=new T.Group();track.name='hsr-display-track';scene.add(track);
  function trackBox(position,size,color,metalness=0) {
    const m=new T.Mesh(new T.BoxGeometry(...size),mat(color,{roughness:.72,metalness}));
    m.position.set(...position);m.receiveShadow=true;m.castShadow=true;track.add(m);
  }
  for(let i=0;i<22;i++) trackBox([-5.51+i*.525,-1.676,0],[.16,.04,2.10],'#a5a698');
  for(const z of [-.80,.80]) {
    trackBox([0,-1.651,z],[11.5,.009,.145],'#899897',.35);
    trackBox([0,-1.633,z],[11.5,.032,.030],'#788b91',.40);
    trackBox([0,-1.611,z],[11.5,.019,.095],'#a6b4b6',.55);
  }
};

window.buildLabModel = ({T,addPart,mesh,mat,sphere,box}) => {
  // X is length; the conventional bus points toward -X. Passenger entry is on -Z.
  const C={yellow:'#efbe3d',light:'#f7d35b',gold:'#db9f23',ink:'#293c45',glass:'#436877',steel:'#7f929b',seat:'#388d79',belt:'#e69a4a',rubber:'#2d3940'};
  const round=(g,p,s,c,r=.08,opts={})=>{
    const [w,h,d]=s,rr=Math.min(r,w/2,h/2),a=-w/2,b=-h/2;
    const q=new T.Shape();q.moveTo(a+rr,b);q.lineTo(a+w-rr,b);q.quadraticCurveTo(a+w,b,a+w,b+rr);
    q.lineTo(a+w,b+h-rr);q.quadraticCurveTo(a+w,b+h,a+w-rr,b+h);q.lineTo(a+rr,b+h);q.quadraticCurveTo(a,b+h,a,b+h-rr);q.lineTo(a,b+rr);q.quadraticCurveTo(a,b,a+rr,b);
    const geo=new T.ExtrudeGeometry(q,{depth:d,bevelEnabled:true,bevelSize:.018,bevelThickness:.018,bevelSegments:2,curveSegments:6,steps:1});geo.translate(0,0,-d/2);
    return mesh(g,geo,mat(c,opts),p);
  };
  const rod=(g,a,b,r,c)=>{
    const start=new T.Vector3(...a),end=new T.Vector3(...b),delta=end.clone().sub(start);
    const m=mesh(g,new T.CylinderGeometry(r,r,delta.length(),10),mat(c),start.add(end).multiplyScalar(.5).toArray());
    m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return m;
  };
  const cyl=(g,p,r,d,c)=>{const m=mesh(g,new T.CylinderGeometry(r,r,d,32),mat(c),p);m.rotation.x=Math.PI/2;return m;};
  const glass=(g,p,s)=>round(g,p,s,C.glass,.045,{roughness:.18,metalness:.2});
  const label=(g,text,p,size,color,bg,rotateY=0)=>{
    // Local canvas texture only; every sign remains attached to its selectable part.
    if(typeof document==='undefined')return;
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const ctx=canvas.getContext('2d');
    ctx.fillStyle=bg;ctx.fillRect(0,0,512,128);ctx.fillStyle=color;ctx.font='bold 72px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,69);
    const tex=new T.CanvasTexture(canvas);if(T.SRGBColorSpace)tex.colorSpace=T.SRGBColorSpace;
    const m=mesh(g,new T.PlaneGeometry(size[0],size[1]),mat('#ffffff',{map:tex,roughness:.7}),p);m.rotation.y=rotateY;
  };

  // Two genuine windowed side walls. Their lower edge curves over the rear wheel.
  for(const side of [-1,1]){
    const wall=addPart('body',[0,0,side*1.34],[0,.1,side*3.25],[.9,.52,0]);
    const wallStart=side<0?-1.18:-2.4;
    const shape=new T.Shape();shape.moveTo(wallStart,.42);shape.lineTo(3.86,.42);shape.lineTo(3.86,-.84);shape.lineTo(3.40,-.84);
    shape.absarc(2.55,-1.08,.88,.276,Math.PI-.276,false);shape.lineTo(wallStart,-.84);shape.closePath();
    const geo=new T.ExtrudeGeometry(shape,{depth:.14,bevelEnabled:true,bevelSize:.035,bevelThickness:.025,bevelSegments:2,steps:1});geo.translate(0,0,-.07);
    mesh(wall,geo,mat(C.yellow));
    round(wall,[.73,1.65,0],[6.27,.19,.16],C.yellow);
    for(let i=0;i<6;i++){
      const x=-1.61+i*.94;
      // The entry opening occupies the front passenger-side bay.
      if(side<0&&i===0)continue;
      glass(wall,[x,1.03,side*.007],[.79,1.0,.105]);
      box(wall,[x,1.10,side*.066],[.80,.045,.027],C.steel);
      box(wall,[x-.44,1.02,0],[.085,1.2,.16],C.yellow);
    }
    box(wall,[3.77,.98,0],[.18,1.22,.18],C.yellow);
    box(wall,[-2.34,1.03,0],[.16,1.22,.18],C.yellow);
    for(const y of [.26,-.09])box(wall,[(wallStart+3.84)/2,y,side*.09],[3.84-wallStart,.09,.045],C.ink);
    for(const x of [-1.15,1.08,3.45])round(wall,[x,-.49,side*.11],[.13,.10,.025],'#efaa35',.025);
    // Rubber wheel-arch trim follows the actual cutout.
    mesh(wall,new T.TorusGeometry(.88,.055,8,36,Math.PI),mat(C.ink),[2.55,-1.08,side*.10]);
    if(side>0){
      rod(wall,[-1.75,.27,.1],[-1.75,.27,.68],.045,C.steel);
      const stop=mesh(wall,new T.CylinderGeometry(.36,.36,.085,8),mat('#d85343'),[-1.75,.4,.71]);stop.rotation.x=Math.PI/2;stop.rotation.z=Math.PI/8;
      label(wall,'STOP',[-1.75,.4,.759],[.51,.16],'#ffffff','#d85343');
    }
  }

  const ends=addPart('body',[0,0,0],[.9,.15,0],[3.8,.9,0]);
  round(ends,[3.83,.4,0],[.17,2.51,2.68],C.yellow,.08);
  // Rear emergency exit is a visibly outlined panel, with its own window and handle.
  round(ends,[3.932,.39,0],[.028,2.09,1.17],C.ink,.015);
  round(ends,[3.953,.39,0],[.025,1.99,1.07],C.yellow,.012);
  glass(ends,[3.978,1.00,0],[.035,.70,.91]);
  box(ends,[3.997,.35,-.31],[.06,.045,.24],C.ink);
  for(const z of [-1.05,1.05]){
    glass(ends,[3.947,1.02,z],[.04,.87,.65]);
    for(const y of [-.32,.01]){const light=cyl(ends,[3.95,y,z],.11,.065,y<0?'#d45143':'#f0a239');light.rotation.set(0,0,Math.PI/2);}
  }
  round(ends,[3.98,-.88,0],[.22,.24,2.95],C.ink);
  const front=addPart('body',[-2.38,0,0],[-1.4,.5,0],[0,1,0]);
  round(front,[0,.16,0],[.17,.45,2.70],C.yellow);
  for(const z of [-.66,.66])glass(front,[-.075,1.02,z],[.11,1.13,1.22]);
  box(front,[-.15,1.02,0],[.07,1.28,.065],C.ink);
  for(const z of [-.61,.61])rod(front,[-.18,.61,z-.3],[-.18,.89,z+.25],.018,C.ink);

  const hood=addPart('body',[-3.30,-.05,0],[-1.6,2,0],[-.4,.59,0]);
  // Three separate hood panels leave an engine cavity rather than a solid block.
  round(hood,[-.10,.56,0],[1.72,.16,1.90],C.yellow,.07);
  for(const s of [-1,1])round(hood,[-.10,.2,s*.90],[1.72,.59,.16],C.yellow,.12);
  round(hood,[-.96,.13,0],[.16,.86,1.96],C.yellow);
  round(hood,[-1.062,.15,0],[.04,.57,1.05],C.ink,.018);
  for(let i=0;i<6;i++)box(hood,[-1.09,-.065+i*.09,0],[.027,.025,.91],C.steel);
  for(const s of [-1,1]){
    const lamp=cyl(hood,[-1.08,.22,s*.75],.15,.06,'#fff2bf');lamp.rotation.set(0,0,Math.PI/2);
    mesh(hood,new T.TorusGeometry(.84,.12,10,36,Math.PI),mat(C.yellow),[.52,-1.03,s*1.36]);
  }
  round(hood,[-1.1,-.65,0],[.22,.24,2.98],C.ink);

  const roof=addPart('roof',[.74,1.80,0],[0,3.35,0],[0,.25,0]);
  // Soft, low arched roof profile, extruded along X.
  const cap=new T.Shape();cap.moveTo(-1.4,0);cap.quadraticCurveTo(-1.42,.35,-.95,.43);cap.quadraticCurveTo(0,.55,.95,.43);cap.quadraticCurveTo(1.42,.35,1.4,0);cap.lineTo(-1.4,0);
  const roofGeo=new T.ExtrudeGeometry(cap,{depth:6.39,bevelEnabled:true,bevelSize:.055,bevelThickness:.055,bevelSegments:3,curveSegments:16,steps:1});roofGeo.translate(0,0,-3.195);roofGeo.rotateY(Math.PI/2);
  mesh(roof,roofGeo,mat(C.light));
  for(const x of [-2.95,2.95]){
    round(roof,[x,.07,0],[.14,.28,2.30],C.yellow,.03);
    for(const z of [-1.00,-.70,.70,1.00]){const lamp=cyl(roof,[x+Math.sign(x)*.09,.11,z],.105,.04,Math.abs(z)>.9?'#d95142':'#f0a327');lamp.rotation.set(0,0,Math.PI/2);}
  }
  label(roof,'SCHOOL BUS',[-3.284,.16,0],[1.25,.17],C.ink,C.light,-Math.PI/2);
  label(roof,'SCHOOL BUS',[3.284,.16,0],[1.25,.17],C.ink,C.light,Math.PI/2);
  round(roof,[.9,.49,0],[.78,.065,.72],'#f9e59c',.10);
  for(const x of [-1.4,0,1.4])box(roof,[x,.015,0],[.055,.05,2.57],'#ddad31');

  const chassis=addPart('chassis',[0,-.82,0],[0,-.38,0],[.3,-.42,.6]);
  round(chassis,[.67,.18,0],[6.24,.20,2.50],'#c9c4aa');
  for(const z of [-.66,.66])box(chassis,[-.05,-.23,z],[7.67,.27,.17],C.ink);
  for(const x of [-3,-1.5,0,1.5,3])box(chassis,[x,-.23,0],[.13,.20,1.48],C.steel);
  for(const x of [-2.78,2.55])rod(chassis,[x,-.26,-1.43],[x,-.26,1.43],.105,C.ink);
  rod(chassis,[-2.0,-.3,0],[2.55,-.3,0],.073,C.steel);
  sphere(chassis,[2.55,-.27,0],[.23,.21,.29],C.ink);
  round(chassis,[1.0,-.34,.91],[1.22,.43,.44],'#87949a');

  for(const side of [-1,1]){
    const seats=addPart('seats',[0,0,side*.84],[0,1.35,side*1.9],[1.0,.95,0]);
    const belts=addPart('belts',[0,0,side*.84],[0,2.5,side*2.55],[.7,.65,0]);
    for(let row=0;row<5;row++){
      const x=-.95+row*.92;
      round(seats,[x,-.07,0],[.64,.19,.84],C.seat,.075);
      round(seats,[x+.26,.42,0],[.18,1.02,.87],C.seat,.08);
      round(seats,[x+.153,.63,0],[.026,.51,.70],'#51a491',.025);
      for(const z of [-.31,.31])rod(seats,[x+.15,-.56,z],[x+.15,-.10,z],.045,C.ink);
      // A visible three-point belt set at each model seat; orange denotes a teaching overlay.
      rod(belts,[x+.145,.85,-.27],[x+.105,.0,.23],.025,C.belt);
      rod(belts,[x+.105,.0,.23],[x-.21,.042,-.30],.025,C.belt);
      round(belts,[x+.09,.035,.24],[.12,.07,.11],'#d9594a',.02);
      box(belts,[x+.089,.077,.24],[.043,.012,.065],'#f2d2ab');
    }
  }

  const cockpit=addPart('cockpit',[-1.93,0,.67],[-.8,1.4,1.5],[-.2,.82,0]);
  round(cockpit,[.12,-.08,0],[.64,.19,.67],'#486273');
  round(cockpit,[.4,.37,0],[.17,.87,.67],'#486273');
  rod(cockpit,[.16,-.55,0],[.16,-.11,0],.095,C.steel);
  round(cockpit,[-.38,.40,0],[.29,.34,.91],C.ink);
  rod(cockpit,[-.34,.29,0],[-.16,.71,0],.046,C.steel);
  const steering=mesh(cockpit,new T.TorusGeometry(.24,.027,10,32),mat(C.ink),[-.16,.73,0]);steering.rotation.y=Math.PI/2;steering.rotation.z=-.5;
  rod(cockpit,[-.16,.73,-.23],[-.16,.73,.23],.018,C.ink);rod(cockpit,[-.16,.73,0],[-.27,.53,0],.018,C.ink);
  for(const z of [-.20,.20])sphere(cockpit,[-.21,.47,z],[.025,.078,.078],'#b0d6d5');
  box(cockpit,[-.17,-.46,.22],[.24,.06,.13],C.ink);

  const door=addPart('door',[-1.80,0,-1.37],[-.55,.25,-3.6],[0,.76,0]);
  // Folded leaves remain distinct from the surrounding shell and reveal the steps.
  for(const [x,z,angle] of [[-.28,-.03,-.15],[.12,.025,.20]]){
    const leaf=round(door,[x,.63,z],[.36,1.99,.09],C.ink,.035);leaf.rotation.y=angle;
    const upper=glass(door,[x,1.10,z-.067],[.275,.76,.022]);upper.rotation.y=angle;
    const lower=glass(door,[x,.23,z-.067],[.275,.75,.022]);lower.rotation.y=angle;
  }
  for(let i=0;i<3;i++){
    round(door,[0,-.91+i*.19,.12+i*.23],[.85,.12,.32],C.ink,.03);
    box(door,[0,-.84+i*.19,-.02+i*.23],[.81,.025,.045],'#ebcc53');
  }
  rod(door,[.44,-.45,.22],[.44,.30,.61],.033,'#e5b94c');

  for(const x of [-2.78,2.55])for(const side of [-1,1]){
    const wheels=addPart('wheels',[x,-1.08,side*1.33],[0,-.10,side*2.5],[0,.1,side*.24]);
    const tirePositions=x>0?[-.16,.16]:[0];
    for(const dz of tirePositions){
      cyl(wheels,[0,0,dz],.73,x>0?.26:.39,C.rubber);
      cyl(wheels,[0,0,dz+side*(x>0?.14:.205)],.42,.035,C.steel);
      cyl(wheels,[0,0,dz+side*(x>0?.163:.225)],.25,.048,'#d5dadd');
      for(let i=0;i<8;i++){const a=i*Math.PI/4;sphere(wheels,[Math.cos(a)*.32,Math.sin(a)*.32,dz+side*(x>0?.17:.237)],[.04,.04,.025],C.ink);}
      for(let i=0;i<28;i++){const a=i*Math.PI/14;const tread=box(wheels,[Math.cos(a)*.722,Math.sin(a)*.722,dz],[.033,.075,x>0?.23:.34],'#3b464b');tread.rotation.z=a;}
    }
  }

  const engine=addPart('engine',[-3.3,-.20,0],[-2.1,.3,0],[-.1,.58,0]);
  round(engine,[0,0,0],[1.12,.67,.99],'#ce7952');
  round(engine,[0,.41,0],[.85,.17,.82],'#e89b68');
  for(let i=0;i<4;i++)box(engine,[-.35+i*.23,.53,0],[.105,.06,.74],'#aa674d');
  round(engine,[-.72,.02,0],[.15,.86,1.11],C.ink);
  for(let i=0;i<9;i++)box(engine,[-.805,.02,-.47+i*.117],[.025,.72,.031],C.steel);
  rod(engine,[.32,.34,.45],[.64,.25,.58],.11,C.ink);
  rod(engine,[.60,.25,.58],[.70,-.18,.47],.10,C.ink);
  cyl(engine,[.22,.03,-.58],.19,.18,'#b6bfc0');

  for(const side of [-1,1]){
    const mirrors=addPart('mirrors',[-2.32,.9,side*1.42],[-1.0,.8,side*2.3],[0,.26,side*.49]);
    rod(mirrors,[0,0,0],[-.27,.10,side*.45],.034,C.ink);
    rod(mirrors,[-.27,.1,side*.45],[-.27,.48,side*.45],.029,C.ink);
    round(mirrors,[-.25,.32,side*.49],[.30,.64,.105],C.ink,.065);
    round(mirrors,[-.25,.32,side*.551],[.23,.55,.025],'#b7d3d9',.045,{metalness:.72,roughness:.16});
    rod(mirrors,[-.67,-.6,-side*.10],[-1.6,-.07,side*.15],.031,C.ink);
    sphere(mirrors,[-1.60,-.04,side*.18],[.22,.17,.08],C.ink);
    sphere(mirrors,[-1.60,-.04,side*.24],[.18,.13,.032],'#b6d1d5');
  }
};

/* Generic two-stage educational launcher. Y is up. No real mission is depicted.
 * Core skin/tanks pull apart for inspection; explode is not a flight simulation. */
window.buildLabModel = ({T,addPart,mesh,mat,sphere,box,panel}) => {
  const C={white:'#f4f0dc',light:'#dddccf',teal:'#65a99b',blue:'#668fac',dark:'#344957',orange:'#dd9967',gold:'#e1b953',steel:'#8b9c9f'};
  const cyl=(g,r1,r2,h,c,p=[0,0,0],open=false,start=0,len=Math.PI*2)=>mesh(g,new T.CylinderGeometry(r1,r2,h,48,1,open,start,len),mat(c,{side:T.DoubleSide}),p);
  const lathe=(g,points,c,start=0,len=Math.PI*2)=>mesh(g,new T.LatheGeometry(points.map(p=>new T.Vector2(...p)),48,start,len),mat(c,{side:T.DoubleSide}));
  const ring=(g,y,r,c,thick=.035,start=0,len=Math.PI*2)=>{
    const m=mesh(g,new T.TorusGeometry(r,thick,8,64,len),mat(c),[0,y,0]);m.rotation.x=Math.PI/2;m.rotation.z=start;return m;
  };
  const pipe=(g,a,b,r,c)=>{
    const d=new T.Vector3(...b).sub(new T.Vector3(...a));
    const m=cyl(g,r,r,d.length(),c,a);m.position.addScaledVector(d,.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return m;
  };
  const bell=(g,x,y,z,r=.3,h=.6)=>{
    const profile=[[r,y],[r*.88,y+h*.22],[r*.61,y+h*.5],[r*.35,y+h*.8],[r*.31,y+h],[r*.24,y+h],[r*.27,y+h*.8],[r*.54,y+h*.5],[r*.8,y+h*.22],[r*.9,y],[r,y]];
    const nozzle=lathe(g,profile,C.dark);nozzle.position.set(x,0,z);
    const lip=ring(g,y,r*.95,C.steel,.026);lip.position.x=x;lip.position.z=z;
    cyl(g,r*.28,r*.31,.15,C.orange,[x,y+h+.06,z]);
    for(let j=0;j<8;j++){
      const a=j*Math.PI/4;
      pipe(g,[x+Math.cos(a)*r*.37,y+h*.73,z+Math.sin(a)*r*.37],[x+Math.cos(a)*r*.76,y+h*.22,z+Math.sin(a)*r*.76],.013,C.steel);
    }
  };

  // The fairing has genuinely hollow halves, including visible rim thickness.
  const fairingProfile=[[.85,1.45],[.93,1.62],[.93,2.65],[.88,3.02],[.73,3.4],[.48,3.79],[.19,4.13],[.012,4.29],[.012,4.22],[.15,4.09],[.44,3.76],[.69,3.38],[.84,3],[.885,2.65],[.885,1.64],[.807,1.49],[.85,1.45]];
  for(const side of [-1,1]){
    const start=side===1?0:Math.PI;
    const g=addPart('fairing',[side*.007,0,0],[side*2.6,1.2,0],[side*.85,3,0]);
    lathe(g,fairingProfile,C.white,start,Math.PI);
    cyl(g,.934,.934,.15,C.orange,[0,1.86,0],true,start,Math.PI);
    cyl(g,.935,.935,.025,C.gold,[0,2.01,0],true,start,Math.PI);
    // Long seam rails and rounded acoustic pads on the inside.
    for(const z of [-1,1])pipe(g,[side*.012,1.62,z*.89],[side*.012,2.72,z*.876],.025,C.light);
    for(let k=0;k<4;k++){
      const a=start+.3+k*.8;
      const pad=box(g,[Math.sin(a)*.854,2.35,Math.cos(a)*.854],[.13,.45,.035],'#d8d8c7');pad.rotation.y=a;
    }
    const badge=cyl(g,.155,.155,.025,C.teal,[side*.937,2.36,0]);badge.rotation.z=Math.PI/2;
    const dot=cyl(g,.055,.055,.035,C.gold,[side*.955,2.36,0]);dot.rotation.z=Math.PI/2;
  }

  const payload=addPart('satellite',[0,2.28,0],[0,2.6,1.25],[0,.3,.55]);
  box(payload,[0,0,0],[.68,.85,.59],C.gold);
  box(payload,[0,0,.303],[.51,.64,.035],'#c59537');
  for(const y of [-.3,0,.3])box(payload,[0,y,.329],[.57,.018,.018],'#f4d789');
  cyl(payload,.3,.39,.17,C.steel,[0,-.52,0]);
  for(const side of [-1,1]){
    box(payload,[side*.377,0,0],[.055,.91,.65],C.dark);
    for(let row=0;row<6;row++)for(let col=0;col<3;col++)box(payload,[side*.409,-.367+row*.146,-.211+col*.211],[.012,.13,.19],row%2?'#406da3':'#365f92');
  }
  pipe(payload,[0,.43,0],[0,.67,0],.025,C.steel);
  const dish=mesh(payload,new T.SphereGeometry(.23,32,16,0,Math.PI*2,0,.85),mat(C.white,{side:T.DoubleSide}),[0,.63,0]);dish.rotation.z=.35;
  sphere(payload,[.18,.41,.12],[.08,.05,.08],C.dark);

  const upper=addPart('upperstage',[0,.9,0],[0,1.05,0],[.7,0,0]);
  cyl(upper,.745,.745,.85,C.teal);
  sphere(upper,[0,.405,0],[.735,.19,.735],C.teal);
  cyl(upper,.85,.74,.16,C.light,[0,.47,0]);
  for(const y of [-.39,.32])ring(upper,y,.745,C.light,.038);
  for(let i=0;i<16;i++){const a=i*Math.PI/8;pipe(upper,[Math.sin(a)*.748,-.33,Math.cos(a)*.748],[Math.sin(a)*.748,.25,Math.cos(a)*.748],.012,'#87bcb0');}
  bell(upper,0,-.93,0,.33,.46);
  box(upper,[0,.02,.757],[.25,.24,.065],C.dark);
  for(const x of [-.07,0,.07])sphere(upper,[x,.02,.797],[.02,.02,.014],C.gold);

  const inter=addPart('interstage',[0,.24,0],[2.6,.8,-.4],[.8,0,0]);
  lathe(inter,[[.77,-.25],[.77,.25],[.72,.25],[.72,-.25],[.77,-.25]],C.blue);
  ring(inter,-.225,.775,C.steel);ring(inter,.225,.775,C.steel);
  for(let i=0;i<18;i++){const a=i*Math.PI/9;pipe(inter,[Math.sin(a)*.777,-.18,Math.cos(a)*.777],[Math.sin(a)*.777,.18,Math.cos(a)*.777],.012,C.light);}

  // Long skin halves reveal two independently selectable closed pressure tanks.
  for(const side of [-1,1]){
    const start=side===1?0:Math.PI;
    const shell=addPart('structure',[0,-1.72,0],[side*1.9,0,-1.3],[side*.78,0,0]);
    lathe(shell,[[.78,-1.63],[.78,1.72],[.74,1.72],[.74,-1.63],[.78,-1.63]],C.white,start,Math.PI);
    cyl(shell,.783,.783,.23,C.teal,[0,-1.28,0],true,start,Math.PI);
    for(const y of [-1.57,-.7,.13,.94,1.63])cyl(shell,.736,.736,.035,C.steel,[0,y,0],true,start,Math.PI);
    for(let i=0;i<5;i++){
      const a=start+.12+i*.73;
      pipe(shell,[Math.sin(a)*.722,-1.58,Math.cos(a)*.722],[Math.sin(a)*.722,1.65,Math.cos(a)*.722],.018,C.light);
    }
    for(const z of [-1,1])box(shell,[side*.01,0,z*.771],[.022,3.25,.025],C.steel);
    const patch=cyl(shell,.21,.21,.023,C.teal,[side*.786,-.13,0]);patch.rotation.z=Math.PI/2;
    const star=panel(shell,[[0,.16],[.047,.053],[.16,.048],[.071,-.025],[.098,-.15],[0,-.072],[-.098,-.15],[-.071,-.025],[-.16,.048],[-.047,.053]],.017,C.gold,'xy');
    star.rotation.y=side*Math.PI/2;star.position.set(side*.805,-.13,0);
  }
  const tank=(id,y,height,c,off)=>{
    const g=addPart(id,[0,y,0],off,[0,.1,.64]);
    cyl(g,.635,.635,height-.46,c);
    for(const sign of [-1,1])sphere(g,[0,sign*(height-.46)/2,0],[.635,.23,.635],c);
    for(const sign of [-1,1])ring(g,sign*(height-.46)/2,.635,C.light,.021);
    cyl(g,.13,.13,.11,C.steel,[0,-height/2-.035,0]);
    pipe(g,[.48,-height/2+.12,.28],[.48,height/2-.12,.28],.035,C.light);
    box(g,[0,0,.633],[.23,.2,.025],id==='fuel'?'#f3cca0':'#b1d5e3');
    return g;
  };
  tank('fuel',-2.54,1.37,C.orange,[-.6,-.1,1.7]);
  tank('oxidizer',-.92,1.57,C.blue,[.65,.18,1.75]);

  for(const side of [-1,1]){
    const g=addPart('boosters',[side*1.19,-1.35,0],[side*3.6,-.3,.4],[side*.36,.6,0]);
    cyl(g,.35,.35,3.43,C.white,[0,-.2,0]);
    lathe(g,[[.35,1.515],[.32,1.76],[.23,2.03],[.06,2.38],[0,2.43]],C.blue);
    cyl(g,.353,.353,.65,C.blue,[0,.7,0]);
    for(const y of [-1.76,-1.08,-.4,.33,1.45])ring(g,y,.353,C.steel,.024);
    cyl(g,.35,.4,.23,C.blue,[0,-1.97,0]);
    bell(g,0,-2.36,0,.27,.32);
    pipe(g,[0,-1.5,.354],[0,1.35,.354],.035,C.light);
    for(const y of [-1.4,1.1])box(g,[-side*.36,y,0],[.24,.12,.2],C.steel);
    box(g,[0,.73,.357],[.12,.28,.025],C.gold);
  }

  const engines=addPart('engines',[0,-3.42,0],[0,-.35,0],[.55,-.3,.4]);
  cyl(engines,.72,.67,.2,C.steel,[0,.12,0]);
  for(let i=0;i<3;i++){
    const a=i*Math.PI*2/3+.5,x=Math.sin(a)*.35,z=Math.cos(a)*.35;
    bell(engines,x,-.62,z,.285,.51);
    sphere(engines,[x,.04,z],[.13,.16,.13],C.orange);
    pipe(engines,[0,.27,0],[x,.08,z],.047,C.steel);
  }
};

(function () {
  'use strict';
    // Purpose-built teaching airframe. Schematic units; forward -X, up +Y, right wing +Z.
  window.AirframeV3 = { create: function (T) {
    const root = new T.Group(); root.name = 'Teaching aircraft / continuous airframe';
    const assemblies = [], motions = [], links=[];
    const mat = (color, extra) => new T.MeshStandardMaterial(Object.assign({color, roughness:.4, metalness:.15},extra));
    const white=mat(0xf4f5f0), blue=mat(0x087bc5), dark=mat(0x142e43), alloy=mat(0xb7cbd1,{metalness:.7,roughness:.3});
    const orange=mat(0xfba94c), seatBlue=mat(0x518faf), floorMat=mat(0xabb9bd), rubber=mat(0x202934,{roughness:.83}), green=mat(0x76bea1);
    const ghostMat=new T.MeshBasicMaterial({color:0xbed0d4,transparent:true,opacity:.08,depthWrite:false,side:T.DoubleSide});
    function assembly(id,region,center,radius,view) {
      const group=new T.Group(), exterior=new T.Group(), interior=new T.Group(), ghost=new T.Group();
      group.name=id; group.userData={region,assemblyId:id}; root.add(group); group.add(exterior,interior,ghost); interior.visible=false; ghost.visible=false;
      const a={id,region,group,exterior,interior,ghost,details:{},center:new T.Vector3(...center),radius,view:view||[1.1,.35]}; assemblies.push(a); return a;
    }
    function detail(a,id,parent) {const g=new T.Group();g.name=id;g.userData={detail:id,region:a.region,assemblyId:a.id};(parent||a.interior).add(g); if(a.details[id]){a.details[id]=[...([].concat(a.details[id])),g];}else a.details[id]=g;return g;}
    function mesh(parent,geo,m,x=0,y=0,z=0) {const o=new T.Mesh(geo,m);o.position.set(x,y,z);parent.add(o);o.castShadow=true;o.receiveShadow=true;return o;}
    function box(p,m,x,y,z,w,h,d){return mesh(p,new T.BoxGeometry(w,h,d),m,x,y,z);}
    function rod(p,m,a,b,r=.025){const av=new T.Vector3(...a),bv=new T.Vector3(...b),delta=bv.clone().sub(av);const o=mesh(p,new T.CylinderGeometry(r,r,delta.length(),10),m);o.position.copy(av.add(bv).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return o;}
    function ibeam(p,m,a,b,w=.09,h=.018){const av=new T.Vector3(...a),bv=new T.Vector3(...b),delta=bv.clone().sub(av),g=new T.Group();p.add(g);g.position.copy(av.add(bv).multiplyScalar(.5));g.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.clone().normalize());box(g,m,0,0,0,.018,delta.length(),h);for(const z of [-1,1])box(g,m,0,0,z*h*.5,w,delta.length(),.006);return g;}
    function tube(p,m,pts,r=.024,closed=false){const curve=new T.CatmullRomCurve3(pts.map(v=>new T.Vector3(...v)),closed);return mesh(p,new T.TubeGeometry(curve,Math.max(16,pts.length*3),r,6,closed),m);}
    function loft(stations,segments=48) {const v=[],idx=[];for(const [x,ry,rz,cy] of stations)for(let j=0;j<=segments;j++){const t=j/segments*Math.PI*2;v.push(x,(cy||0)+Math.sin(t)*ry,Math.cos(t)*rz);}for(let i=0;i<stations.length-1;i++)for(let j=0;j<segments;j++){const q=i*(segments+1)+j;idx.push(q,q+segments+1,q+1,q+1,q+segments+1,q+segments+2);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex(idx);g.computeVertexNormals();return g;}
    function silhouette(a,geo){mesh(a.ghost,geo,ghostMat);}
    // Silhouette rebuilt from the book overview: long near-cylindrical cabin,
    // full shoulders and an upswept tail cone rather than a pinched spindle.
    const bodyStations=[[-4.12,.84,.85,.01],[-3.7,.865,.88,0],[-2.8,.88,.895,0],[0,.88,.895,0],[2.3,.84,.86,.025],[3.25,.76,.79,.055],[4.1,.59,.64,.12],[4.75,.405,.46,.19],[5.35,.235,.28,.24],[5.72,.145,.17,.27],[5.95,.105,.12,.28]];
    const body=assembly('cabin','fuselage',[.1,0,0],4.8,[1.15,.25]);
    mesh(body.exterior,loft(bodyStations),white).name='Book fuselage skin';silhouette(body,loft(bodyStations,14));
    // The blue underside is an inlaid skin band; it follows the same loft.
    function band(stations,lo,hi) {const v=[],ix=[],n=14;for(const [x,ry,rz,cy] of stations)for(let j=0;j<=n;j++){const low=typeof lo==='function'?lo(x):lo,high=typeof hi==='function'?hi(x):hi,t=low+(high-low)*j/n;v.push(x,(cy||0)+Math.sin(t)*(ry+.006),Math.cos(t)*(rz+.006));}for(let i=0;i<stations.length-1;i++)for(let j=0;j<n;j++){const q=i*(n+1)+j;ix.push(q,q+n+1,q+1,q+1,q+n+1,q+n+2);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex(ix);g.computeVertexNormals();return g;}
    mesh(body.exterior,band(bodyStations,Math.PI*1.1,Math.PI*1.9),blue);
    // Project every pane onto the loft: fixed Z values buried the window row.
    function bodySide(x,y,side){let k=0;while(k<bodyStations.length-2&&x>bodyStations[k+1][0])k++;const a=bodyStations[k],b=bodyStations[k+1],t=(x-a[0])/(b[0]-a[0]);const ry=a[1]+(b[1]-a[1])*t,rz=a[2]+(b[2]-a[2])*t,cy=(a[3]||0)+((b[3]||0)-(a[3]||0))*t;return side*(rz*Math.sqrt(Math.max(0,1-((y-cy)/ry)**2))+.012);}
    for(const side of [-1,1])for(let i=0;i<32;i++){const x=-3.35+i*.20;const win=mesh(body.exterior,new T.SphereGeometry(1,12,8),dark,x,.25,bodySide(x,.25,side));win.name='Cabin window on skin';win.scale.set(.055,.088,.026);}
    for(const side of [-1,1])for(const x of [-3.85,3.15]){const pts=[];for(let i=0;i<=40;i++){const t=i/40*Math.PI*2,px=x+.18*Math.sign(Math.cos(t))*Math.abs(Math.cos(t))**.36,py=.04+.43*Math.sign(Math.sin(t))*Math.abs(Math.sin(t))**.36;pts.push([px,py,bodySide(px,py,side)]);}tube(body.exterior,alloy,pts,.01).name='Flush rounded passenger door';box(body.exterior,alloy,x+.075,.05,bodySide(x+.075,.05,side),.075,.023,.02);}
    const apu=mesh(body.exterior,new T.TorusGeometry(.105,.025,10,32),alloy,5.96,.28,0);apu.rotation.y=Math.PI/2;apu.name='Tail cone exhaust rim';const apuBore=mesh(body.exterior,new T.CircleGeometry(.092,28),dark,5.967,.28,0);apuBore.rotation.y=Math.PI/2;
    const frames=detail(body,'cabin.frames');
    for(let i=0;i<15;i++){const x=-3.8+i*.48,ry=x>2.3?.76-(x-2.3)*.2:.748,rz=ry+ .025;const pts=[];for(let j=0;j<32;j++){const t=j/32*Math.PI*2;pts.push([x,Math.sin(t)*ry,Math.cos(t)*rz]);}tube(frames,alloy,pts,.022,true);}
    for(let j=0;j<8;j++){const t=j/8*Math.PI*2;tube(frames,alloy,[[-3.8,Math.sin(t)*.73,Math.cos(t)*.75],[-2.6,Math.sin(t)*.75,Math.cos(t)*.78],[2.2,Math.sin(t)*.7,Math.cos(t)*.74],[3.0,Math.sin(t)*.61,Math.cos(t)*.64]],.013);}
    const floor=detail(body,'cabin.floor');box(floor,floorMat,-.3,-.29,0,6.9,.055,1.34);box(floor,orange,-.3,-.257,0,6.9,.006,.29);
    for(let i=0;i<8;i++)rod(floor,alloy,[-3.45+i*.85,-.31,-.64],[-3.45+i*.85,-.31,.64],.025);
    const seats=detail(body,'cabin.seats');
    function seat(p,x,y,z,scale=1){box(p,seatBlue,x,y,z,.3*scale,.105*scale,.34*scale);const back=box(p,seatBlue,x+.155*scale,y+.21*scale,z,.085*scale,.4*scale,.34*scale);back.rotation.z=-.1;const head=box(p,seatBlue,x+.17*scale,y+.44*scale,z,.09*scale,.12*scale,.24*scale);head.rotation.z=-.1;rod(p,alloy,[x,y-.05,z],[x,y-.19,z],.025*scale);}
    for(let i=0;i<10;i++)for(const side of [-1,1]){const row=new T.Group();row.name='Passenger seat '+i+' '+side;seats.add(row);seat(row,-3.25+i*.58,-.08,side*.44,.9);box(row,dark,-3.25+i*.58,-.023,side*.44,.025,.009,.30);box(row,alloy,-3.25+i*.58,-.014,side*.44,.045,.012,.04);}
    const cargo=detail(body,'cabin.cargo');
    for(let i=0;i<7;i++){const x=-2.75+i*.73;box(cargo,i%2?blue:orange,x,-.51,(i%2?1:-1)*.18,.48,.31,.46);box(cargo,dark,x,-.51,(i%2?1:-1)*.18,.05,.317,.466);tube(cargo,alloy,[[x-.10,-.35,(i%2?1:-1)*.18],[x-.10,-.31,(i%2?1:-1)*.18],[x+.10,-.31,(i%2?1:-1)*.18],[x+.10,-.35,(i%2?1:-1)*.18]],.012);rod(cargo,dark,[x-.07,-.344,(i%2?1:-1)*.18],[x+.07,-.344,(i%2?1:-1)*.18],.016);}
    const cockpit=assembly('flight-deck','cockpit',[-4.6,.05,0],1.32,[1.1,.35]);
    const noseStations=[[-6.1,.005,.006,-.17],[-6.085,.085,.10,-.17],[-6.04,.18,.21,-.15],[-5.95,.29,.33,-.12],[-5.81,.415,.46,-.075],[-5.62,.53,.565,-.025],[-5.4,.63,.655,.015],[-5.13,.715,.735,.035],[-4.84,.775,.795,.035],[-4.5,.82,.835,.02],[-4.12,.84,.85,.01]];
    const noseBand=x=>Math.PI*(1.1+.16*Math.pow(Math.max(0,(-4.12-x)/1.98),.7));
    mesh(cockpit.exterior,loft(noseStations,64),white).name='Rounded book radome';mesh(cockpit.exterior,band(noseStations,noseBand,x=>Math.PI*3-noseBand(x)),blue);silhouette(cockpit,loft(noseStations,14));
    function polygon(p,points,m){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(points.flat(),3));const ix=[];for(let i=1;i<points.length-1;i++)ix.push(0,i,i+1);g.setIndex(ix);g.computeVertexNormals();const o=mesh(p,g,m);o.material.side=T.DoubleSide;return o;}
    // Windshields are curved patches projected onto the exact piecewise nose loft.
    // A tessellated patch follows the skin between vertices, avoiding buried chords.
    function windshield(side,corners) {
      const positions=[],indices=[],steps=14;
      function nosePoint(x,angle){let k=0;while(k<noseStations.length-2&&x>noseStations[k+1][0])k++;const a=noseStations[k],b=noseStations[k+1],t=(x-a[0])/(b[0]-a[0]);const ry=a[1]+(b[1]-a[1])*t,rz=a[2]+(b[2]-a[2])*t,cy=a[3]+(b[3]-a[3])*t;return [x,cy+Math.sin(angle)*(ry+.012),side*Math.cos(angle)*(rz+.012)];}
      for(let j=0;j<=steps;j++)for(let i=0;i<=steps;i++){const u=i/steps,v=j/steps;const x=(1-v)*((1-u)*corners[0][0]+u*corners[1][0])+v*((1-u)*corners[3][0]+u*corners[2][0]);const angle=(1-v)*((1-u)*corners[0][1]+u*corners[1][1])+v*((1-u)*corners[3][1]+u*corners[2][1]);positions.push(...nosePoint(x,angle));}
      for(let j=0;j<steps;j++)for(let i=0;i<steps;i++){const q=j*(steps+1)+i;indices.push(q,q+1,q+steps+1,q+1,q+steps+2,q+steps+1);}
      const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();const glass=dark.clone();glass.side=T.DoubleSide;glass.roughness=.22;const pane=mesh(cockpit.exterior,geometry,glass);pane.name='Curved cockpit windshield';
    }
    for(const side of [-1,1]){windshield(side,[[-5.58,.43],[-5.38,.85],[-5.09,.77],[-5.14,.37]]);windshield(side,[[-5.055,.37],[-5.01,.75],[-4.75,.64],[-4.75,.33]]);}

    const cs=detail(cockpit,'cockpit.seats');for(const s of [-1,1])seat(cs,-4.45,-.08,s*.3,1.1);
    const cp=detail(cockpit,'cockpit.panel');box(cp,floorMat,-4.74,-.28,0,1.1,.045,1.12);const panel=box(cp,dark,-5.05,.13,0,.16,.3,.96);panel.rotation.z=-.22;
    for(const z of [-.32,-.1,.12,.34]){box(cp,blue,-4.951,.15,z,.018,.145,.16);box(cp,blue,-4.938,.172,z,.006,.045,.12);box(cp,orange,-4.938,.128,z,.006,.045,.12);box(cp,white,-4.932,.15,z,.006,.003,.105);for(const dy of [-.022,.022])box(cp,white,-4.932,.15+dy,z,.006,.002,.025);box(cp,dark,-4.932,.15,z,.006,.025,.003);}box(cp,alloy,-4.73,-.13,0,.56,.15,.15);
    const throttle=box(cp,dark,-4.69,-.017,0,.24,.055,.12);for(const z of [-.038,.038]){rod(cp,alloy,[-4.69,.005,z],[-4.76,.09,z],.012);box(cp,dark,-4.76,.10,z,.06,.03,.026);}
    const cc=detail(cockpit,'cockpit.controls');for(const s of [-1,1]){rod(cc,alloy,[-4.82,-.2,s*.3],[-4.78,.04,s*.3],.025);tube(cc,dark,[[-4.78,.1,s*.3-.105],[-4.77,.01,s*.3-.08],[-4.77,.01,s*.3+.08],[-4.78,.1,s*.3+.105]],.022);for(const dz of [-.06,.06])box(cc,alloy,-5.05,-.205,s*.3+dz,.13,.035,.08);}
    // Closed airfoil loft, rounded leading edge, finite trailing edge.
    function foil(sections,vertical=false,from=0,to=1,openTop=false){const v=[],ix=[],n=24;for(const s of sections){const [span,lead,chord,y,thickness]=s;for(let j=0;j<=n*2;j++){const k=j<=n?j:2*n-j,u=from+(to-from)*(1-Math.cos(k/n*Math.PI))/2;const yt=5*thickness*(.2969*Math.sqrt(u)-.126*u-.3516*u*u+.2843*u*u*u-.1015*u*u*u*u);const camber=.018*chord*Math.sin(Math.PI*u);const h=y+camber+(j<=n?yt:-yt);v.push(lead+u*chord,vertical?span:h,vertical?h:span);}}const stride=n*2+1;for(let i=0;i<sections.length-1;i++)for(let j=0;j<stride-1;j++){if(openTop&&j<n)continue;let q=i*stride+j;ix.push(q,q+1,q+stride,q+1,q+stride+1,q+stride);}for(const si of [0,sections.length-1])for(let j=1;j<stride-2;j++){const q=si*stride;ix.push(q,q+j,q+j+1);}if(!vertical && sections[sections.length-1][0]>sections[0][0])for(let k=0;k<ix.length;k+=3){const swap=ix[k+1];ix[k+1]=ix[k+2];ix[k+2]=swap;}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex(ix);g.computeVertexNormals();return g;}
    function hingeSurface(a,id,sections,pivot,axis,amplitude,m=white,parent=a.exterior,vertical=false,from=0,to=1){const d=detail(a,id,parent),hinge=new T.Group();d.add(hinge);hinge.position.set(...pivot);const o=mesh(hinge,foil(sections,vertical,from,to),m);o.position.set(-pivot[0],-pivot[1],-pivot[2]);const last=sections[sections.length-1];const hingeAxis=vertical?new T.Vector3(last[1]+from*last[2]-pivot[0],last[0]-pivot[1],0):new T.Vector3(last[1]+from*last[2]-pivot[0],last[3]-pivot[1],last[0]-pivot[2]);hingeAxis.normalize();for(const t of [.12,.5,.88]){const length=vertical?Math.abs(last[0]-pivot[1]):Math.abs(last[0]-pivot[2]);const c=new T.Vector3(...pivot).addScaledVector(hingeAxis,length*t);rod(d,alloy,c.clone().addScaledVector(hingeAxis,-.05).toArray(),c.clone().addScaledVector(hingeAxis,.05).toArray(),.019);}
      motions.push({group:hinge,base:hinge.position.clone(),axis:hingeAxis,amplitude,region:a.region,id,side:Math.sign(pivot[2])||1});return d;}
    for(const s of [-1,1]){
      const wing=assembly('wing-'+(s>0?'right':'left'),'wings',[.2,-.25,s*3.25],3.7,[s>0?1:-1,.8]);
      const sections=[[s*.67,-2.05,3.02,-.33,.22],[s*1.3,-1.72,2.86,-.29,.20],[s*2,-1.25,2.50,-.23,.17],[s*4,.03,1.88,-.04,.105],[s*6.4,1.58,.93,.16,.045]];
      const cover=new T.Group();cover.name='wing-cover';wing.exterior.add(cover);
      function sectionAt(z){let k=0;while(k<sections.length-2&&z>Math.abs(sections[k+1][0]))k++;const a=sections[k],b=sections[k+1],t=(z-Math.abs(a[0]))/(Math.abs(b[0])-Math.abs(a[0]));return a.map((v,j)=>j===0?s*z:v+(b[j]-v)*t);}
      function span(a,b){return [sectionAt(a),...sections.filter(v=>Math.abs(v[0])>a&&Math.abs(v[0])<b),sectionAt(b)];}
      mesh(cover,foil(span(.67,.9)),white);mesh(cover,foil(span(6.25,6.4)),white);
      mesh(cover,foil(span(.9,6.25),false,.10,.52),white);
      mesh(cover,foil(span(.9,6.25),false,.74,.76),white);
      for(const [a,b,open]of [[.9,1.55,false],[1.55,3.55,true],[3.55,6.25,false]])mesh(cover,foil(span(a,b),false,.52,.74,open),white);
      mesh(cover,foil(span(6.12,6.25),false,0,.10),white);
      for(const [a,b]of [[.9,.95],[3.5,3.65]])mesh(cover,foil(span(a,b),false,.76,1),white);
      silhouette(wing,foil(sections.map(v=>v)),ghostMat);
      const wingletSections=[[s*6.36,1.6,.9,.17,.04],[s*6.47,1.65,.84,.20,.038],[s*6.57,1.71,.76,.28,.035],[s*6.64,1.79,.65,.41,.030],[s*6.70,1.88,.55,.60,.026],[s*6.74,1.97,.45,.80,.022],[s*6.75,2.035,.37,.86,.018]];
      mesh(cover,foil(wingletSections),blue).name='Blended short winglet';
      mesh(cover,foil(wingletSections.slice(0,4)),white);
      // The wing close-up shows streamlined flap-track fairings underneath.
      for(const z of [1.65,2.75,3.85]){const x=.77+z*.27,y=-.26+z*.045;const fairing=mesh(cover,loft([[x-.45,.02,.025,y],[x-.16,.1,.09,y-.035],[x+.3,.09,.075,y-.025],[x+.65,.007,.009,y+.015]],16),white,0,0,s*z);fairing.name='Flap track fairing';}
      const spars=detail(wing,'wing.spar');for(const t of [.25,.7])ibeam(spars,alloy,[-2.05+t*2.72,-.24,s*.75],[1.58+t*.93,.174,s*6.3],t===.25?.062:.045);
      const ribs=detail(wing,'wing.ribs');
      for(let i=0;i<12;i++){
        const z=.86+i*.46;let k=0;while(k<sections.length-2&&z>Math.abs(sections[k+1][0]))k++;
        const a=sections[k],b=sections[k+1],t=(z-Math.abs(a[0]))/(Math.abs(b[0])-Math.abs(a[0]));
        const x=a[1]+(b[1]-a[1])*t,c=a[2]+(b[2]-a[2])*t,y=a[3]+(b[3]-a[3])*t,th=(a[4]+(b[4]-a[4])*t)*.89;
        const profile=new T.Shape();
        function ribY(u,side){return .018*c*Math.sin(Math.PI*u)+side*5*th*(.2969*Math.sqrt(u)-.126*u-.3516*u*u+.2843*u*u*u-.1015*u*u*u*u);}
        for(let j=0;j<=32;j++){const u=.105+.645*j/32;if(j===0)profile.moveTo(c*u,ribY(u,1));else profile.lineTo(c*u,ribY(u,1));}
        for(let j=32;j>=0;j--){const u=.105+.645*j/32;profile.lineTo(c*u,ribY(u,-1));}profile.closePath();
        for(const u of [.3,.56]){const hole=new T.Path();hole.absellipse(c*u,.018*c*Math.sin(Math.PI*u),c*.065,th*.18,0,Math.PI*2,true,0);profile.holes.push(hole);}
        const web=mesh(ribs,new T.ExtrudeGeometry(profile,{depth:.018,bevelEnabled:false,curveSegments:12}),alloy,x,y,s*z-.009);web.name='Airfoil rib web with lightening holes';
      }

      const flapSections=span(.95,3.5),slatSections=span(.9,6.12),sp=sectionAt(1.55);
      const fp=flapSections[0],lp=slatSections[0];
      hingeSurface(wing,'wing.flap',flapSections,[fp[1]+.775*fp[2],fp[3],fp[0]],'z',-s*.32,white,wing.exterior,false,.775,1);
      hingeSurface(wing,'wing.slat',slatSections,[lp[1],lp[3],lp[0]],'z',s*.12,alloy,wing.exterior,false,0,.085);
      const spoilerSections=span(1.57,3.53).map(v=>[v[0],v[1]+.53*v[2],.20*v[2],v[3]+.018*v[2]*Math.sin(Math.PI*.63)+v[4]*.33,.012]);
      hingeSurface(wing,'wing.spoiler',spoilerSections,[spoilerSections[0][1],spoilerSections[0][3],spoilerSections[0][0]],'z',s*.65,white);
      const aileron=assembly('aileron-'+s,'ailerons',[2.2,.05,s*4.95],1.35,[s,.8]);
      const ac=span(3.65,6.25),ap=ac[0];hingeSurface(aileron,'aileron.hinge',ac,[ap[1]+.775*ap[2],ap[3],ap[0]],'z',.25,white,aileron.exterior,false,.775,1);silhouette(aileron,foil(ac,false,.775,1));
      const ah=detail(aileron,'aileron.linkage'),anchor=new T.Vector3(1.43,-.10,s*4.5),start=new T.Vector3(1.60,-.09,s*4.5),end=new T.Vector3(1.72,-.085,s*4.5);
      rod(ah,alloy,anchor.toArray(),start.toArray(),.034);const piston=mesh(ah,new T.CylinderGeometry(.012,.012,1,12),alloy);
      const eye=new T.Group();ah.add(eye);for(const [parent,p]of [[ah,anchor],[eye,new T.Vector3()]]){const rim=mesh(parent,new T.TorusGeometry(.029,.008,8,20),alloy,p.x,p.y,p.z);rod(parent,dark,[p.x,p.y,p.z-.036],[p.x,p.y,p.z+.036],.010);}
      const hinge=aileron.details['aileron.hinge'].children[0];links.push({start,end:end.clone().sub(hinge.position),hinge,piston,eye});
      // Taper the internal webs/flanges to the same airfoil envelope as the skin.
      wing.group.updateMatrixWorld(true);wing.interior.traverse(o=>{if(!o.isMesh)return;const ps=o.geometry.attributes.position;for(let i=0;i<ps.count;i++){const p=o.localToWorld(new T.Vector3().fromBufferAttribute(ps,i)),z=Math.abs(p.z);if(z<.67||z>6.4)continue;const v=sectionAt(z),u=Math.max(0,Math.min(1,(p.x-v[1])/v[2])),cam=.018*v[2]*Math.sin(Math.PI*u),h=5*v[4]*(.2969*Math.sqrt(u)-.126*u-.3516*u*u+.2843*u*u*u-.1015*u*u*u*u)*.86;p.y=Math.max(v[3]+cam-h,Math.min(v[3]+cam+h,p.y));o.worldToLocal(p);ps.setXYZ(i,p.x,p.y,p.z);}ps.needsUpdate=true;o.geometry.computeVertexNormals();o.geometry.computeBoundingBox();o.geometry.computeBoundingSphere();});
      const tail=assembly('tailplane-'+s,'stabilizers',[4.6,.32,s*1.7],1.9,[s,.65]);const ts=[[s*.24,3.25,1.68,.27,.105],[s*2.65,4.45,.78,.49,.045]];mesh(tail.exterior,foil(ts),white);silhouette(tail,foil(ts));const ti=detail(tail,'stabilizer.spar');ibeam(ti,alloy,[3.8,.3,s*.3],[4.75,.505,s*2.58],.08,.020);
      for(let j=0;j<5;j++){const t=.14+j*.17,z=.24+t*2.41,x=3.25+t*1.2,c=1.68-t*.9,y=.28+t*.22;const shape=new T.Shape();shape.moveTo(c*.18,-.020);shape.lineTo(c*.73,-.014);shape.lineTo(c*.73,.020);shape.lineTo(c*.18,.027);shape.closePath();const hole=new T.Path();hole.absellipse(c*.45,.01,c*.12,.010,0,Math.PI*2,true);shape.holes.push(hole);mesh(ti,new T.ExtrudeGeometry(shape,{depth:.014,bevelEnabled:false,curveSegments:12}),alloy,x,y,s*z-.007);}

      const elevator=assembly('elevator-'+s,'elevators',[5.1,.4,s*1.6],1.5,[s,.65]);const es=[[s*.35,4.96,.43,.28,.026],[s*2.63,5.25,.3,.49,.018]];hingeSurface(elevator,'elevator.hinge',es,[4.96,.28,s*.35],'z',s*.28,white);silhouette(elevator,foil(es));
    }
    const fin=assembly('vertical-tail','fin',[4.5,1.5,0],1.8,[1.55,.16]);const fs=[[.34,3.35,1.95,0,.12],[1.7,4.05,1.30,0,.075],[3.02,4.8,.63,0,.035]];mesh(fin.exterior,foil(fs,true),blue);silhouette(fin,foil(fs,true));
    // White swept ribbon follows both cambered faces, as in the tail illustration.
    for(const side of [-1,1]){const vertices=[],indices=[],n=32;for(let row=0;row<2;row++)for(let i=0;i<=n;i++){const u=i/n,y=1.47-.66*u+.27*row;let k=y>fs[1][0]?1:0;const a=fs[k],b=fs[k+1],t=(y-a[0])/(b[0]-a[0]),lead=a[1]+(b[1]-a[1])*t,chord=a[2]+(b[2]-a[2])*t,th=a[4]+(b[4]-a[4])*t;const thickness=5*th*(.2969*Math.sqrt(u)-.126*u-.3516*u*u+.2843*u*u*u-.1015*u*u*u*u);vertices.push(lead+u*chord,y,.018*chord*Math.sin(Math.PI*u)+side*(thickness+.005));}for(let i=0;i<n;i++)indices.push(i,i+1,i+n+1,i+1,i+n+2,i+n+1);const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();const paint=white.clone();paint.side=T.DoubleSide;mesh(fin.exterior,g,paint).name='White tail ribbon';}
    const fi=detail(fin,'fin.spar');ibeam(fi,alloy,[4,.4,.027],[5.04,2.85,.01],.045,.018);for(let i=0;i<5;i++)rod(fi,alloy,[3.65+i*.25,.7+i*.42,0],[5.17+i*.04,.7+i*.42,0],.022);
    const rudder=assembly('rudder','rudder',[5.4,1.6,0],1.5,[1.5,.2]);const rs=[[.5,5.31,.4,0,.026],[1.7,5.3724,.37,0,.025],[3,5.44,.2,0,.014]];hingeSurface(rudder,'rudder.hinge',rs,[5.31,.5,0],'y',.3,blue,rudder.exterior,true);silhouette(rudder,foil(rs,true));
    const rudderPaint=mesh(rudder.details['rudder.hinge'].children[0],foil([[.81,5.32612,.39225,0,.029],[1.08,5.34016,.38550,0,.029]],true),white);rudderPaint.position.set(-5.31,-.5,0);
    const gear=assembly('landing-gear','gear',[-.6,-1.32,0],3.7,[1.0,.15]);
    const strut=detail(gear,'gear.strut',gear.exterior),wheels=detail(gear,'gear.wheel',gear.exterior),brakes=detail(gear,'gear.brake'),bay=detail(gear,'gear.bay');
    const gearStations=[[-4.05,0,true],[.92,-1.18,false],[.92,1.18,false]];
    for(const [x,z,nose] of gearStations){
      const top=nose?-.77:-.56,bottom=nose?-1.785:-1.72,r=nose?.205:.27,pair=nose?.10:.17,width=nose?.12:.17;
      rod(strut,alloy,[x,top,z],[x,bottom,z],nose?.046:.067);rod(strut,dark,[x,top,z],[x,top-.35,z],nose?.065:.088);rod(strut,alloy,[x+.38,top,z],[x,bottom+.23,z],.032);rod(strut,alloy,[x,bottom,z-.25],[x,bottom,z+.25],.035);
      rod(strut,alloy,[x,bottom+.15,z],[x-.13,bottom+.32,z],.026);rod(strut,alloy,[x-.13,bottom+.32,z],[x,bottom+.51,z],.026);
      box(strut,blue,x,top-.05,z+(nose?.13:.25),nose?.30:.48,.24,.025).name='Blue gear door';
      box(bay,dark,x,top,z,.65,.08,nose?.4:.62);box(bay,alloy,x,top-.03,z-.25,.62,.17,.025);box(bay,alloy,x,top-.03,z+.25,.62,.17,.025);
      for(const dz of [-1,1]){const zg=z+dz*pair,wheelGroup=new T.Group();wheels.add(wheelGroup);wheelGroup.position.set(x,bottom,zg);wheelGroup.name=nose?'Nose wheel':'Main wheel';
        const tireProfile=[[.45,-.5],[.79,-.54],[.96,-.38],[1,-.15],[1,.15],[.96,.38],[.79,.54],[.45,.5],[.45,-.5]].map(([rr,ax])=>new T.Vector2(rr*r,ax*width));
        const tire=mesh(wheelGroup,new T.LatheGeometry(tireProfile,32),rubber);tire.rotation.x=Math.PI/2;tire.name='Rounded tire with sidewalls';
        mesh(wheelGroup,new T.CylinderGeometry(r*.47,r*.47,width*.91,24),alloy).rotation.x=Math.PI/2;
        const lugVertices=[];for(let j=0;j<5;j++){const t=j/5*Math.PI*2,g=new T.BoxGeometry(.022,.022,.012).toNonIndexed();g.translate(Math.cos(t)*r*.28,Math.sin(t)*r*.28,dz*width*.47);lugVertices.push(...g.attributes.position.array);g.dispose();}const lugGeometry=new T.BufferGeometry();lugGeometry.setAttribute('position',new T.Float32BufferAttribute(lugVertices,3));lugGeometry.computeVertexNormals();mesh(wheelGroup,lugGeometry,dark);
        motions.push({group:wheelGroup,axis:'z',amplitude:1,region:'gear',id:'gear.wheel',spin:true});
        if(!nose){const pack=new T.Group();pack.name='Coaxial multi-disc wheel brake';pack.userData.detail='gear.brake';pack.position.set(x,bottom,zg);brakes.add(pack);for(let disc=0;disc<3;disc++){const rotor=mesh(pack,new T.CylinderGeometry(.11,.11,.012,28),disc===1?dark:alloy,0,0,-dz*.026+(disc-1)*.017);rotor.rotation.x=Math.PI/2;}box(pack,alloy,.09,.03,-dz*.026,.057,.064,.069);box(pack,dark,.063,.03,-dz*.026,.016,.051,.045);rod(pack,alloy,[0,0,-dz*.055],[0,0,dz*.055],.029);}
      }
    }
    // One coarse silhouette for this assembly, never a cloned internal hierarchy.
    const gv=[];function appendGhost(geometry,x,y,z,rotate){if(rotate)geometry.rotateX(Math.PI/2);geometry.translate(x,y,z);const flat=geometry.index?geometry.toNonIndexed():geometry;gv.push(...flat.attributes.position.array);geometry.dispose();if(flat!==geometry)flat.dispose();}for(const [x,z,nose] of gearStations){appendGhost(new T.CylinderGeometry(.07,.055,1.05,6),x,-1.15,z);for(const side of [-1,1])appendGhost(new T.CylinderGeometry(nose?.205:.27,nose?.205:.27,.15,10),x,nose?-1.785:-1.72,z+side*(nose?.10:.17),true);}const gg=new T.BufferGeometry();gg.setAttribute('position',new T.Float32BufferAttribute(gv,3));gg.computeVertexNormals();silhouette(gear,gg);
    // Publish detail identity on meshes as well as groups for controller fading/picking.
    root.traverse(o=>{if(!o.isMesh)return;let parent=o;while(parent){if(parent.userData.detail){o.userData.detail=parent.userData.detail;break;}parent=parent.parent;}parent=o;while(parent){if(parent.userData.assemblyId){o.userData.assemblyId=parent.userData.assemblyId;o.userData.region=parent.userData.region;break;}parent=parent.parent;}});
    let meshCount=0,triangles=0;root.traverse(o=>{if(o.isMesh){meshCount++;triangles+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3;}});
    function update(state={}){const time=Number(state.time)||0,active=state.mechanism;for(const m of motions){const match=active&&((state.region===m.region||state.region===undefined)&&(!state.detail||state.detail===m.id));const angle=match?(m.spin?time*1.8:(['ailerons','elevators','rudder'].includes(m.region)?Math.sin((state.level!==undefined?state.level:time*.2)*Math.PI*2):(state.level!==undefined?state.level:(.5-.5*Math.cos(time*1.25))))*m.amplitude):0;if(m.spin)m.group.rotation.z=angle;else{m.group.quaternion.setFromAxisAngle(m.axis,angle);m.group.position.copy(m.base);if(match&&m.id==='wing.slat'){m.group.position.x-=.08*(state.level||0);m.group.position.y-=.025*(state.level||0);}}}for(const l of links){const b=l.end.clone().applyQuaternion(l.hinge.quaternion).add(l.hinge.position),delta=b.clone().sub(l.start);l.piston.position.copy(b.clone().add(l.start).multiplyScalar(.5));l.piston.scale.y=delta.length();l.piston.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());l.eye.position.copy(b);}}
    update();return {root,assemblies,update,counts:{assemblies:assemblies.length,meshes:meshCount,triangles:Math.round(triangles)}};
  }};
})();

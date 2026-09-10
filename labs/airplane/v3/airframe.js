(function () {
  'use strict';
  // Purpose-built teaching airframe. Metres; forward -X, up +Y, right wing +Z.
  window.AirframeV3 = { create: function (T) {
    const root = new T.Group(); root.name = 'Teaching aircraft / continuous airframe';
    const assemblies = [], motions = [];
    const mat = (color, extra) => new T.MeshStandardMaterial(Object.assign({color, roughness:.4, metalness:.15},extra));
    const white=mat(0xf4f5f0), blue=mat(0x307b9e), dark=mat(0x142e43), alloy=mat(0xb7cbd1,{metalness:.7,roughness:.3});
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
    function tube(p,m,pts,r=.024,closed=false){const curve=new T.CatmullRomCurve3(pts.map(v=>new T.Vector3(...v)),closed);return mesh(p,new T.TubeGeometry(curve,Math.max(16,pts.length*3),r,6,closed),m);}
    function loft(stations,segments=48) {const v=[],idx=[];for(const [x,ry,rz,cy] of stations)for(let j=0;j<=segments;j++){const t=j/segments*Math.PI*2;v.push(x,(cy||0)+Math.sin(t)*ry,Math.cos(t)*rz);}for(let i=0;i<stations.length-1;i++)for(let j=0;j<segments;j++){const q=i*(segments+1)+j;idx.push(q,q+segments+1,q+1,q+1,q+segments+1,q+segments+2);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex(idx);g.computeVertexNormals();return g;}
    function silhouette(a,geo){mesh(a.ghost,geo,ghostMat);}
    const bodyStations=[[-4.12,.64,.67,.02],[-3.7,.77,.79,0],[-2.8,.8,.82,0],[0,.8,.82,0],[2.3,.76,.78,.015],[3.4,.65,.67,.04],[4.5,.43,.46,.12],[5.35,.19,.22,.21],[5.95,.018,.024,.26]];
    const body=assembly('cabin','fuselage',[.1,0,0],4.8,[1.15,.25]);
    mesh(body.exterior,loft(bodyStations),white);silhouette(body,loft(bodyStations,14));
    // The blue underside is an inlaid skin band; it follows the same loft.
    function band(stations,lo,hi) {const v=[],ix=[],n=14;for(const [x,ry,rz,cy] of stations)for(let j=0;j<=n;j++){const t=lo+(hi-lo)*j/n;v.push(x,(cy||0)+Math.sin(t)*(ry+.006),Math.cos(t)*(rz+.006));}for(let i=0;i<stations.length-1;i++)for(let j=0;j<n;j++){const q=i*(n+1)+j;ix.push(q,q+n+1,q+1,q+1,q+n+1,q+n+2);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex(ix);g.computeVertexNormals();return g;}
    mesh(body.exterior,band(bodyStations,Math.PI*1.08,Math.PI*1.92),blue);
    for(const side of [-1,1])for(let i=0;i<15;i++){const x=-3.45+i*.405;const z=side*(x>2.2?.72:.771);const win=mesh(body.exterior,new T.SphereGeometry(1,12,8),dark,x,.25,z);win.scale.set(.095,.14,.034);}
    for(const side of [-1,1])for(const x of [-3.75,2.85]){const pts=[[x-.15,-.39,side*.695],[x-.15,.46,side*.64],[x+.16,.46,side*.64],[x+.16,-.39,side*.695],[x-.15,-.39,side*.695]];tube(body.exterior,alloy,pts,.012);}
    const frames=detail(body,'cabin.frames');
    for(let i=0;i<15;i++){const x=-3.8+i*.48,ry=x>2.3?.76-(x-2.3)*.2:.748,rz=ry+ .025;const pts=[];for(let j=0;j<32;j++){const t=j/32*Math.PI*2;pts.push([x,Math.sin(t)*ry,Math.cos(t)*rz]);}tube(frames,alloy,pts,.022,true);}
    for(let j=0;j<8;j++){const t=j/8*Math.PI*2;tube(frames,alloy,[[-3.8,Math.sin(t)*.73,Math.cos(t)*.75],[-2.6,Math.sin(t)*.75,Math.cos(t)*.78],[2.2,Math.sin(t)*.7,Math.cos(t)*.74],[3.0,Math.sin(t)*.61,Math.cos(t)*.64]],.013);}
    const floor=detail(body,'cabin.floor');box(floor,floorMat,-.3,-.29,0,6.9,.055,1.34);box(floor,orange,-.3,-.257,0,6.9,.006,.29);
    for(let i=0;i<8;i++)rod(floor,alloy,[-3.45+i*.85,-.31,-.64],[-3.45+i*.85,-.31,.64],.025);
    const seats=detail(body,'cabin.seats');
    function seat(p,x,y,z,scale=1){box(p,seatBlue,x,y,z,.3*scale,.105*scale,.34*scale);const back=box(p,seatBlue,x+.155*scale,y+.21*scale,z,.085*scale,.4*scale,.34*scale);back.rotation.z=-.1;rod(p,alloy,[x,y-.05,z],[x,y-.19,z],.025*scale);}
    for(let i=0;i<10;i++)for(const side of [-1,1])seat(seats,-3.25+i*.58,-.08,side*.44,.9);
    const cargo=detail(body,'cabin.cargo');
    for(let i=0;i<7;i++){const x=-2.75+i*.73;box(cargo,i%2?blue:orange,x,-.51,(i%2?1:-1)*.18,.48,.31,.46);rod(cargo,dark,[x-.07,-.344,(i%2?1:-1)*.18],[x+.07,-.344,(i%2?1:-1)*.18],.016);}
    const cockpit=assembly('flight-deck','cockpit',[-4.6,.05,0],1.32,[1.1,.35]);
    const noseStations=[[-6.1,.025,.025,-.13],[-5.9,.16,.2,-.07],[-5.55,.36,.44,.01],[-5.1,.51,.57,.06],[-4.55,.61,.63,.06],[-4.12,.64,.67,.02]];
    mesh(cockpit.exterior,loft(noseStations),white);mesh(cockpit.exterior,band(noseStations,Math.PI*1.08,Math.PI*1.92),blue);silhouette(cockpit,loft(noseStations,14));
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
    for(const side of [-1,1]){windshield(side,[[-5.48,.48],[-5.14,1.31],[-4.78,1.16],[-4.91,.42]]);windshield(side,[[-4.81,.42],[-4.69,1.12],[-4.32,.91],[-4.32,.34]]);}

    const cs=detail(cockpit,'cockpit.seats');for(const s of [-1,1])seat(cs,-4.45,-.08,s*.3,1.1);
    const cp=detail(cockpit,'cockpit.panel');box(cp,floorMat,-4.74,-.28,0,1.1,.045,1.12);const panel=box(cp,dark,-5.05,.13,0,.16,.3,.96);panel.rotation.z=-.22;
    for(const z of [-.32,-.1,.12,.34]){box(cp,blue,-4.951,.15,z,.018,.145,.16);box(cp,blue,-4.938,.172,z,.006,.045,.12);box(cp,orange,-4.938,.128,z,.006,.045,.12);box(cp,white,-4.932,.15,z,.006,.003,.105);for(const dy of [-.022,.022])box(cp,white,-4.932,.15+dy,z,.006,.002,.025);box(cp,dark,-4.932,.15,z,.006,.025,.003);}box(cp,alloy,-4.73,-.13,0,.56,.15,.15);
    const cc=detail(cockpit,'cockpit.controls');for(const s of [-1,1]){rod(cc,alloy,[-4.82,-.2,s*.3],[-4.78,.04,s*.3],.025);tube(cc,dark,[[-4.78,.1,s*.3-.105],[-4.77,.01,s*.3-.08],[-4.77,.01,s*.3+.08],[-4.78,.1,s*.3+.105]],.022);for(const dz of [-.06,.06])box(cc,alloy,-5.05,-.205,s*.3+dz,.13,.035,.08);}
    // Closed airfoil loft, rounded leading edge, finite trailing edge.
    function foil(sections,vertical=false){const v=[],ix=[],n=24;for(const s of sections){const [span,lead,chord,y,thickness]=s;for(let j=0;j<=n*2;j++){const k=j<=n?j:2*n-j,u=(1-Math.cos(k/n*Math.PI))/2;const yt=5*thickness*(.2969*Math.sqrt(u)-.126*u-.3516*u*u+.2843*u*u*u-.1015*u*u*u*u);const camber=.018*chord*Math.sin(Math.PI*u);const h=y+camber+(j<=n?yt:-yt);v.push(lead+u*chord,vertical?span:h,vertical?h:span);}}const stride=n*2+1;for(let i=0;i<sections.length-1;i++)for(let j=0;j<stride-1;j++){let q=i*stride+j;ix.push(q,q+1,q+stride,q+1,q+stride+1,q+stride);}for(const si of [0,sections.length-1])for(let j=1;j<stride-2;j++){const q=si*stride;ix.push(q,q+j,q+j+1);}if(!vertical && sections[sections.length-1][0]>sections[0][0])for(let k=0;k<ix.length;k+=3){const swap=ix[k+1];ix[k+1]=ix[k+2];ix[k+2]=swap;}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex(ix);g.computeVertexNormals();return g;}
    function hingeSurface(a,id,sections,pivot,axis,amplitude,m=white,parent=a.exterior,vertical=false){const d=detail(a,id,parent),hinge=new T.Group();d.add(hinge);hinge.position.set(...pivot);const o=mesh(hinge,foil(sections,vertical),m);o.position.set(-pivot[0],-pivot[1],-pivot[2]);const last=sections[sections.length-1];const hingeAxis=vertical?new T.Vector3(last[1]-pivot[0],last[0]-pivot[1],0):new T.Vector3(last[1]-pivot[0],last[3]-pivot[1],last[0]-pivot[2]);hingeAxis.normalize();motions.push({group:hinge,axis:hingeAxis,amplitude,region:a.region,id});return d;}
    for(const s of [-1,1]){
      const wing=assembly('wing-'+(s>0?'right':'left'),'wings',[.2,-.25,s*3.25],3.7,[s>0?1:-1,.8]);
      const sections=[[s*.67,-2.05,2.72,-.24,.19],[s*2,-1.25,2.45,-.18,.16],[s*4,.03,1.88,-.04,.105],[s*6.4,1.58,.93,.16,.045]];
      mesh(wing.exterior,foil(sections),white);silhouette(wing,foil(sections.map(v=>v)),ghostMat);
      const winglet=mesh(wing.exterior,foil([[s*6.36,1.6,.9,.17,.04],[s*6.66,1.87,.61,.95,.032],[s*6.71,2.11,.3,1.16,.018]]),blue);
      mesh(wing.exterior,foil([[s*6.61,1.99,.44,.9,.035],[s*6.66,2.08,.34,1.08,.025],[s*6.71,2.11,.3,1.16,.018]]),orange);
      const spars=detail(wing,'wing.spar');for(const t of [.25,.7])rod(spars,alloy,[-2.05+t*2.72,-.24,s*.75],[1.58+t*.93,.16,s*6.3],t===.25?.062:.045);
      const ribs=detail(wing,'wing.ribs');
      for(let i=0;i<12;i++){
        const z=.86+i*.46;let k=0;while(k<sections.length-2&&z>Math.abs(sections[k+1][0]))k++;
        const a=sections[k],b=sections[k+1],t=(z-Math.abs(a[0]))/(Math.abs(b[0])-Math.abs(a[0]));
        const x=a[1]+(b[1]-a[1])*t,c=a[2]+(b[2]-a[2])*t,y=a[3]+(b[3]-a[3])*t,th=(a[4]+(b[4]-a[4])*t)*.89;
        const profile=new T.Shape();
        function ribY(u,side){return .018*c*Math.sin(Math.PI*u)+side*5*th*(.2969*Math.sqrt(u)-.126*u-.3516*u*u+.2843*u*u*u-.1015*u*u*u*u);}
        for(let j=0;j<=32;j++){const u=.008+.982*j/32;if(j===0)profile.moveTo(c*u,ribY(u,1));else profile.lineTo(c*u,ribY(u,1));}
        for(let j=32;j>=0;j--){const u=.008+.982*j/32;profile.lineTo(c*u,ribY(u,-1));}profile.closePath();
        for(const u of [.3,.56]){const hole=new T.Path();hole.absellipse(c*u,.018*c*Math.sin(Math.PI*u),c*.065,th*.18,0,Math.PI*2,true,0);profile.holes.push(hole);}
        const web=mesh(ribs,new T.ExtrudeGeometry(profile,{depth:.018,bevelEnabled:false,curveSegments:12}),alloy,x,y,s*z-.009);web.name='Airfoil rib web with lightening holes';
      }

      hingeSurface(wing,'wing.flap',[[s*.95,.69,.57,-.25,.035],[s*2.1,1.21,.54,-.16,.032],[s*3.5,1.72,.41,-.04,.023]],[.7,-.25,s*.95],'z',.32,blue);
      hingeSurface(wing,'wing.slat',[[s*.9,-2.08,.2,-.235,.035],[s*3.9,-.13,.19,-.02,.028],[s*6.12,1.28,.16,.15,.02]],[-2.02,-.24,s*.9],'z',-.12,alloy);
      hingeSurface(wing,'wing.spoiler',[[s*1.55,.38,.46,-.05,.008],[s*3.55,1.09,.37,.075,.006]],[.38,-.05,s*1.55],'z',-.7,white);
      const aileron=assembly('aileron-'+s,'ailerons',[2.2,.05,s*4.95],1.35,[s,.8]);
      const ac=[[s*3.65,1.88,.43,-.025,.025],[s*6.25,2.49,.24,.155,.014]];hingeSurface(aileron,'aileron.hinge',ac,[1.9,-.02,s*3.65],'z',s*.25,blue);silhouette(aileron,foil(ac));
      const ah=detail(aileron,'aileron.linkage');rod(ah,alloy,[1.82,-.03,s*4.5],[2.13,-.02,s*4.5],.035);
      const tail=assembly('tailplane-'+s,'stabilizers',[4.6,.32,s*1.7],1.9,[s,.65]);const ts=[[s*.24,3.25,1.68,.27,.105],[s*2.65,4.45,.78,.49,.045]];mesh(tail.exterior,foil(ts),white);silhouette(tail,foil(ts));const ti=detail(tail,'stabilizer.spar');rod(ti,alloy,[3.8,.28,s*.3],[4.75,.49,s*2.58],.045);
      const elevator=assembly('elevator-'+s,'elevators',[5.1,.4,s*1.6],1.5,[s,.65]);const es=[[s*.35,4.96,.43,.28,.026],[s*2.63,5.25,.3,.49,.018]];hingeSurface(elevator,'elevator.hinge',es,[4.96,.28,s*.35],'z',.28,blue);silhouette(elevator,foil(es));
    }
    const fin=assembly('vertical-tail','fin',[4.5,1.5,0],1.8,[1.55,.16]);const fs=[[.34,3.35,1.95,0,.12],[1.7,4.05,1.13,0,.075],[3.02,4.8,.63,0,.035]];mesh(fin.exterior,foil(fs,true),blue);silhouette(fin,foil(fs,true));mesh(fin.exterior,foil([[2.72,4.66,.73,.003,.044],[3.02,4.8,.63,.003,.036]],true),orange);
    const fi=detail(fin,'fin.spar');rod(fi,alloy,[4,.4,0],[5.04,2.85,0],.045);for(let i=0;i<5;i++)rod(fi,alloy,[3.65+i*.25,.7+i*.42,0],[5.17+i*.04,.7+i*.42,0],.022);
    const rudder=assembly('rudder','rudder',[5.4,1.6,0],1.5,[1.5,.2]);const rs=[[.5,5.31,.4,0,.026],[1.7,5.2,.37,0,.025],[3,5.44,.2,0,.014]];hingeSurface(rudder,'rudder.hinge',rs,[5.3,.5,0],'y',.3,white,rudder.exterior,true);silhouette(rudder,foil(rs,true));
    const gear=assembly('landing-gear','gear',[-.6,-1.32,0],3.7,[1.0,.15]);
    const strut=detail(gear,'gear.strut',gear.exterior),wheels=detail(gear,'gear.wheel',gear.exterior),brakes=detail(gear,'gear.brake'),bay=detail(gear,'gear.bay');
    for(const [x,z,nose] of [[-4.52,0,true],[.6,-1.18,false],[.6,1.18,false]]){
      const top=nose?-.5:-.37,bottom=nose?-1.66:-1.58,r=nose?.24:.34;
      rod(strut,alloy,[x,top,z],[x,bottom,z],nose?.055:.085);rod(strut,dark,[x,top,z],[x,top-.45,z],nose?.079:.11);rod(strut,alloy,[x+.48,top,z],[x,bottom+.23,z],.039);rod(strut,alloy,[x,bottom,z-.31],[x,bottom,z+.31],.045);
      box(bay,dark,x,-.56,z,.75,.08,nose?.5:.72);box(bay,alloy,x,-.59,z-.29,.72,.2,.025);box(bay,alloy,x,-.59,z+.29,.72,.2,.025);for(const dz of [-1,1]){const zg=z+dz*(nose?.12:.23);const wheelGroup=new T.Group();wheels.add(wheelGroup);wheelGroup.position.set(x,bottom,zg);const tire=mesh(wheelGroup,new T.TorusGeometry(r*.72,r*.28,10,24),rubber);mesh(wheelGroup,new T.CylinderGeometry(r*.47,r*.47,.13,18),alloy).rotation.x=Math.PI/2;for(let j=0;j<5;j++){const t=j/5*Math.PI*2;box(wheelGroup,dark,Math.cos(t)*r*.28,Math.sin(t)*r*.28,dz*.075,.028,.028,.014);}motions.push({group:wheelGroup,axis:'z',amplitude:1,region:'gear',id:'gear.wheel',spin:true});if(!nose){const pack=new T.Group();pack.name='Coaxial multi-disc wheel brake';pack.userData.detail='gear.brake';pack.position.set(x,bottom,zg);brakes.add(pack);for(let disc=0;disc<3;disc++){const rotor=mesh(pack,new T.CylinderGeometry(.13,.13,.012,28),disc===1?dark:alloy,0,0,-dz*.026+(disc-1)*.017);rotor.rotation.x=Math.PI/2;}box(pack,alloy,.103,.036,-dz*.026,.067,.074,.079);box(pack,dark,.073,.036,-dz*.026,.016,.061,.055);rod(pack,alloy,[0,0,-dz*.06],[0,0,dz*.06],.034);}}
    }
    // One coarse silhouette for this assembly, never a cloned internal hierarchy.
    const gv=[];function appendGhost(geometry,x,y,z,rotate){if(rotate)geometry.rotateX(Math.PI/2);geometry.translate(x,y,z);const flat=geometry.index?geometry.toNonIndexed():geometry;gv.push(...flat.attributes.position.array);geometry.dispose();if(flat!==geometry)flat.dispose();}for(const [x,z,nose] of [[-4.52,0,true],[.6,-1.18,false],[.6,1.18,false]]){appendGhost(new T.CylinderGeometry(.08,.065,1.05,6),x,-1.05,z);for(const side of [-1,1])appendGhost(new T.CylinderGeometry(nose?.24:.34,nose?.24:.34,.16,10),x,nose?-1.66:-1.58,z+side*(nose?.12:.23),true);}const gg=new T.BufferGeometry();gg.setAttribute('position',new T.Float32BufferAttribute(gv,3));gg.computeVertexNormals();silhouette(gear,gg);
    // Publish detail identity on meshes as well as groups for controller fading/picking.
    root.traverse(o=>{if(!o.isMesh)return;let parent=o;while(parent){if(parent.userData.detail){o.userData.detail=parent.userData.detail;break;}parent=parent.parent;}parent=o;while(parent){if(parent.userData.assemblyId){o.userData.assemblyId=parent.userData.assemblyId;o.userData.region=parent.userData.region;break;}parent=parent.parent;}});
    let meshCount=0,triangles=0;root.traverse(o=>{if(o.isMesh){meshCount++;triangles+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3;}});
    function update(state={}){const time=Number(state.time)||0,active=state.mechanism;for(const m of motions){const match=active&&(state.region===m.region||state.region===undefined);const angle=match?(m.spin?time*1.8:Math.sin(time*1.25)*m.amplitude):0;if(m.spin)m.group.rotation.z=angle;else m.group.quaternion.setFromAxisAngle(m.axis,angle);}}
    return {root,assemblies,update,counts:{assemblies:assemblies.length,meshes:meshCount,triangles:Math.round(triangles)}};
  }};
})();

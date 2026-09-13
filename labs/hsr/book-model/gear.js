/* Original picture-book running gear. Local X runs along the train, Y up, Z across. */
(function () {
  'use strict';
  function assembly(T,id,region,x,y,radius) {
    const group=new T.Group(), exterior=new T.Group(), interior=new T.Group(), ghost=new T.Group(), details={};
    group.name=id; group.position.x=x; group.add(exterior,interior,ghost); interior.visible=ghost.visible=false;
    [group,exterior,interior,ghost].forEach(g=>g.userData={region,assemblyId:id,detail:null});
    return {id,region,group,exterior,interior,ghost,details,center:new T.Vector3(0,y,0),radius,update(){}};
  }
  function builder(T,a) {
    const materials={};
    function mat(c){return materials[c]||(materials[c]=new T.MeshStandardMaterial({color:c,roughness:.55,metalness:.42}));}
    function detail(id,layer=a.interior){const g=new T.Group();g.name=id;g.userData={region:a.region,assemblyId:a.id,detail:id};layer.add(g);a.details[id]=g;return g;}
    function mesh(parent,geo,c,p=[0,0,0],d){const m=new T.Mesh(geo,mat(c));m.position.set(...p);m.userData={region:a.region,assemblyId:a.id,detail:d||parent.userData.detail||null};m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
    function box(g,s,c,p,d){return mesh(g,new T.BoxGeometry(...s),c,p,d);}
    function cyl(g,r,h,c,p,axis='y',d){const m=mesh(g,new T.CylinderGeometry(r,r,h,20),c,p,d);if(axis==='z')m.rotation.x=Math.PI/2;if(axis==='x')m.rotation.z=Math.PI/2;return m;}
    function rod(g,p,q,r,c,d){const m=cyl(g,r,1,c,[0,0,0],'y',d);setRod(m,p,q);return m;}
    function setRod(m,p,q){const v=new T.Vector3(...q).sub(new T.Vector3(...p));m.position.set((p[0]+q[0])/2,(p[1]+q[1])/2,(p[2]+q[2])/2);m.scale.y=v.length();m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());}
    function instances(g,geo,c,poses,d){const m=new T.InstancedMesh(geo,mat(c),poses.length),o=new T.Object3D();poses.forEach((p,i)=>{o.position.set(...p);o.rotation.set(0,0,0);o.updateMatrix();m.setMatrixAt(i,o.matrix);});m.userData={region:a.region,assemblyId:a.id,detail:d||g.userData.detail||null};g.add(m);return m;}
    function silhouette(s,p){const m=box(a.ghost,s,0xb7c8cf,p);m.material=new T.MeshBasicMaterial({color:0xb7c8cf,transparent:true,opacity:.12,depthWrite:false});}
    return {detail,mesh,box,cyl,rod,setRod,instances,silhouette};
  }
  function createBogie(T,{id='bogie-front',x=-5.6}={}) {
    const a=assembly(T,id,'bogies',x,-1.04,1.9),b=builder(T,a),frame=b.detail('bogies.frame',a.exterior),wheels=b.detail('bogies.wheelset',a.exterior),springs=b.detail('bogies.airspring',a.exterior),rotors=[];
    for(const z of [-.50,.50])b.box(frame,[2.26,.16,.16],0x394349,[0,-.89,z]);
    b.box(frame,[.22,.16,1.16],0x48545a,[0,-.89,0]);
    for(const xx of [-.85,.85]) {
      const axle=new T.Group();axle.position.set(xx,-1.12,0);axle.userData={region:a.region,assemblyId:id,detail:'bogies.wheelset'};wheels.add(axle);rotors.push(axle);
      b.cyl(axle,.071,1.85,0x8a959b,[0,0,0],'z');
      for(const z of [-.70,.70]) {
        b.cyl(axle,.36,.13,0x586268,[0,0,z],'z');
        b.cyl(axle,.375,.029,0x9fa9ae,[0,0,z-Math.sign(z)*.065],'z');
        b.cyl(axle,.24,.139,0x313c42,[0,0,z],'z');
        b.cyl(axle,.105,.164,0xaab3b5,[0,0,z],'z');
        const poses=Array.from({length:6},(_,i)=>[.073*Math.cos(i*Math.PI/3),.073*Math.sin(i*Math.PI/3),z+Math.sign(z)*.09]);
        b.instances(axle,new T.SphereGeometry(.018,6,4),0xd2d9d9,poses,'bogies.wheelset');
        b.box(frame,[.23,.20,.19],0x535f63,[xx,-1.1,z+Math.sign(z)*.14]);
        const spring=b.mesh(springs,new T.TorusGeometry(.085,.019,5,12),0xb1b6ac,[xx,-.91,z+Math.sign(z)*.14]);spring.rotation.x=Math.PI/2;
      }
      for(const z of [-.34,.34]) {b.cyl(a.interior,.238,.036,0xbcc1bc,[xx,-1.12,z],'z','bogies.wheelset');b.box(a.interior,[.15,.15,.095],0x6f7777,[xx+.18,-1.05,z],'bogies.wheelset');}
    }
    for(const z of [-.51,.51]) {b.cyl(springs,.24,.14,0x202e35,[0,-.70,z]);b.cyl(springs,.245,.035,0x778286,[0,-.61,z]);}
    b.silhouette([2.45,.38,1.8],[0,-.98,0]);
    a.update=({time=0,mechanism=false,region,spin=0,level=0}={})=>{const active=mechanism&&region===a.region;rotors.forEach(g=>g.rotation.z=active?time*(spin||1.4):0);springs.position.y=active?Math.sin(time*3)*.025*Math.max(.2,level):0;};
    return a;
  }
  function createMotor(T,{id='motor-front',x=-5.6}={}) {
    const a=assembly(T,id,'motors',x,-1.02,1.25),b=builder(T,a),motor=b.detail('motors.motor'),gears=b.detail('motors.gearbox'),cool=b.detail('motors.cooling'),rotor=new T.Group();
    rotor.userData={region:a.region,assemblyId:id,detail:'motors.motor'};motor.add(rotor);
    b.cyl(a.exterior,.265,.70,0x78858a,[-.39,-1.03,0],'z','motors.motor');
    const fins=Array.from({length:8},(_,i)=>[-.39,-1.03,-.31+i*.09]);
    const finGeo=new T.CylinderGeometry(.282,.282,.018,16);finGeo.rotateX(Math.PI/2);b.instances(a.exterior,finGeo,0x657378,fins,'motors.cooling');
    b.cyl(rotor,.123,.78,0xb2b9b6,[-.39,-1.03,0],'z');
    const coilGeo=new T.TorusGeometry(.19,.032,7,20);
    b.instances(motor,coilGeo,0xd48b43,Array.from({length:7},(_,i)=>[-.39,-1.03,-.28+i*.093]),'motors.motor');
    b.box(a.exterior,[.67,.41,.17],0x68767c,[-.61,-1.05,.43],'motors.gearbox');
    const small=b.cyl(gears,.12,.08,0xbdb9a5,[-.39,-1.03,.43],'z'),large=b.cyl(gears,.235,.08,0xa9b1b0,[-.85,-1.12,.43],'z');
    for(const [g,r,count] of [[small,.13,10],[large,.248,16]]) {const poses=Array.from({length:count},(_,i)=>[r*Math.cos(i*2*Math.PI/count),0,r*Math.sin(i*2*Math.PI/count)]);b.instances(g,new T.BoxGeometry(.044,.08,.044),0xc0c5bf,poses,'motors.gearbox');}
    b.rod(gears,[-.85,-1.12,-.56],[-.85,-1.12,.56],.061,0xadb7b5);
    b.box(cool,[.48,.12,.56],0x9da9a9,[-.39,-.70,0]);
    b.rod(cool,[-.39,-.75,-.3],[-.39,-.99,-.3],.08,0x697d83);
    b.cyl(cool,.17,.04,0x40545c,[-.39,-1.03,-.39],'z');
    b.silhouette([.66,.55,.78],[-.39,-1.03,0]);
    a.update=({time=0,mechanism=false,region,spin=0}={})=>{const angle=mechanism&&region===a.region?time*(spin||2):0;small.rotation.y=angle;large.rotation.y=-angle*.51;rotor.position.x=0;rotor.rotation.z=0;/* rotor spins about its own shaft */rotor.children[0].rotation.y=angle;};return a;
  }
  function createPantograph(T) {
    const a=assembly(T,'pantograph','pantograph',3,2.5,1.7),b=builder(T,a),ins=b.detail('panto.insulator',a.exterior),arm=b.detail('panto.arm',a.exterior),head=b.detail('panto.head',a.exterior);
    b.box(ins,[1.65,.065,1.10],0x718083,[0,1.795,0]);
    const skirts=[];for(const xx of [-.57,.57])for(const z of [-.34,.34]) {b.cyl(ins,.075,.21,0x745342,[xx,1.93,z]);for(let i=0;i<3;i++)skirts.push([xx,1.86+i*.065,z]);}
    b.instances(ins,new T.CylinderGeometry(.115,.13,.033,12),0x836552,skirts);
    b.box(arm,[1.35,.08,.70],0x35444b,[0,2.04,0]);
    const bars=[];for(const z of [-.22,.22]) {bars.push(b.rod(arm,[-.5,2.08,z],[.36,2.54,z],.037,0x28343c));bars.push(b.rod(arm,[.36,2.54,z],[-.42,3.0,z],.030,0x28343c));}
    const joint=b.cyl(arm,.079,.56,0x748084,[.36,2.54,0],'z');
    b.box(head,[.13,.045,1.40],0xb1bbba,[-.42,3,0]);
    b.box(head,[.085,.018,1.36],0x424e52,[-.42,3.032,0]);
    for(const z of [-1,1])b.rod(head,[-.42,3,z*.70],[-.42,2.90,z*.91],.025,0x939f9f);
    b.rod(a.interior,[-.58,2.09,0],[.16,2.39,0],.057,0xc2c6b6,'panto.arm');
    b.silhouette([1.85,.08,1.18],[0,1.8,0]);
    a.update=({mechanism=false,region,level=0}={})=>{const v=mechanism&&region===a.region?Math.max(0,Math.min(1,Number(level)||0)):0;const mid=[.36-.16*v,2.54+.25*v],top=[-.42,3+.5*v];let n=0;for(const z of [-.22,.22]) {b.setRod(bars[n++],[-.5,2.08,z],[...mid,z]);b.setRod(bars[n++],[...mid,z],[...top,z]);}joint.position.set(mid[0],mid[1],0);head.position.y=.5*v;};return a;
  }
  function createCoupler(T) {
    const a=assembly(T,'coupler','coupler',8.25,-.60,.9),b=builder(T,a),head=b.detail('coupler.head',a.exterior),buffer=b.detail('coupler.buffer');
    b.box(head,[.46,.29,.40],0x4c5c64,[.15,-.60,0]);b.cyl(head,.09,.055,0x222f37,[.40,-.60,.085],'x');b.box(head,[.055,.095,.12],0xa8b4b6,[.41,-.63,-.09]);
    b.cyl(a.exterior,.15,.50,0x6f7f85,[-.32,-.60,0],'x','coupler.buffer');
    const rings=new T.CylinderGeometry(.18,.18,.055,16);rings.rotateZ(Math.PI/2);b.instances(buffer,rings,0x535e63,Array.from({length:6},(_,i)=>[-.58+i*.075,-.60,0]));
    b.cyl(buffer,.065,.62,0xb9c2bd,[-.32,-.60,0],'x');b.silhouette([.95,.33,.43],[-.1,-.6,0]);
    a.update=({mechanism=false,region,level=0}={})=>{head.position.x=mechanism&&region===a.region?-.12*Math.max(0,Math.min(1,level)):0;};return a;
  }
  function createTrack(T,{from=-13,to=11}={}) {
    const a=assembly(T,'track','track',(from+to)/2,-1.65,(to-from)/2),b=builder(T,a),length=Math.max(.1,to-from);
    for(const z of [-.70,.70]) {b.box(a.exterior,[length,.065,.085],0xa3aeb0,[0,-1.5125,z]);b.box(a.exterior,[length,.10,.034],0x717c7c,[0,-1.595,z]);b.box(a.exterior,[length,.035,.15],0x818a86,[0,-1.6625,z]);}
    b.instances(a.exterior,new T.BoxGeometry(.20,.12,2.30),0xaaa99b,Array.from({length:Math.ceil(length/.65)},(_,i)=>[-length/2+.30+i*.65,-1.75,0]),'track.sleepers');a.group.name='train-display-track';return a.group;
  }
  window.BookTrainGear={createBogie,createMotor,createPantograph,createCoupler,createTrack};
}());

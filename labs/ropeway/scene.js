(function(){
'use strict';
const T=window.THREE,M=window.RopewayModel;
function create(stage){
  const scene=new T.Scene();scene.background=new T.Color('#e6efec');
  scene.add(new T.HemisphereLight(0xffffff,0x527065,2));
  const sun=new T.DirectionalLight(0xffffff,2.3);sun.position.set(-12,30,20);scene.add(sun);
  const renderer=new T.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
  renderer.outputColorSpace=T.SRGBColorSpace;stage.append(renderer.domElement);
  const camera=new T.PerspectiveCamera(42,1,.1,180);
  const world=new T.Group();scene.add(world);
  const palette={steel:0x637c85,rope:0x263e49,rail:0xcbd5d5,teal:0x146f75,coral:0xef755b,glass:0x9fc4cb,gold:0xf4c464,black:0x243e45,grass:0xadc9b1};
  const materials={};Object.entries(palette).forEach(([k,c])=>materials[k]=new T.MeshStandardMaterial({color:c,roughness:.65,metalness:k==='steel'||k==='rail'?.45:.12}));
  materials.glass.transparent=true;materials.glass.opacity=.64;
  function mesh(g,mat,parent=world,pos=[0,0,0]){const m=new T.Mesh(g,materials[mat]||mat);m.position.set(...pos);parent.add(m);return m;}
  function box(w,h,d,pos,mat='steel',p=world){return mesh(new T.BoxGeometry(w,h,d),mat,p,pos);}
  function cyl(r,h,pos,mat='steel',p=world){return mesh(new T.CylinderGeometry(r,r,h,16),mat,p,pos);}
  function torus(r,t,pos,mat='steel',p=world){const o=mesh(new T.TorusGeometry(r,t,7,36),mat,p,pos);return o;}
  function beam(a,b,r=.07,p=world,mat='steel'){
    const v1=new T.Vector3(...a),v2=new T.Vector3(...b),delta=v2.clone().sub(v1);
    const o=mesh(new T.CylinderGeometry(r,r,delta.length(),8),mat,p,v1.clone().add(v2).multiplyScalar(.5).toArray());
    o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return o;
  }
  class Path extends T.Curve{constructor(fn){super();this.fn=fn;}getPoint(t,target=new T.Vector3()){return target.set(...this.fn(t));}}
  function tube(fn,rad=.05,mat='rail',parent=world,n=160){return mesh(new T.TubeGeometry(new Path(fn),n,rad,6,false),mat,parent);}
  const ground=box(34,.5,14,[0,-.5,0],'grass');
  // Sloped terrain is scenery; support foundations remain visible.
  for(const [x,y,r] of [[-14,-.3,5],[15,3.3,5],[4,-.4,4]]){
    const hill=mesh(new T.ConeGeometry(r,4,7),new T.MeshStandardMaterial({color:0xb1c5ae,roughness:1}),world,[x,y,4.8]);hill.scale.z=.7;
  }
  const stations=[],roofGroups=[],conveyors=[],towerRollers=[];
  function carrierRail(s,side){
    const ids=['support','detach','decelerate','board','accelerate','couple','check'];
    const points=[];
    ids.forEach(id=>{for(let i=0;i<=24;i++)points.push(M.stationPoint(id,i/24,s));});
    const result=[];
    points.forEach((p,i)=>{
      const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],len=Math.hypot(b[0]-a[0],b[2]-a[2])||1;
      result.push(new T.Vector3(p[0]-(b[2]-a[2])/len*side*.3,p[1]+.15,p[2]+(b[0]-a[0])/len*side*.3));
    });
    mesh(new T.TubeGeometry(new T.CatmullRomCurve3(result),180,.065,6,false),'rail');
  }
  for(const s of [-1,1]){
    const y=s===1?8:4,station=new T.Group();world.add(station);stations.push(station);
    box(6.8,.32,6.7,[s*10,y-2.85,0],'rail',station);
    box(5,.08,1.3,[s*10.3,y-2.65,s*3.1],'gold',station);
    for(const x of [7.2,12.3])for(const z of [-3.25,3.25])beam([s*x,y-2.45,z],[s*x,y+1.2,z],.1,station);
    for(const x of [8,10,12])beam([s*x,y+.95,-3.3],[s*x,y+.95,3.3],.09,station);
    const roof=new T.Group();station.add(roof);roofGroups.push(roof);
    const roofMat=new T.MeshStandardMaterial({color:0x5c9392,transparent:true,opacity:.28,side:T.DoubleSide,roughness:.8});
    box(6.7,.12,6.9,[s*10,y+1.25,0],roofMat,roof);
    carrierRail(s,-1);carrierRail(s,1);
    for(const id of ['decelerate','board','accelerate']){
      const phase=M.phases.find(p=>p.id===id&&p.station===s);
      for(let i=0;i<=8;i++){
        const u=(i+.3)/9,p=phase.point(u),a=phase.point(Math.max(0,u-.005)),b=phase.point(Math.min(1,u+.005));
        const group=new T.Group();group.position.set(p[0],p[1]+.74,p[2]);group.rotation.y=Math.atan2(b[0]-a[0],b[2]-a[2]);world.add(group);
        const wheel=cyl(.24,.18,[0,0,0],'black',group);wheel.rotation.z=Math.PI/2;
        const mark=box(.26,.035,.045,[0,.22,0],'gold',group);conveyors.push({group,wheel,mark,s,id,speed:M.stationSpeed(id,u)});
      }
    }
    // Wheel catches are geometry, not a reproduction of a certified sensor.
    const check=box(.28,.7,.38,[s*7.7,y+.55,s*1.4],'teal',station);station.userData.check=check;
    box(.13,1.05,.13,[s*7.7,y+.25,s*1.78],'steel',station);
  }
  for(const x of [-4,4]){
    const p=M.linePoint((x+7)/14),y=p[1];
    box(1.3,.3,1.4,[x,-.12,0],'rail');
    beam([x,0,0],[x,y-.7,0],.25);
    beam([x,y-.7,0],[x,y-.65,-1.4],.14);beam([x,y-.7,0],[x,y-.65,1.4],.14);
    for(const z of [-1.4,1.4]){
      box(1.7,.14,.2,[x,y-.62,z],'steel');
      for(let i=0;i<4;i++){
        const rx=x+(i-1.5)*.4,ry=M.linePoint((rx+7)/14)[1]-.25;
        const wheel=cyl(.25,.16,[rx,ry,z],'black');wheel.rotation.x=Math.PI/2;
        const mark=box(.04,.32,.17,[0,0,0],'rail',wheel);towerRollers.push({wheel,mark,z});
      }
    }
    beam([x-.7,y-.55,0],[x-.7,.2,0],.035);
    for(let k=0;k<8;k++)beam([x-.7,k*(y-.7)/8,0],[x-.5,k*(y-.7)/8,0],.025);
  }
  function bullwheel(parent,x,y){
    const group=new T.Group();group.position.set(x,y,0);parent.add(group);
    const rim=torus(1.4,.11,[0,0,0],'teal',group);rim.rotation.x=Math.PI/2;
    cyl(.28,.28,[0,0,0],'steel',group);
    for(let i=0;i<8;i++){const spoke=box(2.6,.08,.08,[0,0,0],'steel',group);spoke.rotation.y=i*Math.PI/4;}
    return group;
  }
  const driveFrame=new T.Group();world.add(driveFrame);
  for(const z of [-.85,.85])beam([-11.8,3.4,z],[-8.4,3.4,z],.08);
  box(3.8,.16,2.25,[-10,3.6,0],'steel',driveFrame);
  const drive=bullwheel(driveFrame,-10,4),returnWheel=bullwheel(world,10,8);
  beam([-10,4,0],[-10,5,0],.14,driveFrame);
  box(1.2,.9,.85,[-10,5.1,0],'coral',driveFrame);
  const motor=cyl(.34,1.1,[-8.1,5.1,0],'teal',driveFrame);motor.rotation.z=Math.PI/2;
  beam([-10,5.1,0],[-8.5,5.1,0],.13,driveFrame);
  const flywheel=torus(.43,.055,[-8.8,5.1,0],'steel',driveFrame);flywheel.rotation.y=Math.PI/2;
  const servicePads=[-.48,.48].map(z=>box(.3,.22,.18,[-8.8,5.1,z],'coral',driveFrame));
  const safetyPads=[-.25,.25].map(y=>box(.25,.15,.42,[-8.62,4+y,0],'coral',driveFrame));
  const aux=box(.65,.5,.65,[-10,4.7,-1.95],'gold',driveFrame);
  const pinion=cyl(.22,.25,[-10,4.08,-1.55],'gold',driveFrame);
  beam([-10,4.7,-1.95],[-10,4.15,-1.55],.07,driveFrame);
  const rope=mesh(new T.TubeGeometry(new Path(u=>M.ropePoint(u,0)),256,.035,6,true),'rope');
  const markers=Array.from({length:14},()=>new T.Object3D());
  const markerMesh=new T.InstancedMesh(new T.SphereGeometry(.09,7,5),materials.gold,14);world.add(markerMesh);
  const cars=[];
  for(let i=0;i<8;i++){
    const car=new T.Group();world.add(car);
    const mat=new T.MeshStandardMaterial({color:i===0?0xef755b:0x146f75,roughness:.5,metalness:.15});
    box(.9,1.28,.85,[0,-1.83,0],mat,car);
    box(.92,.15,.88,[0,-1.12,0],'steel',car);
    box(.83,.67,.89,[0,-1.63,0],'glass',car);
    for(const x of [-.44,.44])box(.045,.78,.89,[x,-1.6,0],mat,car);
    box(.035,.72,.92,[0,-1.61,0],mat,car);
    box(.88,.14,.84,[0,-2.51,0],'steel',car);
    beam([0,-1.1,0],[0,-.15,0],.07,car);
    beam([0,-.15,0],[0,.27,0],.07,car);
    box(.65,.1,.72,[0,.49,0],'steel',car);
    const wheels=[];
    for(const x of [-.3,.3])for(const z of [-.24,.24]){
      const w=cyl(.23,.13,[x,.4,z],'black',car);w.rotation.z=Math.PI/2;wheels.push(w);
    }
    // Enlarged jaw and two exposed springs: mechanism illustration.
    box(.12,.16,.48,[-.1,0,0],'steel',car);
    const jaw=new T.Group();jaw.position.set(.25,.1,0);car.add(jaw);box(.12,.16,.48,[-.15,-.1,0],'coral',jaw);
    for(const z of [-.22,.22]){
      tube(u=>[-.1+.04*Math.sin(u*Math.PI*14),.2+.04*Math.cos(u*Math.PI*14),z+u*.16],.012,'black',car,44);
    }
    cars.push({group:car,jaw,wheels});
  }
  // Bake stationary pieces once. Moving assemblies retain their own transforms.
  function batch(parent,excluded=new Set()){
    parent.updateMatrixWorld(true);const inverse=parent.matrixWorld.clone().invert(),groups=new Map();
    for(const o of [...parent.children]){
      if(!o.isMesh||o.isInstancedMesh||excluded.has(o)||o.material.transparent)continue;
      const key=o.material.uuid;if(!groups.has(key))groups.set(key,{material:o.material,objects:[]});groups.get(key).objects.push(o);
    }
    for(const {material,objects} of groups.values()){
      if(objects.length<2)continue;
      const positions=[],normals=[],uvs=[],v=new T.Vector3(),n=new T.Vector3();
      for(const o of objects){
        const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry,matrix=inverse.clone().multiply(o.matrixWorld),normal=new T.Matrix3().getNormalMatrix(matrix);
        const p=g.getAttribute('position'),na=g.getAttribute('normal'),uv=g.getAttribute('uv');
        for(let i=0;i<p.count;i++){
          v.fromBufferAttribute(p,i).applyMatrix4(matrix);positions.push(v.x,v.y,v.z);
          n.fromBufferAttribute(na,i).applyMatrix3(normal).normalize();normals.push(n.x,n.y,n.z);
          uvs.push(uv?uv.getX(i):0,uv?uv.getY(i):0);
        }
        parent.remove(o);if(g!==o.geometry)g.dispose();o.geometry.dispose();
      }
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));g.computeBoundingSphere();mesh(g,material,parent);
    }
  }
  cars.forEach(o=>batch(o.group,new Set([o.jaw,...o.wheels])));
  stations.forEach(o=>batch(o,new Set([o.userData.check])));
  batch(drive);batch(returnWheel);
  aux.material=aux.material.clone();
  batch(driveFrame,new Set([flywheel,...servicePads,...safetyPads,aux,pinion]));
  const conveyorWheelMesh=new T.InstancedMesh(conveyors[0].wheel.geometry,materials.black,conveyors.length);
  const conveyorMarkMesh=new T.InstancedMesh(conveyors[0].mark.geometry,materials.gold,conveyors.length);
  conveyors.forEach(o=>world.remove(o.group));world.add(conveyorWheelMesh,conveyorMarkMesh);
  const towerWheelMesh=new T.InstancedMesh(towerRollers[0].wheel.geometry,materials.black,towerRollers.length);
  const towerMarkMesh=new T.InstancedMesh(towerRollers[0].mark.geometry,materials.rail,towerRollers.length);
  towerRollers.forEach(o=>world.remove(o.wheel));world.add(towerWheelMesh,towerMarkMesh);
  batch(world,new Set([rope]));
  for(const o of [markerMesh,conveyorWheelMesh,conveyorMarkMesh,towerWheelMesh,towerMarkMesh])o.frustumCulled=false;
  let stretch=-1;
  function update(snapshot,cutaway=true){
    const travel=snapshot.time*M.LINE_SPEED;
    if(stretch!==snapshot.stretch){
      stretch=snapshot.stretch;driveFrame.position.x=-.3*stretch;
      rope.geometry.dispose();rope.geometry=new T.TubeGeometry(new Path(u=>M.ropePoint(u,stretch)),256,.035,6,true);
    }
    drive.rotation.y=-travel/1.4;returnWheel.rotation.y=-travel/1.4;flywheel.rotation.x=travel/.43;pinion.rotation.y=snapshot.drive==='auxiliary'?-travel/.22:0;
    markers.forEach((o,i)=>{o.position.set(...M.ropePoint(i/markers.length+travel/M.ropeLength(snapshot.stretch),snapshot.stretch));o.updateMatrix();markerMesh.setMatrixAt(i,o.matrix);});markerMesh.instanceMatrix.needsUpdate=true;
    snapshot.cars.forEach((c,i)=>{
      const o=cars[i];o.group.position.set(...c.position);o.group.rotation.y=c.heading;
      o.jaw.rotation.z=(1-c.grip)*.9;o.wheels.forEach(w=>w.rotation.x=-snapshot.time*c.speed/.23);
    });
    conveyors.forEach((o,i)=>{o.wheel.rotation.x=-snapshot.time*o.speed/.24;o.mark.rotation.x=o.wheel.rotation.x;o.mark.position.y=.22*Math.cos(o.wheel.rotation.x);o.mark.position.z=.22*Math.sin(o.wheel.rotation.x);o.group.updateMatrixWorld(true);conveyorWheelMesh.setMatrixAt(i,o.wheel.matrixWorld);conveyorMarkMesh.setMatrixAt(i,o.mark.matrixWorld);});
    towerRollers.forEach((o,i)=>{o.wheel.rotation.y=(o.z<0?-1:1)*travel/.25;o.wheel.updateMatrixWorld(true);towerWheelMesh.setMatrixAt(i,o.wheel.matrixWorld);towerMarkMesh.setMatrixAt(i,o.mark.matrixWorld);});
    for(const o of [conveyorWheelMesh,conveyorMarkMesh,towerWheelMesh,towerMarkMesh])o.instanceMatrix.needsUpdate=true;
    servicePads.forEach((o,i)=>o.position.z=(i?1:-1)*(snapshot.brakes?.37:.48));
    safetyPads.forEach((o,i)=>o.position.y=4+(i?1:-1)*(snapshot.brakes?.13:.25));
    aux.material.emissive.set(snapshot.drive==='auxiliary'?0x554100:0x000000);
    stations.forEach(s=>s.userData.check.material=materials[snapshot.fault==='grip'?'coral':'teal']);
    roofGroups.forEach(o=>o.visible=!cutaway);
  }
  function render(view){
    const rect=stage.getBoundingClientRect(),w=rect.width,h=rect.height;
    if(renderer.domElement.width!==Math.round(w*renderer.getPixelRatio())||renderer.domElement.height!==Math.round(h*renderer.getPixelRatio())){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
    const target=new T.Vector3(...view.target),r=view.fit?view.distance*Math.max(1,1.6/(w/h)):view.distance;
    camera.position.set(target.x+r*Math.cos(view.pitch)*Math.sin(view.yaw),target.y+r*Math.sin(view.pitch),target.z+r*Math.cos(view.pitch)*Math.cos(view.yaw));camera.lookAt(target);
    renderer.render(scene,camera);
  }
  function visualState(){
    rope.geometry.computeBoundingBox();
    return {frameX:driveFrame.position.x,ropeMinX:rope.geometry.boundingBox.min.x,
      safetyGap:Math.abs(safetyPads[0].position.y-4),serviceGap:Math.abs(servicePads[0].position.z),
      auxiliaryGlow:aux.material.emissive.getHex(),
      conveyors:conveyors.filter(o=>o.s===1).map(o=>({phase:o.id,speed:o.speed,angle:o.wheel.rotation.x}))};
  }
  return {scene,renderer,camera,world,update,render,visualState,cars,driveFrame,rope,stations,conveyors,towerRollers};
}
window.RopewayScene={create};
})();

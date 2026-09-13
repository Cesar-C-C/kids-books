/* Aircraft-specific inspection poses. Zoom never changes these openings. */
window.AirplaneInspection = (() => {
 const originals=new WeakMap(),poses=new Map();
 const local={
  'cabin.frames':{point:[-2.7,0,0],radius:1.05,yaw:0,pitch:.35},
  'cabin.floor':{point:[-2.7,-.29,0],radius:.9,yaw:0,pitch:.85},
  'cabin.seats':{point:[-2.67,.02,.44],radius:.64,yaw:-.65,pitch:.6},
  'cabin.cargo':{point:[-2.75,-.51,-.18],radius:.55,yaw:0,pitch:-.12},
  'cockpit.seats':{point:[-4.43,.10,0],radius:.65,yaw:-.6,pitch:.6},
  'cockpit.panel':{point:[-5,.14,0],radius:.61,yaw:.5,pitch:.45},
  'cockpit.controls':{point:[-4.85,-.04,0],radius:.54,yaw:.65,pitch:.65},
  'gear.strut':{point:[.92,-1.16,1.18],radius:.77,yaw:.5,pitch:.04},
  'gear.wheel':{point:[.92,-1.72,1.35],radius:.46,yaw:.25,pitch:.05},
  'gear.brake':{point:[.92,-1.72,1.35],radius:.35,yaw:.8,pitch:.1},
  'gear.bay':{point:[-4.05,-.77,0],radius:.62,yaw:-.7,pitch:-.55}
 };
 function plan(p,a){
  const d=a.inspectionDetail,s=Math.sign(a.center.z)||1;
  if(a.region==='cockpit'){p.inside=['flight-deck'];p.move={'flight-deck':[0,3,-4]};}
  if(a.region==='gear'){p.cut=[];p.label='查看起落架结构';if(d==='gear.bay'){p.move={cabin:[0,3,-4],'flight-deck':[0,3,-4]};}}
  if(a.region==='wings'){p.move={};p.nodes=[{id:a.id,name:'wing-cover',offset:[0,4,-s*8]}];p.label='移开固定蒙皮';}
  if(a.region==='fin')p.move[a.id]=[0,1.8,-3];
  if(a.region==='stabilizers')p.move[a.id]=[0,3,-s*5];
  if(['ailerons','elevators','rudder'].includes(a.region)){p.cut=[];p.label='查看铰链与连接';}
  if(a.region==='engines')p.nodes=[{id:a.id,name:'nacelle-near-half',offset:[0,2.3,3]},{id:a.id,name:'nacelle-far-half',offset:[0,2.3,-3]}];
  return p;
 }
 function focus(T,a,d,objects){
  if(local[d])return {...local[d],point:a.group.localToWorld(new T.Vector3(...local[d].point))};
  const box=new T.Box3();objects.forEach(g=>box.expandByObject(g));
  const point=box.isEmpty()?a.group.localToWorld(a.center.clone()):box.getCenter(new T.Vector3());
  let radius=box.isEmpty()?a.radius:box.getBoundingSphere(new T.Sphere()).radius;
  let yaw=0,pitch=.45;const s=Math.sign(a.group.position.z||a.center.z)||1;
  if(a.region==='engines'){
   yaw=s>0?0:Math.PI;pitch=.04;
   if(['engine.inlet','engine.fan'].includes(d)){yaw=-Math.PI/2;pitch=.03;}
   if(d==='engine.nozzle')yaw=Math.PI/2;
   radius=Math.max(.30,radius*1.16);
  }else if(['wings','ailerons','stabilizers','elevators'].includes(a.region)){
   yaw=s>0?.12:Math.PI-.12;pitch=.95;
   if(d==='aileron.linkage'){pitch=-.45;yaw=s>0?.2:Math.PI-.2;radius=.42;}
   if(d==='wing.ribs'){const ribs=objects[0]?.children;if(ribs?.length){const b=new T.Box3().setFromObject(ribs[4]);b.getCenter(point);radius=b.getBoundingSphere(new T.Sphere()).radius*1.1;pitch=.48;yaw=s>0?-.35:Math.PI+.35;}}
  }else if(['fin','rudder'].includes(a.region)){yaw=.1;pitch=.1;}
  else if(a.region==='gear'){point.set(.92,-1.2,1.18);radius=1;yaw=.4;pitch=.1;}
  return {point,radius:Math.max(.32,radius),yaw,pitch};
 }
 function apply(T,active,d,opened,assemblies,surfaces){
  for(const [o,p]of poses)o.position.copy(p);
  // A removed wheel is parked beside its axle only during explicit brake inspection.
  if(opened&&d==='gear.brake'){
   const wheels=active.details['gear.wheel'];for(const o of wheels.children){if(o.name==='Main wheel'&&o.position.z>1.2){if(!poses.has(o))poses.set(o,o.position.clone());o.position.add(new T.Vector3(-.85,0,.12));}}
  }
  const engine=opened&&active?.region==='engines',shaft=engine&&d==='engine.shaft';
  const section=engine&&['engine.compressor','engine.combustor','engine.turbine','engine.shaft','engine.bypass'].includes(d);
  const normal=new T.Vector3(0,0,active?.group.position.z>0?-1:1);
  const plane=section?new T.Plane().setFromNormalAndCoplanarPoint(normal,active.group.localToWorld(new T.Vector3(0,0,0))):null;
  for(const s of surfaces){
   if(opened&&['cabin.floor','cabin.seats','cabin.cargo'].includes(d)&&s.detail==='cabin.frames')for(const m of s.materials)m.clippingPlanes=[new T.Plane(new T.Vector3(0,0,-1),0)];
   // Open the near half of surrounding core components, preserving the whole shaft.
   if(section&&s.assembly===active&&s.detail!=='engine.shaft'&&((shaft&&!/nacelle/.test(s.object.parent?.name||''))||['engine.combustor','engine.bypass'].includes(s.detail)))for(const m of s.materials)m.clippingPlanes=[plane];
   for(const m of s.materials){if(!m.emissive)continue;if(!originals.has(m))originals.set(m,{color:m.emissive.clone(),intensity:m.emissiveIntensity});const base=originals.get(m);m.emissive.copy(base.color);m.emissiveIntensity=base.intensity;if(opened&&d&&s.assembly===active&&s.detail===d){m.emissive.setHex(0x386c68);m.emissiveIntensity=.22;}}
  }
 }
 return {plan,focus,apply};
})();

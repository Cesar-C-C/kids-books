/* School-bus inspection poses keep each target in its installed context. */
window.SchoolBusInspection=(()=>{
 const local={
 'body.shell':[[1.35,-.48,1.23],1.22,.12,.1],'body.windows':[[-.82,.42,1.26],.77,-.12,.12],
 'body.rubrail':[[.45,-.25,1.26],.80,0,.08],'body.skirt':[[.16,-1.57,1.25],1.48,0,.07],
 'roof.hatch':[[-.65,1.57,0],.65,.3,1.05],'roof.beacon':[[.6,1.2,0],1.23,.3,.15],
 'hood.cover':[[-3.65,-.78,0],1.8,-1.95,.32],
 'hood.grille':[[-4.96,-.93,0],.73,-Math.PI/2,.12],'hood.headlight':[[-4.99,-1.08,-.81],.31,-1.9,.14],
 'hood.bumper':[[-4.94,-1.55,0],1.34,-Math.PI/2,.14],'hood.engine':[[-3.58,-.77,0],.88,-.2,.6],
 'hood.radiator':[[-4.38,-.82,0],.75,-.55,.40],
 'cab.wheel':[[-1.68,-.37,.42],.66,.50,.7],'cab.dash':[[-2.08,-.02,.42],.48,1.1,.35],
 'cab.seat':[[-1.32,-.50,.42],.80,-.15,.38],'cab.glass':[[-2.63,.40,0],1.24,-1.78,.17],
 'cab.mirror':[[-3.35,.34,1.38],.34,.8,.2],
 'doors.leaf':[[-1.72,-.32,-1.31],1.49,Math.PI,.12],'doors.glass':[[-1.94,.32,-1.31],.78,Math.PI-.14,.06],
 'doors.step':[[-1.72,-1.42,-.73],.74,Math.PI,.58],'doors.emergency':[[4.26,-.12,0],1.28,Math.PI/2,.15],
 'seats.cushion':[[-.40,-.78,.62],.54,-.55,.85],'seats.back':[[-.10,-.30,.62],.63,-.6,.25],
 'seats.belt':[[-.25,-.34,.62],.59,-.65,.30],'seats.frame':[[-.40,-1.05,.62],.43,-.4,.03],
 'aisle.floor':[[.45,-1.20,0],.98,-.35,1.27],'aisle.handrail':[[-1.2,-.74,-.84],.67,2.95,.23],
 'aisle.rear':[[3.6,-1.14,0],.73,-.55,.92],
 'stopsign.blade':[[.60,-.32,-1.37],.45,Math.PI,.05],'stopsign.arm':[[.21,-.32,-1.36],.36,Math.PI-.45,.16],
 'stopsign.lamp':[[.6,-.10,-1.38],.24,Math.PI,.1],
 'lights.red':[[-2.70,1.17,-.65],.24,-Math.PI/2,.12],'lights.amber':[[-2.70,1.17,-.96],.24,-Math.PI/2,.12],
 'lights.bracket':[[-2.65,1.17,-.81],.49,-Math.PI/2,.20],
 'wheels.tire':[[2.30,-1.63,1.14],.78,.2,.06],'wheels.tread':[[2.72,-1.88,1.14],.45,.95,.05],
 'wheels.hub':[[2.30,-1.63,1.38],.45,0,.02],'wheels.arch':[[2.30,-1.34,1.29],.89,0,.08]
 };
 function plan(p,a){const d=a.inspectionDetail;p.cut=[];p.nodes=[];p.move={};p.inside=['seats','cab','aisle'];p.label='展开观察细节';p.key=a.id;
  if(['seats','aisle','cab'].includes(a.region)&&!['cab.glass','cab.mirror'].includes(d)){
   p.key='cabin';p.label='打开车厢';p.move={body:[0,.8,-4],roof:[0,3,-4]};p.nodes=[{id:'cab',name:'cab.glass',offset:[0,2,-4]}];
  }
  if(a.region==='body'&&!d){p.key='cabin';p.label='打开车厢';p.move={body:[0,.8,-4],roof:[0,3,-4]};}
  if(a.region==='roof'&&d==='roof.beacon'){p.move.roof=[0,2,-4];p.inside.push('roof');}
  if(a.region==='hood'&&(!d||['hood.engine','hood.radiator'].includes(d))){p.label='打开发动机舱盖';p.move.hood=[0,2.7,-3.5];p.inside.push('hood');}
  return p;
 }
 function focus(T,a,d,objects){
  const spec=local[d];if(spec)return {point:a.group.localToWorld(new T.Vector3(...spec[0])),radius:spec[1],yaw:spec[2],pitch:spec[3]};
  if(!d&&a.region==='stopsign')return {point:new T.Vector3(.55,-.32,-1.35),radius:.65,yaw:Math.PI,pitch:.12};
  if(!d&&a.region==='wheels')return {point:new T.Vector3(2.3,-1.63,1.14),radius:1,yaw:.15,pitch:.1};
  const box=new T.Box3();objects.forEach(o=>box.expandByObject(o));return {point:box.isEmpty()?a.group.localToWorld(a.center.clone()):box.getCenter(new T.Vector3()),radius:box.isEmpty()?a.radius:box.getBoundingSphere(new T.Sphere()).radius,yaw:a.region==='hood'?-1.95:.2,pitch:a.region==='roof'?.65:.2};
 }
 function apply(active,d,opened,assemblies,level=0,playing=false,T){
  // Interiors are always rendered so the child sees actual seats through glazing.
  for(const a of assemblies)if(['seats','cab'].includes(a.region))a.interior.visible=true;
  for(const a of assemblies)if(['lights','stopsign'].includes(a.region))a.exterior.traverse(o=>{if(!o.isMesh||!o.material.emissive)return;const id=o.userData.detail;const lamp=['lights.red','lights.amber','stopsign.lamp'].includes(id);o.material.emissive.copy(o.material.color);o.material.emissiveIntensity=lamp&&active===a&&(!d||d===id)&&level>.02&&Math.floor(level*12)%2===0?1.6:0;});
  if(opened&&d==='hood.radiator')for(const mesh of active.detailMeshes[d])if(['Radiator core','Cooling fins'].includes(mesh.name))mesh.material.clippingPlanes=[new T.Plane(new T.Vector3(0,0,-1),0)];
  const doors=assemblies.find(a=>a.id==='doors');if(opened&&d==='doors.step')doors.update({region:'doors',mechanism:true,level:1,detail:d});
 }
 return {plan,focus,apply};
})();

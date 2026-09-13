/* Detail cameras use installed coordinates; opening is always an explicit action. */
window.DoubleDeckerInspection=(()=>{
 const poses={
 'body.shell':[[1.40,.12,1.25],1.2,0,.12],'body.windows':[[.66,.76,1.28],.76,.10,.1],
 'body.skirt':[[-1.2,-1.30,1.27],.79,0,.10],'body.livery':[[.5,.20,1.27],.92,0,.08],
 'roof.panel':[[0,1.40,0],3.1,.35,.95],'roof.hatch':[[-1.25,1.48,0],.65,.3,1.1],'roof.rail':[[.3,1.17,1.27],.75,0,.12],
 'upper.seats':[[.74,.67,.66],.79,-.8,.38],'upper.aisle':[[.8,.19,0],.82,0,1.50],
 'upper.poles':[[1.20,.64,.19],.74,.6,.2],'upper.rail':[[.75,1.10,.19],.75,.2,.85],'upper.floor':[[.8,.12,0],1.3,.3,1.12],
 'lower.seats':[[1.66,-.49,.66],.78,-.8,.30],'lower.floor':[[.7,-1.0,0],.78,0,1.50],
 'lower.stroller':[[.45,-.95,-.66],1.0,2.95,.9],'lower.priority':[[-2.1,-.49,.66],.8,.2,.35],
 'stairs.treads':[[-2.13,-.32,-.74],1.15,2.75,.32],'stairs.rail':[[-2.13,.20,-.74],1.10,2.85,.28],
 'stairs.well':[[-2.05,.18,-.70],1.12,-.2,1.15],
 'cab.wheel':[[-3.48,-.31,.58],.53,.6,.85],'cab.dash':[[-3.75,-.40,.51],.55,.9,.8],
 'cab.seat':[[-3.05,-.47,.58],.73,.05,.28],'cab.glass':[[-4.46,-.435,0],1.17,-1.6,.15],
 'cab.mirror':[[-3.98,.66,1.42],.42,1.4,.10],
 'doors.leaf':[[-3.52,-.565,-1.30],1.44,Math.PI,.1],'doors.glass':[[-3.79,-.565,-1.31],1.12,Math.PI-.13,.10],
 'doors.step':[[-3.52,-1.13,-1.02],.71,Math.PI,.65],'doors.emergency':[[4.35,.78,0],.71,Math.PI/2,.1],
 'engine.block':[[3.20,-.55,-.18],1.08,2.7,.4],'engine.fan':[[3.80,-.62,-.18],.72,1.57,.12],
 'engine.pipes':[[3.58,-.24,.27],.73,.4,.6],'engine.tank':[[3.3,-.65,.70],.83,.55,.26],
 'chassis.rail':[[0,-1.19,.62],1.7,0,-.4],'chassis.cross':[[1,-1.19,0],.94,0,-1.35],
 'chassis.axle':[[2.42,-1.49,0],1.4,0,-1.35],
 'wheels.tire':[[2.42,-1.49,1.16],.8,.16,.10],'wheels.tread':[[2.82,-1.78,1.16],.46,.95,.02],
 'wheels.hub':[[2.42,-1.49,1.35],.46,0,.03],'wheels.arch':[[2.42,-1.22,1.28],.88,0,.08]
 };
 function plan(p,a){const d=a.inspectionDetail;p.cut=[];p.nodes=[];p.move={};p.lift={};p.inside=['upper','lower','doors'];p.key=a.id;p.label='展开观察细节';
  const cabin=['upper','lower','stairs','cab'].includes(a.region)&&!['cab.glass','cab.mirror'].includes(d);
  if(cabin||(a.region==='body'&&!d)||a.region==='engine'){
   p.move={body:[0,5,-5],roof:[0,7,-5],doors:[0,5,-5]};p.nodes=[{id:'cab',name:'cab.glass',offset:[0,5,-5]}];p.label='打开车厢覆盖件';
   if(['lower','cab','engine'].includes(a.region))p.lift.upper=[0,5,-5];
  }
  if(d==='engine.fan')p.nodes.push({id:'engine',name:'Radiator section',offset:[.5,1.5,-1.5]});
  if(a.region==='chassis'){for(const id of['body','roof','upper','lower','stairs','cab','doors','engine'])p.lift[id]=[0,3.5,-3.0];p.label='抬起车体查看底盘';}
  return p;
 }
 function focus(T,a,d){let spec=poses[d];
  if(!d){const regions={body:[[0,0,0],5,-2.52,.2],roof:[[0,1.40,0],4.2,.3,.75],upper:[[.2,.63,0],3.6,.3,.50],lower:[[.15,-.5,0],3.6,.3,.35],stairs:poses['stairs.treads'],cab:[[-3.4,-.4,.5],1.55,.6,.32],doors:poses['doors.leaf'],engine:[[3.5,-.5,.2],1.5,.6,.45],chassis:[[0,-1.19,0],4.5,.3,-.3],wheels:poses['wheels.tire']};spec=regions[a.region];}
  const point=new T.Vector3(...spec[0]);if(!['wheels','chassis'].includes(a.region))point.y*=1.42;
  return {point:a.group.localToWorld(point),radius:spec[1],yaw:spec[2],pitch:spec[3]};
 }
 function apply(active,d,opened,assemblies,level,playing,T){
  for(const a of assemblies)if(['upper','lower'].includes(a.id))a.interior.visible=true;
  if(opened&&d==='doors.step')assemblies.find(a=>a.id==='doors').update({region:'doors',mechanism:true,level:1});
 }
 return {plan,focus,apply};
})();

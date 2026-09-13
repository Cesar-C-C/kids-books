/* Installed-coordinate cameras; explicit local opening, never zoom opacity. */
window.StationInspection=(()=>{
 const poses={
 'modules.skin':[[-2,.05,.58],1.8,0,.20], 'modules.ring':[[-2.45,0,0],.85,-.8,.35],
 'modules.port':[[-1.38,.362,.574],.29,0,.38], 'modules.handhold':[[-1.89,.56,.41],.45,0,.35],
 'modules.mmu':[[-2.92,.49,.49],.35,0,.45],
 'node.hatch':[[.93,0,0],.55,1.5,.16],'node.ring':[[.2,0,0],.95,.7,.35],'node.light':[[.2,.60,0],.45,0,-.9],
 'solar.panel':[[-3.05,0,2.04],1.28,0,1.1],'solar.cell':[[-3.05,.03,1.62],.66,0,1.25],
 'solar.boom':[[-3.05,0,.86],.48,-.5,.7],'solar.horn':[[-3.05,0,2.07],.77,0,1.20],
 'truss.beam':[[.2,-.2,3.45],.80,-1.0,.4],'truss.cable':[[.2,-.70,3.40],.80,-1.4,-.35],
 'truss.joint':[[.2,-.2,3.61],.39,-1.35,.25],
 'cupola.rail':[[.2,-.65,0],.48,.4,.95],
 'docking.ring':[[-4.2,0,0],.8,-1.57,.1],'docking.tunnel':[[-3.99,0,0],.5,-1.57,.1],
 'docking.light':[[-4.23,.62,.18],.18,-1.57,.1],'docking.target':[[-4.35,0,0],.3,-1.57,.1],
 'windows.frame':[[-2.6,.66,0],.43,0,1.1],'windows.inner':[[-2.6,.72,0],.28,0,1.15],'windows.drape':[[-3.04,.66,0],.3,0,1.1],
 'interior.racks':[[-3.05,.12,-.40],.49,0,.08],'interior.sleep':[[-2.18,0,-.32],.60,0,.08],
 'interior.table':[[-1.25,-.29,-.22],.44,.25,.85],'interior.treadmill':[[-.55,-.25,.20],.59,-.45,.45],
 'interior.plants':[[.2,-.17,-1.2],.50,-.9,.22],'interior.crystals':[[.2,-.17,1.2],.48,-1.3,.2],
 'interior.samples':[[.2,.04,1.73],.42,-1.3,.25],'interior.services':[[-2,.36,-.27],1.7,0,.3]
 };
 function plan(p,a){p.cut=[];p.normal=[0,-1,0];p.point=[0,.05,0];
  const d=a.inspectionDetail;
  if(a.region==='interior'||d==='node.light'||(!d&&['modules','node'].includes(a.region))){
   p.inside=['interior','modules','node'];p.cut=['modules','node','windows'];p.key='station-cabin';p.label='打开舱段剖面';p.move.solar=[0,-3,0];
   if(['interior.plants','interior.crystals','interior.samples'].includes(d)){p.normal=[1,0,0];p.point=[.12,0,0];}
   if(d?.startsWith('interior.')&&!['interior.plants','interior.crystals','interior.samples'].includes(d)){p.normal=[0,0,-1];p.point=[0,0,.12];}
   if(d==='node.light'){p.normal=[0,1,0];p.point=[0,.48,0];}
  }
  if(a.region==='cupola'){p.cut=[];p.nodes=[{id:'cupola',name:'Observation shutter 0',offset:[-.8,0,0]},{id:'cupola',name:'Observation shutter 1',offset:[.8,0,0]}];if(d==='cupola.rail'){p.nodes.push({id:'cupola',name:'Observation glazing',offset:[0,-1.5,1.5]});p.move={modules:[0,2,-2],node:[0,2,-2],windows:[0,2,-2]};}}
  return p;
 }
 function focus(T,a,d){let s=poses[d];
  if(s)return {point:a.group.localToWorld(new T.Vector3(...s[0])),radius:s[1],yaw:s[2],pitch:s[3]};
  const targets=d?a.detailMeshes[d]:null,b=new T.Box3();
  if(targets?.length)targets.forEach(o=>b.expandByObject(o));else{b.expandByObject(a.exterior);if(a.region==='interior')b.expandByObject(a.interior);}
  let point=b.isEmpty()?a.group.localToWorld(a.center.clone()):b.getCenter(new T.Vector3());
  let radius=b.isEmpty()?.7:b.getBoundingSphere(new T.Sphere()).radius;
  let yaw=.2,pitch=.6;if(a.region==='arm'){yaw=-Math.PI/2;pitch=.20;}if(a.region==='solar')pitch=1.1;if(a.region==='cupola')pitch=-.8;
  if(a.region==='interior'){point=new T.Vector3(-1.65,0,0);radius=2.45;yaw=-.25;pitch=.65;}
  return {point,radius:Math.max(.2,radius),yaw,pitch};
 }
 return {plan,focus};
})();

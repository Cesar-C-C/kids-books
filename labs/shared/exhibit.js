/* Explicit educational openings. Camera zoom never drives geometry or opacity. */
(() => {
 'use strict';
 window.LabExhibit = { create(subject, T) {
  let current=null,closing=null,amount=0;
  const bases=new WeakMap(),nodeBases=new Map();
  function plan(a){
   if(!a)return null;
   const p={key:a.id,label:'打开结构',inside:[a.id],move:{},lift:{},cut:[],nodes:[],normal:[0,0,-1],point:a.group.localToWorld(a.center.clone()).toArray()};
   if(subject==='airplane'){
    if(a.region==='engines'){p.label='打开发动机罩';p.nodes=[{id:a.id,name:'nacelle-near-half',offset:[0,1.6,1.8]},{id:a.id,name:'nacelle-far-half',offset:[0,1.6,-1.8]}];}
    else if(['fuselage','cockpit'].includes(a.region)){p.key='cabin';p.label='打开机舱';p.inside=['cabin','flight-deck'];p.move={cabin:[0,2.8,-2.2],'flight-deck':[0,2.8,-2.2]};}
    else if(['wings','fin','stabilizers'].includes(a.region)){p.label='移开翼面蒙皮';p.move[a.id]=[0,2,0];}
    else {p.label='查看内部连接';p.cut=[a.id];}
   }else if(subject==='schoolbus'){
    if(['body','roof','cab','seats','aisle'].includes(a.region)){p.key='cabin';p.label='打开车厢';p.inside=['body','roof','cab','seats','aisle'];p.move={body:[0,.4,-3.8],roof:[0,3.4,0],doors:[0,.4,-3.8]};p.nodes=[{id:'cab',name:'cab.glass',offset:[0,.4,-3.8]}];}
    else if(a.region==='hood'){p.label='打开发动机舱盖';p.move.hood=[-1,2,0];}
    else {p.label='查看内部连接';p.cut=[a.id];}
   }else if(subject==='doubledecker'){
    if(['body','roof','upper','lower','stairs','cab'].includes(a.region)){
     p.key=['lower','stairs','cab'].includes(a.region)?'lower-cabin':'upper-cabin';p.label=p.key==='lower-cabin'?'打开下层车厢':'打开上层车厢';
     p.inside=['body','roof','upper','lower','stairs','cab'];p.move={body:[0,.4,-4],roof:[0,4.2,0],doors:[0,.4,-4]};p.nodes=[{id:'cab',name:'cab.glass',offset:[0,.4,-4]}];
     if(p.key==='lower-cabin')p.lift.upper=[0,3.2,0];
    }else if(a.region==='engine'){p.label='打开后部发动机舱';p.move.body=[0,2.8,0];p.cut=[a.id];}
    else if(['chassis','wheels'].includes(a.region)){p.label='抬起车体';for(const id of ['body','roof','upper','lower','stairs','cab','doors'])p.lift[id]=[0,3,0];p.cut=[a.id];}
    else {p.label='查看内部连接';p.cut=[a.id];}
   }else if(subject==='rocket'){
    if(['fairing','satellite'].includes(a.region)){p.key='payload';p.label='打开整流罩';p.lift.fairing=[2.2,2.4,0];p.inside=['fairing','satellite'];}
    else {p.label='切开局部箭体';p.cut=[a.id];if(a.region==='upperstage'){p.cut.push('interstage');p.inside.push('interstage');}if(a.region==='engines')p.cut.push('structure');if(['structure','fuel','oxidizer'].includes(a.region)){p.key='tanks';p.cut=['structure','fuel','oxidizer'];p.inside=p.cut.slice();p.point=[0,0,0];}}
   }else if(subject==='station'){
    if(['modules','node','interior','windows','cupola'].includes(a.region)){p.key='cabin';p.label='打开舱段剖面';p.cut=['modules','node','windows'];if(a.region==='cupola')p.cut.push('cupola');p.inside=['modules','node','interior','windows'];if(a.region==='cupola')p.inside.push('cupola');p.point=[0,0,0];}
    else {p.label='查看内部连接';p.cut=[a.id];}
   }
   if(!p.inside.includes(a.id))p.inside.push(a.id);return p;
  }
  function clear(immediate=false){closing=current;current=null;if(immediate){closing=null;amount=0;}}
  return {
   plan, get opened(){return current;}, get amount(){return amount;},
   select(a){if(current){const next=plan(a);if(current.key!==next.key)clear(true);else current=next;}},
   open(a){current=plan(a);closing=null;amount=0;}, close:clear,
   step(ease,assemblies,surfaces,originals,explosion,active){
    amount+=((current?1:0)-amount)*ease;if(amount<.001){amount=0;closing=null;}
    const p=current||closing;
    for(const a of assemblies){
     if(!bases.has(a))bases.set(a,a.exterior.position.clone());a.exterior.position.copy(bases.get(a));
     a.exterior.visible=a.defaultVisible!==false||a===active||explosion>.2;
     a.interior.visible=!!(p&&p.inside.includes(a.id))||explosion>.2;a.ghost.visible=false;
     if(p?.move[a.id])a.exterior.position.addScaledVector(new T.Vector3(...p.move[a.id]),amount);
     if(p?.lift[a.id])a.group.position.addScaledVector(new T.Vector3(...p.lift[a.id]),amount);
    }
    for(const [node,base] of nodeBases)node.position.copy(base);
    if(p)for(const spec of p.nodes){const a=assemblies.find(a=>a.id===spec.id),node=a?.exterior.getObjectByName(spec.name);if(node){if(!nodeBases.has(node))nodeBases.set(node,node.position.clone());node.position.copy(nodeBases.get(node)).addScaledVector(new T.Vector3(...spec.offset),amount);}}
    const plane=p?new T.Plane().setFromNormalAndCoplanarPoint(new T.Vector3(...p.normal),new T.Vector3(...p.point)):null;
    for(const s of surfaces){
     const cut=p&&amount>.01&&p.cut.includes(s.assembly.id)&&(s.layer==='exterior'||/inner wall|lining|liner|casing|Engine space/i.test(s.object.name));
     for(const m of s.materials){Object.assign(m,originals.get(m));m.clippingPlanes=cut?[plane]:null;}
     s.object.castShadow=s.shadow&&!cut;
    }
   },
   snapshot(){return {opening:current?.key||null,openAmount:amount,cutNormal:(current||closing)?.normal||null};}
  };
 }};
})();

/* Attached teaching details. Every object remains a child of the original
 * airframe part; this module never creates a scene, camera or renderer. */
(() => {
  'use strict';
  window.AirplaneDetails = {
    install({THREE:T,model,nodes,pickables}) {
      const ids=['engine.inlet','engine.fan','engine.bypass','engine.compressor','engine.combustor','engine.turbine','engine.shaft','engine.nozzle','cabin.frames','cabin.floor','cabin.seats','cabin.cargo','cockpit.seats','cockpit.panel','cockpit.controls','wing.spar','wing.ribs','wing.flap','wing.slat','wing.spoiler','gear.strut','gear.wheel','gear.brake','gear.bay'];
      const refs=new Map(ids.map(id=>[id,[]])),finishes=[],skins=[],engines=[],hinges=[],wheels=[];
      const v=(x,y,z)=>new T.Vector3(x,y,z),X=v(1,0,0),Y=v(0,1,0);
      const clamp=n=>Number.isFinite(n)?Math.max(0,Math.min(1,n)):0;
      const partNodes=id=>nodes.filter(n=>n.id===id);
      function remember(id,object,point=new T.Vector3()) {refs.get(id).push({object,point:point.clone()});}
      function finish(m,id) {
        finishes.push({m,id,color:m.emissive.clone(),intensity:m.emissiveIntensity});return m;
      }
      function add(parent,id,geo,color,position=[0,0,0],primary) {
        const part=primary||parent.userData.part;
        const m=new T.Mesh(geo,finish(new T.MeshStandardMaterial({color,roughness:.48,metalness:.2,side:T.DoubleSide}),id));
        m.position.set(...position);m.userData={part,detail:id};m.castShadow=true;m.receiveShadow=true;
        parent.add(m);pickables.push(m);geo.computeBoundingBox();remember(id,m,geo.boundingBox.getCenter(new T.Vector3()));if(id==='gear.wheel')skin(m,['gear']);return m;
      }
      function box(parent,id,pos,size,color,part) {return add(parent,id,new T.BoxGeometry(...size),color,pos,part);}
      function cylinder(parent,id,pos,radius,length,color,axis=Y,part) {
        const m=add(parent,id,new T.CylinderGeometry(radius,radius,length,18),color,pos,part);
        m.quaternion.setFromUnitVectors(Y,axis.clone().normalize());return m;
      }
      function beam(parent,id,a,b,width,height,color,part) {
        const direction=b.clone().sub(a),m=box(parent,id,a.clone().add(b).multiplyScalar(.5).toArray(),[direction.length(),height,width],color,part);
        m.quaternion.setFromUnitVectors(X,direction.normalize());return m;
      }
      function tube(parent,id,points,radius,color,part) {return add(parent,id,new T.TubeGeometry(new T.CatmullRomCurve3(points),24,radius,7,false),color,[0,0,0],part);}
      function ring(parent,id,pos,radius,tubeSize,color,axis=X,part) {
        const m=add(parent,id,new T.TorusGeometry(radius,tubeSize,7,40),color,pos,part);
        m.quaternion.setFromUnitVectors(v(0,0,1),axis.clone().normalize());return m;
      }
      function skin(m,regions) {
        skins.push({m,regions,opacity:m.material.opacity,transparent:m.material.transparent,depthWrite:m.material.depthWrite,side:m.material.side,castShadow:m.castShadow});
      }
      function disposeTree(object) {
        const geometries=new Set(),materials=new Set();
        object.traverse(m=>{if(!m.isMesh)return;const index=pickables.indexOf(m);if(index>=0)pickables.splice(index,1);geometries.add(m.geometry);(Array.isArray(m.material)?m.material:[m.material]).forEach(a=>materials.add(a));});
        object.removeFromParent();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
      }
      // Split the fuselage's existing triangles at its nose section so opening
      // the cockpit does not make the entire passenger cabin transparent.
      function splitBodySkin(original,parent) {
        const flat=original.geometry.index?original.geometry.toNonIndexed():original.geometry.clone();
        const chunks=[[],[]],position=flat.attributes.position;
        for(let i=0;i<position.count;i+=3){const x=(position.getX(i)+position.getX(i+1)+position.getX(i+2))/3;chunks[x< -2.55?0:1].push(i,i+1,i+2);}
        chunks.forEach((indices,index)=>{
          if(!indices.length)return;const geo=new T.BufferGeometry();
          for(const [name,attribute] of Object.entries(flat.attributes)){
            const values=[];for(const i of indices)for(let j=0;j<attribute.itemSize;j++)values.push(attribute.array[i*attribute.itemSize+j]);
            geo.setAttribute(name,new T.Float32BufferAttribute(values,attribute.itemSize));
          }
          const m=new T.Mesh(geo,original.material.clone());m.position.copy(original.position);m.quaternion.copy(original.quaternion);m.scale.copy(original.scale);m.userData={...original.userData};m.castShadow=original.castShadow;m.receiveShadow=original.receiveShadow;
          parent.add(m);pickables.push(m);skin(m,[index===0?'cockpit':'fuselage']);
        });flat.dispose();disposeTree(original);
      }

      for(const node of partNodes('engines')) {
        const root=node.group;
        // Retain the actual pylon at the original wing attachment point.
        const pylon=root.children.find(m=>m.isMesh&&m.geometry.type==='BoxGeometry'&&m.position.y>.3);
        for(const child of [...root.children])if(child!==pylon)disposeTree(child);
        const engine=window.EngineModel.create(T);engine.group.scale.setScalar(.265);root.add(engine.group);
        engine.pickables.forEach(m=>{const raw=m.userData.part;m.userData.part='engines';m.userData.detail='engine.'+raw;m.castShadow=true;m.receiveShadow=true;pickables.push(m);});
        for(const [id,point] of Object.entries(engine.anchors))remember('engine.'+id,engine.group,point);
        const hood=engine.group.getObjectByName('opening-nacelle'),hoodMeshes=[];
        hood.traverse(m=>{if(m.isMesh)hoodMeshes.push(m);});
        engines.push({engine,hoodMeshes});
      }

      const body=partNodes('fuselage')[0]?.group;
      if(body) {
        for(const m of [...body.children]){
          if(!m.isMesh)continue;
          if(m.geometry.type==='LatheGeometry')splitBodySkin(m,body);else skin(m,['fuselage']);
        }
        const radius=x=>x< -1.7?.64+(x+2.55)*.04/.85:x>.65?.68-(x-.65)*.08/1.15:.68;
        for(let i=0;i<12;i++) {
          const x=-2.18+i*.345;
          ring(body,'cabin.frames',[x,0,0],radius(x)-.042,.018,0xb6c6bd);
        }
        // Longitudinal stringers connect the frames into an actual structure.
        for(const a of [.38,1.15,2.0,2.76,3.7,4.65,5.6]) {
          const points=[];for(let i=0;i<12;i++){const x=-2.18+i*.345,r=radius(x)-.048;points.push(v(x,Math.cos(a)*r,Math.sin(a)*r));}
          tube(body,'cabin.frames',points,.011,0x8baaa0);
        }
        box(body,'cabin.floor',[-.25,-.095,0],[4.15,.045,1.12],0xd3be94);
        box(body,'cabin.floor',[-.25,-.067,0],[4.12,.012,.14],0x759e9b);
        for(const z of [-.47,-.29,.29,.47])box(body,'cabin.floor',[-.25,-.062,z],[4.08,.015,.018],0x9a9d89);
        for(const x of [-1.78,-.91,-.04,.83])for(const z of [-.42,-.16,.16,.42]){
          const cushion=box(body,'cabin.seats',[x,.016,z],[.34,.072,.18],0x588f99);cushion.name='passenger-seat-cushion';
          const back=box(body,'cabin.seats',[x+.15,.2,z],[.065,.31,.18],0x74a7ad);back.rotation.z=-.09;
          box(body,'cabin.seats',[x+.15,.355,z],[.08,.07,.145],0xa5c6bc);
          for(const side of [-1,1])box(body,'cabin.seats',[x+.01,.13,z+side*.094],[.23,.025,.017],0xd6d9c5);
          for(const dx of [-.09,.1])box(body,'cabin.seats',[x+dx,-.048,z],[.025,.058,.13],0x526f72);
        }
        box(body,'cabin.cargo',[-.35,-.48,0],[3.85,.035,.72],0x7c9290);
        for(const x of [-1.65,-.82,.01,.84]) {
          box(body,'cabin.cargo',[x,-.305,0],[.58,.29,.61],0xc89b65);
          for(const z of [-.18,.18])box(body,'cabin.cargo',[x,-.154,z],[.59,.012,.026],0x8b7356);
          box(body,'cabin.cargo',[x-.296,-.305,0],[.014,.24,.028],0xe1c6a2);
        }
      }

      for(const node of partNodes('cockpit')) {
        const root=node.group;root.children.filter(m=>m.isMesh).forEach(m=>skin(m,['cockpit']));
        for(const z of [-.21,.21]) {
          box(root,'cockpit.seats',[.16,-.25,z],[.31,.08,.225],0x526c7c);
          box(root,'cockpit.seats',[.3,-.07,z],[.07,.31,.225],0x7895a0);
          box(root,'cockpit.seats',[.3,.105,z],[.08,.075,.18],0xa1b8b6);
          cylinder(root,'cockpit.seats',[.16,-.335,z],.045,.12,0xaabbb3);
          beam(root,'cockpit.controls',v(-.03,-.29,z),v(-.15,-.105,z),.025,.027,0x919f99);
          tube(root,'cockpit.controls',[v(-.15,-.035,z-.085),v(-.15,-.11,z-.085),v(-.15,-.145,z),v(-.15,-.11,z+.085),v(-.15,-.035,z+.085)],.016,0x293f4d);
          for(const dz of [-.042,.042])box(root,'cockpit.controls',[-.15,-.325,z+dz],[.1,.025,.048],0x526878);
        }
        box(root,'cockpit.panel',[-.39,-.1,0],[.075,.24,.65],0x344e5a);
        for(const z of [-.22,0,.22]) {
          const screen=box(root,'cockpit.panel',[-.348,-.074,z],[.014,.11,.14],0x70b9c2);screen.material.emissive.set(0x153941);screen.material.emissiveIntensity=.4;
          for(const dz of [-.03,.03])cylinder(root,'cockpit.panel',[-.335,-.174,z+dz],.012,.018,0xc9d5be,X);
        }
        box(root,'cockpit.panel',[-.03,-.295,0],[.41,.07,.095],0x647c83);
        for(const z of [-.018,.018]) {
          beam(root,'cockpit.controls',v(-.01,-.255,z),v(-.055,-.175,z),.011,.014,0xd2d1b9);
          cylinder(root,'cockpit.controls',[-.055,-.175,z],.022,.036,0x303f49,v(0,0,1));
        }
      }

      function hingePanel(root,id,points,pivot,axis,color,regions,angle) {
        const holder=new T.Group();holder.userData.part=root.userData.part;holder.name=id+'-hinge';holder.position.copy(pivot);root.add(holder);
        const shape=new T.Shape();points.forEach(([x,z],i)=>i?shape.lineTo(x-pivot.x,-(z-pivot.z)):shape.moveTo(x-pivot.x,-(z-pivot.z)));shape.closePath();
        const geo=new T.ExtrudeGeometry(shape,{depth:.024,bevelEnabled:false});geo.translate(0,0,-.012);geo.rotateX(Math.PI/2);
        add(holder,id,geo,color);hinges.push({holder,axis:axis.clone().normalize(),regions,angle});return holder;
      }
      for(const node of partNodes('wings')) {
        const root=node.group,s=Math.sign(node.anchor.z)||Math.sign(node.offset.z)||1;
        root.children.filter(m=>m.isMesh&&m.geometry.type==='ExtrudeGeometry').forEach(m=>skin(m,['wings']));
        const lead=z=>-.9+(z-.51)*1.73/3.61;
        const trail=z=>z<2.44?1.44-(z-.51)*.27/1.92:1.06+(z-2.45)*.37/1.67;
        const chord=(z,f)=>lead(z)+(trail(z)-lead(z))*f;
        for(const f of [.26,.65])for(const [a,b] of [[.61,1.5],[1.5,2.45],[2.45,3.92]])beam(root,'wing.spar',v(chord(a,f),-.005,s*a),v(chord(b,f),-.005,s*b),.04,.066,0xd9be7c);
        for(const z of [.78,1.24,1.72,2.2,2.68,3.16,3.65]){
          beam(root,'wing.ribs',v(lead(z)+.06,0,s*z),v(trail(z)-.05,0,s*z),.025,.072,0xb2c4b5);
          for(const f of [.37,.54])ring(root,'wing.ribs',[chord(z,f),0,s*z],.024,.006,0x7d9f9a,v(0,0,1));
        }
        // All movable panels share a real hinge line with the fixed wing.
        const a=.7,b=2.36,flapA=v(trail(a)-.24,.079,s*a),flapB=v(trail(b)-.24,.079,s*b);
        hingePanel(root,'wing.flap',[[flapA.x,s*a],[flapB.x,s*b],[trail(b)+.11,s*b],[trail(a)+.11,s*a]],flapA,flapB.clone().sub(flapA),0x91bab0,['wings'],-s*.62);
        beam(root,'wing.flap',flapA,flapB,.027,.027,0x71908b);
        const c=.74,d=3.68,slatA=v(lead(c)+.09,.07,s*c),slatB=v(lead(d)+.09,.07,s*d);
        hingePanel(root,'wing.slat',[[lead(c)-.075,s*c],[lead(d)-.075,s*d],[slatB.x,s*d],[slatA.x,s*c]],slatA,slatB.clone().sub(slatA),0x81b9b2,['wings'],s*.34);
        beam(root,'wing.slat',slatA,slatB,.021,.021,0xc0d4c8);
        const e=1.28,f=2.15,spA=v(chord(e,.48),.087,s*e),spB=v(chord(f,.48),.087,s*f);
        hingePanel(root,'wing.spoiler',[[spA.x,s*e],[spB.x,s*f],[chord(f,.73),s*f],[chord(e,.73),s*e]],spA,spB.clone().sub(spA),0xd3b465,['wings'],s*.88);
        beam(root,'wing.spoiler',spA,spB,.023,.023,0x7d9990);
      }

      // Reparent the original control surfaces around their actual attachment
      // edge. The part root and explosion offset are never moved by a mechanism.
      for(const node of nodes.filter(n=>['ailerons','elevators','rudder'].includes(n.id))) {
        const root=node.group,s=Math.sign(node.anchor.z)||Math.sign(node.offset.z)||1;
        let point,axis,angle,regions;
        if(node.id==='ailerons'){point=v(1.12,0,s*2.5);axis=v(.37,0,s*1.6);angle=.46;regions=['ailerons'];}
        else if(node.id==='elevators'){point=v(.72,0,s*.2);axis=v(.31,0,s*1.71);angle=-s*.4;regions=['elevators','stabilizers'];}
        else{point=v(.88,.25,0);axis=Y;angle=.5;regions=['rudder','fin'];}
        const holder=new T.Group();holder.name=node.id+'-attached-hinge';holder.position.copy(point);root.add(holder);
        for(const child of [...root.children])if(child!==holder){child.position.sub(point);holder.add(child);}
        hinges.push({holder,axis:axis.clone().normalize(),angle,regions});
      }

      for(const node of partNodes('gear')) {
        const root=node.group,nose=node.base.x< -1,radius=nose?.19:.25,spacing=nose?.1:.16;
        const oldMeshes=root.children.filter(m=>m.isMesh);
        for(const m of oldMeshes){
          const r=m.geometry.parameters.radiusTop,id=r>.15||nose&&r>.07?'gear.wheel':r>.07?'gear.brake':'gear.strut';
          m.userData.detail=id;remember(id,m);finish(m.material,id);
          if(id==='gear.wheel')skin(m,['gear']);
          if(id==='gear.wheel'&&r>.15){
            const holder=new T.Group();holder.userData.part='gear';holder.position.copy(m.position);holder.name='wheel-axle';root.add(holder);m.position.set(0,0,0);holder.add(m);wheels.push(holder);
            const side=Math.sign(holder.position.z),outer=side*.065;
            ring(holder,'gear.wheel',[0,0,outer],radius*.77,.013,0x728786,v(0,0,1));
            for(let j=0;j<8;j++){
              const a=j*Math.PI/4;
              beam(holder,'gear.wheel',v(Math.cos(a)*.09,Math.sin(a)*.09,outer),v(Math.cos(a)*radius*.72,Math.sin(a)*radius*.72,outer),.021,.023,0xc7d0bf);
            }
            for(let j=0;j<12;j++){
              const a=j*Math.PI/6;
              const tread=box(holder,'gear.wheel',[Math.cos(a)*(radius+.002),Math.sin(a)*(radius+.002),0],[.016,.035,.1],0x45565a);tread.rotation.z=a;
            }
          }
        }
        cylinder(root,'gear.strut',[0,-.12,0],.079,.13,0x748f91);
        cylinder(root,'gear.strut',[0,-.46,0],.063,.22,0xd5dfd7);
        cylinder(root,'gear.strut',[0,-.63,0],.043,spacing*2+.14,0x809898,v(0,0,1));
        beam(root,'gear.strut',v(-.055,-.2,0),v(-.15,-.36,0),.028,.028,0x94aba7);
        beam(root,'gear.strut',v(-.15,-.36,0),v(-.035,-.52,0),.028,.028,0x94aba7);
        box(root,'gear.bay',[0,.045,0],[nose?.52:.65,.065,nose?.32:.51],0x526d75);
        for(const side of [-1,1]){
          const z=side*(nose?.16:.255),door=box(root,'gear.bay',[0,-.045,z],[nose?.5:.62,.025,.11],0xc0d2c1);door.rotation.x=side*.9;
          if(nose)continue; // This airliner has wheel brakes on the main gear.
          const packZ=side*(spacing-.072);
          for(let j=0;j<3;j++)cylinder(root,'gear.brake',[0,-.63,packZ-side*j*.017],radius*.48,.013,0xa59d83,v(0,0,1));
          box(root,'gear.brake',[radius*.16,-.63+radius*.52,packZ],[radius*.62,.075,.095],0xab7152);
          tube(root,'gear.brake',[v(.05,-.12,0),v(.085,-.35,side*.035),v(.07,-.53,packZ)],.009,0x394d55);
        }
      }

      function update({time=0,cutaway=0,region='',mechanism=0,selected=null}={}) {
        const reveal=clamp(cutaway),amount=clamp(mechanism);
        for(const f of finishes){f.m.emissive.copy(f.color);f.m.emissiveIntensity=f.intensity;if(f.id===selected){f.m.emissive.set(0x2b7b7b);f.m.emissiveIntensity=.5;}}
        for(const s of skins){
          const active=s.regions.includes(region)&&(region!=='gear'||selected==='gear.brake');
          const opacity=active?s.opacity*(1-.95*reveal):s.opacity;
          s.m.material.opacity=opacity;s.m.material.transparent=opacity<.99||s.transparent;s.m.material.depthWrite=opacity<.99?false:s.depthWrite;s.m.material.side=opacity<.99?T.DoubleSide:s.side;s.m.castShadow=opacity<.3?false:s.castShadow;
        }
        for(const {engine,hoodMeshes} of engines){
          const active=region==='engines',raw=typeof selected==='string'&&selected.startsWith('engine.')?selected.slice(7):null;
          engine.update({time:Number.isFinite(time)?time:0,open:0,flow:active&&amount>.05?'both':'off',shaft:active&&raw==='shaft',selected:active?raw:null});
          for(const m of hoodMeshes){
            if(active&&reveal>0){m.material.opacity=Math.min(m.material.opacity,1-.97*reveal);m.material.transparent=true;m.material.depthWrite=false;}
            m.castShadow=!(active&&reveal>.4);
          }
        }
        for(const h of hinges)h.holder.quaternion.setFromAxisAngle(h.axis,h.regions.includes(region)?amount*h.angle:0);
        for(const wheel of wheels)wheel.rotation.z=region==='gear'?amount*Math.PI*3:0;
      }
      function anchor(id,cameraPosition) {
        const options=refs.get(id);if(!options?.length)return null;
        model.updateWorldMatrix(true,true);
        // Choose the nearest original part group, then keep its detail center
        // stable while orbiting; a label must not jump from rib to rib.
        const groups=new Map();
        for(const ref of options){let root=ref.object;while(root.parent&&root.parent!==model)root=root.parent;const points=groups.get(root)||[];points.push(ref.object.localToWorld(ref.point.clone()));groups.set(root,points);}
        let best=null,distance=Infinity;
        for(const points of groups.values()){const p=new T.Box3().setFromPoints(points).getCenter(new T.Vector3()),d=cameraPosition?p.distanceToSquared(cameraPosition):0;if(d<distance){best=p;distance=d;}}
        return best;
      }
      update();return {ids:ids.slice(),update,anchor};
    }
  };
})();

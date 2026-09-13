/* Modeling coordinates are relative proportions, not engineering dimensions.
 * Canonical silhouette: book overview. Equipment: references/interior.png.
 * Every discovery has one installed anchor and its own selectable geometry. */
window.StationReferenceDetails = { enrich(T, model) {
 const {root,assemblies}=model, A=id=>assemblies.find(a=>a.id===id);
 const colors={ivory:0xd8cfb9,gold:0xb89954,steel:0x8e9da5,blue:0x315c91,dark:0x26323d,cream:0xece2c8,green:0x6f9847,purple:0x9463be,red:0xa96245};
 const cache={};
 function material(key){return cache[key]||(cache[key]=new T.MeshStandardMaterial({color:colors[key],roughness:['blue','green'].includes(key)?.8:.48,metalness:['steel','gold'].includes(key)?.55:0}));}
 const glass=new T.MeshPhysicalMaterial({color:0xc2e0e9,roughness:.09,metalness:0,transmission:.48,thickness:.025,ior:1.46,transparent:true,opacity:.36,depthWrite:false,side:T.DoubleSide,envMapIntensity:1.15,clearcoat:1});
 const box=(x,y,z)=>new T.BoxGeometry(x,y,z), cyl=(r,h)=>new T.CylinderGeometry(r,r,h,32), ring=(r,t)=>new T.TorusGeometry(r,t,8,48);
 function rounded(w,h,d,r=.035){const s=new T.Shape(),x=-w/2,y=-h/2;r=Math.min(r,w/3,h/3);s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);const g=new T.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,curveSegments:6});g.translate(0,0,-d/2);return g;}
 function put(a,d,g,key,p=[0,0,0],rot=[0,0,0],parent){const m=new T.Mesh(g,key==='glass'?glass:material(key));m.position.set(...p);m.rotation.set(...rot);m.name=d; m.userData={assemblyId:a.id,region:a.region,detail:d};m.castShadow=key!=='glass';m.receiveShadow=key!=='glass';(parent||a.details[d]).add(m);return m;}
 function rod(a,d,p,q,r=.012,key='steel',parent){const v=new T.Vector3(...p),w=new T.Vector3(...q),delta=w.clone().sub(v);const m=put(a,d,cyl(r,delta.length()),key,v.add(w).multiplyScalar(.5).toArray(),[0,0,0],parent);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return m;}
 function bolts(a,d,c,r,n=12,axis='x',parent){for(let i=0;i<n;i++){const t=i/n*Math.PI*2,p=axis==='x'?[c[0],c[1]+r*Math.sin(t),c[2]+r*Math.cos(t)]:[c[0]+r*Math.sin(t),c[1]+r*Math.cos(t),c[2]];put(a,d,cyl(.013,.019),'gold',p,axis==='x'?[0,0,Math.PI/2]:[Math.PI/2,0,0],parent);}}
 function group(a,id,p){const g=new T.Group();g.name=id;g.position.set(...p);g.userData={assemblyId:a.id,region:a.region,detail:id};a.interior.add(g);a.details[id]=g;a.detailLayer[id]='interior';return g;}
 const inside=A('interior');inside.interior.clear();inside.exterior.clear();inside.details={};inside.detailLayer={};inside.center.set(-1.7,0,0);inside.radius=2.5;
 // One layout, with a clear axial passage. No post-hoc position remapping.
 const layout={racks:[-3.05,.12,-.40],sleep:[-2.18,0,-.32],table:[-1.25,-.25,-.22],treadmill:[-.55,-.35,.20],plants:[.2,-.17,-1.20],crystals:[.2,-.17,1.20],samples:[.2,.04,1.73],services:[-2,.47,-.27]};
 for(const [id,p]of Object.entries(layout))group(inside,'interior.'+id,p);
 let d='interior.racks';
 for(let j=0;j<3;j++){
  put(inside,d,rounded(.48,.19,.12),'ivory',[0,-.22+j*.22,0]);
  put(inside,d,rounded(.42,.145,.012),'cream',[0,-.22+j*.22,.068]);
  rod(inside,d,[-.12,-.22+j*.22,.087],[.08,-.22+j*.22,.087],.014);
  put(inside,d,box(.035,.04,.018),'gold',[.16,-.22+j*.22,.089]);
  for(let i=0;i<5;i++)put(inside,d,box(.025,.006,.008),'dark',[-.15+i*.035,-.27+j*.22,.080]);
 }
 d='interior.sleep';const bag=put(inside,d,rounded(.46,.86,.16,.16),'blue');bag.name='Sleeping bag';
 for(let j=0;j<3;j++){
  put(inside,d,box(.47,.045,.021),'cream',[0,-.30+j*.30,.093]).name='Bag strap';
  put(inside,d,rounded(.070,.065,.012,.009),'steel',[.13,-.30+j*.30,.109]);
  put(inside,d,box(.038,.031,.014),'dark',[.13,-.30+j*.30,.117]);
 }
 rod(inside,d,[0,-.43,.091],[0,.36,.091],.006,'gold');
 for(let j=0;j<8;j++)for(let s of[-1,1])rod(inside,d,[s*.19,-.4+j*.1,.083],[s*.025,-.30+j*.1,.083],.003,'steel');
 put(inside,d,ring(.025,.007),'gold',[.025,.35,.10]);
 d='interior.table';put(inside,d,rounded(.53,.30,.05,.035),'cream',[0,0,0],[Math.PI/2,0,0]).name='Galley table';
 put(inside,d,cyl(.030,.22),'steel',[0,-.135,0]).name='Table post';
 put(inside,d,box(.14,.025,.13),'steel',[0,-.252,0]);
 for(const x of[-.05,.05])for(const z of[-.045,.045])put(inside,d,cyl(.012,.012),'gold',[x,-.232,z]);
 for(let i=0;i<3;i++){
  put(inside,d,rounded(.13,.21,.015,.015),'glass',[-.17+i*.17,.037,0],[Math.PI/2,0,0]);
  for(let j=0;j<3;j++)put(inside,d,new T.SphereGeometry(.020,10,6),j%2?'gold':'cream',[-.19+i*.17,.037,-.05+j*.05]);
  put(inside,d,box(.021,.009,.31),'blue',[-.17+i*.17,.055,0]);
 }
 d='interior.treadmill';
 put(inside,d,rounded(.58,.30,.052,.03),'dark',[0,-.12,0],[Math.PI/2,0,0]).name='Treadmill belt';
 for(const x of[-.26,.26])put(inside,d,cyl(.042,.32),'steel',[x,-.12,0],[Math.PI/2,0,0]).name='Treadmill roller';
 for(const z of[-.165,.165]){
  put(inside,d,box(.65,.05,.03),'ivory',[0,-.13,z]);
  rod(inside,d,[-.23,-.12,z],[-.19,.30,z]);rod(inside,d,[-.19,.30,z],[.21,.30,z]);rod(inside,d,[.21,.30,z],[.27,-.12,z]);
  rod(inside,d,[-.13,.30,z],[.14,.30,z],.018,'blue');
  put(inside,d,box(.025,.27,.013),'blue',[.04,.20,z*.6],[0,0,.16]);
  put(inside,d,box(.043,.043,.02),'steel',[.04,.17,z*.6]);
 }
 put(inside,d,box(.045,.024,.23),'blue',[.04,.14,0]);
 // Transparent chambers use four separate panes, not a solid translucent cube.
 function chamber(id,w,h,depth){
  put(inside,id,rounded(w,.085,depth),'ivory',[0,-h/2,0]);put(inside,id,rounded(w,.065,depth),'steel',[0,h/2,0]);
  for(const s of[-1,1]){
   put(inside,id,box(w-.03,h-.04,.009),'glass',[0,0,s*(depth/2-.015)]);
   put(inside,id,box(.009,h-.04,depth-.03),'glass',[s*(w/2-.015),0,0]);
   for(const z of[-1,1])rod(inside,id,[s*(w/2-.016),-h/2,z*(depth/2-.016)],[s*(w/2-.016),h/2,z*(depth/2-.016)],.012);
   put(inside,id,box(.045,.065,.023),'gold',[s*w*.3,-h/2,depth/2]);
  }
 }
 d='interior.plants';chamber(d,.48,.51,.45);
 put(inside,d,box(.42,.035,.39),'dark',[0,-.21,0]);
 for(let x of[-.12,.12])for(let z of[-.10,.10]){
  rod(inside,d,[x,-.19,z],[x,.07,z],.009,'green');
  for(let i=0;i<7;i++){
   const a=i*2.4,leaf=put(inside,d,new T.SphereGeometry(1,12,8),'green',[x+Math.cos(a)*.04,-.10+i*.021,z+Math.sin(a)*.04]);
   leaf.scale.set(.032,.08,.012);leaf.rotation.set(.5*Math.sin(a),a,.5*Math.cos(a));leaf.name='Lettuce leaf';
  }
 }
 for(let x of[-.16,-.05,.05,.16])for(let z of[-.12,0,.12]){const m=put(inside,d,cyl(.013,.009),'purple',[x,.215,z]);m.material=material('purple').clone();m.material.emissive.setHex(0x9d43b8);m.material.emissiveIntensity=.6;}
 d='interior.crystals';chamber(d,.49,.50,.42);
 for(let i=0;i<7;i++){const h=.10+(i%3)*.07,g=new T.CylinderGeometry(0,.035,h,6),m=put(inside,d,g,'purple',[(i%3-1)*.095,-.19+h/2,(Math.floor(i/3)-1)*.095]);m.material= new T.MeshPhysicalMaterial({color:0x998bd9,roughness:.19,metalness:.05,clearcoat:1,transparent:true,opacity:.82,depthWrite:false});m.rotation.z=(i-3)*.075;m.name='Faceted crystal';}
 d='interior.samples';put(inside,d,rounded(.45,.18,.16),'ivory',[0,-.10,0]);
 for(let i=0;i<3;i++){
  const x=-.14+i*.14;put(inside,d,cyl(.043,.23),'glass',[x,.105,0]);put(inside,d,cyl(.046,.029),'dark',[x,.235,0]);put(inside,d,cyl(.029,.10+i*.026),['gold','blue','green'][i],[x,.04+i*.013,0]);
  put(inside,d,ring(.047,.008),'steel',[x,.13,0],[Math.PI/2,0,0]);
  put(inside,d,box(.045,.025,.01),['gold','blue','green'][i],[x,-.06,.09]);
  put(inside,d,cyl(.016,.015),'dark',[x,-.13,.09],[Math.PI/2,0,0]);
 }
 d='interior.services';
 for(let y of[-.03,.03]){
  rod(inside,d,[-1.45,y,0],[1.45,y,0],.012,y>0?'blue':'red');
  for(let i=0;i<9;i++)put(inside,d,box(.023,.07,.04),'steel',[-1.35+i*.33,y,-.012]);
 }
 // Floor and wall panels follow the actual installed cabin envelope.
 for(let x=-3.55;x<-.55;x+=.38){put(inside,'interior.services',box(.35,.022,.56),'ivory',[x+2,-.94,.27]);}
 // Recessed docking hardware and closed pressure hatch.
 const dock=A('docking');
 dock.group.traverse(o=>{if(o.name==='Docking tunnel'){o.geometry.dispose();o.geometry=new T.CylinderGeometry(.40,.40,.46,64,1,true);o.material.side=T.DoubleSide;}});
 put(dock,'docking.tunnel',cyl(.347,.025),'ivory',[-3.88,0,0],[0,0,Math.PI/2]).name='Pressure hatch';
 put(dock,'docking.ring',ring(.405,.021),'dark',[-4.255,0,0],[0,Math.PI/2,0]);
 bolts(dock,'docking.ring',[-4.17,0,0],.60,24);
 // Close outer module ends without inserting caps across the node passage.
 const mods=A('modules');
 for(const s of[-1,1]){
  put(mods,'modules.ring',cyl(.643,.055),'ivory',[.2,0,s*2.02],[Math.PI/2,0,0]).name='Cross end cap';
  bolts(mods,'modules.ring',[.2,0,s*2.055],.58,24,'z');
 }
 for(let x of[-3.72,-2.45,-1.2,-.10])bolts(mods,'modules.ring',[x,0,0],.657,20);
 put(mods,'modules.skin',new T.CylinderGeometry(.645,.59,.27,64,1,true),'ivory',[-3.915,0,0],[0,0,Math.PI/2]).name='Docking transition shell';
 put(mods,'modules.ring',ring(.651,.020),'gold',[-2.45,0,0],[0,Math.PI/2,0]);
 const node=A('node');put(node,'node.ring',ring(.15,.022),'gold',[.2,.702,0],[Math.PI/2,0,0]);
 put(node,'node.ring',cyl(.13,.025),'glass',[.2,.724,0]);
 node.group.traverse(o=>{if(o.name==='Hatch')o.parent.rotation.y=Math.PI/2;});
 bolts(node,'node.hatch',[.974,0,0],.25,12);
 put(node,'node.hatch',ring(.095,.014),'steel',[.986,0,0],[0,Math.PI/2,0]);
 for(const t of[0,Math.PI/3,Math.PI*2/3])rod(node,'node.hatch',[.994,-Math.sin(t)*.09,-Math.cos(t)*.09],[.994,Math.sin(t)*.09,Math.cos(t)*.09],.01,'gold');
 const windows=A('windows');
 for(const id of['windows.frame','windows.inner','windows.drape'])windows.details[id].clear();
 // A genuine annular frame leaves the glazing open through its centre.
 put(windows,'windows.frame',ring(.128,.025),'gold',[-2.6,.66,0],[Math.PI/2,0,0]);
 put(windows,'windows.inner',cyl(.108,.012),'glass',[-2.6,.682,0]);
 put(windows,'windows.inner',cyl(.108,.012),'glass',[-2.6,.705,0]);
 put(windows,'windows.drape',cyl(.024,.25),'blue',[-2.83,.66,0],[Math.PI/2,0,0]);
 // Apertures belong to the hull geometry. Glazing must not sit on opaque metal.
 const holes=[];
 for(const x of[-2.62,-1.38])for(const th of[Math.PI*.18,Math.PI*.82])holes.push({p:new T.Vector3(x,Math.sin(th)*.645,Math.cos(th)*.645),n:new T.Vector3(0,Math.sin(th),Math.cos(th)),r:.122});
 for(const z of[-1.31,1.31])holes.push({p:new T.Vector3(.2-.645,0,z),n:new T.Vector3(-1,0,0),r:.145});
 holes.push({p:new T.Vector3(-2.6,.645,0),n:new T.Vector3(0,1,0),r:.10});
 root.updateMatrixWorld(true);
 for(const m of [...mods.details['modules.skin'].children]){
  if(!['Module barrel','Cross module barrel'].includes(m.name))continue;
  const h=m.geometry.parameters.height;m.geometry.dispose();
  m.geometry=new T.CylinderGeometry(.645,.645,h,128,Math.ceil(h/.018),true);m.updateMatrixWorld(true);
  const geo=m.geometry.toNonIndexed(),pos=geo.attributes.position,indices=[];
  for(let i=0;i<pos.count;i+=3){const c=new T.Vector3();for(let j=0;j<3;j++)c.add(new T.Vector3().fromBufferAttribute(pos,i+j));c.multiplyScalar(1/3).applyMatrix4(m.matrixWorld);
   const remove=holes.some(hole=>{const delta=c.clone().sub(hole.p),normal=delta.dot(hole.n);return Math.abs(normal)<.06&&delta.addScaledVector(hole.n,-normal).length()<hole.r;});if(!remove)indices.push(i,i+1,i+2);
  }
  geo.setIndex(indices);m.geometry.dispose();m.geometry=geo;m.material.side=T.DoubleSide;
 }
 // Shoulder, elbow and wrist details are attached to the animated hierarchy.
 const arm=A('arm');
 for(const [key,r] of [['shoulder',.19],['elbow',.135],['wrist',.09]]){
  const p=arm.chain[key],id='arm.'+key;
  put(arm,id,cyl(r,.04),'steel',[0,0,.13],[Math.PI/2,0,0],p);
  put(arm,id,ring(r*.86,.012),'gold',[0,0,.157],[0,0,0],p);
  bolts(arm,id,[0,0,.16],r*.66,8,'z',p);
 }
 for(const [key,len,id]of[['upper',1.2,'arm.boom'],['fore',.90,'arm.wrist']]){
  const p=arm.chain[key];rod(arm,id,[.11,.10,.08],[.11,len-.08,.08],.015,'dark',p);
  for(let i=1;i<5;i++)put(arm,id,box(.045,.027,.045),'gold',[.11,i*len/5,.08],[0,0,0],p);
 }
 // Finger links share explicit hinge coordinates: no floating fingertip blocks.
 const wrist=arm.chain.wrist;
 for(const o of [...wrist.children])if(['Gripper finger','Gripper tip'].includes(o.name)){wrist.remove(o);o.geometry.dispose();}
 for(const s of[-1,1]){
  const points=[[s*.065,.11,0],[s*.14,.34,0],[s*.075,.43,0]];
  for(let i=0;i<2;i++){const v=new T.Vector3(...points[i]),w=new T.Vector3(...points[i+1]),delta=w.clone().sub(v),m=put(arm,'arm.gripper',box(.055,delta.length()+.018,.08),'steel',v.add(w).multiplyScalar(.5).toArray(),[0,0,0],wrist);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());}
  for(const p of points.slice(0,2))put(arm,'arm.gripper',cyl(.033,.096),'gold',p,[Math.PI/2,0,0],wrist);
 }
 // Physical glazing everywhere, including legacy portholes.
 root.traverse(o=>{if(!o.isMesh)return;if(o.material.name==='station-glass')return;
  if(/Porthole glass|Cross module porthole|Window petal|Top window|Inner pane/.test(o.name)){o.material=glass;o.castShadow=false;o.receiveShadow=false;}
 });glass.name='station-glass';
 const cup=A('cupola'),covers=[],panes=[];
 cup.exterior.traverse(o=>{
  if(o.name==='Shield cover')covers.push(o);
  if(['Top window','Window petal','Petal frame'].includes(o.name))panes.push(o);
  if(o.name==='Cupola housing'){o.geometry.dispose();o.geometry=new T.CylinderGeometry(.52,.58,.30,64,1,true);o.material.side=T.DoubleSide;}
  if(o.name==='Shield ring'){o.geometry.dispose();o.geometry=ring(.52,.035);o.rotation.x=Math.PI/2;}
 });
 covers.forEach((o,i)=>o.name='Observation shutter '+i);
 const glazing=new T.Group();glazing.name='Observation glazing';cup.exterior.add(glazing);root.updateMatrixWorld(true);panes.forEach(o=>glazing.attach(o));
 // Batch static opaque hardware per discovery/material to reduce draw calls.
 // Glass stays as separate panes for correct transparency sorting.
 const parents=[];root.traverse(o=>{if(o.isGroup)parents.push(o);});
 for(const parent of parents){const buckets=new Map();
  for(const o of parent.children){if(!o.isMesh||o.material.transparent||o.name!==o.userData.detail)continue;const key=o.name+'|'+o.material.uuid;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(o);}
  for(const list of buckets.values()){if(list.length<3)continue;const p=[],n=[];
   for(const o of list){o.updateMatrix();const g=(o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone()).applyMatrix4(o.matrix);p.push(...g.attributes.position.array);n.push(...g.attributes.normal.array);g.dispose();}
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('normal',new T.Float32BufferAttribute(n,3));const m=new T.Mesh(g,list[0].material);m.name=list[0].name;m.userData={...list[0].userData};m.castShadow=list[0].castShadow;m.receiveShadow=list[0].receiveShadow;
   list.forEach(o=>{parent.remove(o);o.geometry.dispose();});parent.add(m);
  }
 }
 // Keep nested animation geometry reachable by the discovery camera.
 for(const a of assemblies){a.detailMeshes={};a.group.traverse(o=>{const id=o.userData.detail;if(o.isMesh&&id)(a.detailMeshes[id]||(a.detailMeshes[id]=[])).push(o);});}
 model.layout=layout;
} };

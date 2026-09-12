const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const T=require('./labs/shared/vendor/three.min.js');
// The explorer-architecture labs. hsr moved to the v3 studio and is covered by
// qa_v3_hsr_model.cjs / qa_v3_hsr_browser.cjs.
for(const id of ['rocket','schoolbus']){
  const context={window:{}};
  for(const file of ['parts.js','model.js'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,'labs',id,file),'utf8'),context,{filename:id+'/'+file});
  const {LAB_CONFIG:config,LAB_PARTS:parts,buildLabModel:build}=context.window;
  assert.equal(config.id,id);assert.ok(parts.length>=6&&parts.length<=12);
  assert.equal(new Set(parts.map(p=>p.id)).size,parts.length);
  assert.equal(new Set(parts.map(p=>p.question)).size,parts.length);
  for(const p of parts)for(const field of ['id','name','zhName','category','color','en','zh','tip','question'])assert.ok(typeof p[field]==='string'&&p[field].trim(),`${id}/${p.id}/${field}`);
  const model=new T.Group(),scene=new T.Scene(),nodes=[],meshes=[];
  const mat=(color,options={})=>new T.MeshStandardMaterial({color,...options});
  const addPart=(partId,position,offset,anchor)=>{assert.ok(parts.some(p=>p.id===partId),`${id}: unknown ${partId}`);for(const v of [position,offset,anchor])assert.ok(v.length===3&&v.every(Number.isFinite));const g=new T.Group();g.position.set(...position);g.userData.part=partId;model.add(g);nodes.push({id:partId,g,base:g.position.clone(),offset:new T.Vector3(...offset)});return g;};
  const mesh=(g,geo,material,position=[0,0,0])=>{const m=new T.Mesh(geo,material.clone());m.position.set(...position);m.userData.part=g.userData.part;g.add(m);meshes.push(m);return m;};
  const box=(g,p,s,c)=>mesh(g,new T.BoxGeometry(...s),mat(c),p);
  const sphere=(g,p,s,c)=>{const m=mesh(g,new T.SphereGeometry(1,36,24),mat(c),p);m.scale.set(...s);return m;};
  const panel=(g,points,depth,c,plane='xz')=>{const s=new T.Shape();points.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();const geo=new T.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSize:.035,bevelThickness:.025,bevelSegments:2,steps:1});geo.translate(0,0,-depth/2);if(plane==='xz')geo.rotateX(Math.PI/2);return mesh(g,geo,mat(c));};
  build({T,addPart,mesh,mat,sphere,box,panel,model,scene});
  assert.ok(meshes.length>20,`${id}: expected detailed model`);
  for(const p of parts)assert.ok(nodes.some(n=>n.id===p.id),`${id}: missing selectable geometry ${p.id}`);
  for(const m of meshes){assert.ok(parts.some(p=>p.id===m.userData.part));assert.ok(Array.from(m.geometry.attributes.position.array).every(Number.isFinite),`${id}: non-finite geometry`);}
  const sizes=[];
  for(const amount of [0,1]){
    nodes.forEach(n=>n.g.position.copy(n.base).addScaledVector(n.offset,amount));model.updateMatrixWorld(true);
    const bounds=new T.Box3().setFromObject(model),size=bounds.getSize(new T.Vector3());
    assert.ok([size.x,size.y,size.z].every(v=>Number.isFinite(v)&&v>0&&v<30));sizes.push(size.toArray().map(v=>Number(v.toFixed(2))));
  }
  assert.ok(nodes.some(n=>n.offset.length()>1),`${id}: no meaningful explosion`);
  console.log(`PASS ${id}: ${parts.length} bilingual lessons, ${nodes.length} part groups, ${meshes.length} meshes; assembled/exploded bounds ${JSON.stringify(sizes)}`);
}

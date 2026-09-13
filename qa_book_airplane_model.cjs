const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const T=require('./labs/shared/vendor/three.min.js'),context={window:{}};
for(const file of ['airframe','engine'])vm.runInNewContext(fs.readFileSync(`${__dirname}/labs/airplane/v3/${file}.js`,'utf8'),context);
const plane=context.window.AirframeV3.create(T),cabin=plane.assemblies.find(a=>a.id==='cabin');
plane.root.updateMatrixWorld(true);
const panes=[];cabin.exterior.traverse(o=>{if(o.name==='Cabin window on skin')panes.push(o);});
assert.ok(panes.length>30,'A continuous row of small book-style passenger windows');
for(const pane of panes){const side=Math.sign(pane.position.z),origin=new T.Vector3(pane.position.x,pane.position.y,side*5),ray=new T.Raycaster(origin,new T.Vector3(0,0,-side));const hit=ray.intersectObject(cabin.exterior,true)[0];assert.equal(hit?.object,pane,`Cabin skin must not bury window at ${pane.position.toArray()}`);}
for(const a of plane.assemblies.filter(a=>a.region==='wings')){const fairings=a.exterior.getObjectByName('wing-cover').children.filter(o=>o.name==='Flap track fairing');assert.equal(fairings.length,3);for(const f of fairings){const bounds=new T.Box3().setFromObject(f),size=bounds.getSize(new T.Vector3());assert.ok(size.x>size.y*4&&size.x>size.z*4,'Streamlined fairing must be elongated in flight direction');}}
const fin=plane.assemblies.find(a=>a.id==='vertical-tail');assert.equal(fin.exterior.children.filter(o=>o.name==='White tail ribbon').length,2);
// Reviewable silhouette constraints, rather than paint-only assertions.
const radome=plane.root.getObjectByName('Rounded book radome'),skin=plane.root.getObjectByName('Book fuselage skin');
const bodyBox=new T.Box3().setFromObject(skin),noseBox=new T.Box3().setFromObject(radome);
const diameter=bodyBox.max.y-bodyBox.min.y,bodyLength=bodyBox.max.x-noseBox.min.x;
assert.ok(bodyLength/diameter>6.5&&bodyLength/diameter<7.3,'Overview has a full airliner fuselage, not a thin spindle');
const p=radome.geometry.attributes.position;let forwardShoulder=0;
for(let i=0;i<p.count;i++)if(p.getX(i)<noseBox.min.x+.36)forwardShoulder=Math.max(forwardShoulder,Math.abs(p.getZ(i)));
assert.ok(forwardShoulder>diameter*.24,'Radome must become round quickly behind its tip, not form a long pointed cone');
const panes3d=[];plane.root.traverse(o=>{if(o.name==='Curved cockpit windshield')panes3d.push(o);});
for(const pane of panes3d){const size=new T.Box3().setFromObject(pane).getSize(new T.Vector3());assert.ok(size.y<diameter*.20,'Cockpit windows must remain shallow, not a tall fighter canopy');}
const tires=[];plane.root.traverse(o=>{if(o.name==='Rounded tire with sidewalls')tires.push(o);});assert.equal(tires.length,6);
const groundLevels=tires.map(o=>new T.Box3().setFromObject(o).min.y);assert.ok(Math.max(...groundLevels)-Math.min(...groundLevels)<.012,'All three paired wheel sets meet one ground plane');
for(const a of plane.assemblies.filter(a=>a.region==='wings')){const tip=a.exterior.getObjectByName('Blended short winglet');const bounds=new T.Box3().setFromObject(tip);assert.ok(bounds.max.y<1&&bounds.max.y-bounds.min.y<.8,'Wingtip is the book-style short blended upturn');}
for(const side of [-1,1]){const engine=context.window.EngineV3.create(T,{side});for(const name of ['nacelle-near-half','nacelle-far-half']){const shell=engine.exterior.getObjectByName(name).children[0];assert.ok(shell.material.color.b>shell.material.color.r*2,'Painted blue nacelle');}assert.equal(engine.details['engine.fan'].parent,engine.exterior,'Fan face must remain visible in a closed engine');const size=new T.Box3().setFromObject(engine.group).getSize(new T.Vector3());assert.ok(size.x/size.z>1.5&&size.x/size.z<1.85,'Short broad engine silhouette replaces the long tapered pod');}
console.log('PASS airplane book reference: passenger windows visible above skin on both sides, six streamlined fairings, two tail ribbons, blue nacelles and exterior fan faces.');

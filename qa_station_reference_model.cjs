const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const ctx={window:{},console};vm.createContext(ctx);
for(const f of ['labs/shared/vendor/three.min.js','labs/station/v3/reference-details.js','labs/station/v3/stationframe.js','labs/station/parts.js','labs/station/detail-parts.js'])vm.runInContext(fs.readFileSync(f,'utf8'),ctx);
const T=ctx.THREE,m=ctx.window.StationV3.create(T);m.root.updateMatrixWorld(true);
for(const d of ctx.window.STATION_DETAILS){const a=m.assemblies.find(a=>a.region===d.region);assert.ok(a?.detailMeshes[d.id]?.length,d.id+' maps to visible geometry');assert.ok(d.en.length>25,d.id+' English explanation');}
const inside=m.assemblies.find(a=>a.id==='interior');
// Check real transformed vertices, not just object origins: furniture stays in cabins.
for(const id of Object.keys(inside.details)){
 const cross=['interior.plants','interior.crystals','interior.samples'].includes(id);
 inside.details[id].traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;
  for(let i=0;i<p.count;i++){const v=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);
   const radial=cross?Math.hypot(v.x-.2,v.y):Math.hypot(v.y,v.z);
   assert.ok(radial<.645,`${id}: vertex outside pressure cabin (${radial.toFixed(3)})`);
   if(!cross)assert.ok(v.x> -3.8&&v.x<.1,id+' inside fore barrel');
  }
 });
}
let glass=0;m.root.traverse(o=>{if(o.material?.name==='station-glass'){glass++;assert.ok(o.material.isMeshPhysicalMaterial&&o.material.transparent&&!o.material.depthWrite,'physical transparent glazing');}});assert.ok(glass>=20);
const boxes=Object.entries(inside.details).filter(([id])=>id!=='interior.services').map(([id,g])=>[id,new T.Box3().setFromObject(g)]);
for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++)assert.ok(!boxes[i][1].intersectsBox(boxes[j][1]),boxes[i][0]+' overlaps '+boxes[j][0]);
console.log('PASS station reference: '+ctx.window.STATION_DETAILS.length+' detail mappings; '+glass+' glass surfaces; furniture containment and separation; '+JSON.stringify(m.counts));

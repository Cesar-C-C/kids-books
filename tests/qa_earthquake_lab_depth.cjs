const assert=require('node:assert/strict'), fs=require('node:fs'), path=require('node:path');
const m=require('../labs/earthquake/v3/model.js');
const initial=m.createFault();
assert.equal(m.storedEnergy(initial),0);
const locked=m.advanceObservation(initial);
assert.equal(locked.phase,'locked'); assert.equal(locked.slipOffset,0);
assert.ok(m.storedEnergy(locked)>m.storedEnergy(initial),'locked rock stores illustrative elastic energy');
const slipped=m.advanceObservation(locked);
assert.equal(slipped.phase,'slipped');
assert.ok(m.storedEnergy(slipped)<m.storedEnergy(locked),'release partly reduces stored energy');
assert.ok(slipped.slipOffset>0 && slipped.elasticStrain>0);
const settled=m.advanceObservation(slipped);
assert.equal(settled.phase,'settled'); assert.equal(settled.slipOffset,slipped.slipOffset);
assert.deepEqual(m.advanceObservation(settled),settled,'no silent restart');
for(const focus of m.FOCI) {
 assert.ok(Math.abs(focus.x+m.FAULT_DIP*focus.y)<1e-9,'source lies on fault plane');
 const wave=m.createWave({focus}); assert.deepEqual(wave.focus,focus); assert.equal(wave.tick,0);
 for(const flag of m.FLAGS) {
  const d=Math.hypot(flag.position.x-focus.x,flag.position.y-focus.y,flag.position.z-focus.z);
  assert.equal(wave.arrivalTicks[flag.id].p,Math.ceil(d/0.16)); assert.equal(wave.arrivalTicks[flag.id].s,Math.ceil(d/0.1));
 }
 for(const point of [m.TRACKED_POINT,...m.FLAGS.map(f=>f.position)]) {
  const d={x:point.x-focus.x,y:point.y-focus.y,z:point.z-focus.z};
  let w=wave,pSeen=false,sSeen=false; const signs=new Set();
  for(let i=0;i<82;i++) {
   w=m.stepWave(w);
   const p=m.particleDisplacement(w,point,'p'),s=m.particleDisplacement(w,point,'s');
   if(Math.hypot(p.x,p.y,p.z)>0.001) {
    pSeen=true; signs.add(Math.sign(p.x*d.x+p.y*d.y+p.z*d.z));
    assert.ok(Math.hypot(p.y*d.z-p.z*d.y,p.z*d.x-p.x*d.z,p.x*d.y-p.y*d.x)<1e-7,'P parallel to propagation');
   }
   if(Math.hypot(s.x,s.y,s.z)>0.001) {sSeen=true; assert.ok(Math.abs(s.x*d.x+s.y*d.y+s.z*d.z)<1e-7,'S perpendicular to propagation');}
  }
  assert.ok(pSeen&&sSeen,'underground and surface points move during passing pulses'); assert.equal(signs.size,2,'local motion goes back and forth');
  assert.deepEqual(m.particleDisplacement(w,point,'p'),{x:0,y:0,z:0}); assert.deepEqual(m.particleDisplacement(w,point,'s'),{x:0,y:0,z:0});
 }
}
const root=path.resolve(__dirname,'..');
const content=JSON.parse(fs.readFileSync(path.join(root,'labs/earthquake/content.json'),'utf8'));
assert.equal(content.contentVersion,'earthquake-lab-v2');
assert.ok(content.entries.every(e=>e.contentVersion===content.contentVersion));
for(const id of ['why-locked','why-slipped','why-p','why-s','model-limit-focus','model-limit-waves']) {
 const item=content.entries.find(e=>e.id===id); assert.ok(item?.zh&&item?.en,id+' bilingual explanation/limit');
}
const html=fs.readFileSync(path.join(root,'labs/earthquake/index.html'),'utf8');
assert.ok(!html.includes('surface-choices')&&!html.includes('guess-correct'),'fixed ABC guessing removed');
for(const id of ['advance','deep-explanation','why-body','focus-deep','focus-shallow','focus-project','energy-evidence']) assert.ok(html.includes('id="'+id+'"'),id+' wired to page');
console.log('Earthquake v2 causal stages, energy, source change, local P/S polarization and teaching contracts PASS');

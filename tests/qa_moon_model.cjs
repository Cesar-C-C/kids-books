const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..');
const model=require('../books/moon/moon-model.js');
const story=JSON.parse(fs.readFileSync(path.join(root,'books/moon/story.json'),'utf8'));
const manifest=JSON.parse(fs.readFileSync(path.join(root,'books/moon/audio-manifest.json'),'utf8'));
const release=JSON.parse(fs.readFileSync(path.join(root,'docs/qa/moon-release-audio.json'),'utf8'));
const hash=x=>createHash('sha256').update(x).digest('hex');
assert.equal(release.approval.status,'accepted-by-user');
assert.deepEqual(release.files.map(f=>f.id).sort(),manifest.entries.map(e=>e.id).sort());
for(const file of release.files)assert.equal(hash(fs.readFileSync(path.join(root,file.path))),file.sha256,file.path);
assert.equal(manifest.scriptSha256,hash(fs.readFileSync(path.join(root,'books/moon/story.json'))));
const ids=new Set();
for(const entry of manifest.entries){assert(!ids.has(entry.id));ids.add(entry.id);assert.equal(entry.textSha256,hash(entry.text));const item=(entry.kind==='scene'?story.scenes:story.vocab).find(x=>x.id===(entry.sceneId||entry.termId));assert.equal(item[entry.lang],entry.text);assert.equal(entry.output,`audio/${entry.id}.mp3`);}
assert.equal(ids.size,2*(story.scenes.length+story.vocab.length));
for(const [a,f,x,y] of [[0,0,330,165],[90,.5,200,35],[180,1,70,165],[270,.5,200,295],[360,0,330,165]]){const s=model.state(a);assert(Math.abs(s.fraction-f)<1e-10);assert(Math.abs(s.x-x)<1e-8);assert(Math.abs(s.y-y)<1e-8);}
// Independent polygon area integration checks rendered illumination, not just state metadata.
for(let a=0;a<=360;a+=5){const p=[...model.path(a,1,0,0).matchAll(/[ML](-?[\d.]+),(-?[\d.]+)/g)].map(m=>[+m[1],+m[2]]);let twice=0;for(let i=0;i<p.length;i++){const q=p[(i+1)%p.length];twice+=p[i][0]*q[1]-q[0]*p[i][1];}const fraction=Math.abs(twice)/2/Math.PI;assert(Math.abs(fraction-(1-Math.cos(a*Math.PI/180))/2)<.003,`area ${a}`);}
console.log(`PASS: phase coordinates, 73 silhouette areas, ${ids.size} frozen bilingual entries`);

const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),work=path.join(root,'workbench/health-narration-update');
const jobs=JSON.parse(fs.readFileSync(path.join(work,'jobs.json'))),report=JSON.parse(fs.readFileSync(path.join(work,'validation.json'))),before=JSON.parse(fs.readFileSync(path.join(work,'before.json')));
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const targets=new Set(jobs.map(j=>`books/${j.book}/audio/${j.id}.mp3`));
assert.equal(jobs.length,16);assert.equal(Object.keys(report).length,16);
for(const book of ['myopia','cavities']){
 const scope={window:{},Reader:{init(){}}};vm.runInNewContext(fs.readFileSync(path.join(root,'books',book,'book.js'),'utf8'),scope);
 for(const j of jobs.filter(j=>j.book===book)){
  assert.equal(j.text,scope.window.PAGES[j.index][j.lang],'source changed since export');
  assert.equal(report[book+'/'+j.id].text,j.text);
  assert.equal(hash(path.join(work,book,j.id+'.mp3')),report[book+'/'+j.id].sha256);
 }
}
for(const [rel,h] of Object.entries(before))if(!targets.has(rel.replaceAll('\\','/')))assert.equal(hash(path.join(root,rel)),h,'unrelated audio changed');
for(const j of jobs)fs.copyFileSync(path.join(work,j.book,j.id+'.mp3'),path.join(root,'books',j.book,'audio',j.id+'.mp3'));
for(const book of ['myopia','cavities']){
 const p=path.join(root,'books',book,'_manifest.json'),m=JSON.parse(fs.readFileSync(p));
 for(const j of jobs.filter(j=>j.book===book)){const e=m.entries.find(e=>e.id===j.id);assert.ok(e);e.text=j.text;}
 fs.writeFileSync(p,JSON.stringify(m,null,2)+'\n');
}
for(const [rel,h] of Object.entries(before))if(!targets.has(rel.replaceAll('\\','/')))assert.equal(hash(path.join(root,rel)),h);
console.log('ADOPTED 16; remaining 64 audio hashes unchanged; manifest texts exact');

const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../books/earthquake');
function validate(s){
 assert.equal(s.bookId,'earthquake'); assert.ok(s.scriptVersion);
 const keys=new Set(),images=new Set(['opening','observation','arrival','exhibit']);
 for(const [kind,list] of [['scene',s.scenes],['vocab',s.vocab],['interaction',s.interactions]]){
  assert.ok(Array.isArray(list)&&list.length);
  for(const x of list){const k=kind==='interaction'?x.kind:kind;assert.match(x.id,/^[a-z0-9-]+$/);assert(!keys.has(k+':'+x.id));keys.add(k+':'+x.id);assert.equal(typeof x.narrationNeeded,'boolean');for(const lang of ['zh','en'])assert.ok(typeof x[lang]==='string'&&x[lang].trim());if(kind==='scene')assert(images.has(x.image));if(kind==='interaction')assert(['prompt','result'].includes(k));}
 }
 for(const id of ['fault-predict','fault-locked','fault-slipped','fault-settled','wave-predict','wave-ready','wave-moving','wave-surface','wave-finished','local-motion','exhibit-complete'])assert(s.interactions.some(x=>x.id===id),id);
 assert.equal(s.scriptVersion,'earthquake-story-v2');
 assert.equal(s.why.length,4);
 for(const q of s.why){assert(q.zh&&q.en);assert(s.scenes.some(x=>x.id===q.id&&x.layer==='why'));}
 for(const id of ['tectonic-load','stored-energy','released-energy','surface-shakes'])assert(s.scenes.some(x=>x.id===id));
 for(const id of ['arrived-a','arrived-b','arrived-together','exhibit-hint'])assert(!s.interactions.some(x=>x.id===id),'removed guess/sort line: '+id);
 assert.deepEqual(s.exhibitOrder,['strain','slip','waves']);assert(s.adultNotes.zh&&s.adultNotes.en);
 for(const scene of s.scenes)for(const lang of ['zh','en'])if(scene.segments){assert.equal(scene.segments[lang].map(x=>x.sourceText).join(''),scene[lang]);assert(scene.segments[lang].every(x=>['narrator','yanyan'].includes(x.role)));}
 return s;
}
assert(fs.existsSync(path.join(root,'story.json')),'earthquake story is not implemented');
const story=validate(JSON.parse(fs.readFileSync(path.join(root,'story.json'),'utf8')));
const missing=structuredClone(story);missing.scenes[0].en='';assert.throws(()=>validate(missing));
const duplicate=structuredClone(story);duplicate.scenes.push(duplicate.scenes[0]);assert.throws(()=>validate(duplicate));
if(process.argv.includes('--art')){const manifest=JSON.parse(fs.readFileSync(path.join(root,'art-manifest.json'),'utf8'));for(const id of ['opening','observation','arrival','exhibit','yan-yan']){const item=manifest.entries.find(x=>x.id===id);assert(item&&item.reviewed,'missing reviewed art: '+id);assert(fs.existsSync(path.join(root,item.path)));}require('node:child_process').execFileSync('python',['-c',"from PIL import Image; import sys; im=Image.open(sys.argv[1]); assert im.mode=='RGBA'; assert im.getchannel('A').getextrema()==(0,255)",path.join(root,'images/yan-yan.webp')]);}
console.log('EARTHQUAKE_CONTENT_PASS',story.scenes.length,'scenes',story.interactions.length,'interaction lines');

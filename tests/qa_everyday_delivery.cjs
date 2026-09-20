// Portable release contract: final MP3 identity, bilingual text and segment casting.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),h=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const book of ['sound','soap']){
 const base=path.join(root,'books',book),read=f=>fs.readFileSync(path.join(base,f)),manifest=JSON.parse(read('audio-manifest.json')),delivery=JSON.parse(read('audio-delivery.json'));
 assert.equal(delivery.bookId,book);assert.equal(delivery.audioVersion,1);
 assert.deepEqual(delivery.entries.map(e=>e.id).sort(),manifest.entries.map(e=>e.id).sort());
 for(const e of delivery.entries){const m=manifest.entries.find(m=>m.id===e.id);assert.equal(e.output,m.output);assert.equal(e.lang,m.lang);assert.equal(h(read(e.output)),e.sha256);assert(e.seconds>0);assert.equal(e.segments.map(s=>s.sourceText).join(''),m.text);assert.equal(e.segments.map(s=>s.spokenText).join(''),m.text.replace(/[“”]/g,''));for(const s of e.segments)assert(['narrator','dongdong','squirrel','momo','mom'].includes(s.role));}
 assert(!/[A-Z]:\\|absolutePath|actualFile/.test(read('audio-delivery.json').toString()));
 console.log('DELIVERY_CONTRACT_PASS',book,delivery.entries.length);
}

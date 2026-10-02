const {test,beforeEach}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const modulePath='../tools/earthquake_audio_manifest.cjs';
const api=fs.existsSync(require('node:path').resolve(__dirname,modulePath))?require(modulePath):{};
beforeEach(()=>assert.equal(typeof api.collectEntries,'function','real exporter required before negative validation tests'));
const item=(id='intro')=>({id,zh:'岩岩看模型。',en:'Yanyan looks at the model.',narrationNeeded:true});
const book=()=>({bookId:'earthquake',scriptVersion:'earthquake-v1',scenes:[item()],vocab:[],interactions:[]});
test('covers_required_bilingual_items',()=>{
 assert.equal(typeof api.collectEntries,'function','exporter must exist');
 const s=book();s.interactions=[{...item('stuck'),kind:'prompt'},{...item('slip'),kind:'result'}];
 assert.deepEqual(api.collectEntries('book',s).map(e=>e.key),['book:scene-intro-zh','book:scene-intro-en','book:prompt-stuck-zh','book:prompt-stuck-en','book:result-slip-zh','book:result-slip-en']);
});
test('rejects_duplicate_missing_translation_and_bad_path',()=>{
 for(const mutate of [s=>s.scenes.push(item()),s=>delete s.scenes[0].en,s=>s.scenes[0].id='../escape',s=>s.scenes[0].narrationNeeded='true']){
  const s=book();mutate(s);assert.throws(()=>api.collectEntries('book',s));
 }
});
test('non_narrated_buttons_excluded',()=>{const s=book();s.interactions=[{...item('go'),kind:'prompt',narrationNeeded:false}];assert.equal(api.collectEntries('book',s).length,2)});
test('hashes_roles_and_spoken_text',()=>{
 const s=book(),a=api.collectEntries('book',s)[0];s.scenes[0].segments={zh:[{role:'yanyan',sourceText:s.scenes[0].zh}]};
 const b=api.collectEntries('book',s)[0];assert.equal(a.textSha256,b.textSha256);assert.notEqual(a.utteranceSha256,b.utteranceSha256);
 s.scenes[0].segments.zh[0].spokenText='岩岩看看模型。';assert.throws(()=>api.collectEntries('book',s),/reason/i);
 s.scenes[0].segments.zh[0].reason='approved pronunciation mapping';assert.notEqual(api.collectEntries('book',s)[0].utteranceSha256,b.utteranceSha256);
});
test('normalizes_crlf_and_nfc_but_preserves_spaces',()=>{
 const s=book();s.scenes[0].en='Cafe\u0301\r\nmodel';const a=api.collectEntries('book',s)[1];s.scenes[0].en='Café\nmodel';assert.equal(api.collectEntries('book',s)[1].utteranceSha256,a.utteranceSha256);s.scenes[0].en+=' ';assert.notEqual(api.collectEntries('book',s)[1].utteranceSha256,a.utteranceSha256);
});
test('rejects_segment_source_mismatch_and_unknown_role',()=>{
 for(const seg of [{role:'narrator',sourceText:'Wrong'},{role:'worm',sourceText:'岩岩看模型。'}]){const s=book();s.scenes[0].segments={zh:[seg]};assert.throws(()=>api.collectEntries('book',s));}
});
test('lab_namespace_and_pending_manifest',()=>{
 const s={contentVersion:'lab-v1',entries:[{...item(),kind:'knowledge',conceptId:'fault',contentVersion:'lab-v1'}]};const m=api.buildManifest('lab',s,JSON.stringify(s));
 assert.equal(m.schemaVersion,2);assert.equal(m.entries[0].key,'lab:knowledge-intro-zh');assert.equal(m.entries[0].output,'audio/knowledge-intro-zh.mp3');assert.equal(m.entries[0].status,'pending');assert.equal(m.entries[0].fileSha256,null);assert.equal(m.entries.length,2);
});
test('rejects_owner_kind_and_raw_source_mismatch',()=>{
 assert.throws(()=>api.collectEntries('other',book()));const s=book();s.interactions=[{...item(),kind:'knowledge'}];assert.throws(()=>api.collectEntries('book',s));assert.throws(()=>api.buildManifest('book',book(),'{}'));
});
test('cli_missing_sources_fails_without_writing',()=>{
 const {spawnSync}=require('node:child_process');
 const root=fs.mkdtempSync(require('node:path').join(require('node:os').tmpdir(),'earthquake-audio-test-'));
 const r=spawnSync(process.execPath,[require('node:path').resolve(__dirname,modulePath),'--root',root,'--check'],{encoding:'utf8'});
 assert.notEqual(r.status,0);assert.match(r.stderr,/missing|ENOENT/i);assert.deepEqual(fs.readdirSync(root),[]);
});

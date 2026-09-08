const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const root=__dirname;
const context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'labs/catalog.js'),'utf8'),context);
const labs=context.window.LABS_CATALOG;
assert.ok(Array.isArray(labs)&&labs.length>=3);
assert.equal(new Set(labs.map(l=>l.id)).size,labs.length);
for(const lab of labs){
  assert.match(lab.id,/^[a-z][a-z0-9-]*$/);
  for(const key of ['title','englishTitle','description','icon','status'])assert.ok(lab[key],`${lab.id}: ${key}`);
  assert.ok(['ready','planned'].includes(lab.status));
  if(lab.status==='ready'){
    assert.equal(lab.href,`${lab.id}/index.html`);
    assert.ok(fs.existsSync(path.join(root,'labs',lab.href)));
    assert.ok(fs.existsSync(path.join(root,'labs',lab.image)));
  }else assert.equal(lab.href,null,'Planned labs must not have a live URL');
  if(lab.bookId)assert.ok(fs.existsSync(path.join(root,'books',lab.bookId,'index.html')));
}
for(const page of ['index.html','labs/index.html','labs/airplane/engine/index.html',...labs.filter(l=>l.status==='ready').map(l=>'labs/'+l.href)]){
  const html=fs.readFileSync(path.join(root,page),'utf8');
  for(const m of html.matchAll(/(?:src|href)="([^"#]+)"/g)){
    if(/^(?:https?:|data:)/.test(m[1]))continue;
    assert.ok(fs.existsSync(path.resolve(root,path.dirname(page),m[1].split(/[?#]/)[0])),`${page}: missing ${m[1]}`);
  }
}
assert.ok(fs.readFileSync(path.join(root,'index.html'),'utf8').includes('labs/index.html'));
for(const file of ['labs/catalog.js','labs/directory.js','labs/shared/navigation.js','labs/shared/speech.js','labs/shared/page.js','labs/shared/explorer.js','labs/airplane/app.js','labs/airplane/parts.js'])new vm.Script(fs.readFileSync(path.join(root,file),'utf8'));
const partsContext={window:{}};
for(const file of ['labs/shared/discovery-progress.js','labs/airplane/discovery.js','labs/airplane/engine/app.js','labs/airplane/engine/model.js','labs/airplane/engine/content.js'])new vm.Script(fs.readFileSync(path.join(root,file),'utf8'));
vm.runInNewContext(fs.readFileSync(path.join(root,'labs/airplane/parts.js'),'utf8'),partsContext);
assert.equal(partsContext.window.PLANE_PARTS.length,10);
console.log(`PASS: ${labs.length} registered labs, ready/planned routes, related books, shared assets, 10 airplane lessons, script syntax.`);

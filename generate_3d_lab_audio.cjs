const fs=require('fs');const path=require('path');const vm=require('vm');
const root=__dirname;
function load(dir,file){const c={window:{}};vm.createContext(c);for(const f of file){vm.runInContext(fs.readFileSync(path.join(dir,f),'utf8'),c);}return c.window;}
function entries(dir,name){
 const w=load(dir,['parts.js','detail-parts.js']);
 const parts=w[Object.keys(w).find(k=>k.endsWith('_PARTS'))]||[];
 const details=w[Object.keys(w).find(k=>k.endsWith('_DETAILS'))]||[];
 const all=[...parts,...details].filter(p=>p&&p.id&&p.en).map(p=>({id:p.id,lang:'en',text:`${p.name}. ${p.en}`}));
 fs.mkdirSync(path.join(dir,'audio'),{recursive:true});fs.writeFileSync(path.join(dir,'_manifest.json'),JSON.stringify({audioDir:'audio',entries:all},null,2)+'\n');console.log(`${name}: ${all.length}`);
}
for(const name of ['airplane','hsr','rocket','schoolbus','doubledecker','station']) entries(path.join(root,'labs',name),name);

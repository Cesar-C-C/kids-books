// Read-only source extraction for page-specific art briefs.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const id = process.argv[2];
const context = {window:{}, Reader:{init(){}}, document:{}};
vm.createContext(context);
for (const file of ['shared/overlays.js', `books/${id}/overlays.js`, `books/${id}/book.js`]) {
  vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context);
}
const manifest = JSON.parse(fs.readFileSync(path.join(root,'art/regeneration-manifest.json'),'utf8'));
const pages = manifest.filter(p=>p.book===id).map(p=>{
  const hotspots=[];
  context.partSVG = part => {hotspots.push(part);return '';};
  if(p.overlayKey) context.window.OVL[p.overlayKey]();
  return {...p, hotspots};
});
process.stdout.write(JSON.stringify({title:context.window.BOOK.title,pages}));

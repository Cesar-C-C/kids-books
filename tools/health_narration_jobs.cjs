const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const jobs = [];
for (const [book, indices] of Object.entries({myopia:[4,5,11], cavities:[2,3,4,5,6]})) {
  const scope = {window:{}, Reader:{init(){}}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'books',book,'book.js'),'utf8'),scope);
  for (const index of indices) for (const lang of ['zh','en']) {
    jobs.push({book,index,lang,id:`page_${String(index).padStart(2,'0')}_${lang}`,text:scope.window.PAGES[index][lang]});
  }
}
const out = path.join(root,'workbench','health-narration-update');
fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'jobs.json'),JSON.stringify(jobs,null,2)+'\n');
console.log(`Exported ${jobs.length} exact current story texts`);

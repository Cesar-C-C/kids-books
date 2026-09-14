// Derive narration inputs from the exact displayed text, without a second script copy.
const fs=require('fs'),path=require('path'),vm=require('vm');
const dir=path.resolve(__dirname,'../books/cloud'),sandbox={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(dir,'book.js'),'utf8'),sandbox);
const entries=[];
sandbox.window.PAGES.forEach((p,i)=>{
 for(const lang of ['zh','en']){
  const n=String(i).padStart(2,'0');
  entries.push({id:`page_${n}_${lang}`,lang,text:p[lang]});
  entries.push({id:`fact_${n}_${lang}`,lang,text:p[lang==='zh'?'factZh':'factEn']});
 }
 for(const w of p.glossary||[])for(const lang of ['zh','en'])entries.push({id:`word_${w.en.toLowerCase().replaceAll(' ','_')}_${lang}`,lang,text:w[lang]});
});
fs.writeFileSync(path.join(dir,'_manifest.json'),JSON.stringify({audioDir:'audio',entries},null,2)+'\n');
console.log(`Cloud: ${sandbox.window.PAGES.length} pages; ${entries.length} bilingual audio entries.`);

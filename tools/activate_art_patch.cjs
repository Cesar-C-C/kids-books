// Print a patch only after a book has passed artwork and hotspot review.
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),ids=process.argv.slice(2);
const all=JSON.parse(fs.readFileSync(path.join(root,'art/regeneration-manifest.json'),'utf8'));
let patch='*** Begin Patch\n';
for(const file of [...ids.map(id=>`books/${id}/book.js`),'index.html']){
 const old=fs.readFileSync(path.join(root,file),'utf8');let next=old;
 for(const p of all.filter(p=>ids.includes(p.book))){
  const a=file==='index.html'?`books/${p.book}/${p.oldAsset}`:p.oldAsset;
  const b=file==='index.html'?`books/${p.book}/${p.newAsset}`:p.newAsset;
  if(file==='index.html'||file===`books/${p.book}/book.js`)next=next.replaceAll(a,b);
 }
 if(next!==old){patch+=`*** Update File: ${path.join(root,file).replaceAll('\\','/')}\n`;const a=old.split(/\r?\n/),b=next.split(/\r?\n/);for(let i=0;i<a.length;i++)if(a[i]!==b[i])patch+=`@@\n-${a[i]}\n+${b[i]}\n`;}
}
console.log(patch+'*** End Patch');

// Diagnostic rendering only: source artwork and production overlays are never modified.
const fs=require('fs'),path=require('path'),vm=require('vm'),sharp=require('sharp');
const root=path.resolve(__dirname,'..'),id=process.argv[2];
const ctx={window:{},Reader:{init(){}},document:{}};vm.createContext(ctx);
for(const f of ['shared/overlays.js',`books/${id}/overlays.js`,`books/${id}/book.js`])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx);
const manifest=JSON.parse(fs.readFileSync(path.join(root,'art/regeneration-manifest.json'),'utf8')).filter(p=>p.book===id);
const out=path.join(root,'.art-review',id);fs.mkdirSync(out,{recursive:true});
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
(async()=>{
 const thumbs=[];
 for(let i=0;i<manifest.length;i++){
  const p=manifest[i],file=path.join(root,'books',id,p.newAsset);
  if(!fs.existsSync(file))throw Error('Missing '+file);
  let svg=p.overlayKey?ctx.window.OVL[p.overlayKey]():'';
  const points=[];const saved=ctx.partSVG;ctx.partSVG=h=>{points.push(h);return '';};
  if(p.overlayKey)ctx.window.OVL[p.overlayKey]();ctx.partSVG=saved;
  const labels=points.map((h,j)=>`<text x="${12.6+h.px/1216*974.8}" y="${h.py/832*667-24}" text-anchor="middle" font-size="13" font-family="Arial" fill="#0b1220" stroke="white" stroke-width="3" paint-order="stroke">${j+1}. ${esc(h.name)}</text>`).join('');
  if(svg)svg=svg.replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" width="1248" height="832" ').replace('</svg>',labels+'</svg>');
  const base=await sharp(file).extend({left:16,right:16,top:0,bottom:0,background:'#f6f3eb'}).png().toBuffer();
  const marked=svg?await sharp(base).composite([{input:Buffer.from(svg)}]).png().toBuffer():base;
  await sharp(marked).toFile(path.join(out,`${String(i).padStart(2,'0')}.png`));
  const image=await sharp(marked).resize(416,277).toBuffer();
  const caption=Buffer.from(`<svg width="416" height="28"><rect width="416" height="28" fill="white"/><text x="8" y="19" font-family="Arial" font-size="13" fill="#111">${i}. ${esc(path.basename(p.newAsset))}</text></svg>`);
  const thumb=await sharp({create:{width:416,height:305,channels:3,background:'white'}}).composite([{input:image,top:0,left:0},{input:caption,top:277,left:0}]).png().toBuffer();
  thumbs.push({input:thumb,left:(i%3)*416,top:Math.floor(i/3)*305});
 }
 await sharp({create:{width:1248,height:Math.ceil(thumbs.length/3)*305,channels:3,background:'#eee'}}).composite(thumbs).png().toFile(path.join(out,'sheet.png'));
 console.log(path.join(out,'sheet.png'));
})().catch(e=>{console.error(e);process.exit(1);});

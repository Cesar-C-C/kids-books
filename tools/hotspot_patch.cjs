// Emit an apply_patch patch from visually reviewed coordinates. Does not write files.
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),id=process.argv[2];
const mapping=JSON.parse(fs.readFileSync(path.join(root,'art',id+'-hotspot-review.json'),'utf8')).coordinates;
const file=path.join(root,'books',id,'overlays.js');
const original=fs.readFileSync(file,'utf8').trimEnd();let changed=original;
for(const [key,point] of Object.entries(mapping)){
  if(!Array.isArray(point)||point.length!==2)throw Error('Coordinates must be keyed by lineKey: '+key);
  const match=new RegExp('lineKey:\\s*[\x27\x22]'+key+'[\x27\x22]').exec(changed);
  if(!match)throw Error('Missing '+key);
  const pos=match.index,start=changed.lastIndexOf('{',pos),end=changed.indexOf('}',pos)+1;
  let block=changed.slice(start,end);
  if(!/px:\s*\d+/.test(block)||!/py:\s*\d+/.test(block))throw Error('Missing point '+key);
  block=block.replace(/px:\s*\d+/,`px:${point[0]}`).replace(/py:\s*\d+/,`py:${point[1]}`);
  changed=changed.slice(0,start)+block+changed.slice(end);
}
process.stdout.write('*** Begin Patch\n*** Update File: '+file+'\n@@\n-'+original.replaceAll('\r\n','\n').replaceAll('\n','\n-')+'\n+'+changed.replaceAll('\r\n','\n').replaceAll('\n','\n+')+'\n*** End Patch');

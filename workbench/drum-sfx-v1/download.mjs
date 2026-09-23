import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const base=new URL('./',import.meta.url);
const commit='c1ea7bcc3c7309650ab0da9d15c9cd1fbc4a4c7e';
const paths=['LICENSE','README.md','Membranophones/Struck Membranophones/Conga/Conga_HitN_v3_rr1_Sum.wav','Membranophones/Struck Membranophones/Bass Drum 1/BDrumNew_hit_v5_rr1_Sum.wav','Membranophones/Struck Membranophones/Darbuka/Darbuka_1_hit_vl2_rr1.wav'];
await mkdir(new URL('raw/',base),{recursive:true});
const rows=[];
for(const path of paths){
 const url=`https://raw.githubusercontent.com/sgossner/VCSL/${commit}/${path.split('/').map(encodeURIComponent).join('/')}`;
 const r=await fetch(url);if(!r.ok)throw Error(`${r.status} ${url}`);
 const b=Buffer.from(await r.arrayBuffer());const file=path.split('/').at(-1);
 await writeFile(new URL(`raw/${file}`,base),b);
 rows.push({path,url,file,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')});
}
await writeFile(new URL('sources.json',base),JSON.stringify({commit,rows},null,2));
console.log(JSON.stringify(rows,null,2));

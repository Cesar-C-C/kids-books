const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..'),hash=s=>createHash('sha256').update(s).digest('hex');
for(const bookId of ['sound','soap']){
 const dir=path.join(root,'books',bookId),raw=fs.readFileSync(path.join(dir,'story.json'),'utf8'),s=JSON.parse(raw),entries=[];
 for(const [kind,items]of [['scene',s.scenes],['vocab',s.vocab]])for(const item of items)for(const lang of ['zh','en'])entries.push({id:`${kind}-${item.id}-${lang}`,kind,[kind==='scene'?'sceneId':'termId']:item.id,role:'narrator',lang,text:item[lang],textSha256:hash(item[lang]),output:`audio/${kind}-${item.id}-${lang}.mp3`});
 fs.writeFileSync(path.join(dir,'audio-manifest.json'),JSON.stringify({bookId,scriptVersion:s.scriptVersion,scriptSha256:hash(raw),entries},null,2)+'\n');console.log(bookId,entries.length,hash(raw));
}

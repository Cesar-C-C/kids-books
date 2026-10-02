'use strict';
const {createHash}=require('node:crypto');
const {isDeepStrictEqual}=require('node:util');
function normalize(value){
 if(typeof value!=='string')throw new Error('Expected text string');
 return value.normalize('NFC').replace(/\r\n/g,'\n');
}
const hash=value=>createHash('sha256').update(value).digest('hex');
function nonempty(value,label){if(typeof value!=='string')throw new Error('Missing '+label);const v=normalize(value);if(!v.trim())throw new Error('Missing '+label);return v;}
function collectEntries(owner,source){
 if(!['book','lab'].includes(owner))throw new Error('Invalid owner');
 if(owner==='book'&&source.bookId!=='earthquake')throw new Error('Invalid bookId');
 const version=nonempty(owner==='book'?source.scriptVersion:source.contentVersion,'contentVersion');
 const groups=owner==='book'?[['scene',source.scenes],['vocab',source.vocab],['interaction',source.interactions]]:[['lab',source.entries]];
 const entries=[],seen=new Set();
 for(const [group,items]of groups){
  if(!Array.isArray(items))throw new Error('Missing array '+group);
  for(const item of items){
   const kind=['scene','vocab'].includes(group)?group:item.kind;
   const allowed=group==='lab'?['knowledge','prompt','result']:group==='interaction'?['prompt','result']:[group];
   if(!allowed.includes(kind))throw new Error('Invalid kind');
   if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id||''))throw new Error('Invalid itemId');
   const identity=kind+':'+item.id;if(seen.has(identity))throw new Error('Duplicate item');seen.add(identity);
   if(typeof item.narrationNeeded!=='boolean')throw new Error('narrationNeeded must be boolean');
   const texts={zh:nonempty(item.zh,'zh'),en:nonempty(item.en,'en')};
   if(!item.narrationNeeded)continue;
   for(const lang of ['zh','en']){
    const text=texts[lang],rawSegments=item.segments?.[lang]??[{role:'narrator',sourceText:text}];
    if(!Array.isArray(rawSegments)||!rawSegments.length)throw new Error('Empty segments');
    const segments=rawSegments.map(segment=>{
     if(!['narrator','yanyan'].includes(segment.role))throw new Error('Unknown role');
     const sourceText=nonempty(segment.sourceText,'sourceText');
     const spokenText=nonempty(segment.spokenText??sourceText,'spokenText');
     const result={role:segment.role,sourceText,spokenText};
     if(spokenText!==sourceText)result.reason=nonempty(segment.reason,'spokenText change reason');
     return result;
    });
    if(segments.map(s=>s.sourceText).join('')!==text)throw new Error('Segment source mismatch');
    const id=`${kind}-${item.id}-${lang}`;
    const utterance={kind,id:item.id,lang,text,segments:segments.map(({role,sourceText,spokenText})=>({role,sourceText,spokenText}))};
    const entry={id,key:`${owner}:${id}`,owner,itemId:item.id,kind,lang,text,segments,contentVersion:nonempty(item.contentVersion??version,'item contentVersion'),textSha256:hash(text),utteranceSha256:hash(JSON.stringify(utterance)),output:`audio/${id}.mp3`,status:'pending',fileSha256:null};
    if(item.conceptId)entry.conceptId=item.conceptId;
    if(kind==='scene')entry.sceneId=item.id;
    if(kind==='vocab')entry.termId=item.id;
    entries.push(entry);
   }
  }
 }
 return entries;
}
function buildManifest(owner,source,sourceRaw){
 if(!isDeepStrictEqual(JSON.parse(sourceRaw),source))throw new Error('Raw source mismatch');
 const entries=collectEntries(owner,source),contentVersion=owner==='book'?source.scriptVersion:source.contentVersion;
 const sourceSha256=hash(normalize(sourceRaw));
 const result={schemaVersion:2,topicId:'earthquake',owner,contentVersion,sourceSha256,entries};
 if(owner==='book')Object.assign(result,{bookId:'earthquake',scriptVersion:contentVersion,scriptSha256:sourceSha256});
 return result;
}
module.exports={normalize,collectEntries,buildManifest};
if(require.main===module){
 try{
  const fs=require('node:fs'),path=require('node:path'),args=process.argv.slice(2);
  let root=process.cwd();
  if(args.includes('--check')&&args.includes('--write'))throw new Error('Choose either --check or --write');
  for(let i=0;i<args.length;i++){
   if(args[i]==='--root'&&args[i+1])root=path.resolve(args[++i]);
   else if(!['--check','--write'].includes(args[i]))throw new Error('Only --check, --write and --root are supported');
  }
  const summaries=[];
  const frozenPath=path.join(root,'workbench/earthquake-audio-v1/freeze.json');
  const frozen=fs.existsSync(frozenPath)?JSON.parse(fs.readFileSync(frozenPath,'utf8')):null;
  for(const [owner,relative]of [['book','books/earthquake/story.json'],['lab','labs/earthquake/content.json']]){
   const raw=fs.readFileSync(path.join(root,relative),'utf8');
   const manifest=buildManifest(owner,JSON.parse(raw),raw);
   const isFrozen=owner==='book'?JSON.parse(raw).frozen===true:frozen?.sources?.lab?.ownerConfirmed===true;
   const expected=frozen?.sources?.[owner]?.sourceSha256;
   const matchesFreeze=isFrozen&&expected===manifest.sourceSha256;
   if(args.includes('--write')&&!matchesFreeze)throw new Error(owner+' source is not frozen at the recorded hash');
   summaries.push({owner,contentVersion:manifest.contentVersion,sourceSha256:manifest.sourceSha256,entries:manifest.entries.length,status:matchesFreeze?'pending-audio':'pending-content-freeze',manifest});
  }
  if(args.includes('--write')){
   for(const summary of summaries){
    const destination=path.join(root,summary.owner==='book'?'books/earthquake/audio-manifest.json':'labs/earthquake/audio-manifest.json');
    if(fs.existsSync(destination))throw new Error('Refusing to overwrite existing manifest: '+destination);
    const temp=destination+'.tmp';
    fs.writeFileSync(temp,JSON.stringify(summary.manifest,null,2)+'\n','utf8');
    fs.renameSync(temp,destination);
   }
  }
  console.log(JSON.stringify({productionAllowed:false,sources:summaries.map(({manifest,...summary})=>summary),written:args.includes('--write')},null,2));
 }catch(error){console.error('Audio preparation not ready: '+error.message);process.exitCode=1;}
}

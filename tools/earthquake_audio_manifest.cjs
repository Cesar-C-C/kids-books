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
  if(args.filter(arg=>['--check','--write','--check-v2','--write-v2'].includes(arg)).length>1)throw new Error('Choose exactly one manifest mode');
  for(let i=0;i<args.length;i++){
   if(args[i]==='--root'&&args[i+1])root=path.resolve(args[++i]);
   else if(!['--check','--write','--check-v2','--write-v2'].includes(args[i]))throw new Error('Only --check, --write, --check-v2, --write-v2 and --root are supported');
  }
  if(args.includes('--check-v2')||args.includes('--write-v2')){
   const freezePath=path.join(root,'docs/qa/earthquake-v2-integration/content-freeze.json');
   const diffPath=path.join(root,'docs/qa/earthquake-v2-integration/narration-diff.json');
   const freezeRaw=fs.readFileSync(freezePath,'utf8'),diffRaw=fs.readFileSync(diffPath,'utf8');
   const freeze=JSON.parse(freezeRaw),diff=JSON.parse(diffRaw),freezeSha256=hash(freezeRaw),diffSha256=hash(diffRaw);
   if(freeze.jointContentFrozen!==true||freeze.generation?.authorized!==true)throw new Error('Joint v2 content freeze and generation authority are required');
   if(diff.frozen!==true||diff.topicId!=='earthquake')throw new Error('Frozen earthquake narration diff required');
   const summaries=[],destinations=[];
   for(const [owner,sourceRel,manifestRel]of [['book','books/earthquake/story.json','books/earthquake/audio-manifest.json'],['lab','labs/earthquake/content.json','labs/earthquake/audio-manifest.json']]){
    const sourcePath=path.join(root,sourceRel),destination=path.join(root,manifestRel),sourceRaw=fs.readFileSync(sourcePath,'utf8');
    const sourceFileSha256=hash(sourceRaw),manifest=buildManifest(owner,JSON.parse(sourceRaw),sourceRaw),locked=freeze.sources?.[owner],ownerDiff=diff.owners?.[owner];
    if(!locked||locked.frozen!==true||locked.ownerConfirmed!==true)throw new Error(`${owner} source freeze is incomplete`);
    if(sourceFileSha256!==locked.fileSha256||manifest.sourceSha256!==locked.sourceSha256)throw new Error(`${owner} source hash differs from joint freeze`);
    if(manifest.contentVersion!==locked.contentVersion||manifest.entries.length!==locked.entries)throw new Error(`${owner} source version or entry count differs from joint freeze`);
    if(!ownerDiff||ownerDiff.contentVersion!==manifest.contentVersion||ownerDiff.priorManifestSha256==null)throw new Error(`${owner} narration diff is incomplete`);
    const categories=['reuseCandidates','changed','added'];
    const records=categories.flatMap(category=>{
     const rows=ownerDiff[category];
     if(!Array.isArray(rows)||rows.length!==ownerDiff.counts?.[category])throw new Error(`${owner} diff ${category} count mismatch`);
     return rows.map(row=>({...row,category}));
    });
    const keys=records.map(row=>row.key);
    if(new Set(keys).size!==keys.length||keys.length!==manifest.entries.length)throw new Error(`${owner} diff identities do not exactly cover its manifest`);
    const byKey=new Map(records.map(row=>[row.key,row]));
    for(const entry of manifest.entries){
     const row=byKey.get(entry.key);
     if(!row||row.owner!==owner||row.kind!==entry.kind||row.itemId!==entry.itemId||row.lang!==entry.lang||row.textSha256!==entry.textSha256||row.utteranceSha256!==entry.utteranceSha256||row.output!==entry.output)throw new Error(`${owner} diff identity/hash mismatch: ${entry.key}`);
    }
    const oldRaw=fs.existsSync(destination)?fs.readFileSync(destination,'utf8'):null;
    let destinationState='missing';
    if(oldRaw!==null){
     const old=JSON.parse(oldRaw);
     const v2Shape=old.owner===owner&&old.contentVersion===manifest.contentVersion&&old.sourceSha256===manifest.sourceSha256&&Array.isArray(old.entries)&&old.entries.length===manifest.entries.length&&old.entries.every((entry,index)=>{
      const {status,fileSha256,...immutable}=entry;
      const {status:expectedStatus,fileSha256:expectedFileSha,...expectedImmutable}=manifest.entries[index];
      return JSON.stringify(immutable)===JSON.stringify(expectedImmutable)&&['pending','ready'].includes(status)&&(status==='pending'?fileSha256===null:/^[a-f0-9]{64}$/.test(fileSha256||''));
     });
     if(v2Shape)destinationState='already-v2';
     else if(hash(oldRaw)===ownerDiff.priorManifestSha256)destinationState='prior-v1';
     else throw new Error(`Refusing to replace unexpected ${owner} manifest`);
    }
    summaries.push({owner,contentVersion:manifest.contentVersion,sourceSha256:manifest.sourceSha256,entries:manifest.entries.length,priorManifestSha256:ownerDiff.priorManifestSha256,destinationState,counts:ownerDiff.counts});
    destinations.push({owner,path:destination,oldRaw,manifest,ownerDiff});
   }
   if(args.includes('--write-v2')){
    const work=path.join(root,'workbench/earthquake-audio-v2');
    fs.mkdirSync(path.join(work,'prior-manifests'),{recursive:true});
    for(const item of destinations){
     if(item.oldRaw!==null&&item.ownerDiff.priorManifestSha256===hash(item.oldRaw)){
      const backup=path.join(work,'prior-manifests',`${item.owner}.json`);
      if(fs.existsSync(backup)&&hash(fs.readFileSync(backup,'utf8'))!==item.ownerDiff.priorManifestSha256)throw new Error(`Prior ${item.owner} manifest backup hash mismatch`);
      if(!fs.existsSync(backup))fs.writeFileSync(backup,item.oldRaw,'utf8');
     }
    }
    for(const item of destinations){
     if(summaries.find(row=>row.owner===item.owner).destinationState==='already-v2')continue;
     const temporary=item.path+'.tmp';
     fs.writeFileSync(temporary,JSON.stringify(item.manifest,null,2)+'\n','utf8');
     fs.renameSync(temporary,item.path);
    }
   }
   console.log(JSON.stringify({mode:args.includes('--write-v2')?'write-v2':'check-v2',contentFreezeSha256:freezeSha256,narrationDiffSha256:diffSha256,productionAllowed:false,sources:summaries},null,2));
   process.exitCode=0;
  }else{
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
  }
 }catch(error){console.error('Audio preparation not ready: '+error.message);process.exitCode=1;}
}

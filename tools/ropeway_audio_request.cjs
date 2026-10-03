'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),source=path.join(root,'labs/ropeway/content.js'),ctx={};
const bytes=fs.readFileSync(source),sha=v=>crypto.createHash('sha256').update(v).digest('hex');
vm.runInNewContext(bytes.toString('utf8'),ctx);
const content=ctx.ROPEWAY_CONTENT;
if(!Array.isArray(content)||content.length!==16||new Set(content.map(c=>c.id)).size!==16)throw Error('Expected 16 stable reviewed IDs.');
const expected=process.argv.find(x=>x.startsWith('--source-sha='))?.split('=')[1],review=process.argv.find(x=>x.startsWith('--review-turn='))?.split('=')[1];
if(process.argv.includes('--freeze')&&(!expected||expected!==sha(bytes)||!review))throw Error('Freeze requires the exact reviewed source SHA and review turn.');
const request={schemaVersion:1,subject:'ropeway-lab',status:process.argv.includes('--freeze')?'frozen':'draft',source:'labs/ropeway/content.js',sourceSha256:sha(bytes),reviewTurn:review||null,engine:'Fun-CosyVoice 3',publicationAllowed:false,format:'MP3 runtime; finite-sample verified WAV masters outside labs/',tracks:content.flatMap(c=>['zh','en'].map(lang=>({id:c.id+'-'+lang,lessonId:c.id,lang,title:c.title[lang],text:c.text[lang],textSha256:sha(c.text[lang]),runtimeFile:'labs/ropeway/audio/'+c.id+'-'+lang+'.mp3'})))};
const out=path.join(root,'docs/ropeway-narration-'+(request.status==='frozen'?'lock':'draft')+'.json');
if(request.status==='frozen'&&fs.existsSync(out)){const old=JSON.parse(fs.readFileSync(out,'utf8'));if(old.sourceSha256!==request.sourceSha256)throw Error('Existing frozen source differs: create an explicit revision, do not overwrite it.');}
fs.writeFileSync(out,JSON.stringify(request,null,2)+'\n');
console.log(JSON.stringify({path:out,status:request.status,sourceSha256:request.sourceSha256,tracks:request.tracks.length},null,2));

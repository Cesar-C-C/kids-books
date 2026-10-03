'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');
const root=path.resolve(process.env.ROPEWAY_ROOT||path.join(__dirname,'..')),ctx={window:{}};
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
for(const f of ['content.js','audio-manifest.js'])vm.runInNewContext(fs.readFileSync(path.join(root,'labs/ropeway',f),'utf8'),ctx);
const manifest=ctx.window.ROPEWAY_AUDIO_MANIFEST,content=ctx.window.ROPEWAY_CONTENT;
const lock=JSON.parse(fs.readFileSync(path.join(root,'docs/ropeway-narration-lock.json'),'utf8'));
const sourceSha=sha(fs.readFileSync(path.join(root,'labs/ropeway/content.js'),'utf8').replace(/\r\n/g,'\n'));
assert.equal(lock.status,'frozen');assert.equal(lock.sourceSha256,sourceSha);assert.equal(lock.publicationAllowed,false);
assert.equal(lock.tracks.length,32);assert.equal(new Set(lock.tracks.map(t=>t.id)).size,32);
for(const c of content)for(const lang of ['zh','en']){
 const t=lock.tracks.find(t=>t.id===c.id+'-'+lang);assert.ok(t);assert.equal(t.lessonId,c.id);assert.equal(t.lang,lang);
 assert.equal(t.text,c.text[lang]);assert.equal(t.title,c.title[lang]);assert.equal(t.textSha256,sha(c.text[lang]));assert.equal(t.runtimeFile,'labs/ropeway/audio/'+t.id+'.mp3');
}
assert.ok(!fs.existsSync(path.join(root,'labs/ropeway/audio'))||fs.readdirSync(path.join(root,'labs/ropeway/audio')).every(f=>/^[a-z]+-(zh|en)\.mp3$/.test(f)),'no masters, drafts or tools in runtime audio directory');
assert.ok(['pending','ready'].includes(manifest.status));
if(manifest.status==='ready'){
 assert.equal(manifest.sourceSha256,sourceSha);
 assert.equal(Object.keys(manifest.tracks).length,32);
 for(const c of content)for(const lang of ['zh','en']){
  const track=manifest.tracks[c.id+'-'+lang];assert.ok(track);assert.equal(track.text,c.text[lang]);assert.equal(track.textSha256,sha(c.text[lang]));
  assert.match(track.file,/^audio\/[a-z]+-(zh|en)\.mp3(?:\?v=[a-f0-9]+)?$/);
  const file=path.join(root,'labs/ropeway',track.file.split('?')[0]);assert.ok(fs.existsSync(file));const bytes=fs.readFileSync(file);assert.equal(bytes.length,track.bytes);assert.equal(sha(bytes),track.sha256);assert.ok(track.duration>0);
 }
}else assert.equal(Object.keys(manifest.tracks).length,0,'do not present partial drafts as formal audio');
const pendingCallbacks=[],instances=[];
class MockAudio{
 constructor(file){this.file=file;this.events={};this.currentTime=1;instances.push(this);}
 addEventListener(name,cb){this.events[name]=cb;}
 play(){return new Promise(resolve=>pendingCallbacks.push(resolve));}
 pause(){this.paused=true;}
}
const lesson=content[0],track={file:'audio/'+lesson.id+'-zh.mp3',text:lesson.text.zh};
ctx.window.ROPEWAY_AUDIO_MANIFEST={status:'ready',tracks:{[lesson.id+'-zh']:track,[lesson.id+'-en']:{file:'audio/'+lesson.id+'-en.mp3',text:'stale text'}}};
ctx.Audio=MockAudio;vm.runInNewContext(fs.readFileSync(path.join(root,'labs/ropeway/audio.js'),'utf8'),ctx);
const audio=ctx.window.RopewayAudio;assert.equal(audio.has(lesson.id,'zh'),true);assert.equal(audio.has(lesson.id,'en'),false);
audio.manifest.status='pending';assert.equal(audio.has(lesson.id,'zh'),false);audio.manifest.status='ready';
(async()=>{
 const statuses=[],p=audio.play(lesson.id,'zh',s=>statuses.push(s));audio.stop();pendingCallbacks.shift()();assert.equal(await p,false);instances[0].events.ended();instances[0].events.error();assert.deepEqual(statuses,[]);assert.equal(instances[0].paused,true);
 const p2=audio.play(lesson.id,'zh',s=>statuses.push(s));pendingCallbacks.shift()();assert.equal(await p2,true);assert.deepEqual(statuses,['playing']);instances[1].events.ended();assert.deepEqual(statuses,['playing','idle']);
 const p3=audio.play(lesson.id,'zh',s=>statuses.push(s));pendingCallbacks.shift()();assert.equal(await p3,true);instances[2].events.error();assert.equal(statuses.at(-1),'error');assert.equal(audio.getState().src,null);
 console.log(JSON.stringify({status:'PASS',formalAudio:manifest.status,formalTracks:manifest.status==='ready'?32:0,contract:'exact bilingual text binding; stale-text rejection; stop and late-promise cancellation',limits:manifest.status==='pending'?'Formal playback and listening acceptance remain pending.':'MP3 hashes and cancellation contract; separate real playback and human listening evidence required.'},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});

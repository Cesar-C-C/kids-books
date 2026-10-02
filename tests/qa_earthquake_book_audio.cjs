'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'../books/earthquake'),file=path.join(root,'audio.js');
assert(fs.existsSync(file),'manifest-validated narrator must exist');
const {createNarrator}=require(file),raw=fs.readFileSync(path.join(root,'story.json'),'utf8'),manifest=JSON.parse(fs.readFileSync(path.join(root,'audio-manifest.json'),'utf8'));
// Positive playback tests use a frozen test-only source paired with existing v1
// bytes. It is never written as a production manifest and does not approve v2.
const fixture={bookId:'earthquake',scriptVersion:'earthquake-audio-test-fixture',frozen:true,scenes:[],vocab:[],interactions:[]};
for(const [kind,id,group]of [['scene','invitation','scenes'],['vocab','fault','vocab'],['result','local-motion','interactions']]){
 const item={id,narrationNeeded:true,segments:{}};
 if(group==='interactions')item.kind=kind;
 for(const lang of ['zh','en']){
  const e=manifest.entries.find(e=>e.kind===kind&&e.itemId===id&&e.lang===lang);
  item[lang]=e.text;item.segments[lang]=structuredClone(e.segments);
 }
 fixture[group].push(item);
}
const fixtureRaw=JSON.stringify(fixture);
const fixtureManifest=require('../tools/earthquake_audio_manifest.cjs').buildManifest('book',fixture,fixtureRaw);
for(const e of fixtureManifest.entries){
 e.status='ready';e.fileSha256=manifest.entries.find(x=>x.key===e.key).fileSha256;
}
const context={window:{},setTimeout,clearTimeout};vm.runInNewContext(fs.readFileSync(path.join(root,'session.js'),'utf8'),context);
async function setup(m=fixtureManifest,options={}){const session=context.window.EarthquakeUI.createSession(),statuses=[],requests=[],audios=[];let resolvePlay;
 const narrator=createNarrator({manifest:m,sourceRaw:fixtureRaw,session,onStatus:s=>statuses.push(s),fetcher:async url=>{requests.push(url);const bytes=fs.readFileSync(path.join(root,url.split('?')[0]));return {ok:true,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};},makeAudio:()=>{const a={paused:true,play(){this.paused=false;return new Promise(r=>resolvePlay=r);},pause(){this.paused=true;},removeAttribute(){},load(){}};audios.push(a);return a;},...options});await narrator.ready;return {narrator,session,statuses,requests,audios,get resolve(){return resolvePlay;}};}
(async()=>{
 let x=await setup(manifest,{sourceRaw:raw});
 for(const e of manifest.entries)assert.equal(x.narrator.available(e.kind,e.itemId,e.lang),false,'v1 manifest must not play over v2: '+e.key);
 await x.narrator.play('scene','invitation','zh');assert.equal(x.requests.length,0);
 x=await setup();assert.equal(x.narrator.available('scene','invitation','zh'),true);assert.equal(x.narrator.available('result','local-motion','en'),true);
 assert.equal(fixtureManifest.entries.length,6);for(const e of fixtureManifest.entries)assert(x.narrator.available(e.kind,e.itemId,e.lang),e.key);
 for(const mutate of [m=>m.sourceSha256='0'.repeat(64),m=>m.entries[0].textSha256='0'.repeat(64),m=>m.entries[0].utteranceSha256='0'.repeat(64),m=>m.entries[0].output='../escape.mp3',m=>m.entries[0].status='pending',m=>m.entries.push(m.entries[0])]){const m=structuredClone(fixtureManifest);mutate(m);x=await setup(m);assert.equal(x.narrator.available('scene','invitation','zh'),false);await x.narrator.play('scene','invitation','zh');assert.equal(x.requests.length,0);}
 x=await setup(null);await x.narrator.play('scene','invitation','zh');assert.equal(x.requests.length,0);assert.equal(x.statuses.at(-1).state,'unavailable');
 for(const reason of ['stop','language','blur','pagehide','hidden','wave-start','drive']){x=await setup();const play=x.narrator.play('scene','invitation','zh');while(!x.audios.length)await new Promise(r=>setTimeout(r,5));assert.equal(x.requests[0],'audio/scene-invitation-zh.mp3?v=earthquake-audio-test-fixture');x.session.cancel(reason);await play;x.resolve();await new Promise(r=>setTimeout(r,0));assert.equal(x.audios[0].paused,true,reason);assert.notEqual(x.statuses.at(-1).state,'playing',reason);}
 x=await setup();const first=x.narrator.play('scene','invitation','zh');while(!x.audios.length)await new Promise(r=>setTimeout(r,5));const finishFirst=x.resolve;const oldAudio=x.audios[0];const second=x.narrator.play('vocab','fault','en');await first;while(x.audios.length<2)await new Promise(r=>setTimeout(r,5));finishFirst();await new Promise(r=>setTimeout(r,0));assert(oldAudio.paused);assert.equal(x.audios[1].paused,false);x.narrator.stop();await second;
 x=await setup(manifest,{fetcher:async()=>({ok:true,arrayBuffer:async()=>new Uint8Array([1,2,3]).buffer})});await x.narrator.play('scene','invitation','zh');assert.equal(x.audios.length,0);assert.equal(x.statuses.at(-1).state,'unavailable');
 x=await setup(manifest,{fetcher:async()=>({ok:false})});await x.narrator.play('scene','invitation','zh');assert.equal(x.audios.length,0);assert.equal(x.statuses.filter(s=>s.state==='unavailable').length,1);
 x=await setup(manifest,{makeAudio:()=>({pause(){},removeAttribute(){},load(){},play:()=>Promise.reject(Error('decode failed'))})});await x.narrator.play('scene','invitation','zh');assert.equal(x.statuses.filter(s=>s.state==='unavailable').length,1);
 x=await setup();const ended=x.narrator.play('vocab','fault','en');while(!x.audios.length)await new Promise(r=>setTimeout(r,5));x.resolve();await new Promise(r=>setTimeout(r,0));x.audios[0].onended();await ended;assert.equal(x.statuses.at(-1).state,'ended');
 console.log('EARTHQUAKE_BOOK_AUDIO_PASS: v2 rejects v1; test-fixture manifest guards, missing/corrupt audio, versioned URL, cancellation race, ended');
})().catch(e=>{console.error(e);process.exitCode=1;});

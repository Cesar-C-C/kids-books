// Portable, read-only static verification. This is not playback/listening QA.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {checkedPath, fileIdentity} from './release_assets.mjs';

export function embeddedIdentity(html, mime) {
  const prefix=`data:${mime};base64,`, begin=html.indexOf(prefix);
  assert(begin>=0, `Missing embedded ${mime}`);
  const start=begin+prefix.length;
  const ends=[html.indexOf('"',start),html.indexOf("'",start)].filter(x=>x>=start);
  assert(ends.length, 'Unterminated embedded payload');
  const end=Math.min(...ends), digest=createHash('sha256');let bytes=0;
  for(let i=start;i<end;i+=65536) {
    const part=html.slice(i,Math.min(i+65536,end));
    assert(/^[A-Za-z0-9+/=]+$/.test(part), 'Invalid base64 payload');
    const raw=Buffer.from(part,'base64');bytes+=raw.length;digest.update(raw);
  }
  return {bytes,sha256:digest.digest('hex')};
}
export async function verifyFilm(root) {
  const read=async relative=>JSON.parse(await fs.readFile(await checkedPath(root,relative),'utf8'));
  const dir='animations/ropeway-adventure/', film=await read(dir+'film.json');
  assert.equal(film.kind,'native-bilingual-film');assert.equal(film.duration,597.5);
  assert.equal(film.fps,24);assert.equal(film.captionPairs,104);assert.equal(film.chapters.length,7);
  assert.equal(film.offline.identity,'project-adapted-offline-v3');
  assert.equal(film.offline.original.identity,'original-source-v5-unaltered');
  assert.match(film.renderingDisclosure,/Not all frames are native/);
  const lock=await read('video-production/ropeway-v5/generation-lock.json');
  const files=[];
  async function match(relative, expected) {
    const actual=await fileIdentity(await checkedPath(root,relative));
    assert.deepEqual(actual,{bytes:expected.bytes,sha256:expected.sha256},relative);
    files.push({path:relative,...actual});return actual;
  }
  for(const m of Object.values(film.media)) {
    assert(new URL(m.url,'https://static.invalid/').searchParams.get('v')===m.sha256.slice(0,12));
    await match(dir+m.url.split('?')[0],m);
  }
  await match(dir+film.download.file,film.download);
  const zip=lock.copies.find(x=>x.path==='video-production/ropeway-v5/source.zip');assert(zip);
  await match(zip.path,zip);
  const poster=lock.copies.find(x=>x.path===dir+'cover-v5.jpg');assert(poster);await match(poster.path,poster);
  for(const wrapper of [film.offline,film.offline.original]) {
    await match(dir+wrapper.file,wrapper);
    const html=await fs.readFile(await checkedPath(root,dir+wrapper.file),'utf8');
    for(const [mime,expected] of [['video/mp4',film.media.video],['audio/mp4',film.media.mandarin],['image/jpeg',poster]])
      assert.deepEqual(embeddedIdentity(html,mime),{bytes:expected.bytes,sha256:expected.sha256},wrapper.identity+' '+mime);
  }
  const timing=await read('video-production/ropeway-v5/full-timing.json');
  assert.equal(timing.scenes.length,35);
  // Original compose_film.py extends each caption to the next beat start,
  // or next scene boundary. Caption display windows are not audio end times.
  const beats=timing.scenes.flatMap((s,sceneIndex)=>s.beats.map((b,beatIndex)=>({...b,
    captionEnd:s.beats[beatIndex+1]?.start??timing.scenes[sceneIndex+1]?.start??film.duration
  })));assert.equal(beats.length,104);
  assert.equal(new Set(beats.map(b=>b.id)).size,104);
  const srt=await fs.readFile(await checkedPath(root,dir+'bilingual-v5.srt'),'utf8');
  const srtPin=lock.copies.find(x=>x.path===dir+'bilingual-v5.srt');assert(srtPin);await match(srtPin.path,srtPin);
  const captions=srt.trim().split(/\r?\n\r?\n/);assert.equal(captions.length,104);
  const timestamp=s=>{const m=/^(\d+):(\d+):(\d+),(\d+)$/.exec(s);assert(m);return +m[1]*3600 + +m[2]*60 + +m[3] + +m[4]/1000;};
  for(let i=0;i<captions.length;i++) {
    const lines=captions[i].split(/\r?\n/), times=lines[1].split(' --> ');
    assert.equal(+lines[0],i+1);assert.equal(lines.length,4);
    assert.equal(lines[2],beats[i].en);assert.equal(lines[3],beats[i].zh);
    assert(Math.abs(timestamp(times[0])-beats[i].start)<=.002);
    assert(Math.abs(timestamp(times[1])-beats[i].captionEnd)<=.002);
    assert(timestamp(times[1])<=film.duration);
  }
  const pwaText=await fs.readFile(await checkedPath(root,'pwa-assets.js'),'utf8');
  const m=/self\.KB_ASSETS\s*=\s*(\{.*\});\s*$/s.exec(pwaText);assert(m);
  const pwa=JSON.parse(m[1]);assert(pwa.films?.[film.id]);
  assert(!pwa.shell.some(x=>/\/media\/|\/downloads\/|source\.zip$/.test(x)),'Large media must not be shell-preloaded');
  assert(!pwa.shell.some(x=>x.startsWith('animations/ropeway-station/')));
  assert.equal(pwa.retiredAnimations?.['ropeway-station']?.paths.length,37);
  return {status:'PASS_STATIC_NATIVE_FILM',duration:film.duration,scenes:35,captionPairs:104,pwaVersion:pwa.version,files,render:'NOT_RUN',speech:'NOT_RUN',browserPlayback:'SEPARATE_GATE',humanListening:'NOT_CLAIMED'};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(await verifyFilm(process.argv[2]||'.'),null,2));
}

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {validateManifest, hydrateManifest, checkedPath} from '../tools/release_assets.mjs';
import {allowedRuntime, pwaClosure, buildPayload} from '../tools/build_pages_payload.mjs';

const raw=Buffer.from('Exact source media fixture — not a rendered film');
const sha256=createHash('sha256').update(raw).digest('hex');
const pin={path:'animations/ropeway-adventure/media/browser-v5.mp4',name:'browser-v5.mp4',assetId:42,bytes:raw.length,sha256,deploy:true};
const manifest={schemaVersion:1,repository:'Cesar-C-C/kids-books',tag:'native-film-v3-fixture-20261005',releaseId:123,assets:[pin]};
const metadata={id:123,tag_name:manifest.tag,draft:false,assets:[{id:42,name:pin.name,size:pin.bytes,state:'uploaded',digest:`sha256:${sha256}`,browser_download_url:`https://github.com/${manifest.repository}/releases/download/${manifest.tag}/${pin.name}`}]};
async function temp(t) {const root=await fs.mkdtemp(path.join(os.tmpdir(),'kb-release-fixture-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));return root;}
const transport=(body=raw, meta=metadata) => async url => url.includes('api.github.com') ? Response.json(meta) : new Response(body);
test('strict same-repository identity, paths, hashes and duplicate rejection',()=>{
  assert.equal(validateManifest(structuredClone(manifest)).assets.length,1);
  for(const delta of [{repository:'other/repo'},{tag:'latest'},{releaseId:0}]) assert.throws(()=>validateManifest({...manifest,...delta}));
  for(const delta of [{path:'../../sw.js'},{path:'books/moon/index.html'},{bytes:0},{sha256:'bad'},{assetId:0}]) assert.throws(()=>validateManifest({...manifest,assets:[{...pin,...delta}]}));
  assert.throws(()=>validateManifest({...manifest,assets:[pin,pin]}));
});
test('verified raw download, idempotent local validation, no arbitrary overwrite',async t=>{
  const root=await temp(t), first=await hydrateManifest(manifest,root,{get:transport()});
  assert.equal(first.assets[0].status,'downloaded-verified');assert.deepEqual(await fs.readFile(path.join(root,pin.path)),raw);
  assert.equal((await hydrateManifest(manifest,root,{get:transport()})).assets[0].status,'verified-existing');
  await fs.writeFile(path.join(root,pin.path),'wrong');await assert.rejects(hydrateManifest(manifest,root,{get:transport()}),/checksum/);
  assert.equal(await fs.readFile(path.join(root,pin.path),'utf8'),'wrong');
});
test('short, extra, incorrect and interrupted content never publishes a partial target',async t=>{
  const root=await temp(t);
  for(const body of [raw.subarray(0,3),Buffer.concat([raw,raw]),Buffer.alloc(raw.length)]) {
    await assert.rejects(hydrateManifest(manifest,root,{get:transport(body)}));
    await assert.rejects(fs.stat(path.join(root,pin.path)),{code:'ENOENT'});
    assert.deepEqual(await fs.readdir(path.dirname(path.join(root,pin.path))),[]);
  }
  const broken=new ReadableStream({start(c){c.enqueue(raw.subarray(0,3));c.error(new Error('native stream interrupted'));}});
  await assert.rejects(hydrateManifest(manifest,root,{get:transport(broken)}),/interrupted/);
  assert.deepEqual(await fs.readdir(path.dirname(path.join(root,pin.path))),[]);
});
test('asset ID replacement, draft and mismatched GitHub digest are rejected',async t=>{
  const root=await temp(t);
  for(const meta of [{...metadata,draft:true},{...metadata,id:456},{...metadata,assets:[{...metadata.assets[0],id:99}]},{...metadata,assets:[{...metadata.assets[0],digest:'sha256:bad'}]}]) await assert.rejects(hydrateManifest(manifest,root,{get:transport(raw,meta)}));
});
test('symlink destinations cannot escape the owned root',async t=>{
  const root=await temp(t), external=await temp(t);
  await fs.symlink(external,path.join(root,'animations'),'junction');
  await assert.rejects(checkedPath(root,pin.path),/Symlink/);
});
test('runtime policy preserves lab/book closure, forbids short/history/intermediate',()=>{
  for(const p of ['labs/shared/vendor/three.min.js','labs/shared/vendor/THREE-LICENSE.txt','labs/earthquake/preview.png','labs/ropeway/audio/power-stop-zh.mp3','books/moon/story.json','books/sound/sfx/drum-high.wav','books/sound/sfx/drum-low.wav','docs/video-production/ropeway-method.md','docs/video-production/audio/narration-record.schema.json','video-production/templates/science-film.json','video-production/ropeway-v5/README.md','video-production/ropeway-v5/EDITORIAL-REVIEW.md','video-production/ropeway-v5/generation-lock.json','video-production/ropeway-v5/source.zip','tools/science_video.py']) assert.ok(allowedRuntime(p),p);
  for(const p of ['workbench/receipt.json','preview_overlays/a.png','books/schoolbus/audio/narration/a.wav','books/sound/sfx/other.wav','animations/ropeway-station/index.html','node_modules/x.js','../index.html']) {
    try{assert.equal(allowedRuntime(p),false,p);}catch(e){assert.equal(p,'../index.html');}
  }
  assert.deepEqual(pwaClosure({shell:['shared/pwa.js'],books:{x:{files:['books/x/a.mp3?v=5']}},labs:{earthquake:{onDemandAudio:['labs/earthquake/a.mp3']}}}),['shared/pwa.js','books/x/a.mp3','labs/earthquake/a.mp3']);
});
test('explicit package only, identity checked, missing/removed paths and nonempty output fail',async t=>{
  const root=await temp(t);await fs.mkdir(path.join(root,'video-production'),{recursive:true});
  await fs.writeFile(path.join(root,'video-production/release-assets.json'),JSON.stringify(manifest));
  await fs.writeFile(path.join(root,'video-production/pages-runtime.json'),JSON.stringify({schemaVersion:1,extraFiles:[],removedPaths:[]}));
  for(const p of ['index.html','offline.html','sw.js','manifest.webmanifest']) await fs.writeFile(path.join(root,p),'fixture');
  await fs.writeFile(path.join(root,'pwa-assets.js'),'self.KB_ASSETS = {"version":"fixture","shell":[]};\n');
  await hydrateManifest(manifest,root,{get:transport()});
  const out=path.join(root,'_site'), report=await buildPayload(root,out,{gitSha:'fixture'});
  assert.equal(report.files,6);assert.deepEqual(await fs.readFile(path.join(out,pin.path)),raw);
  assert.equal((await fs.stat(path.join(out,'.nojekyll'))).size,0);
  await assert.rejects(buildPayload(root,out),/nonempty/);
  await fs.writeFile(path.join(root,'video-production/pages-runtime.json'),JSON.stringify({schemaVersion:1,extraFiles:[],removedPaths:[pin.path]}));
  await assert.rejects(buildPayload(root,path.join(root,'_removed')),/removed/);
  await fs.writeFile(path.join(root,'video-production/pages-runtime.json'),JSON.stringify({schemaVersion:1,extraFiles:['docs/video-production/README.md'],removedPaths:[]}));
  await fs.mkdir(path.join(root,'docs/video-production'),{recursive:true});
  await fs.writeFile(path.join(root,'docs/video-production/README.md'),'[Missing local method](audio/missing.json)');
  await assert.rejects(buildPayload(root,path.join(root,'_dangling')),/Unpublished method link/);
  const outside=await temp(t);await fs.symlink(outside,path.join(root,'_linked'),'junction');
  await assert.rejects(buildPayload(root,path.join(root,'_linked')),/Symlink/);
});
test('read-only PR hydration precedes QA; main CI gate and environment protect Pages writes',async()=>{
  const root=fileURLToPath(new URL('../',import.meta.url));
  const pwa=await fs.readFile(path.join(root,'.github/workflows/pwa.yml'),'utf8');
  const labs=await fs.readFile(path.join(root,'.github/workflows/labs.yml'),'utf8');
  const pages=await fs.readFile(path.join(root,'.github/workflows/pages.yml'),'utf8');
  assert.equal((pwa.match(/run: node tools\/release_assets\.mjs/g)||[]).length,2);
  assert.ok(pwa.indexOf('run: node tools/release_assets.mjs')<pwa.indexOf('run: python qa_pwa.py'));
  assert.ok(pwa.includes('qa_earthquake_lab_scroll.cjs')&&pwa.includes('qa_earthquake_lab_touch_lifecycle.cjs'));
  for(const yml of [pwa,labs]) {assert.ok(yml.includes('animations/**'));assert.ok(yml.includes('contents: read'));assert.ok(!yml.includes('contents: write'));assert.ok(!yml.includes('pull_request_target:'));}
  assert.ok(pages.includes('workflow_dispatch:')&&!/\n\s+(pull_request|pull_request_target|push):/.test(pages));
  for(const action of ['actions/configure-pages@v5','actions/upload-pages-artifact@v4','actions/deploy-pages@v4']) assert.ok(pages.includes(action),action);
  assert.equal((pages.match(/run: node tools\/check_pages_gate.mjs/g)||[]).length,2);
  assert.ok(pages.includes("github.ref == 'refs/heads/main'"));assert.ok(pages.includes('name: github-pages'));
});

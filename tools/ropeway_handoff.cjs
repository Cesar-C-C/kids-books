'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),cp=require('child_process'),vm=require('vm');
const root=path.resolve(__dirname,'..'),baseFiles=['.github/workflows/labs.yml','.github/workflows/pwa.yml','labs/catalog.js','qa_models.cjs','pwa-assets.js','sw.js','docs/ropeway-design.md','docs/ropeway-audio-receipt.json','tools/ropeway_audio_request.cjs','tools/ropeway_handoff.cjs','tests/qa_ropeway_model.cjs','tests/qa_ropeway_browser.cjs','tests/qa_ropeway_audio.cjs','tests/qa_ropeway_offline.cjs','tests/qa_ropeway_auxiliary_lifecycle.cjs'];
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),files=[];
function inventory(dir){for(const e of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory())inventory(p);else files.push(p);}}
inventory('labs/ropeway');files.push(...baseFiles);if(fs.existsSync(path.join(root,'docs/ropeway-narration-lock.json')))files.push('docs/ropeway-narration-lock.json');
const manifest=fs.readFileSync(path.join(root,'pwa-assets.js'),'utf8'),version=manifest.match(/"version":"([a-f0-9]+)"/)?.[1];
const lockFile=path.join(root,'docs/ropeway-narration-lock.json'),lock=fs.existsSync(lockFile)?JSON.parse(fs.readFileSync(lockFile,'utf8')):null;
const sourceBytes=fs.readFileSync(path.join(root,'labs/ropeway/content.js')),sourceSha=sha(sourceBytes.toString('utf8').replace(/\r\n/g,'\n'));
if(lock&&lock.sourceSha256!==sourceSha)throw Error('Frozen narration source has changed.');
const audioCtx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'labs/ropeway/audio-manifest.js'),'utf8'),audioCtx);
const audio=audioCtx.window.ROPEWAY_AUDIO_MANIFEST;
const runtimeSha256=sha(['index.html','ropeway.css','model.js','content.js','scene.js','audio-manifest.js','audio.js','app.js'].map(f=>f+'\n'+fs.readFileSync(path.join(root,'labs/ropeway',f),'utf8').replace(/\r\n/g,'\n')).join('\n'));
files.push('tools/gen_pwa_assets.py','tests/test_ropeway_pwa_audio_keys.py');
const mergeFiles=new Set(['.github/workflows/labs.yml','.github/workflows/pwa.yml','labs/catalog.js','qa_models.cjs','tools/gen_pwa_assets.py']);
const regeneratedFiles=new Set(['pwa-assets.js','sw.js']);
const git=cp.spawnSync('git',['-c','safe.directory='+root,'rev-parse','HEAD'],{cwd:root,encoding:'utf8'});if(git.status)throw Error(git.stderr);
const report={schemaVersion:1,generatedAt:new Date().toISOString(),root,base:git.stdout.trim(),status:'local-candidate',published:false,sourceSha256:sourceSha,sourceRawSha256:sha(sourceBytes),sourceHashConvention:'Canonical LF; raw bytes separately retained for adoption checks.',freezeLockSha256:lock?sha(fs.readFileSync(lockFile)):null,narrationFrozen:!!lock,narrationExpected:32,narration:{status:audio.status,tracks:Object.keys(audio.tracks||{}).length,sourceSha256:audio.sourceSha256||null},runtimeSha256,pwaVersion:version,files:[...new Set(files)].sort().map(p=>{
const b=fs.readFileSync(path.join(root,p));return {path:p,integration:regeneratedFiles.has(p)?'regenerate-on-target':mergeFiles.has(p)?'merge-scoped-diff':'add-exact',bytes:b.length,sha256:sha(b),canonicalSha256:/\.(js|cjs|html|css|yml|md|json|py)$/.test(p)?sha(b.toString('utf8').replace(/\r\n/g,'\n')):sha(b)};}),boundaries:['No commits, push, PR or publication by the ropeway task.','Separate from the earthquake touch candidate; integrate scoped changes, never overwrite its workflow or PWA files wholesale.','Native browser input is simulated, not physical-device or original installed-PWA evidence.','Model dimensions and timing are illustrative; no hardware or regulatory compliance claim.','Formal audio playback and listening must be recorded separately from source contracts.']};
const outArg=process.argv.find(v=>v.startsWith('--report=')),out=outArg?path.resolve(outArg.slice(9)):path.join(root,'.qa-labs/ropeway/handoff.json');
report.evidence=['browser-report.json','offline-report.json','auxiliary-before-report.json','auxiliary-after-report.json'].filter(f=>fs.existsSync(path.join(path.dirname(out),f))).map(f=>{
 const file=path.join(path.dirname(out),f),b=fs.readFileSync(file),e=JSON.parse(b);
 return {path:file,sha256:sha(b),kind:e.beforeReplay?'prior-model-replay':'current-candidate',matchesRuntime:e.runtimeSha256===runtimeSha256,formalAudio:e.formalAudio||null,profiles:e.profiles?.length||e.cases?.length||null,status:e.status||null,coldOfflineBeforeAnyOnlineAudio:e.coldOfflineBeforeAnyOnlineAudio||false};
});
fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({path:out,files:report.files.length,pwaVersion:version,narration:report.narration,narrationFrozen:report.narrationFrozen,sourceSha256:sourceSha,evidence:report.evidence},null,2));

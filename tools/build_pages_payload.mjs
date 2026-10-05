// An explicit runtime package: PWA closure + reviewed extra runtime/download
// files. Workbench, previews, QA, raw WAV/model sources never enter Pages.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {safeRelative, checkedPath, fileIdentity, validateManifest} from './release_assets.mjs';

const ROOT_FILES=new Set(['index.html','offline.html','sw.js','pwa-assets.js','manifest.webmanifest']);
export function allowedRuntime(relative) {
  safeRelative(relative);
  if(ROOT_FILES.has(relative)) return true;
  if(relative==='tools/science_video.py') return true; // Explicit static method download, never executed by Pages.
  // Existing runtime notices and two authored sound effects, not narration masters.
  if(['labs/shared/vendor/THREE-LICENSE.txt','books/sound/sfx/drum-high.wav','books/sound/sfx/drum-low.wav'].includes(relative)) return true;
  if(/(^|\/)(node_modules|workbench|\.git|\.qa[^/]*|__pycache__|_replica)(\/|$)/.test(relative) ||
     /(^|\/)preview[^/]*\//.test(relative) ||
     /^animations\/ropeway-station\//.test(relative) || /\.(wav|blend|py|log|tmp)$/i.test(relative)) return false;
  if(/^(books|labs|shared|icons)\//.test(relative)) return /\.(html|js|css|json|webmanifest|png|jpe?g|webp|gif|svg|avif|mp3|m4a|ogg|wasm)$/i.test(relative);
  if(/^animations\//.test(relative)) return /\.(html|js|css|json|jpg|srt|mp4|m4a)$/i.test(relative);
  // These are only eligible; every file still needs a finite reviewed extraFiles
  // entry. Never sweep the complete production/source/history directory.
  return /^docs\/video-production\/(?:audio\/)?[A-Za-z0-9_.-]+\.(md|json)$/.test(relative) ||
    /^video-production\/templates\/[a-z0-9_.-]+\.json$/.test(relative) ||
    /^video-production\/ropeway-v5\/[A-Za-z0-9_.-]+\.(json|md)$/.test(relative) ||
    relative==='video-production/ropeway-v5/source.zip';
}
export function pwaClosure(pwa) {
  const files=new Set(pwa.shell || []);
  for(const family of ['books','labs','animations']) for(const entry of Object.values(pwa[family]||{})) {
    for(const key of ['files','onDemandAudio']) for(const value of entry[key]||[]) files.add(value);
  }
  for(const [id,film] of Object.entries(pwa.films||{})) {
    if(!/^[a-z0-9-]+$/.test(id)) throw new Error('Unsafe film identity');
    for(const value of film.core||[]) files.add(value);
    for(const media of Object.values(film.media||{})) if(media.url) files.add(`animations/${id}/${media.url}`);
    if(film.offline?.file) files.add(`animations/${id}/${film.offline.file}`);
  }
  return [...files].map(x=>x.split('?')[0]);
}
export async function buildPayload(root, out, {gitSha}={}) {
  root=await fs.realpath(root);out=path.resolve(out);
  if(out===root || !out.startsWith(root+path.sep)) throw new Error('Payload output must be a dedicated subdirectory');
  await checkedPath(root,path.relative(root,out).split(path.sep).join('/'));
  try {if((await fs.readdir(out)).length) throw new Error('Refusing nonempty payload output');}
  catch(e) {if(e.code!=='ENOENT')throw e;}
  const text=await fs.readFile(path.join(root,'pwa-assets.js'),'utf8');
  const match=text.match(/self\.KB_ASSETS\s*=\s*(\{.*\});\s*$/s);
  if(!match) throw new Error('Invalid generated PWA manifest');
  const pwa=JSON.parse(match[1]);
  const policy=JSON.parse(await fs.readFile(path.join(root,'video-production/pages-runtime.json'),'utf8'));
  if(policy.schemaVersion!==1 || !Array.isArray(policy.extraFiles) || !Array.isArray(policy.removedPaths)) throw new Error('Invalid runtime whitelist');
  const assets=validateManifest(JSON.parse(await fs.readFile(path.join(root,'video-production/release-assets.json'),'utf8')));
  const files=[...new Set([...ROOT_FILES,...pwaClosure(pwa),...policy.extraFiles,...assets.assets.filter(a=>a.deploy).map(a=>a.path)])].sort();
  for(const file of files) {
    if(!allowedRuntime(file) || policy.removedPaths.includes(file)) throw new Error(`Non-runtime or removed path: ${file}`);
  }
  const inventory=[];let bytes=0;
  for(const file of files) {
    const source=await checkedPath(root,file), stat=await fs.lstat(source);
    if(!stat.isFile()) throw new Error(`Missing regular runtime file: ${file}`);
    const identity=await fileIdentity(source), pin=assets.assets.find(a=>a.path===file);
    if(pin && (identity.bytes!==pin.bytes || identity.sha256!==pin.sha256)) throw new Error(`Hydrated asset drift: ${file}`);
    bytes+=identity.bytes;inventory.push({path:file,...identity});
  }
  // Navigation/download references in the published method bundle must resolve
  // within this finite package. Historical raw reports are not web navigation.
  for(const file of files.filter(x=>x.startsWith('docs/video-production/') && x.endsWith('.md'))) {
    const markdown=await fs.readFile(await checkedPath(root,file),'utf8');
    for(const m of markdown.matchAll(/\]\(([^)\s]+)\)/g)) {
      const href=m[1];if(/^(?:https?:|#)/.test(href)) continue;
      const target=path.posix.normalize(path.posix.join(path.posix.dirname(file),href.split(/[?#]/)[0]));
      if(!files.includes(target)) throw new Error(`Unpublished method link: ${file} -> ${href}`);
    }
  }
  // GitHub Pages' published-site limit is 1 GB. Keep 100 MB of margin.
  if(bytes>900000000) throw new Error(`Pages payload too large: ${bytes}`);
  await fs.mkdir(out,{recursive:true});
  for(const file of files) {
    const target=await checkedPath(out,file);
    await fs.mkdir(path.dirname(target),{recursive:true});
    await fs.copyFile(await checkedPath(root,file),target,fs.constants.COPYFILE_EXCL);
  }
  await fs.writeFile(path.join(out,'.nojekyll'),'');
  const report={schemaVersion:1,gitSha:gitSha||null,pwaVersion:pwa.version,files:inventory.length,bytes,releaseTag:assets.tag,releaseId:assets.releaseId,inventory,excluded:policy.removedPaths};
  await fs.writeFile(path.join(out,'release-info.json'),JSON.stringify(report,null,2)+'\n');
  return report;
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const report=await buildPayload('.',process.argv[2]||'_site',{gitSha:process.env.GITHUB_SHA});
  console.log(JSON.stringify({...report,inventory:undefined},null,2));
}

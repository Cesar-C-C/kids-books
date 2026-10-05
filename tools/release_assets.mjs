// Restore identity- and checksum-pinned public GitHub Release assets. No writes to
// GitHub, no transcoding, no LFS, no client-side reconstruction.
import {createHash, randomUUID} from 'node:crypto';
import {createReadStream} from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const REPOSITORY = 'Cesar-C-C/kids-books';
const DEFAULT_MANIFEST = 'video-production/release-assets.json';
const fail = message => {throw new Error(message);};
export function safeRelative(value) {
  if(typeof value !== 'string' || !/^[A-Za-z0-9_.\/-]+$/.test(value) ||
     value.startsWith('/') || value.split('/').some(x => !x || x === '.' || x === '..')) fail('Unsafe relative path');
  return value;
}
export function validateManifest(m) {
  if(m?.schemaVersion !== 1 || m.repository !== REPOSITORY ||
     !/^native-film-v3-[a-z0-9][a-z0-9.-]{5,80}$/.test(m.tag || '') ||
     !Number.isSafeInteger(m.releaseId) || m.releaseId < 1 ||
     !Array.isArray(m.assets) || !m.assets.length || m.assets.length > 20) fail('Invalid pinned release manifest');
  const paths = new Set(), ids = new Set(), names = new Set();
  for(const a of m.assets) {
    safeRelative(a.path);
    if(!/^animations\/ropeway-adventure\/(media|downloads)\/[a-zA-Z0-9_.-]+$/.test(a.path) ||
       !/^[a-zA-Z0-9_.-]+$/.test(a.name || '') ||
       !Number.isSafeInteger(a.assetId) || a.assetId < 1 ||
       !Number.isSafeInteger(a.bytes) || a.bytes < 1 || a.bytes >= 2*1024**3 ||
       !/^[a-f0-9]{64}$/.test(a.sha256 || '') || typeof a.deploy !== 'boolean') fail('Invalid asset identity');
    if(paths.has(a.path) || ids.has(a.assetId) || names.has(a.name)) fail('Duplicate asset identity');
    paths.add(a.path); ids.add(a.assetId); names.add(a.name);
  }
  return m;
}
export async function fileIdentity(filename) {
  const digest=createHash('sha256'); let bytes=0;
  for await(const chunk of createReadStream(filename)) {bytes+=chunk.length;digest.update(chunk);}
  return {bytes,sha256:digest.digest('hex')};
}
export async function checkedPath(root, relative) {
  safeRelative(relative);
  const base=await fs.realpath(root), target=path.resolve(base, relative);
  if(!target.startsWith(base+path.sep)) fail('Target outside root');
  let current=base;
  for(const segment of relative.split('/')) {
    current=path.join(current,segment);
    try {if((await fs.lstat(current)).isSymbolicLink()) fail('Symlink target is not allowed');}
    catch(e) {if(e.code !== 'ENOENT') throw e;}
  }
  return target;
}
function same(actual, expected) {
  if(actual.bytes !== expected.bytes || actual.sha256 !== expected.sha256) fail('Asset checksum/size mismatch');
}
export async function githubResponse(url) {
  // URLs are constructed from validated identities, never supplied by a page.
  const u=new URL(url);
  if(u.protocol !== 'https:' || !['api.github.com','github.com'].includes(u.hostname)) fail('Non-GitHub source');
  const headers={'User-Agent':'kids-books-byte-exact-hydration','Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2026-03-10'};
  // Only public resources are needed. A workflow may use its read-only token to
  // avoid public API throttling; never send it to release asset redirect hosts.
  if(u.hostname === 'api.github.com' && process.env.GITHUB_TOKEN) headers.Authorization=`Bearer ${process.env.GITHUB_TOKEN}`;
  return fetch(url,{headers,signal:AbortSignal.timeout(600000)});
}
export async function hydrateManifest(m, root, {get=githubResponse, all=true}={}) {
  validateManifest(m);
  const response=await get(`https://api.github.com/repos/${REPOSITORY}/releases/tags/${m.tag}`);
  if(!response.ok) fail(`Release metadata HTTP ${response.status}`);
  const release=await response.json();
  if(release.id !== m.releaseId || release.tag_name !== m.tag || release.draft || !Array.isArray(release.assets)) fail('Pinned public release identity mismatch');
  const results=[];
  for(const a of m.assets) {
    if(!all && !a.deploy) continue;
    const url=`https://github.com/${REPOSITORY}/releases/download/${m.tag}/${a.name}`;
    const remote=release.assets.find(x=>x.id===a.assetId);
    if(!remote || remote.name !== a.name || remote.size !== a.bytes || remote.state !== 'uploaded' || remote.browser_download_url !== url ||
       (remote.digest && remote.digest !== `sha256:${a.sha256}`)) fail('Release asset identity changed');
    const target=await checkedPath(root,a.path);
    try {
      const stat=await fs.lstat(target);
      if(!stat.isFile()) fail('Asset target is not a file');
      same(await fileIdentity(target),a);results.push({path:a.path,status:'verified-existing',bytes:a.bytes,sha256:a.sha256});continue;
    } catch(e) {if(e.code !== 'ENOENT') throw e;}
    await fs.mkdir(path.dirname(target),{recursive:true});
    const temporary=`${target}.${randomUUID()}.partial`;
    let handle, body;
    try {
      body=await get(url);
      if(!body.ok || !body.body) fail(`Asset HTTP ${body.status}`);
      const length=body.headers.get('content-length');
      if(length !== null && Number(length) !== a.bytes) fail('Asset Content-Length mismatch');
      handle=await fs.open(temporary,'wx');
      const digest=createHash('sha256');let bytes=0;
      for await(const chunk of body.body) {
        bytes+=chunk.length;if(bytes>a.bytes) fail('Asset exceeds pinned size');
        digest.update(chunk);await handle.writeFile(chunk);
      }
      same({bytes,sha256:digest.digest('hex')},a);
      await handle.close();handle=null;
      // Link avoids overwriting any file another process created meanwhile.
      await fs.link(temporary,target);
      results.push({path:a.path,status:'downloaded-verified',bytes,sha256:a.sha256});
    } finally {
      if(handle) await handle.close();
      if(body?.body && !body.body.locked) await body.body.cancel().catch(()=>{});
      await fs.unlink(temporary).catch(e=>{if(e.code!=='ENOENT')throw e;});
    }
  }
  return {repository:m.repository,tag:m.tag,releaseId:m.releaseId,assets:results};
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const args=process.argv.slice(2), verify=args.includes('--verify');
  const root=path.resolve(args.find(a=>a.startsWith('--root='))?.slice(7) || '.');
  const manifest=validateManifest(JSON.parse(await fs.readFile(path.join(root,DEFAULT_MANIFEST),'utf8')));
  if(verify) {
    for(const a of manifest.assets) same(await fileIdentity(await checkedPath(root,a.path)),a);
    console.log(JSON.stringify({status:'PASS_LOCAL_PINNED_ASSETS',assets:manifest.assets.length}));
  } else console.log(JSON.stringify(await hydrateManifest(manifest,root),null,2));
}

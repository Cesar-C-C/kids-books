/* ============================================================
   tools/push_via_api.mjs — 当 github.com 的 git 主机不可达时，
   用 GitHub Git Data API 把本地提交推上去（零依赖，只要 gh 已登录）。

   为什么需要它：本机网络对 github.com:443 会超时/重置
   （`git push` 报 Recv failure: Connection was reset），
   但 api.github.com 是通的。于是改用 REST：
       blob（逐个上传） → tree（基于远端 HEAD 的 tree） → commit → 更新 ref

   与 `git push` 的差异（重要）：
     GitHub 会用它自己的规范重建 commit 对象。实测它保留作者/提交者与时区，
     但会把 message 结尾的换行去掉 —— 于是**远端提交号与本地不同**。
     内容（tree）会逐字节相同，但本地与远端分叉成两个 commit。
     所以脚本跑完会校验 tree 一致，并提示把本地对齐到已发布提交。

   前置条件：
     · gh 已登录（`gh auth status`），token 有 repo 权限
     · 远端 main 必须正好等于本地 HEAD~1（只支持快进，绝不做 force）

   用法：
     node tools/push_via_api.mjs            # 推送 HEAD
     node tools/push_via_api.mjs --dry-run  # 只校验并列改动，不写远端
   ============================================================ */
import { execFileSync } from 'node:child_process';

const OWNER = 'Cesar-C-C';
const REPO = 'kids-books';
const API = `https://api.github.com/repos/${OWNER}/${REPO}`;
const DRY = process.argv.includes('--dry-run');

const git = (...a) => execFileSync('git', a, { encoding: 'utf8', maxBuffer: 1 << 28 }).trim();
const gitBuf = (...a) => execFileSync('git', a, { maxBuffer: 1 << 28 });
const token = execFileSync('gh', ['auth', 'token'], { encoding: 'utf8' }).trim();

async function api(path, init = {}) {
  const res = await fetch(API + path, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'kids-books-push',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${path}\n${text.slice(0, 600)}`);
  return text ? JSON.parse(text) : {};
}

const head = git('rev-parse', 'HEAD');
const parent = git('rev-parse', 'HEAD~1');
const message = git('log', '-1', '--format=%B', 'HEAD');
const [an, ae, ad] = git('log', '-1', '--format=%an%x00%ae%x00%aI', 'HEAD').split('\0');

/* 解析 --name-status -z：条目形如 "M\0path"，重命名是 "R100\0old\0new"。
   重命名拆成「删旧 + 加新」，这样基于 base_tree 的构造就能正确表达。 */
function parseChanges() {
  const toks = git('diff', '--name-status', '-z', 'HEAD~1', 'HEAD').split('\0').filter(Boolean);
  const out = [];
  for (let i = 0; i < toks.length; i++) {
    const st = toks[i];
    if (!/^[AMDRT]\d*$/.test(st)) continue;      // 不是状态码就跳过（防御）
    if (st[0] === 'R' || st[0] === 'C') {
      const from = toks[++i], to = toks[++i];
      out.push({ status: 'D', path: from }, { status: 'A', path: to });
    } else {
      out.push({ status: st[0], path: toks[++i] });
    }
  }
  return out;
}

const changes = parseChanges();
const uploads = changes.filter((c) => c.status !== 'D');
const deletes = changes.filter((c) => c.status === 'D');

console.log(`本地 HEAD ${head.slice(0, 8)}  <-  父提交 ${parent.slice(0, 8)}`);
console.log(`改动 ${changes.length} 项：新增/修改 ${uploads.length}，删除 ${deletes.length}`);

if (DRY) {
  changes.forEach((c) => console.log(`  ${c.status} ${c.path}`));
  process.exit(0);
}

const ref = await api('/git/ref/heads/main');
if (ref.object.sha !== parent) {
  throw new Error(`远端 main=${ref.object.sha} 不等于本地父提交 ${parent}；` +
    `先 fetch 并 rebase/merge —— 本脚本只做快进，绝不 force`);
}
console.log('远端 main 校验通过（可快进）');

/* 逐个上传 blob。内容一律取自 git 对象而不是工作区 ——
   本机 core.autocrlf=true，工作区是 CRLF，直接读文件会把 \r 推上线。 */
const entries = deletes.map((c) => ({ path: c.path, mode: '100644', type: 'blob', sha: null }));
const queue = uploads.slice();
let done = 0;
async function worker() {
  while (queue.length) {
    const c = queue.shift();
    const mode = git('ls-tree', 'HEAD', '--', c.path).split(/\s+/)[0] || '100644';
    const buf = gitBuf('cat-file', 'blob', `HEAD:${c.path}`);
    const blob = await api('/git/blobs', {
      method: 'POST',
      body: JSON.stringify({ content: buf.toString('base64'), encoding: 'base64' }),
    });
    entries.push({ path: c.path, mode, type: 'blob', sha: blob.sha });
    done++;
    if (done % 20 === 0 || done === uploads.length) console.log(`  blob ${done}/${uploads.length}`);
  }
}
await Promise.all(Array.from({ length: 5 }, worker));

const remote = await api(`/git/commits/${parent}`);
const tree = await api('/git/trees', {
  method: 'POST',
  body: JSON.stringify({ base_tree: remote.tree.sha, tree: entries }),
});

/* 构造出的 tree 必须与本地 HEAD 的 tree 完全一致才敢更新 ref。
   这是防止「推上去的内容和本地不一样」的最后一道闸。 */
const localTree = git('rev-parse', 'HEAD^{tree}');
if (tree.sha !== localTree) {
  throw new Error(`生成的 tree ${tree.sha} 与本地 ${localTree} 不一致，中止（未更新 ref）`);
}
console.log(`tree 与本地一致 ${tree.sha.slice(0, 12)}`);

const commit = await api('/git/commits', {
  method: 'POST',
  body: JSON.stringify({
    message, tree: tree.sha, parents: [parent],
    author: { name: an, email: ae, date: ad },
    committer: { name: an, email: ae, date: ad },
  }),
});

await api('/git/refs/heads/main', {
  method: 'PATCH',
  body: JSON.stringify({ sha: commit.sha, force: false }),
});

console.log(`\n远端 main -> ${commit.sha}`);
if (commit.sha === head) {
  console.log('提交号与本地一致 ✓');
} else {
  console.log('注意：GitHub 重建了 commit 对象，提交号与本地不同（tree 内容相同）。');
  console.log('请跑 node tools/align_to_remote.mjs 把本地对齐到已发布提交。');
}

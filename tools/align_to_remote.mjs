/* ============================================================
   tools/align_to_remote.mjs — 把本地 main 对齐到已发布的远端提交。

   为什么需要它：tools/push_via_api.mjs 经 GitHub API 建提交时，GitHub 会用
   自己的规范重建 commit 对象（实测：保留作者与 +0800 时区，但去掉 message
   结尾的换行），于是远端提交号与本地不同。内容 tree 完全一致，但本地与远端
   分叉成两个 commit，下一次 git push 会被判非快进。

   这里的做法不是猜规则，而是**重建并验证**：
     1. 取远端提交对象（tree / parent / 作者 / 提交者 / message）
     2. 先用 tree 比对确认内容逐字节相同（不同就中止，绝不覆盖有价值的东西）
     3. 在「可能的规范化形态」里穷举，找到 hash 正好等于远端提交号的那个
     4. 把该对象写进本地对象库，再把 refs/heads/main 指过去
     5. 复核 HEAD 与状态

   用法：
     node tools/align_to_remote.mjs            # 执行
     node tools/align_to_remote.mjs --dry-run  # 只报告差异，不改本地
   ============================================================ */
import { execFileSync } from 'node:child_process';

const OWNER = 'Cesar-C-C';
const REPO = 'kids-books';
const API = `https://api.github.com/repos/${OWNER}/${REPO}`;
const DRY = process.argv.includes('--dry-run');

const git = (...a) => execFileSync('git', a, { encoding: 'utf8', maxBuffer: 1 << 28 }).trim();
const gitIn = (args, input) => execFileSync('git', args, { input, encoding: 'utf8', maxBuffer: 1 << 28 }).trim();
const token = execFileSync('gh', ['auth', 'token'], { encoding: 'utf8' }).trim();

async function api(path) {
  const res = await fetch(API + path, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'kids-books-align',
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${path}\n${text.slice(0, 600)}`);
  return text ? JSON.parse(text) : {};
}

const localHead = git('rev-parse', 'HEAD');
const remoteHead = (await api('/git/ref/heads/main')).object.sha;
const localTree = git('rev-parse', 'HEAD^{tree}');

console.log(`本地 HEAD   ${localHead}`);
console.log(`远端 main   ${remoteHead}`);
if (localHead === remoteHead) {
  console.log('已经一致，无需处理 ✓');
  process.exit(0);
}

const rc = await api(`/git/commits/${remoteHead}`);
console.log(`远端 tree   ${rc.tree.sha}`);
console.log(`本地 tree   ${localTree}`);
if (rc.tree.sha !== localTree) {
  throw new Error('本地与远端 tree 不同 —— 内容确实不一样，不能用本工具；请人工处理');
}
console.log('tree 一致（内容逐字节相同，只是 commit 对象被重建）');

const parents = rc.parents.map((p) => p.sha);
const name = rc.author.name;
const email = rc.author.email;
const id = `${name} <${email}>`;

// 远端 message 去掉了结尾换行；本地 git 提交会带一个。枚举两种形态。
const remoteMsg = rc.message;                       // API 已给出去掉结尾换行的形态
const candidatesMsg = [remoteMsg, remoteMsg + '\n'];

// 时区：GitHub 保留提交时的偏移。用本地提交的偏移，同时兜底两种零偏移写法。
const localTz = (git('log', '-1', '--format=%ai', 'HEAD').match(/([+-]\d{4})$/) || [])[1] || '+0000';
const tzSet = [...new Set([localTz, '+0000', '-0000'])];

// 时间戳取远端作者时间（与本地同为一个瞬间，仅表示法不同）
const epoch = Math.floor(new Date(rc.author.date).getTime() / 1000);

let found = null;
for (const tz of tzSet) {
  for (const msg of candidatesMsg) {
    const text = `tree ${rc.tree.sha}\n` +
      parents.map((p) => `parent ${p}\n`).join('') +
      `author ${id} ${epoch} ${tz}\n` +
      `committer ${id} ${epoch} ${tz}\n\n` + msg;
    const sha = gitIn(['hash-object', '-t', 'commit', '--stdin'], Buffer.from(text, 'utf8'));
    if (sha === remoteHead) { found = { tz, msgLen: msg.length, text }; break; }
  }
  if (found) break;
}

if (!found) {
  throw new Error('穷举常见规范化形态后仍无法重建出远端提交号。' +
    '本地与远端会保持分叉；请人工核对（可用 git commit --amend 调整 message/时区后重试）');
}
console.log(`重建成功：时区 ${found.tz}，message ${found.msgLen} 字节`);

if (DRY) { console.log('（--dry-run，未改动本地）'); process.exit(0); }

const sha = gitIn(['hash-object', '-t', 'commit', '--stdin', '-w'], Buffer.from(found.text, 'utf8'));
if (sha !== remoteHead) throw new Error(`写入后 hash 不匹配：${sha}`);
git('update-ref', 'refs/heads/main', sha);

console.log(`\nrefs/heads/main -> ${sha}`);
console.log('本地 HEAD   ' + git('rev-parse', 'HEAD'));
const dirty = git('status', '--porcelain');
console.log(dirty ? '工作区有改动：\n' + dirty : '工作区干净 ✓');

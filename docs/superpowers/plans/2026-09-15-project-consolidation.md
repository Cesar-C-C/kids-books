# 儿童绘本开发项目整理 Implementation Plan

> 后续决策（2026-09-15）：用户在本计划执行后明确放弃 HeyGen 配音方案，`workbench/cloud-voice-heygen/` 已永久删除。下文关于保留该 WIP 的内容仅为历史执行记录，当前事实以 `docs/STATUS.md` 为准。

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `kids-books-cloud` 提升为 `儿童绘本开发` 根目录下唯一的 Git 仓库，保留云朵 HeyGen WIP，删除重复工作区与可再生成产物，并建立项目及会话的长期说明。

**Architecture:** 先在不改变正式入口的前提下，把未完成配音材料隔离到 `workbench/` 并写齐项目文档；再从 linked worktree 所属的本地对象库创建 `--no-hardlinks` 独立临时克隆，迁入未提交内容并验证 Git 对象完整性，最后替换外层空仓库及历史副本。完成后按结构、Git、静态资源、浏览器和会话五层验收。

**Tech Stack:** 静态 HTML/CSS/JavaScript、Three.js、Node.js QA、Python QA、PowerShell、Git、Codex Desktop tasks

**Spec:** `docs/superpowers/specs/2026-09-15-project-consolidation-design.md`

**Execution result (2026-09-15):** Tasks 1–4 and the final repository gate completed. Task 5 used representative Codex-browser checks because the cleaned repository no longer contains a local Playwright runtime; the five automated browser suites remain explicitly unrun in `docs/STATUS.md`. Task 6 persisted the memory note and queued the five category tasks without deleting old tasks. No integration, push, PR, or deployment was performed.

## Global Constraints

- 不提交、不推送、不创建 PR，不改变 GitHub Pages。
- 不删除或归档现有 Codex 会话。
- 不把 HeyGen WIP 接入正式阅读入口、正式音频目录或 PWA 清单。
- 所有递归删除和移动前，必须把源、目标解析为绝对路径并验证其位于 `C:\Users\Cesar\Documents\ChatGPT\儿童绘本开发` 内。
- 只保留 `kids-books-cloud` 的 Git 历史；当前基线必须仍为 `f9aea94139f0c77147692ab480bf11fbb547a159`，远端必须仍为 `https://github.com/Cesar-C-C/kids-books.git`。
- 静态检查、浏览器检查和线上状态分别报告；本计划不做线上验证或发布。

---

### Task 1: 隔离并记录云朵 HeyGen WIP

**Files:**
- Create: `workbench/cloud-voice-heygen/README.md`
- Move: `tools/cloud_voice_plan.cjs` → `workbench/cloud-voice-heygen/tools/cloud_voice_plan.cjs`
- Move: `tools/heygen_cloud_cast.cjs` → `workbench/cloud-voice-heygen/tools/heygen_cloud_cast.cjs`
- Move: `tools/download_cloud_voices.py` → `workbench/cloud-voice-heygen/tools/download_cloud_voices.py`
- Move: `books/cloud/audio/heygen-progress.json` → `workbench/cloud-voice-heygen/state/heygen-progress.json`
- Move: `books/cloud/audio/voice-manifest.json` → `workbench/cloud-voice-heygen/state/legacy-voice-manifest.json`
- Move: `books/cloud/audio/heygen-staging/` → `workbench/cloud-voice-heygen/audio/heygen-staging/`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: `books/cloud/book.js` as the content source; no production page consumes these WIP files.
- Produces: a self-contained local experiment whose README records `provider=HeyGen`, `completed=24`, `total=188`, `status=blocked_insufficient_credit`, voice IDs, recovery commands, and the fact that it is not production audio.

- [ ] **Step 1: Prove the WIP inputs are exactly the inventoried files**

Run from `kids-books-cloud`:

```powershell
git status --short
Get-ChildItem books/cloud/audio/heygen-staging -File | Measure-Object
(Get-Content -Raw books/cloud/audio/heygen-progress.json | ConvertFrom-Json) | Select-Object provider,status,completed,total
```

Expected: six untracked WIP paths plus the design/plan documents; 24 staging WAV files; progress reports HeyGen, `blocked_insufficient_credit`, 24/188.

- [ ] **Step 2: Create the WIP README and ignore only regenerable audio**

Use `apply_patch` to create a README containing the verified status, input source, roles/voices, current files, resume procedure, and production-integration gate. Add this exact ignore rule:

```gitignore
# Local voice experiments; scripts and state stay reviewable, WAV clips are regenerable.
workbench/**/audio/
```

- [ ] **Step 3: Move the WIP files without changing their content**

Resolve each source and destination under the canonical repository, create `tools`, `state`, and `audio` directories, then use PowerShell `Move-Item -LiteralPath` for each listed target. Do not glob files from outside the six inventoried paths.

- [ ] **Step 4: Adjust WIP-only script roots**

Use `apply_patch` so both Node scripts resolve the repository root with `path.resolve(__dirname, '..', '..', '..')`, and the Python script resolves it with `pathlib.Path(__file__).resolve().parents[3]`. Point the Python manifest input to `workbench/cloud-voice-heygen/state/legacy-voice-manifest.json`; keep its production-output behavior documented but do not run it.

- [ ] **Step 5: Verify isolation**

Run:

```powershell
node workbench/cloud-voice-heygen/tools/cloud_voice_plan.cjs > $null
node workbench/cloud-voice-heygen/tools/heygen_cloud_cast.cjs > $null
Get-ChildItem books/cloud/audio -Force | Where-Object Name -Like 'heygen*'
rg -n "workbench|heygen-progress|voice-manifest|heygen-staging" index.html books labs shared sw.js pwa-assets.js
```

Expected: both Node commands exit 0; no HeyGen staging item remains in the production audio directory; production entry points contain no WIP references.

---

### Task 2: 建立项目、状态和会话文档

**Files:**
- Create: `PROJECT.md`
- Create: `docs/STATUS.md`
- Create: `docs/CONVERSATIONS.md`
- Modify: `docs/superpowers/specs/2026-09-15-project-consolidation-design.md` only if execution evidence reveals a factual mismatch

**Interfaces:**
- Consumes: Git metadata, current entry points, existing QA filenames, verified deployment history, and Task 1 WIP status.
- Produces: the durable context future Codex tasks must read before editing or publishing.

- [ ] **Step 1: Write `PROJECT.md`**

Use `apply_patch`. Include product scope, repository URL, local and live entry points, directory map, source-versus-generated resource rules, core commands, testing layers, Git/publishing boundaries, and links to `docs/STATUS.md` and `docs/CONVERSATIONS.md`.

- [ ] **Step 2: Write `docs/STATUS.md`**

Use `apply_patch`. Record:

```text
Baseline: f9aea94139f0c77147692ab480bf11fbb547a159
Remote: https://github.com/Cesar-C-C/kids-books.git
Cloud swipe: committed and previously verified on mobile/tablet
Cloud CosyVoice: production audio committed on main
Cloud HeyGen experiment: blocked at 24/188, not integrated
3D v3 Edge TTS: 264 MP3 generated historically; current runtime/browser status must be filled from Task 5 evidence
Publishing: no publish performed by this cleanup
```

Also retain the rule that generated assets do not prove active adoption and that school-bus cover/R2 checks must compare actual runtime references.

- [ ] **Step 3: Write `docs/CONVERSATIONS.md`**

Use `apply_patch`. Define exactly five task categories and the title pattern `[类别] 具体目标`: 项目规划与集成、绘本内容与插画、3D 科普实验室、配音与音频、测试发布与线上问题. Include routing examples and the rule that cross-category requests are split by the planning task.

- [ ] **Step 4: Verify documentation integrity**

Run:

```powershell
rg -n "T[B]D|T[O]DO|待[定]|稍后[补]" PROJECT.md docs/STATUS.md docs/CONVERSATIONS.md
git diff --check
```

Expected: the placeholder search returns no matches; `git diff --check` exits 0.

---

### Task 3: Convert the linked worktree and promote it to the project root

**Files:**
- Create temporarily: `C:\Users\Cesar\Documents\ChatGPT\儿童绘本开发.__canonical_tmp\` as an independent `--no-hardlinks` clone
- Copy: the complete `kids-books-cloud` working tree except its `.git` pointer into the temporary clone
- Move: every item under the verified temporary clone, including its independent `.git/`, to `C:\Users\Cesar\Documents\ChatGPT\儿童绘本开发\`
- Delete: outer empty `.git/`
- Delete: `kids-books/`, `kids-books-opaque/`, `kids-books-engine/`, `kids-books-inline/`, `kids-books-rich/`
- Delete: `airplane-3d/`, `.edge_tts_venv/`, `.cosyvoice-runtime/`, `outputs/`, `.skill-backups/`, `skill-review/`
- Delete: `finish_hsr.py`, `redesign_hsr.py`, `upgrade_exhibits.py`, `hsr-opaque.patch`

**Interfaces:**
- Consumes: Task 1 and Task 2 completed inside the linked `kids-books-cloud` worktree; exact pre-migration Git identity.
- Produces: one Git repository whose top-level path is the saved Codex project path.

- [ ] **Step 1: Revalidate the canonical repository immediately before destructive work**

Run from the outer project root:

```powershell
git -C kids-books-cloud rev-parse HEAD
git -C kids-books-cloud rev-parse origin/main
git -C kids-books-cloud remote get-url origin
git -C kids-books-cloud status --short
```

Expected: HEAD and `origin/main` are both `f9aea94139f0c77147692ab480bf11fbb547a159`; the remote is the approved GitHub URL; `.git` resolves under `kids-books/.git/worktrees`; status contains only Task 1/2 documents and WIP changes.

- [ ] **Step 2: Create and verify an independent local clone**

Clone the local common repository without hard links and check out the worktree branch:

```powershell
git clone --no-hardlinks --branch codex/cloud-journey "C:\Users\Cesar\Documents\ChatGPT\儿童绘本开发\kids-books" "C:\Users\Cesar\Documents\ChatGPT\儿童绘本开发.__canonical_tmp"
git -C "C:\Users\Cesar\Documents\ChatGPT\儿童绘本开发.__canonical_tmp" rev-parse HEAD
git -C "C:\Users\Cesar\Documents\ChatGPT\儿童绘本开发.__canonical_tmp" fsck --full
```

Expected: HEAD is `f9aea94139f0c77147692ab480bf11fbb547a159`; `git fsck --full` reports no missing or corrupt object; the clone's `.git` is a directory within the temporary clone and does not resolve under `kids-books/.git`.

- [ ] **Step 3: Copy the current working tree into the independent clone**

Use `robocopy` from `kids-books-cloud` to the temporary clone with `/E`, excluding `.git`, `.qa-deps`, `.qa-labs`, `preview_pwa`, and other ignored QA output directories. Accept robocopy exit codes 0–7 only. Then compare source and clone file hashes for every non-ignored file and run `git status --short` in both; expected changed paths are identical.

- [ ] **Step 4: Verify the independent clone before deletion**

Run the Task 4 core static checks in the temporary clone, verify its remote URL, HEAD, `origin/main`, `git fsck --full`, and `git diff --check`. Stop if any result differs from the linked worktree baseline.

- [ ] **Step 5: Resolve and validate every destructive target**

In one PowerShell process, define the literal outer root, linked source, and temporary clone, call `[IO.Path]::GetFullPath()` for each target, require all deletion targets to equal or be descendants of the outer root, require the temporary clone to equal the exact sibling path `C:\Users\Cesar\Documents\ChatGPT\儿童绘本开发.__canonical_tmp`, and print the complete validated list. Exit nonzero if any check fails.

- [ ] **Step 6: Replace the outer contents with the independent clone**

Use native PowerShell `Remove-Item -LiteralPath` on each individually validated old item inside the outer root. Then enumerate the temporary clone with `Get-ChildItem -Force`, move each item into the now-empty outer root, verify the temporary clone is empty, and remove only that empty temporary directory. This is a permanent local deletion; do not touch any path not explicitly validated.

- [ ] **Step 7: Verify the new repository identity**

Run from the outer root:

```powershell
git rev-parse --show-toplevel
git rev-parse HEAD
git rev-parse origin/main
git remote -v
git status --short --branch
Get-ChildItem -Directory -Recurse -Force -Filter .git | Select-Object FullName
```

Expected: Git top-level equals the outer project root; both revisions remain `f9aea94139f0c77147692ab480bf11fbb547a159`; one origin remains; no nested `.git` directory is returned below the root.

---

### Task 4: Verify structure and static product integrity

**Files:**
- Modify: `docs/STATUS.md` with actual verification results
- Modify: `pwa-assets.js` only if a documented generator proves it contains deleted WIP or obsolete-root paths

**Interfaces:**
- Consumes: the promoted root repository from Task 3.
- Produces: fresh evidence that formal books, labs, assets, runtime data, and offline metadata still agree.

- [ ] **Step 1: Verify removed paths and retained entry points**

Run:

```powershell
$removed=@('kids-books','kids-books-cloud','kids-books-opaque','kids-books-engine','kids-books-inline','kids-books-rich','airplane-3d','.edge_tts_venv','.cosyvoice-runtime','outputs','.skill-backups','skill-review','finish_hsr.py','redesign_hsr.py','upgrade_exhibits.py','hsr-opaque.patch')
$removed | ForEach-Object { if(Test-Path -LiteralPath $_){ throw "Still exists: $_" } }
Get-Item index.html,books,labs,shared,sw.js,pwa-assets.js,PROJECT.md
```

Expected: no planned deletion target remains; all formal entry points exist.

- [ ] **Step 2: Run core book and runtime checks**

Run individually and preserve each exit code:

```powershell
node qa_books.js
node qa_runtime.js
node qa_labs.cjs
node qa_models.cjs
node qa_exhibits_model.cjs
```

Expected: every command exits 0; `qa_books.js` reports all registered books without errors.

- [ ] **Step 3: Run resource and PWA checks**

Run:

```powershell
python qa_library_r2_assets.py
python qa_schoolbus_cdn_assets.py
python qa_pwa.py
python tools/qa_offline_manifest.py
rg -n "workbench/|kids-books-cloud|kids-books-opaque|kids-books-engine|kids-books-inline|kids-books-rich" index.html sw.js pwa-assets.js books labs shared
```

Expected: all Python checks exit 0; the reference search returns no production reference to WIP or deleted workspace names.

- [ ] **Step 4: Record exact static results**

Use `apply_patch` to add the date, command, exit code, and result summary to `docs/STATUS.md`. Do not describe a skipped browser test as passed.

---

### Task 5: Run browser regression checks

**Files:**
- Modify: `docs/STATUS.md` with actual browser results
- Create/Modify: no product file unless a regression is found; a regression changes scope and must be diagnosed before editing

**Interfaces:**
- Consumes: existing browser QA harness and the promoted static site.
- Produces: desktop/mobile evidence for the homepage, ordinary books, cloud book, school bus, and 3D labs.

- [ ] **Step 1: Locate the existing Playwright runtime**

Run:

```powershell
Get-ChildItem .qa-deps,.qa-labs -Force -ErrorAction SilentlyContinue
node -e "for(const p of ['playwright','playwright-core']){try{console.log(p,require.resolve(p))}catch(e){}}"
```

Expected: at least one existing local/browser QA dependency path resolves. If none resolves, record browser QA as blocked by missing local dependency; do not install packages without separate need and approval.

- [ ] **Step 2: Run representative browser suites**

Run each suite with its existing local dependency environment:

```powershell
node qa_cloud.cjs
node qa_cloud_swipe.cjs
node qa_schoolbus_inspection.cjs
node qa_v3_labs_browser.cjs
node qa_book_hsr_browser.cjs
```

Expected: each exits 0. `qa_cloud_swipe.cjs` covers mobile and tablet gestures; the school-bus test covers its active resources; the v3 and HSR tests exercise 3D model interaction and narration controls.

- [ ] **Step 3: Record browser evidence and 3D audio status**

Update `docs/STATUS.md` with exact commands and outcomes. Only mark the historical 264-file v3 audio work runtime-verified if the relevant browser suite actually exercises playback and exits 0; otherwise retain “files generated; playback not verified.”

---

### Task 6: Persist key context and create the new task set

**Files:**
- Create: `C:\Users\Cesar\.codex\memories\extensions\ad_hoc\notes\2026-09-15-kids-books-consolidation.md`
- Read: `docs/STATUS.md`, `docs/CONVERSATIONS.md`, `PROJECT.md`

**Interfaces:**
- Consumes: final verified repository state and documented task taxonomy.
- Produces: one memory update request and five clearly scoped Codex tasks associated with project `251242ac-dd05-4657-a5bc-3d8705e7e035`.

- [ ] **Step 1: Write the memory update note**

Use `apply_patch` to create one small note under the authorized ad-hoc memory-update directory. Record the canonical root/repository, removed duplicate workspaces, baseline, retained HeyGen WIP state, final validation evidence, five task categories, and the rule to inspect Git root/branch/remote and active resources before changes. Do not edit `MEMORY.md` directly.

- [ ] **Step 2: Create five project tasks**

Create project-local tasks using the saved project ID and local environment. Titles and prompts:

```text
[项目规划与集成] 儿童绘本路线与跨模块协调
[绘本内容与插画] 双语绘本创作与页面体验
[3D 科普实验室] 模型拆解与互动教学
[配音与音频] TTS 生成与播放质量
[测试发布与线上问题] QA、Git 与 Pages
```

Each initial prompt must instruct the task to read `PROJECT.md`, `docs/STATUS.md`, and `docs/CONVERSATIONS.md`, stay within its category, and route cross-category work to the planning task. Creation is organizational only; do not ask the new tasks to modify files immediately.

- [ ] **Step 3: Verify task creation**

List project tasks and confirm the five exact titles are present once each under project `儿童绘本开发`. Do not archive or delete old tasks.

---

### Task 7: Final verification and handoff

**Files:**
- Modify: `docs/STATUS.md` only if final evidence differs from earlier results

**Interfaces:**
- Consumes: all previous tasks.
- Produces: an evidence-backed cleanup report with deleted size estimate, retained WIP, QA layers, and new task links.

- [ ] **Step 1: Run the final repository gate**

Run:

```powershell
git rev-parse --show-toplevel
git status --short --branch
git diff --check
git diff --stat
git remote -v
git rev-list --left-right --count origin/main...HEAD
```

Expected: top-level is `C:\Users\Cesar\Documents\ChatGPT\儿童绘本开发`; branch remains `codex/cloud-journey`; no whitespace errors; origin is unchanged; committed HEAD is still equal to local `origin/main`; only planned documentation and WIP moves appear as uncommitted changes.

- [ ] **Step 2: Re-run the minimum smoke set after all documentation changes**

Run:

```powershell
node qa_books.js
node qa_runtime.js
node qa_labs.cjs
python qa_pwa.py
```

Expected: all four commands exit 0 in the final root layout.

- [ ] **Step 3: Report exact outcomes**

Report permanently removed directories/files, approximate reclaimed size, canonical Git identity, WIP path and 24/188 state, static/browser test results, any blocked checks, memory-note path, and the five newly created task titles. State explicitly that no commit, push, PR, task deletion, or online deployment was performed.

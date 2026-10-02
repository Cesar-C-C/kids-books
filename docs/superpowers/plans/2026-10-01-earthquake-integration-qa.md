# 地震绘本与 3D 实验室集成验收 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把《地面为什么会摇？》绘本、地震 3D 实验室与正式双语朗读接成一个可在本地完整体验、可离线验证的主题，同时保护现有下载和其他未完成工作。

**Architecture:** 四个任务在同一新建的隔离 checkout 上工作，按文件所有权分区；本计划的执行者独占书架、实验室目录、PWA 资源发现、共享离线接口和跨端 QA。绘本与实验室各自拥有模型和页面，交换的仅是白名单深链、概念 ID 与版本化音频条目，不共享可变模拟状态。

**Tech Stack:** 静态 HTML/CSS/JavaScript、Python 资源生成器、Service Worker/Cache Storage、Node 与真实 Chrome 浏览器回归；Fun-CosyVoice 3 录音由音频任务单独交付。

**Spec:** `docs/superpowers/specs/2026-10-01-earthquake-design.md` 与 `docs/superpowers/specs/2026-10-01-earthquake-3d-lab-design.md`。

## Global Constraints

- 默认机制固定为“向内挤压＋逆断层上盘沿倾斜断层面上滑”；绘本不提供接触条件对照，该对照仅是实验室可选深看，纯模型门槛不通过则删去。
- 绘本的断层／波章节分别使用 `#fault-lab`、`#wave-lab`；实验室目标分别为 `#elastic-rebound`、`#waves`。`lang` 只接受 `zh|en`，`from` 只接受 `earthquake-fault|earthquake-waves`；不传 `returnUrl`、物理参数或进度。
- 本轮先交可体验的本地版本；两份设计批准不等于推送、PR、合并或上线许可。音频未齐全的候选必须明确显示缺录状态，不能宣称正式点读完成。
- 绘本 4–8 岁、中英双语；默认静音、没有整页摇晃／突然巨响；触控目标约 44px、键盘等价路径和减少动态效果的同状态关键帧必须可用。
- 实验室新增非音频资源预算不含共享 Three.js 应以 2 MB、约 100k 可见三角面／250 draw calls 为目标，超出须另给真机证据；这些数值不是当前验收结果。
- 静态、桌面浏览器模拟、真人／真机和线上验收分别记录；模拟浏览器不能冒充安装到用户设备的应用或儿童理解性验收。

## Review Focus

1. `lang=xx`、未知 `from`、未知 hash 或恶意 `returnUrl`：安全回落中文／无来源／首卡，绝不跳到任意 URL；由 Task 3 浏览器测试钉住。
2. 绘本已离线而实验室不在实际缓存中：点击入口仍留在当前章节，提示联网并可继续故事；由 Task 2 和 Task 3 测试钉住。
3. 旧安装仍由旧 Service Worker 控制：普通升级最终换到新资源目录，已有书本缓存的逐字节 hash 保持不变；由 Task 4 测试钉住。
4. 音频条目缺文件、文字版本或 hash 不一致：候选显示缺录，正式完成门槛失败，不能播放过期录音；由 Task 2 静态与浏览器测试钉住。
5. 失焦、`pointercancel`、切语言、朗读或离页时仍按住推动／存在延迟回调：输入和声音停止，恢复后不自动再触发；由 Task 3 浏览器测试钉住。

---

## 工作区与文件所有权

2026-10-01 的只读事实：主目录在 `codex/cloud-journey`，HEAD `1a2268f6e6c332eb69dabe0fd13f1f3494f7abed`；`labs/station/**`、`pwa-assets.js`、旧规划等已有用户未提交改动，两个已批准设计仍是主目录未跟踪文件。现有工作树各自用于声音／肥皂、月相、首批健康书等。`origin/main` 的本地引用仅 `92ff2c27`，不能作新主题基线；GitHub 只读查询的当前 `main` 为 `89e5a4ad332380e5c32f2b4bc1ce6d1733a508d5`。执行开始时重查远端 SHA，不能把上述日期的值当永久锁。

计划批准后由集成任务建立**一个**从重新核对的远端 `main` 出发的受管理隔离 worktree，公布绝对路径和基线 SHA 供四方使用；不得在主目录实现，也不覆盖现有任一 checkout。原样复制两份已批准 spec 到新 checkout，复制前后分别核 SHA-256，源文件保留；本次读到的源 hash 分别为 `370c4c22902b8a71fb4218b26b675de645cb529e6717578f083e86339e1d4784` 与 `92f267ac7c9f753d380af05c783f5f644636958f5c1cb771421e7d1746785cc7`，执行时以重新实测值为准。若 GitHub `main` 已变化，先核差异与主题冲突再定基线；不重置或清理主目录。

| 唯一 owner | 可修改范围 | 不得抢写 |
| --- | --- | --- |
| 绘本任务 | `books/earthquake/**`，但不含 `audio/**` 和正式 `audio-manifest.json`；`tests/qa_earthquake_book_content.cjs`、`tests/qa_earthquake_book_models.cjs`、`tests/qa_earthquake_book_routes.cjs` | 根 `index.html`、浏览器联合测试、PWA 与实验室文件 |
| 3D 任务 | `labs/earthquake/**`，但不含 `audio/**` 和 `audio-manifest.json`；`tests/qa_earthquake_lab_*.cjs` | `labs/catalog.js`、共享导航／样式源与 PWA |
| 音频任务 | 两端各自的 `audio/**`、正式 `audio-manifest.json`；`tools/earthquake_audio_manifest.cjs`、`tools/earthquake_audio_batch.py`、`tests/test_earthquake_audio_manifest.cjs`、`tests/test_earthquake_audio_batch.py`、`tests/test_earthquake_audio_player.cjs`、`tests/qa_earthquake_audio.cjs` 和独立音频工作台 | 故事／实验室双语内容表、两端播放器适配器、共享 PWA 工具及生成清单 |
| 集成 QA 任务 | 根 `index.html`、`labs/catalog.js`、必要的 `labs/shared/navigation.js`、`shared/pwa.js`、`sw.js`、`pwa-assets.js`、`tools/story_resources.py`、`tools/gen_pwa_assets.py`、`tools/qa_offline_manifest.py`、`qa_pwa.py`、`qa_labs.cjs`、`qa_models.cjs`、`.github/workflows/pwa.yml`、`tests/qa_earthquake_book_browser.cjs`、`tests/qa_earthquake_integration.cjs`、`tests/qa_earthquake_upgrade.cjs`、本计划与联合报告 | 书内模型、3D 几何和音频字节 |

内容作者先确定稳定 ID 与 `zh/en` 文字，音频任务据冻结文本生成清单和文件；绘本 `books/earthquake/audio.js` 与实验室 `labs/earthquake/v3/audio.js` 分别由对应页面 owner 实现，均消费同一清单字段约定，不新增无明确 owner 的共享播放器。集成任务在两端页面与资源就位后最后一次生成 `pwa-assets.js`。只有集成任务修改共享文件或解决共享文件冲突；并行任务若需要它们，先交接口请求，不各自覆盖。未来执行时提交与否另依用户授权；本计划本轮不执行任何提交或发布动作。

### Task 1: 锁定隔离基线和跨任务契约

**Files:** 新隔离 checkout 内复制两份 spec；记录 `docs/qa/earthquake-integration/baseline.md`。

**Interfaces:** 向绘本、3D、音频任务提供同一个 worktree 绝对路径、基线 SHA、独占文件表、上述锚点与概念 ID；任何一方的后续计划不得假定主目录旧 `main` 或主目录 `pwa-assets.js` 是新版事实。

- [ ] **Step 1: 重查并记录 Git 根、全部工作树状态、GitHub `main` SHA、`books/earthquake/` 与 `labs/earthquake/` 是否已占用。** 预期主目录脏文件与已批准 spec 均仍在，不把它们算作新基线。
- [ ] **Step 2: 在用户审阅本计划后建立新的隔离 checkout，原样带入两个 spec，并核对复制前后 SHA-256 一致。** 若路径已占用或远端主题已有变化，先调整目标，绝不覆盖。
- [ ] **Step 3: 在 `baseline.md` 写入实际基线、spec hash、owner、预览 URL 与不能发布的边界，并通知三位对应任务。** 预期所有任务报告同一基线与路径。
- [ ] **Step 4: 独立核查文档与工作树状态，作为本任务评审门槛。** 预期只有隔离 checkout 获得新文件，主目录原有改动和 spec 字节不变。

### Task 2: 类型化配音与可验证的离线资源

**Files:** Modify `tools/story_resources.py`、`tools/gen_pwa_assets.py`、`tools/qa_offline_manifest.py`、`qa_pwa.py`；Test `tests/test_everyday_resources.py`、新 `tests/qa_earthquake_resources.py`。绘本内容和音频清单由各自 owner 提供。

**Interfaces:** `discover(repo, 'earthquake')` 继续返回 `images`、`data`、`audio`、`audioExpected`、`audioVersion`、`missingAudio`，并把有 `narrationNeeded: true` 的互动提示／结果纳入 `expected`。绘本 `story.json` 使用 `interactions:[{id,kind:'prompt'|'result',conceptId,zh,en,narrationNeeded}]`；录音键由 `owner+kind+id+lang` 唯一确定，文件名与文本 hash 以音频任务的锁定清单为准，不能从界面文字临时猜。`scene|vocab` 沿用现有输出契约。实验室 `labs/earthquake/content.json` 使用 `{contentVersion,entries:[{id,kind,conceptId,zh,en,narrationNeeded,contentVersion}]}`，`kind=knowledge|prompt|result`；它的有声条目与 `labs/earthquake/audio-manifest.json` 逐键、语言和文本 hash 匹配。实验室 MP3 单列体积，不偷偷算进 2 MB 非音频预算，也不默认塞进首次安装 shell：页面按需播放时由现有 SW 的完整 200 回填缓存；未播放过的音频离线时明确不可用，不使实验室核心交互失效。

- [ ] **Step 1: 增加失败用例。** 缺一条 `prompt/result` 语言、重复 ID、`narrationNeeded=false` 却出现正式文件、同名 MP3 缺失或空文件、`scriptVersion`/文本 hash 与内容源不符时，断言资源发现或正式完成门槛准确报错／待录；旧书 `scene/vocab` 返回值不得变。
- [ ] **Step 2: 运行 `python -m unittest discover -s tests -p 'test_*.py'`，确认新契约用例先失败、旧书用例仍通过。**
- [ ] **Step 3: 最小扩展资源发现与校验。** 新书允许候选阶段 `missingAudio` 非空且 `complete=false`；正式门槛要求所有承诺有声条目的中英文件存在、可解码、hash 与内容锁一致。实验室内容表／清单由 JS 专项校验逐条读取，不从目录猜“够了几段”。
- [ ] **Step 4: 运行 `python tools/gen_pwa_assets.py`、`python tools/qa_offline_manifest.py`、`python qa_pwa.py` 与 Python 单测。** 预期书内插图、互动图和已存在的书本 MP3 进入书包；实验室非音频依赖进入 shell，实验室 MP3 不进入首次 shell，单独列出文件、字节与按需缓存行为。未录条目明确列在缺失集合。生成物只由集成任务更新。
- [ ] **Step 5: 用真实浏览器离线播放书本各语言的 scene、vocab、prompt、result；实验室先在线逐条播放并确认 200 缓存，再断网复播深看样本。** 断言自然结束、停止／切语不叠音，资源 URL 含当前版本；未预热的实验室录音应给可读的不可用提示。内容还未冻结时只标“待录”，不以设备 TTS 冒充正式声音。
- [ ] **Step 6: 如后续获得提交授权，仅提交共享工具与专项测试的独立可评审变更；否则保留本地 diff。提交前检查暂存路径仅属于本任务。**

### Task 3: 书架、目录、深链与实际缓存门槛

**Files:** Modify 根 `index.html`、`labs/catalog.js`、必要时 `labs/shared/navigation.js`、`shared/pwa.js`、`sw.js`、`tools/gen_pwa_assets.py`、`qa_labs.cjs`、`qa_models.cjs`；Test `tests/qa_earthquake_integration.cjs`。不改变书内和实验室的私有状态机。

**Interfaces:** 共享离线查询 `window.KBOfflineLab.check('earthquake') -> Promise<{ready:boolean,version:string|null}>`，只读请求 Service Worker 的 `KB_LAB_STATUS` 白名单消息；未知 ID、无 controller、旧 worker、超时或任一必需核心资源缺失均返回 `ready:false`。生成清单提供 `labs.earthquake.files`，列出实验室 HTML、实际加载的 JS/CSS、预览图和必要的同源共享依赖，但不把按需音频误作核心运行门槛；SW 在实际 Cache Storage 中逐一匹配本版本资源，不仅凭 `navigator.onLine` 或文件在磁盘存在来宣称离线可用。绘本任务只调用此接口决定“进入实验室／联网后再来”，始终保留“继续故事”。

- [ ] **Step 1: 写失败的共享契约测试。** `KB_LAB_STATUS` 未知 ID、旧 worker、部分缓存、全缓存四种状态分别返回安全失败／成功；生成器漏掉 HTML 中带 `?v=` 的脚本时失败；原有书籍 `KB_STATUS` 格式不变。
- [ ] **Step 2: 运行新测试确认失败，再实现上述白名单与有界超时接口。** `labs.earthquake.files` 以页面实际引用为准；多余实验室原始素材、测试截图和大 WAV 不进入发布清单。
- [ ] **Step 3: 待两端页面、预览图、模型与本地测试完成后登记 `labs/catalog.js` 为 `ready`，根书架加入地震卡；未齐全时不得留下可点击的假入口。** 检查 `qa_labs.cjs` 的 `bookId:'earthquake'`、预览和 `qa_models.cjs` 的 `parts.js`、`detail-parts.js`、唯一逐字相同的 `v3/studio.css` 等既有契约。
- [ ] **Step 4: 在真实浏览器断言两个章节各以 `zh/en` 进入对应实验室卡，切语后返回原章节的当前语言；无来源直开回书首，未知 `lang/from/hash` 安全回落且 `returnUrl` 被忽略。** 从实验室切换别的卡不改进入时来源；返回时模型重置，浏览器后退恢复快照也暂停。
- [ ] **Step 5: 断网且实验室缓存缺失时点击书内入口，不导航、不留空白，显示联网提示；缓存完整时才允许进入。** 还要验证无 WebGL／脚本失败仍有 SVG/HTML 主路径或明确错误和固定返书链接。
- [ ] **Step 6: 如后续获得提交授权，仅提交入口、资源接口与跨端测试的独立可评审变更；否则保留本地 diff。确认不包含主目录太空站文件。**

### Task 4: 联合科学、互动生命周期与旧安装升级回归

**Files:** Create `tests/qa_earthquake_upgrade.cjs`、`docs/qa/earthquake-integration/local-report.md`；Modify `.github/workflows/pwa.yml`，必要时更新 `tests/qa_earthquake_integration.cjs`。模型单测仍由 3D／绘本 owner 编写，本任务核对其断言而不代写物理实现。

**Interfaces:** 使用同一语义概念 ID：`fault`、`elastic-strain`、`slip`、`focus`、`epicenter`、`wavefront`、`particle-motion`、`p-wave`、`s-wave`。书与实验室可有不同表述，但默认逆断层运动、震源和震中关系、波前与局部运动的模型结论不得冲突。

- [ ] **Step 1: 审核并运行两端纯模型断言。** 锁住时滑移近零且形变增加；松手不触发、暂停冻结、滑后错位保留；绘本近／远／等距旗与追踪点局部往复；实验室正／逆／走滑相对运动、震中垂直投影、P 先 S 后及两种局部振动方向。接触单变量对照先经可丢弃纯模型验证，不成立就按 spec 删除该可选卡。
- [ ] **Step 2: 真实 Chrome 覆盖 320、390、820、1024 宽和短横屏，两种语言。** 保存关键实验同屏截图，核对无横向溢出、主按钮／结果可见、至少约 44px 的命中区、焦点、手机纵向滚动；减弱动效模式必须保留同状态关键帧、逐步证据和结果，不只剩文字。
- [ ] **Step 3: 快速输入生命周期回归。** 长按与单步／键盘同路径；`pointercancel`、失焦、切语、朗读、离页取消持续输入和过期声音／回调；反复暂停／重播／重置不重复释放波，恢复焦点不自动继续；WebGL 拒绝或加载失败可完成主要学习路径。
- [ ] **Step 4: 从已发布的 `89e5a4ad332380e5c32f2b4bc1ce6d1733a508d5` 建旧安装测试夹具，先缓存飞机、声音和肥皂中至少两本并记全部资源 hash；普通升级到新 manifest 后下载地震绘本，原下载字节与完整状态保持，新书的中英样本可离线结束。** 测试不清缓存、不卸载、不直接调用 `registration.update()`；若 main 后来变化仍保留该已发布安装快照。
- [ ] **Step 5: 在 `.github/workflows/pwa.yml` 接入静态、模型、浏览器、离线和升级检查，并本地按相同命令跑一次。** 旧书受共享文件影响时运行其相关回归；`python tools/gen_pwa_assets.py` 之后 `git diff` 应只有预期生成变更。
- [ ] **Step 6: `local-report.md` 分栏写静态证据、浏览器证据、仍待真人／真机观察及未进行的线上验收。** 真人检查可请孩子指出先弯处、滑动处和标记点是否远走；中档 Android 的帧率／内存／输入响应由真实设备另记，不以桌面模拟代替。
- [ ] **Step 7: 在全部适用检查通过后交给规划任务合并审阅；如后续获得提交授权才提交本任务的测试、工作流和报告，否则保留本地 diff。** 此步骤不推送、不建 PR、不合并、不部署。

## 联合完成门槛与执行交接

内容、3D 与音频计划分别交付可独立审阅的文件和本地证据。本计划的 Task 1 → 内容／3D 私有实现 → Task 2 音频契约与冻结内容 → 音频实际交付 → Task 3 入口与离线门槛 → Task 4 联合回归是依赖顺序；可在不争用文件时并行写私有模块。最终由集成任务逐项核对所有 owner 的 diff、内容锁与 hash，再把本地体验链接和明确未验收边界交规划任务；提交及发布分别走后续用户授权流程。

**计划自审（2026-10-01）：** 两份 spec 的故事完整性、默认断层机制、四张实验室卡、深链白名单、离线降级、正式录音与科学误导边界分别有对应 owner 和验证步骤。五个 Review Focus 均落到 Task 2–4 的失败用例。共用类型只在上文 Interfaces 定义一次；未知的实际新音频片数不预设为旧书的 66 段。Task 1 不抢先实施，所有计划均待用户合并审阅。

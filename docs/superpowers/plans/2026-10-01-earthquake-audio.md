# Earthquake Bilingual Audio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为地震绘本及配套 3D 实验室建立可追溯、分角色、中英自然的 Fun-CosyVoice3 配音，覆盖文本冻结、试听、生成、实际播放和离线验收。

**Architecture:** 各端只有一个双语内容源，导出成同构、带 owner 命名空间的录音任务；共享概念键，不复制故事句到实验室。音频任务负责导出/生成锁/成品验证，内容与 3D 任务分别负责页面播放接入，QA 负责独立验收。

**Tech Stack:** 现有 Node.js/Python 工具、Fun-CosyVoice3 CUDA FP32、24 kHz mono WAV 工作母版、MP3 发布件、HTMLAudioElement、现有 PWA 管线。

**Spec:** `docs/superpowers/specs/2026-10-01-earthquake-design.md`；`docs/superpowers/specs/2026-10-01-earthquake-3d-lab-design.md`。

## Global Constraints

- 规划任务于 2026-10-01 转达用户“确认，开始制作。”及两份设计获批；spec 内“待审”文字尚未同步，不在本任务擅改设计。当前仍是实施计划待联合审阅，不是音频生产批准。
- 保留执行方式：现有音频/内容/3D/QA任务协作，规划任务只协调；本轮只写本文，不生成音频/图片、不建模、不提交。无 push/PR/merge/发布授权。
- “默认面向4–8岁、中英双语、Fun-CosyVoice3预生成配音。”不重复询问引擎选择。
- “默认静音，无震动音效需求；声音不是任何题目的答案线索。”不引入此前鼓声或地震巨响。
- “正文、核心问题与关键观察结论纳入正式Fun-CosyVoice3朗读；短按钮标签由文本和无障碍名称承担，点击不自动发声。”
- “内容未冻结不批量生成；变更已录文本必须标为待更新。”旧音色与自然度认可不等于新文本/新角色/新音频获批。
- “模型只产生语义状态ID，不拼接临时待朗读段落。”不按帧、位置组合或旧66段数量生成。
- 实验室的“不含共享 Three.js 与未来音频时不超过 2 MB”不包含音频；音频须单独报告总字节和下载策略，不借此默认全部塞入首次 shell 缓存。

## Review Focus

1. 同 ID 跨书/实验室或跨 kind 撞车：以 owner+kind+id+lang 定位，拒绝覆盖（Task 1）。
2. 文本仅改角色/读法/换行：语义 hash 检出实质变化、CRLF/LF 等价；缺译与未冻结阻断生产（Task 1/2）。
3. 中文参考误用英文、P/S/岩岩/地质术语误读：分语言参考与实际试听，不能凭文件可解码放行（Task 2）。
4. 快速切语、导航、失焦和迟到 play promise：撤销旧播放，保持当前语义状态，不自动启动实验（Task 4）。
5. 离线只有绘本、旧缓存和文件损坏：不显示假可用录音，不把实验室缺缓存变成绘本不可读（Task 4）。

## 基线、文件与所有权

只读检查：主目录 `C:/Users/Cesar/Documents/ChatGPT/儿童绘本开发`，分支 `codex/cloud-journey`。太空站 `labs/station/*`、`pwa-assets.js`、旧健康书计划等存在未提交改动；保留全部，不 reset/stash/批量 add。执行时由协调方先确定集成基线/工作树；本计划不是创建新工作树的操作指令。

现有可复用证据位于 `.worktrees/everyday-science/`，不能误认为主目录已有同版文件：

- `tools/build_everyday_audio.cjs` 硬编码 sound/soap、scene/vocab，默认 narrator：不能直接作为地震导出器。
- `tools/story_resources.py::discover(repo, book_id)` 只枚举 scene/vocab，并读取入口的单一数字 AUDIO_VER：需兼容扩展，不能只放 MP3。
- `workbench/generate_everyday_full_v2.py` 硬编码人物映射、66项断言和旧 publicationAuthorized：仅借鉴分段/seed/hash/复用流程，禁止继承其批准文件或数量断言。
- `workbench/generate_dialogue_v2.py`、`verify_everyday_full_v2.py`、`test_everyday_full_v2.py` 是清理/PCM复核/锁检查参考，不直接改写旧交付。
- 主目录 `labs/shared/speech.js` 偏英文；预生成 Audio 是 say() 局部变量，stop() 仅取消 speechSynthesis。地震实验室不可直接沿用并声称支持停止/双语完整性。

拟新增音频所有文件：`tools/earthquake_audio_manifest.cjs`、`tools/earthquake_audio_batch.py`、`tests/test_earthquake_audio_manifest.cjs`、`tests/test_earthquake_audio_batch.py`、`workbench/earthquake-audio-v1/`。
内容方所有：`books/earthquake/story.json`、页面控制器与绘本播放器；3D方所有：`labs/earthquake/content.json`、实验室播放器。音频方拥有两端 `audio-manifest.json` 与 `audio/*.mp3`；QA已单向确认拥有共享 `tools/story_resources.py`、`tools/gen_pwa_assets.py` 及全局PWA/QA修改，音频任务不并发编辑这些文件。

QA于本轮提供远端main快照 `89e5a4ad332380e5c32f2b4bc1ce6d1733a508d5`（本任务未独立联网复核）。执行前刷新确认基线，隔离checkout不带入太空站dirty。QA确认现有发现器可报告缺音频并令complete=false；新类型扩展应保留该候选能力，不能要求无音频候选伪造ready条目。

## 接口决定（联合计划审阅后冻结）

- 绘本以 `story.json` 为唯一内容源：`scriptVersion`；`scenes`、`vocab`、`interactions`，后者 kind 仅 prompt/result。场景及词汇按原结构兼容；所有可录条目显式 `narrationNeeded`，短控件为 false。
- 实验室 `content.json` 为唯一内容源：`contentVersion`、`entries[]`；每项 `{id,kind,zh,en,conceptId,narrationNeeded,contentVersion}`，kind=knowledge/prompt/result。3D任务单向同步已确认上述路径、顶层容器、条目字段、owner命名空间和独立manifest；本文细化hash规则仍随联合计划核对。未向被拦截线程重发或绕过权限。
- 通用角色分段字段可选 `segments:{zh:[{role,sourceText,spokenText}],en:[...]}`；无分段条目默认 narrator，词汇读词还是读解释由源文本决定，不由生成器猜。分段 sourceText 按顺序拼接必须等于对应显示文本（统一换行后）；spokenText 默认 sourceText，改读法须显式记录原因，不能悄悄改科学含义。
- role 首版仅 narrator/yanyan。narrator 延续温柔成年女士；岩岩为年轻、自然、清晰且不尖叫的角色声，实际中文/英文参考经必要新样本确定。没有新角色文本不额外造角色。
- 概念键沿用两份 spec；实验室另有 fault-normal/fault-reverse/fault-strike-slip。conceptId 仅语义关联，不作为音频共享许可。
- 导出 `entry.id = kind-itemId-lang`、`key = owner:entry.id`；owner=book|lab，lang=zh|en，itemId 仅 `[a-z0-9-]+`。book kind=scene/vocab/prompt/result；lab kind=knowledge/prompt/result。两端分别输出 `audio/{entry.id}.mp3`，拒绝路径穿越及重复键。
- manifest 顶层 `{schemaVersion:2,topicId:'earthquake',owner,contentVersion,sourceSha256,entries}`；entry 保存 `{id,itemId,kind,lang,text,segments,contentVersion,textSha256,utteranceSha256,output,status,fileSha256}`，status=pending|ready|stale。book 保留 `bookId/scriptVersion/scriptSha256` 兼容字段，sceneId/termId 仅对应旧类型。
- hash 口径：统一 Unicode NFC 与 CRLF→LF，不 trim/折叠正文空格；textSha256 对规范化显示文本；utteranceSha256 对固定字段顺序 JSON `{kind,id,lang,text,segments:[{role,sourceText,spokenText}]}`；sourceSha256 对规范化换行后的完整源文件。纯格式变化可导致整源hash变化但不强迫重录；复用要求 utteranceHash、参考/生成设置、输出hash全相同并记录新manifest与旧锁的映射。
- 记录每个源条目的版本；顶层版本改变不自动批准增量。样本认可绑定样本文件hash＋对应utteranceHash＋配音设置hash；全量许可绑定冻结任务清单hash，单独字段，不借用旧书授权。

### Task 1: 内容适配与可验证清单（计划批准后，先不合成）

**Files:** 新建 `tools/earthquake_audio_manifest.cjs`、`tests/test_earthquake_audio_manifest.cjs`；消费双方内容源；产出双方 `audio-manifest.json` 与 `workbench/earthquake-audio-v1/freeze.json`。
**Interfaces:** `collectEntries(owner, source) -> Entry[]`；`buildManifest(owner, source, sourceRaw) -> Manifest`；CLI `node tools/earthquake_audio_manifest.cjs --root <repo> --check|--write`。check 不改文件；write 只写地震产物。

- [ ] 写 node:test：`covers_required_bilingual_items` 断言清单键集合等于源中 narrationNeeded=true 的两种语言；`rejects_duplicate_missing_translation_and_bad_path`；`hashes_roles_and_spoken_text`；`normalizes_crlf_only`；`non_narrated_buttons_excluded`。
- [ ] 运行 `node --test tests/test_earthquake_audio_manifest.cjs`，确认因缺适配器失败，而非测试环境错误。
- [ ] 实现上述接口，逐项从源导出，不抄出第二份脚本；两端同 id 不互相覆盖。清单数量由集合计算，分 owner/kind/lang 报告，不断言66。
- [ ] 重跑测试全绿；运行 `node tools/earthquake_audio_manifest.cjs --root . --check`。缺源/缺译/源未声明冻结应报告明确未就绪，不能虚构文件来通过。
- [ ] 与内容/3D核对逐条显示文本、角色、术语读法和 narrationNeeded；生成冻结源/清单hash及统计，交付可审查差异。只检查涉及文件，不提交他人改动。

### Task 2: 新文本必要试听与生成锁

**Files:** 新建 `tools/earthquake_audio_batch.py`、`tests/test_earthquake_audio_batch.py`；生成 `workbench/earthquake-audio-v1/{voice-profile.json,generation-lock.json,listen.html,validation.json,user-approval.json}`（approval仅在真实用户认可后记录）。
**Interfaces:** `prepare_jobs(manifests, profile) -> list[Job]`；`validate_lock(lock, current_inputs) -> None`（不匹配抛错）；CLI `python tools/earthquake_audio_batch.py --stage prepare|sample|batch|verify --root <repo>`，默认仅prepare。sample/batch须对应授权，不能由prepare隐式生成。

- [ ] 写测试：`rejects_unfrozen_inputs`、`rejects_old_book_approval`、`requires_reference_language_and_hash`、`rejects_changed_utterance`、`separates_sample_and_batch_authority`；运行 `python -m unittest discover -s tests -p test_earthquake_audio_batch.py` 观察预期失败。
- [ ] 实现锁检查与任务准备：记录模型路径/版本、生成器hash、CUDA FP32、24kHz、mode、speed、seed、角色/语言reference的路径/hash/来源/使用条件/准确转写、instruction、分段停顿、导出参数、清理配置hash。设置任务级缓存；不改共享运行时，不偷偷降级CPU/其它引擎。
- [ ] 复跑上述测试通过；`--stage prepare` 输出预计条数/时长口径及缺项，不创建WAV。角色指派显式来源于segments，不按引号位置猜是谁。
- [ ] 内容冻结且样本范围获授权后，仅选覆盖“旁白＋岩岩对话、互动问题/结论、实验室术语/P-S读法”的最小去重文本集合，中英各覆盖所有实际使用角色。沿用已认可音色方法，不重选引擎，不再要求旧样本重复认可。
- [ ] `--stage sample` 生成真实新文本样本并给出原始/候选清理版本；检查自然中文、英文底噪、人物区分、术语、漏字复读和句尾。清理以旧轻度配方为比较基线，不在未听前硬定滤波阈值。
- [ ] 收到用户对具体样本认可后保存hash绑定记录；批准需要包含正式批量范围才可进入Task 3，否则只保留样本认可，不推断批量/发布权。

### Task 3: 锁定批量、增量复用与成品验收

**Files:** Task 2脚本/测试；`workbench/earthquake-audio-v1/{clips,delivery,validation.json}`；两端正式 `audio/` 和 manifests。
**Interfaces:** `generate_job(job, lock) -> ClipRecord`、`verify_delivery(manifests, lock, files) -> Report`；支持逐条复用，不承诺GPU结果逐字节确定。

- [ ] 测试 `rejects_relative_reuse_path_escape`、`rejects_corrupt_or_stale_output`、`requires_exact_expected_set`、`cannot_promote_without_batch_approval`；先运行失败，再实现最小检查与导出。
- [ ] 正式批量授权及锁吻合后运行 `--stage batch`；同样本已认可成品优先原字节复用，元数据展开后再解析绝对路径并验证hash。中断从已验证条目继续，未通过条目不改ready。
- [ ] `--stage verify` 检查每条有限值、非静音、24kHz mono工作母版、可解码MP3、无削波/截字、文本/角色/参考/seed/输出hash覆盖；拼接PCM与记录片段在既定量化容差内一致。报告peak/RMS/时长/格式/字节数，不拿RMS当听感认可。
- [ ] 中英逐条人工/可听复核词句及角色；自动转写仅辅助。失败条目单独返工，改音频hash时记录影响范围，必要时重新试听该变更，不重问未改文件。
- [ ] 验收后复制明确清单至两端audio，写ready/fileSha256；源文变化立即stale并禁止正式按钮继续播放旧文。锁/原始参考/WAV母版不进发布路由。提交仅在后续明确授权时按本任务文件清单办理。

### Task 4: 页面与PWA验收交接（内容/3D接入，QA主责）

**Files:** 内容任务拥有 `books/earthquake/audio.js` 及本书播放测试；3D任务拥有 `labs/earthquake/v3/audio.js`、`tests/qa_earthquake_lab_audio.cjs`。音频任务仅提供共同manifest契约、下列测试案例及跨端清单驱动验收 `tests/qa_earthquake_audio.cjs`，不新增共享主题播放器或另一套播放器实现/单测文件。QA扩展 `tools/story_resources.py`（含 `interactions[]` 的 prompt/result）、`tools/gen_pwa_assets.py`、`tools/qa_offline_manifest.py`，更新生成的 `pwa-assets.js`。控制器沿双方计划，音频任务不编辑页面适配器。
**Interfaces:** 绘本沿内容计划 `createNarrator({manifest,session,onStatus}) -> {play(kind,id,lang):Promise<void>,stop():void,available(kind,id,lang):boolean}`；实验室沿3D计划 `window.EarthquakeLabAudio.create({manifestUrl,contentVersion}) -> {play(kind,id,lang),available(kind,id,lang),stop(),dispose()}`。owner分别固定为book/lab，调用中的id是源条目的itemId，不是拼接后的manifest entry.id；按owner+kind+itemId+lang查询清单。只播ready且版本/hash契约通过的资源，页面显式用户操作调用，不跟随每帧状态自动播放。manifest URL版本由QA集成人统一，保持现有数字AUDIO_VER兼容或明确迁移测试，不散落手写旧?v值。

- [ ] 向两位接入方提供测试案例：`stop_cancels_audio_and_late_promise`（stop后迟到promise不得复播）、`language_change_stops_without_state_reset`（旧声停、模型语义态不变）、`stale_missing_failed_clip_not_playable`（available=false且无未知路径请求）、`rapid_play_latest_wins`（至多一个有效播放）。双方纳入各自计划的页面测试先红后绿；实验室运行 `node tests/qa_earthquake_lab_audio.cjs`，绘本采用内容计划已有音频/浏览器测试，不在音频任务另建第三套播放器单测。
- [ ] 两端控制器在调用play前取消持续输入/过期实验回调；适配器保存并停止真实Audio实例、清理监听，实验室dispose完成销毁，绘本由session生命周期清理。切卡/语种/失焦/pagehide停止旧声，返回页仍静音。不自动恢复加载或启动实验；UI暂停模型与停止朗读为明确独立行为。
- [ ] 资源枚举加入 book prompt/result 与 lab knowledge/prompt/result，纳入manifest-selected URL、版本/hash及缺件报告；先写漏类型/缺译/不一致hash/旧scene-vocab兼容测试，再修改共享发现器。原66配音不重建。
- [ ] 运行 `node tests/qa_earthquake_audio.cjs --base-url <local-url>`，清单驱动枚举全部中英文目标，真实页面触发、到ended、切语/快速切换/停止/无WebGL/减少动效；测试记录请求、解码、错误和匹配hash。内容候选未有音频时必须可读且不伪装正式点读。
- [ ] 运行 `python tools/gen_pwa_assets.py`、`python qa_pwa.py`、`python tools/qa_offline_manifest.py`（在批准基线核对现有CLI）；断言首版目标：绘本已存在的MP3进入绘本下载包；实验室MP3不进入首次安装shell，也不进入绘本包，独立列出文件/字节。实验室音频按需在线播放，由SW在取得成功的完整HTTP 200响应后回填缓存；206局部响应、失败或不完整响应不能作为完整离线录音。实验室核心资源缓存门槛不含按需MP3。当前生成器会把lab音频纳入shell是待QA修正的旧行为，不是新交付策略。
- [ ] 验证 `lab_audio_warmed_offline_replays`：按当前manifest逐条在线播放中英实验室录音，确认完整200响应已缓存且字节hash匹配，再断网逐条复播至ended，检查停止/切语不叠音。仅在线播放成功但未取得完整缓存不算预热完成。
- [ ] 验证 `lab_audio_unwarmed_offline_is_unavailable`：独立新安装测试上下文仅缓存实验室核心资源，不预热MP3，断网后点读显示可读的录音不可用提示，不假报可播放、不转设备TTS冒充正式录音；四卡核心交互仍可使用。新装离线与旧PWA升级均覆盖预热/未预热两类状态。用户仅下载绘本时仍完整可读可操作；实验室核心资源本身缺缓存则书内入口保持原章节并提示联网，不导航空白页。
- [ ] QA交付静态、在线本地浏览器、离线、真人听感、真机各自证据；没有真机或线上权限标未测。只有后续获得发布授权，才验证正式域名实际版本/hash及中英在线/离线播放；本计划不承诺已发布。

## 自审与交接门槛

已按 writing-plans 自审：spec音频范围→Task1；角色/自然度/授权→Task2；批量与复用→Task3；默认静音/生命周期/双语离线→Task4。类型与文件名统一，五项Review Focus均有具名测试；本轮未执行这些未来测试，未生成音频。

依赖顺序：用户一次联合审阅实施计划 → 各端可读无音频候选与内容冻结 → 必要新文本试听 → hash绑定正式批量许可 → 成品/页面/离线验收。角色样本认可与未来发布许可分开。

待联合计划审阅的细项为hash规则；内容源容器、两端播放器所有权与实验室音频目标缓存策略已对齐，不再列为未决。首版lab MP3排除首次shell，按需成功完整200响应回填缓存；未预热离线明确不可用，核心交互不受影响。Task4已列预热与未预热用例，均尚未执行。QA计划若仍列音频任务拥有额外播放器单测文件，应由QA按此分工同步，本文不修改其文件。此前向3D发信被权限审查阻止；随后已收到其单向合同同步。3D明确要求不跨线程回信，协调方可直接读本文核对；进一步跨线程发送需相应用户授权。所有旧dirty文件保持原样。

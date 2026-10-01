# Earthquake Picture Book Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task in the existing content task. Steps use checkbox (`- [ ]`) syntax for tracking. The established execution method is preserved: content, 3D, audio and QA work in their corresponding existing tasks; do not create replacement tasks or silently switch to subagent-driven execution.

**Goal:** 制作《地面为什么会摇？》中英双语故事绘本，交付两个可操作实验、可跳过布展与配套3D实验室入口，再接入正式配音并完成独立验收。

**Architecture:** 内容、纯模型、实验输入视图、朗读与路由分离。绘本固定逆断层加载和单波脉冲机制，状态独立于3D实验室；双方共享语义约定及深链接，不共享可变模拟状态。先交付无配音但能完整阅读操作的候选，再冻结内容、接入音频、交独立QA。

**Tech Stack:** 原生HTML/CSS/JavaScript、SVG教学层、WebP插画、JSON内容和音频清单；Node内置assert测试纯模型，项目既有真实Chrome测试工具由QA维护，Python现有PWA生成流程由QA负责。不增加前端框架。

**Spec:** [绘本已批设计](../specs/2026-10-01-earthquake-design.md)；[配套3D已批设计](../specs/2026-10-01-earthquake-3d-lab-design.md)。2026-10-01规划任务转达用户“确认，开始制作”；设计获批，本实施计划尚待合并审阅。设计文件中的旧“待审”标记不代表重新要求批准故事；执行前由文档所有者更新批准记录。

## Global Constraints

- 默认面向4–8岁、中英双语、Fun-CosyVoice3预生成配音；页数和音频数从实际内容导出，不套固定模板。
- 默认统一为向内挤压＋逆断层；书内无接触条件对照。接触条件对照仅3D实验室可选深看。
- 停止推动只停止驱动，暂停才冻结模型时间；不设真实预测倒计时、满格触发或按松手触发地震。
- 两个核心实验＋可跳过布展；答案不阻止阅读，无震级、建筑、海啸或灾难得分扩展。
- 默认静音，无震动音效需求；不以设备TTS冒充正式配音。无配音阶段不调用speechSynthesis。
- 触控目标至少44px；测试320/390/820/1024宽及短横屏；键盘、单步和减少动态效果路径保留完整观察证据。
- 仅允许lang=zh|en与from=earthquake-fault|earthquake-waves；不传任意returnUrl、模拟参数或进度。
- 当前仅编写计划，不创建／清理工作树、不生成产品或素材。计划获批后由QA确认基线和隔离目录；所有现有dirty内容保留。
- 未获提交权限前每个任务以本地diff和测试记录为检查点，不自动commit；本计划不授权push、PR、merge或发布。

## Review Focus

1. 按住途中失焦、pointercancel或语言切换：驱动必须停止，返回焦点不自行继续。由任务3输入测试覆盖。
2. 大时间步、低帧率或重复重播：不能跳过锁定证据、产生第二次事件或丢永久错位。由任务2模型和任务3重播测试覆盖。
3. 两旗等距、交换身份、播放中改位置：到达结果应跟位置而非字母，运行中不能偷改实验。由任务4覆盖。
4. 从深链直达、非法来源、切语后返回、lab未缓存：留在可读路径，不能跳任意地址或空页。由任务6与QA跨端测试覆盖。
5. 音频缺失／旧文本hash／迟到play回调：候选保持可读，正式验收失败，停止后不复播。由任务7覆盖。

## 工作区和文件所有权

相对路径均以QA最终确认的实施checkout为根，不默认当前主目录。当前主目录codex/cloud-journey有空间站等未提交修改，两份spec为未跟踪文件。执行前QA须明确：基线SHA、任务写入目录、spec/plan逐文件带入方法及共享文件所有权；不复制整个仓库、不reset、不清理已有worktree。本轮不做该准备操作。

| 所有者 | 文件与职责 |
| --- | --- |
| 内容任务 | `books/earthquake/story.json`、`SOURCES.md`、`storyboard.md`、`art-manifest.json`：唯一双语内容、科学来源、分镜、素材引用 |
| 内容任务 | `books/earthquake/index.html`、`earthquake.css`、`book.js`：独立入口、布局、章节装配 |
| 内容任务 | `books/earthquake/fault-model.js`、`wave-model.js`：无DOM、无音频的确定性状态；UMD同时供浏览器与Node require |
| 内容任务 | `books/earthquake/fault-view.js`、`wave-view.js`、`exhibit-view.js`、`session.js`：各实验渲染、输入、取消管理 |
| 内容任务 | `books/earthquake/audio.js`、`navigation.js`：本书清单播放、语言与深链适配，不改共享运行时 |
| 内容任务 | `books/earthquake/images/{arrival,exhibit,observation,opening,yan-yan}.webp`：前四张故事场景与透明角色素材；模型与标签由SVG/HTML承担 |
| 内容任务 | `tests/qa_earthquake_book_content.cjs`、`qa_earthquake_book_models.cjs`、`qa_earthquake_book_routes.cjs`：内容、模型、路由单测 |
| QA任务 | `tests/qa_earthquake_book_browser.cjs`、跨端/PWA专项、共享书架入口与`tools/story_resources.py`、PWA生成器及产物；内容任务只给接口和用例 |
| 音频任务 | `books/earthquake/audio-manifest.json`正式交付状态及`audio/`、`workbench/earthquake-audio-v1/`锁定／生成／测量资料；内容任务先建立空entries候选清单再移交其所有权 |
| 3D任务 | `labs/earthquake/`及其文档／测试；本任务只读核对，不互改 |

## Task 1 双语分镜与内容契约

**Files:** 创建`story.json`、`storyboard.md`、`SOURCES.md`和`tests/qa_earthquake_book_content.cjs`。

**Interfaces:** `story.json={bookId:'earthquake',scriptVersion:'earthquake-story-v1',title:{zh,en},scenes:[],vocab:[],interactions:[],ui:{}}`。scene为`{id,act,image,zh,en,narrationNeeded:true}`，vocab为`{id,zh,en,narrationNeeded:true}`，interaction为`{id,kind:'prompt'|'result',conceptId,zh,en,narrationNeeded:true}`；ui项为`{zh,en,narrationNeeded:false}`。全局条目标识使用kind/id，不以中文作键。`listNarration(story)`由测试侧导出预期键集合，不在模型中拼接文本。

- [ ] 写失败测试：bookId/version正确，kind/id唯一，中英非空，所有scene.image属于素材清单；有fault预测／locked／slipped／settled、wave预测／arrived-a／arrived-b／arrived-together／local-motion和exhibit提示语义条目；无预报倒计时和接触切换UI。缺语言、重复ID的fixture须抛错。
- [ ] 运行`node tests/qa_earthquake_book_content.cjs`，确认因缺内容文件或断言失败而红灯，不把路径／依赖错误当测试证据。
- [ ] 编写完整双语故事与分镜：接任务→观察变形→突滑错位→追踪振动→完成展览；每段写场景目的、证据、角色动作、可复用背景，维持独立岩岩角色。页段数量按内容决定。
- [ ] 将核心问题、固定结果与成人笔记纳入同一内容源；来源逐条关联科学主张，限制说明集中成人笔记。布展三卡顺序固定`strain,slip,waves`，允许跳过。
- [ ] 重跑内容测试，输出`EARTHQUAKE_CONTENT_PASS`；与3D只读核对conceptId、逆断层方向和同一语义，记录本地检查点，不生成音频。

## Task 2 固定断层与波的纯模型

**Files:** 创建`fault-model.js`、`wave-model.js`、`tests/qa_earthquake_book_models.cjs`。

**Interfaces:**

- `createFault(): FaultState`；`stepFault(state,{drive:boolean,dt:number}):FaultState`；`pauseFault(state,paused:boolean):FaultState`；`resetFault():FaultState`。状态字段：`phase:'initial'|'locked'|'slipping'|'settled'`、`time`、`driverDisplacement`、`elasticStrain`、`slipOffset`、`velocity`、`paused`、`eventCount:0|1`。函数返回新状态，不突变输入。
- `createWave({a:'left'|'center'|'right',b:...}):WaveState`，不同旗不能占同一落点；`stepWave(state,dt):WaveState`；`placeFlag(state,flag:'a'|'b',slot):WaveState`；`selectPoint(state,id:'near'|'far'):WaveState`。字段`phase:'ready'|'running'|'paused'|'done'`、`time`、`flags`、`arrivalTimes`、`arrived`、`selectedPoint`、`particleOffset`；`setWaveMode(state,phase)`仅接受ready→running、running↔paused、running→done合法转换。
- `FAULT_PROFILE`为冻结的归一化教学参数，无现实单位。采用弹性加载＋静／动摩擦滑块、阻尼和固定小步积分；锁定时保持slip不变，超承载条件才进入滑移，settled保留slip。参数选择记录于模型注释和测试fixture；不能从按键次数或绝对播放秒数触发。
- 波fixture：平面地表y=0、震源(0,-1)、落点left=(-1,0)、center=(0,0)、right=(1,0)，模型波速1；到达时间分别sqrt(2)、1、sqrt(2)。沿源到点方向的一次有限脉冲，脉冲长0.8模型时间，振幅上限0.03模型长度；不在波前前振动，脉冲后offset=0。无P/S切换。

- [ ] 写模型失败测试，包括以下精确断言（`assert`来自Node；数值容差是教学模型测试阈值，不是现实精度）：

```js
assert.equal(createFault().eventCount, 0);
assert.equal(stepFault(pauseFault(s, true), {drive:true, dt:0.1}).time, s.time);
assert.equal(stepFault(sBelowThreshold, {drive:false, dt:0.1}).eventCount, 0);
assert(settled.slipOffset > 0 && settled.eventCount === 1);
assert(Math.abs(result30.slipOffset-result120.slipOffset) < 1e-3);
assert.equal(w.arrivalTimes.a, 1); // a=center
assert(Math.abs(w.arrivalTimes.b-Math.sqrt(2)) < 1e-9); // b=left
assert.deepEqual(stepWave(wBeforeArrival, 0.01).particleOffset, {x:0,y:0});
```

- [ ] 运行`node tests/qa_earthquake_book_models.cjs`确认FAIL。
- [ ] 实现固定逆断层模型，并用记录的驱动轨迹证明locked时形变增长、松手不等于触发、首次事件有界收尾、slip永久保留。积分使用不大于1/240模型秒的小步；外部dt非有限或负数拒绝，单次dt大于0.1截断为0.1，失焦由控制器暂停，避免追赶后台时间。
- [ ] 实现上述波fixture和输入校验；phase非ready时placeFlag不改变状态，重复落点拒绝；选点仅改selectedPoint，不能改波前。等距left/right必须同时到达，交换a/b必须交换结果。
- [ ] 重跑测试输出`EARTHQUAKE_MODELS_PASS`；保存不同dt驱动下的误差和能量／位移检查证据。若固定参数不能解释锁定—突滑—收尾，停在模型层修正，不能用定时动画伪造通过。
- [ ] 与3D核对逆断层位移方向、状态语义和波源位置，双方参数可因展示尺度不同而不同，但机制与结论必须相容；保留本地diff检查点。

## Task 3 页面框架与断层操作闭环

**Files:** 创建`index.html`、`earthquake.css`、`book.js`、`session.js`、`fault-view.js`；QA创建`tests/qa_earthquake_book_browser.cjs`的fault用例。

**Interfaces:** `createSession():{epoch, cancel(reason), schedule(fn,ms), onCancel(fn)}`管理计时和输入取消；`mountFault(container,{content,lang,session}):{render(),cancel(),destroy(),snapshot()}`只消费任务2模型。`book.js`创建`#fault-lab`、`#wave-lab`、`#exhibit-lab`和全局`#stop`、`#language`，切语保留语义状态但暂停，导航离开取消。

- [ ] QA先写失败浏览器用例`fault_input_cancel`：pointerdown加载、pointerup只停驱动、pointercancel／blur／切语后驱动为false；再次focus不恢复。键盘短按与“推一小步”驱动增量相同。
- [ ] 运行`node tests/qa_earthquake_book_browser.cjs --case fault`确认FAIL。
- [ ] 实现最小故事壳和SVG剖面，不生成装饰素材；主按钮长按固定速度加载，单步提供等价输入，Pointer Events不能阻止纵向阅读。状态与文字取模型和内容ID。
- [ ] 实现暂停／继续、逐步观察、同条件重试、慢放重看：重放记录快照期间禁用加载，慢放不重新求随机结果；到settled自动停止新加载，无无限抖动。`snapshot()`只读返回模型与driverActive/replayActive供测试。
- [ ] 增加`fault_replay_cancel`、`fault_permanent_offset`：快速点击重播和切语不叠调度；重试恢复初态但永久错位不会在普通收尾时消失。
- [ ] 重跑fault用例输出PASS，保存窄屏主图／操作／结果同屏截图；布局不把面板盖住角色占位区。此阶段标题明确为无配音候选，不显示可点击假朗读按钮。

## Task 4 波追踪与布展闭环

**Files:** 创建`wave-view.js`、`exhibit-view.js`；扩展同一浏览器专项。

**Interfaces:** `mountWave(container,{content,lang,session})`与`mountExhibit(...)`均返回`{render,cancel,destroy,snapshot}`。波视图消费任务2接口；布展状态为`order:string[]`、`previewCard:null|'strain'|'slip'|'waves'`、`assisted:boolean`，三卡动画共享取消epoch但不共享物理状态。

- [ ] 先写失败用例`flags_equal_distance`、`flags_swapped`、`flags_locked_while_playing`、`particle_stays_local`；预测选项不能改变任何arrivalTimes。
- [ ] 运行`node tests/qa_earthquake_book_browser.cjs --case waves`确认FAIL。
- [ ] 实现先选旗再点固定落点、默认一近一远、“一起／先看看”、到达持久标记、两个地下追踪点以及暂停／下一小步。提供按钮替代拖动，第一版不依赖拖放增强。
- [ ] 写失败用例`exhibit_retry_skip`：错误顺序提供具体线索、允许修改；跳过直接进入完整结尾；一次最多一张卡播放。
- [ ] 实现三卡点选入位、前移／后移、单卡短动作与“请岩岩帮忙”；不评分、不锁阅读，不用排序正确率声称理解。
- [ ] 执行`--case waves`和`--case exhibit`，均PASS；减少动态效果模式使用同一模型关键帧，不把证据删成纯文字。

## Task 5 插画制作与无配音候选验收

**Files:** 创建`art-manifest.json`、前述`images/*.webp`；完善`storyboard.md`及`earthquake.css`。原始图与提示词放`workbench/earthquake-art-v1/`，不进发布目录。

**Interfaces:** art-manifest每项`{id,path,sourceFile,prompt,referenceIds,alphaRequired,reviewed}`，scene.image映射到明确WebP文件；实验几何保持SVG而非生图内烤入。

- [ ] 增加内容测试：每个场景引用唯一已存在素材；yan-yan需要RGBA且透明背景确有alpha=0；所有教学标签仍可在DOM切语。
- [ ] 执行内容测试确认缺素材的FAIL。
- [ ] 按当前imagegen技能生成岩岩参考与四个叙事场景，再生成透明角色素材；提供已有角色参考，保持馆内空间和外观一致。逐图目视检查肢体、地下／地表关系、无灾难恐吓，必要时定向修图；编码保留alpha。
- [ ] 接入真实素材并在手机／桌面复查，不在背景上直接堆叠遮挡式面板。实验主图继续采用可验证的矢量结构，故事底图不承担断层几何正确性的证据。
- [ ] QA运行全部内容／模型／浏览器用例及320/390/820/1024宽、844×390横屏、双语、键盘、减少动态效果；主操作和结果可同时观察，按钮≥44px，无横向溢出。截图与未测真机边界分开记录。
- [ ] 交付“无配音可体验候选”，允许完整阅读和实验；记录需要修正的文案，不生成正式音频。候选评审通过后任务7才冻结文本。

## Task 6 书与实验室导航契约

**Files:** 创建`navigation.js`、`tests/qa_earthquake_book_routes.cjs`；修改本书`book.js`。共享缓存能力／实验室入口由QA负责，本任务不修改共享文件。

**Interfaces:** `parseBookLocation(search,hash):{lang:'zh'|'en',chapter:'fault-lab'|'wave-lab'|null}`；`buildLabHref(chapter,lang):string`仅生成设计白名单；`canEnterLab({online,cached:boolean|null}):boolean`在离线且cached不是true时返回false。缓存状态由QA提供只读适配器；未知按不可用处理，不猜测“已缓存”。

- [ ] 写失败路由测试，精确断言fault中文得到`../../labs/earthquake/index.html?lang=zh&from=earthquake-fault#elastic-rebound`，waves英文得到对应`lang=en&from=earthquake-waves#waves`；注入returnUrl或非法from不会影响输出。
- [ ] 运行`node tests/qa_earthquake_book_routes.cjs`确认FAIL。
- [ ] 实现两个可选入口、当前语言输出与导航前cancel；离线未缓存时留当前书页，显示“联网后可进入实验室”，保留继续阅读。由QA接入可用性适配器后再标入口ready，不把navigator.onLine当缓存证明。
- [ ] 重跑路由测试输出`EARTHQUAKE_ROUTES_PASS`。
- [ ] 与3D/QA在集成checkout验证：无来源实验室返书开头；切卡不改来源；实验室切成英文后回原章节英文；非法值回默认；返书模型暂停／重置无自动声音；只缓存绘本仍完整阅读操作。

## Task 7 内容冻结与正式配音接入

**Files:** 创建本书`audio.js`、候选`audio-manifest.json`；移交音频任务维护正式清单、`audio/`及生成锁。扩展内容／浏览器音频测试；QA扩展发现器，不由内容任务私改。

**Interfaces:** 预期文件`audio/{kind}-{id}-{lang}.mp3`，kind仅scene/vocab/prompt/result。统一使用音频计划 schemaVersion:2：顶层为`{schemaVersion:2,topicId:'earthquake',owner:'book',contentVersion,sourceSha256,bookId,scriptVersion,scriptSha256,entries}`；entry为`{id,itemId,kind,lang,text,segments,contentVersion,textSha256,utteranceSha256,output,status,fileSha256}`，状态pending/ready/stale。hash按音频计划的NFC、CRLF→LF和固定角色分段JSON规则生成，不另设contentHash。候选与正式manifest均由音频任务生成，本任务不写假hash或成品路径。

`createNarrator({manifest,session,onStatus}):{play(kind,id,lang):Promise<void>,stop():void,available(kind,id,lang):boolean}`。未生成清单时manifest可为null，候选明确无正式配音，available始终false。音频任务生成的pending/stale条目不可播放；正式ready必须与所有narrationNeeded条目中英文本逐项一致且具备真实文件hash。不存在条目不请求未知路径。

- [ ] 写失败测试`missing_audio_readable`、`manifest_text_hash_mismatch`、`late_play_after_stop`：缺音仍可读、正式验收拒绝旧文本、停止后迟到回调不复播；交互提示只在显式“听这句”激活。
- [ ] 执行内容与音频浏览器用例确认FAIL。
- [ ] 候选评审修订完成后导出稳定条目和文本hash，交音频任务按Fun-CosyVoice3流程试听、锁定并生成；故事角色、参考音频及其来源由该任务核查。本任务不代用设备TTS、不擅自改已批准字节。
- [ ] 实现manifest驱动播放器：播放前session.cancel旧互动，stop/lang/pagehide取消旧音频和Promise回调；播放失败给一次可读提示，可用户重试，不循环降级。
- [ ] 接入音频交付，只改绑定与清单版本，不借接入改文案；如必须改文案，重新标pending并通知音频，重新冻结受影响条目。
- [ ] QA验证所有实际条目中英在线和离线到ended、文本／文件hash一致、朗读与实验互斥、缺失／解码失败、快速切语和离页；输出实际总数而非预设数字。自然度确认与技术解码分别记录。

## Task 8 独立集成验收与交付

**Files:** 内容只补`docs/qa/earthquake-book-handoff.md`；QA拥有书架／实验室目录、共享发现器、`pwa-assets.js`、`sw.js`及最终测试报告。

**Interfaces:** 交付表含内容版本/hash、素材清单、音频锁、模型fixture与测试结果、两端路由、已知限制；共享集成不能覆写空间站或声音／肥皂未完改动。

- [ ] QA先写共享失败用例：prompt/result也被发现；候选pending不冒充完整音频包；正式ready缺一个双语文件即失败；旧scene/vocab绘本发现保持不变。
- [ ] 在QA确认checkout完成入口和PWA集成后，内容任务只读核对实际入口加载了新文件、无伪ready页面。
- [ ] 执行`node tests/qa_earthquake_book_content.cjs`、`node tests/qa_earthquake_book_models.cjs`、`node tests/qa_earthquake_book_routes.cjs`；QA执行完整`node tests/qa_earthquake_book_browser.cjs`以及其计划约定的PWA/跨端回归，全部PASS后才交付正式本地候选。
- [ ] QA分别记录新装离线与旧安装升级，验证绘本完整资源、实验室未缓存降级和其他书资源保留。未经实际验证不得写“真机／儿童测试通过”。
- [ ] 在交付报告列出实际执行命令、结果、截图、未测项及本地预览；各所有者审阅diff确认没有混入无关文件。无发布授权时停止在本地交付，不自动提交、推送或上线。

## 依赖顺序与自审结果

执行顺序：QA确认工作区 → 任务1内容 → 任务2模型 → 任务3/4交互 → 任务5无配音候选 → 任务6跨端对接 → 任务7冻结/音频 → 任务8独立验收。任务6可在3D入口就绪前先做纯路由测试，但不能提前宣称跨端通过；音频生成不得越过任务5内容评审。

自审：设计中的故事、两实验、布展、科学边界、同屏、键盘／减少动效、正式音频、双向链接和离线均有任务承接；Review Focus五项已对应任务2/3/4/6/7测试。模型状态签名与视图消费者一致，正文不保留接触条件开关。尚待协调的缓存适配器和正式音频schema由其所有者确认后写入同一计划，不在执行时临时猜测；未确认前相应接入任务不启动。

本文件是待用户审阅的实施计划，不是已执行结果。由规划任务与3D、音频、QA计划合并说明后一次征求计划确认，保持现有任务分工，不重复征求故事设计批准。

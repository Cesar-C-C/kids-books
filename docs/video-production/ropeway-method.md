# 内容驱动的 3D 科普视频制作方法

此方法来自会话「了解视频生成能力」（`01a10132-c939-74b0-be26-1d0a78d6bd0c`）的《索道小探险》v5，不来自本站旧 Remotion 短篇。2026-10-04 本地迁移；不改全局技能、记忆、钩子或模型设置。

## 成果与使用入口

完整片为 597.5 秒、35 场景、104 组双语字幕。网页入口 `animations/ropeway-adventure/index.html`；栏目仅展示完整片；经用户授权，旧 Remotion 短篇与专属运行包已退役。原源码仅作可恢复技术历史，不进入运行/发布清单。原始 `source.zip` 有 82 个文件；其中包括参数化建模、动作、镜头投影标注、配音母版、三处语音修订、生成与验证脚本、双语播放器模板。源清单与逐字节接收记录在 `video-production/ropeway-v5/source-manifest.json` 和 `generation-lock.json`。不要把源包、帧缓存、模型依赖或巨型内嵌 HTML 加入默认 PWA 外壳。

复用起点是 `video-production/templates/science-film.json` 与 `tools/science_video.py`。它们是可编辑的制作计划与只读预检入口，不是批量制造相同视觉模板的生成器。原始 Blender 项目保留在源码包里；展开后按原目录运行。

## 三条真正的设计约束

源会话后来完成的 [32项复盘迁移索引](retrospective.md) 已逐条读入；原快照 hash、跨版本证据路径与未完成边界另列，避免把旧左栏方案或缓存键建议误当已实现规范。

1. 形式为内容服务。每个问题决定镜头、剖面、动作和视觉标记，不套固定「一段旁白一张知识卡」。不要以固定左栏减少重叠作为成功：用户明确要求文字在视频主体内部，不要左边专用文字区。
2. 视频必须展示变化。长时间静止一幅图讲解不是合格的视频。运动需揭示机制或观察关系：轨道先接住、抱索器再松开、轮胎减速、出站再夹紧。必要时短暂给儿童思考；不要用无意义摇镜头代替动作。
3. 字幕完整，额外标记克制。旁白全文在稳定双语字幕带；画面标记只帮助辨认真实部件、方向、承载路径、机械状态或答题选择。模型边界和家长说明放片尾/折叠补充，不在故事正文反复提醒。

## 制作闭环

### 1. 科学范围与证据

先说明年龄、主问题、具体系统及不解释的边界。逐条建立 claim → 第一方来源 → 场景/句子对应表。保存来源 URL、访问日期、摘录页码/定位、事实与编者归纳的区别。索道片不是通用操作指南：单线循环脱挂式为主；中间站两独立绳环只是所展示的设计，设备、风速和救援由具体运营方决定。源 `full-timing.json` 的 S1–S13 及中间站资料是已有来源映射，不因迁移就宣称重新逐页查证。

### 2. 问题驱动分镜与真实因果

先列「儿童看什么变化，才能回答什么问题」，再写双语旁白。模型必须有可追踪的载荷/动力连接和状态：吊厢—吊杆—抱索器—钢丝绳—支架/车站—地面。轨道接住之前不能脱挂，站外不能松开；停机后仍有支撑；制动垫有真实间隙和真实接触，而不只是标注文字变化。

先做一个短关键动作 proof（例如 6–12 秒的接住→松开），检查始/中/末姿态、连接、运动方向、接触和镜头；通过后才整片渲染。本站接收现成 v5，**没有重新执行此 proof 或整片重建**。

### 3. 参数化模型、动作与相机

原始链：`ropeway_scene.py` → `film_models.py`（共用资产、部件组、装配）→ `enhance.py` / `overview.py` / `intermediate.py` → `motion.py`（叙事动作、连体关节）→ `render_baseline.py` / `render_animation.py`。模型/人物复用真正的共享结构；隐藏模型的所有子对象和新加枢轴都要跟随组可见性，避免车站闪现或隐藏吊厢残留。母版 `.blend` 不代替源脚本与参数。

镜头围绕当前问题靠近部件、切开外壳、展示内部连接；保留方向和空间连续性。画面标记调用与 Blender 同一套相机投影：世界坐标 → 当前相机 → 屏幕像素。源 `annotations.py` 用 `sXX-anchors.json` 做误差检查（选定场景 < 0.025 px），不凭静态截图坐标贴箭头。承载箭头与牵引箭头方向不同；承载路径亮点是追踪标记，不冒充实测力矢量；速度箭头只表达相对关系，不冒充测速。

### 4. 冻结配音、再建立唯一时间轴

现有音频负责人已完成只读审阅，原样 [配音方法与历史限制](audio/audio-method.md)、[独立回执](audio/receipt.json) 和待填 [记录模板](../../video-production/templates/narration-record.template.json)/[Schema](../../video-production/templates/narration-record.schema.json) 都在本站。中文 zero-shot 精确参考文本与英文 transcript-free cross-lingual 分开；字幕显示窗和实际音频替换窗也分开。接入模块不产生新声音，不把占位模板当冻结成品。

配音交给现有音频负责人，不在内容会话自行批量生成。固定文本 ID、文字 hash、参考 WAV 来源/授权/精确转录/hash、Fun-CosyVoice 版本/设备/精度/参数、逐条实际时长及候选选择。源 v5 中文采用 Fun-CosyVoice3-0.5B、CUDA FP32，参考记录在 `zh-reference-provenance.json`；该官方示例参考的许可信息必须在新作品中重新审查，不能把模型许可等同于任意声音授权。

实测最终音频建立 beat `start/end`，再排思考间隔和镜头；统一到 24fps 输出帧边界。两种语言共享同一画面时间轴，由已有完整母版提供配音。不能用估计语速驱动成片，不能为隐藏同步问题改变正常播放速度。模板中 null 音频 hash 代表待交付，预检标 `NOT_READY`，绝不生成假音频。

局部修订的可复用经验：v5 修订「行走轮」「不故意」连读及「如果担心」。第一遍「不故意」仍有停顿，未采用；带「我们」语境的候选经波形/词边界裁掉前缀，最终交付不含前缀。第二句约 1.037 倍保调变速、RMS 匹配和峰值约 0.84，仍落原槽位。ASR/词间隔检查不能替代人工试听。改译文同时改配音和字幕；只换一段音频不等于整轨编码后窗外样本逐字节相同。

### 5. 标注与编码

源 `annotations.py` 手工选择标记时窗与用途；按当前机械状态出现「轨道接住」「抱索器松开」「间隙」「压紧」，不是整句旁白再抄一遍。字幕安全区 y=925..1069（1920×1080），其他文字不能进入字幕带；逐场景检查字体大小、最长中英句、箭头终点和部件遮挡。源 `compose_film.py` 通过 Pillow 字宽检查生成 ASS，再用 FFmpeg 合成。

固定源参数：Blender 5.2；Python 3.11+、NumPy/Pillow；EEVEE；关键机制原生 24fps；14 个解释场景采用 8fps 渲染，部分原图 1280×720 后运动补帧到 1920×1080/24fps。`render_project.py` baseline width=1280/samples=16，animation width=1280/samples=8，4 线程、factory-startup/OpenGL。FFmpeg `libx264 -preset fast -crf 19 -pix_fmt yuv420p`，`minterpolate=fps=24:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1`，ASS 合成；AAC 母版音轨复用、最终 mux `-c copy -movflags +faststart`。容器 24fps 不能证明全片原生 24fps；源低分辨率不能因标注在 1080p 合成就改称原生 1080p。

### 6. 可复现命令与环境预检

本站只读预检（不生成帧、不合成、不写报告文件）：

```powershell
python tools/science_video.py --template video-production/templates/science-film.json --source-zip video-production/ropeway-v5/source.zip --source-lock video-production/ropeway-v5/generation-lock.json
```

把 source.zip 解压到新的专用构建目录，保留 `work/ropeway-3d-v5/` 与 `work/bilingual-player-template.html` 结构。以下是**未来获得渲染授权后**的命令，本轮 NOT_RUN：

```powershell
$env:ROPEWAY_FFPROBE = 'C:/path/to/ffprobe.exe'
python work/ropeway-3d-v5/render_project.py --blender 'C:/Program Files/Blender Foundation/Blender 5.2/blender.exe' --ffmpeg 'C:/path/to/ffmpeg.exe'
```

不要照抄「完全跨平台可复现」：源 compose 的默认 FFmpeg/FFprobe 位于旧 `work/video-tools/node_modules/@ff*-installer/win32-x64/`；入口只设 `ROPEWAY_FFMPEG`，须另设 FFprobe。源 Pillow 字体硬编码 `C:/Windows/Fonts/msyh.ttc` / `segoeui.ttf`，ASS 用 Microsoft YaHei/Segoe UI；跨平台需要显式字体参数与实际排版重验，不能悄悄替换字体。新作品需记录 `blender --version`、`ffmpeg -version/-filters`、`ffprobe -version`、Python/NumPy/Pillow版本和字体 SHA。库、字体和硬件不同的结果不得宣称字节相同。

### 7. 检查点与失效策略

每个镜头缓存键至少绑定：模型/动作/相机源码 SHA、冻结文字/实际音频 SHA、时间窗、尺寸、原生 fps、samples、字体、工具版本。只按帧数或现有文件名复用不够。源 `compose_film.py` 的优先级是新 `B/scene-frames/sid` → v4 特定场景 → v2；若 v4/background 存在且新 scene-frames 不存在，会整段复用旧背景。这是已有单机增量优化，不是新项目的默认正确性保证。

新项目使用新构建目录；先完整生成当前 B 下场景帧/进度，禁止落到同机旧缓存。模型/运动/镜头变：该镜头帧、anchors、运动 QA、背景、ASS标记、成片全部失效；字幕/标注变：ASS、layout 与合成区间失效，不必重建无关模型；配音变：原槽位内验证或重排受影响后续时间轴，再失效对应标签/字幕/编码；播放器变：不重编码，但重跑原生媒体生命周期/双语/离线测试。旧版本和失败候选不可覆盖。源 reencode-GOP 与 AAC 窗口修订方法保留为范例，先证明边界完整，不泛化承诺所有容器字节不变。

### 8. 发布之前的证据阶梯

本地 HTTP 预览必须支持 MP4/AAC 的 Range 请求。简单 `python -m http.server` 在此次原生 AAC 测试中使 Chrome seekable 为 0–0，不能证明拖动/双语对齐能力。使用 `node tools/serve_science_videos.cjs 63543`，再运行 `node tests/test_ropeway_film.cjs`；服务器提供完整 GET 的 200 和合法单区间的 206，媒体原字节不变。发布服务器也要验证实际 Range/Content-Length/MIME，不用本地通过代替部署证据。

`checklist.md` 把几何、运动、标注、语音、编码、浏览器、离线和独立 QA 分开。原生播放器：英文取 browser.mp4 内置音轨，中文取独立 narration-zh.m4a，同时屏蔽英文；暂停/seek/waiting/结束停止中文，语言切换保持位置，晚到 play Promise 不得唤回旧音轨。

当前媒体 SHA 以 generation-lock 为准：browser.mp4 `5b5b15a14213…` / 119,325,620 B；中文 AAC `165cf06d7bce…` / 6,963,011 B。**不要用普通话默认的双音轨 full MP4 再叠加中文 AAC。** 网页只载小型外壳；点击播放后取精确 `?v=<sha前12位>` 媒体，离线需显式下载自包含 HTML。推荐“项目适配离线版 v3”；原始 HTML 另作未经修改的来源归档，两者不能冒用同一文件身份或验收结论。文件较大，未来发布须另行确认托管限制；本轮没有上传、转码、R2/SaaS 迁移或规避限制。

作者测试不是独立验收。源全解码/17项播放器报告是源侧历史证据，不替代本站实际集成后的浏览器测试；ASR不是自然度验收、手机视口不是实体设备、本站旧基线 PWA 生成不是最新主线集成发布。交付收据明确哪些 PASS、NOT_RUN 或待接收主线 QA。

### 9. 下载后的播放器也须实测，不只验证打开与媒体 hash

2026-10-05 独立 QA 在原始自包含 HTML 观察到可信 touchStart→touchMove→touchCancel 后 `dragging` 未清，视频/声音继续但进度条停旧值；语言按钮 40px、章节 42px 也未达项目 44px 合同。本站另做项目适配离线版，先加取消/丢失捕获/焦点丢失后的拖动清理与更新、44px 高度和焦点描边，再针对下述密集定位失败加入必要的原生协调与有界恢复。原始 HTML 仍原字节归档，视频/AAC/poster 三个嵌入 payload 与原件逐 SHA 等价，SRT/MP4/ZIP 不动。

复验须在全新浏览器中断网，使用 CDP 真实触摸输入并确认 `isTrusted`，不能用 dispatchEvent 冒充取消。前后同一用例检查播放中/暂停中的取消、进度投影恢复、已结束边界、原生无延时密集键盘、语言快切和同页继续播放；分别测桌面、390px 手机、平板、减少动态效果配置的所有语言/章节触控目标及 Tab 可见焦点。保留原版 FAIL 与适配版作者结果，后者仍不是独立签收。

本轮回归还在原版和初次适配版发现了密集定位后的原生 seeking/按钮准备状态超时。独立 F03 的四个 fresh 原版上下文有三次失败，发生于暂停或播放密集段，不把它统称为恢复播放失败。先保存各次失败，不能通过首次加载多等一会儿或放慢键盘抹掉；也不据此武断归因 Chrome、AAC 或画面内容。

最终派生版仍用原生 video/audio，最多一个视频定位在途。每次原生输入立即更新逻辑目标；相对键盘累加在最新目标上，不丢重复输入。原生 seeked 后提交当前最新目标，最后通过实际媒体钟和 requestVideoFrameCallback 帧时间核对；不是固定延迟 debounce 或禁键盘。定位时保留用户播放/暂停意图，停旁白，视频及中文 AAC 就绪后才能继续；旧代播放 Promise 不得暂停或唤回新代声音。等待上限10秒，须有中英可见反馈、手动重新加载/停止等待，不无界自动重载。首次加载、readyState4 等待、AAC 守卫和仅暂停定位的失败尝试也留档，不冒充最终PASS。

派生源码在 `video-production/offline/ropeway-offline-player-v2.js`；新空目录接收原始文件后可运行 `node tools/build_ropeway_offline_v2.mjs --fresh-final`，只构建适配HTML，不渲染或转码。该入口拒绝覆盖已有产物；旧参数仅为本轮保留的候选演进证据，不是复用制作步骤。生产媒体、来源原件和新派生版 hash 分开冻结，独立QA仍须重新签收。
## 10. v3 全屏修复与精确退役

独立 v2 QA 在真实 HTTP `Permissions-Policy: fullscreen=()` 下发现：原生全屏被拒绝后进入 CSS fallback，按钮保有焦点，Escape 却被焦点控件 early-return 挡住。v3 仅把 fallback 中的 Escape 处理移到该返回前；其余 range/select/button/link/summary 的原生键盘行为不变。站内与自包含文件分别验证，v2 原件与 NO-GO 回执保持原字节。

生产派生源码为 `video-production/offline/ropeway-offline-player-v3.js`；`node tools/build_ropeway_offline_v3.mjs` 从已封存的 v2 构建独立 v3 文件，拒绝覆盖已有产物。三份内嵌媒体 payload、MP4/AAC/SRT/ZIP、时长与字幕内容均不改。v2 构建入口和产物是历史证据，不是当前推荐下载。

旧短篇的 37 项逐文件删除白名单及 raw SHA/bytes 恢复映射在 `workbench/ropeway-film-integration-v3/before.json`；原件副本在其 `raw-before/`，源码副本在 `technical-history/`。目录页和完整片去掉旧短篇链接；独立 film inventory 不再依赖 Remotion build。`animations/retired.json` 是精确退役表，SW 只删除这 37 个同源路径（含旧 query 和目录别名）的缓存项并返回 410，禁止再次下载；不全清下载缓存，不改其他绘本、实验室、删除状态或 localStorage。接收主线须重新生成 PWA 清单和 SW import 并独立验证普通关闭/重开升级，作者 fixture 不代替该签收。

# 月相最终本地候选：配音与完整离线验收

结果：Fun-CosyVoice v3 batch-r2 正式 40 条中英配音已接入；用户试听通过；独立本地技术验收通过。**没有 commit、push、合并或发布。**

## 精确候选

- 工作区：`C:/Users/Cesar/Documents/ChatGPT/儿童绘本开发/.worktrees/moon-diary`，分支 `codex/moon-diary`。
- Git HEAD 保持 `5cfb30f91a986d5c537680b9f072740c87221dc8`；候选仍为本地未提交改动。
- 文本 `moon-story-v1`；月相音频 `AUDIO_VER=1`；PWA 指纹 `562723b37a6b`。
- 月相离线包 53 项，约 5.7 MiB：13 项图文/互动/入口/JSON + 40 MP3。`complete=true`、`missingAudio=[]`，用户下载全部资源后才显示已存好。
- 正文 28 条 + 词汇 12 条，中文/英文各 20；音频合计 390.74 秒、2,724,624 字节。采用 v3 恢复旧绘本的 instruct2 温柔女声配置，不是 v2，也不是 Kokoro。
- 首次正式音频沿用预先冻结的 `?v=1` URL；此前正式目录为空，只有不缓存的失败请求和 workbench 候选，没有覆盖已交付 v1 成品，因此无需为此次首次增加文件改动阅读器版本。若日后替换音频字节，需更新音频版本、清单并重验。

| 文件或记录 | SHA256 |
| --- | --- |
| story.json | a4936f906d0d1216050daf3285d27359a7561f852c94065532971cdd587efcee |
| audio-manifest.json | 6a03d4283f12e6fdba0c49819d25b810ee9849416b84153847670172806dd017 |
| moon-experience.js | 8005edef0a1b2bbc7abccb7328d51f1c03642bcfa2f3aa634c7bc56c769377c2 |
| batch-r2/delivery-validation.json | e0f6125df96b505b22917ac7f48599ba9b5c8316fb4a8c54dfd545b8facdbd56 |
| batch-r2/config.json | 46848d50fca3f6adc8abf3be56cbbe1b5def32d7772c9b7d94cd9c93275922a4 |

音频工作台根目录为 `workbench/moon-audio-v1/cosyvoice-v3`。40 个独立成品哈希见 delivery-validation.json 与本轮 `.qa-labs/moon-audio-offline/delivery-audit.json`，不只依赖数量判断齐全。

## 用户试听与机器验证分开记录

`batch-r2/user-approval.json` 记录用户“试听通过。”，范围为 listen-all.html 中本批 40 条，绑定上表交付清单与配置文件 hash。本轮再次核对批准记录及正式 40 个文件确实对应这批字节，因此该版本的**用户试听状态为通过**，不再列为用户未验收。

这不是代理独立人耳鉴定，也不构成发布授权；任何后续音频字节更改不自动继承该批准。旧 v2/Kokoro 报告与历史“未试听”记录不覆盖本批批准。

## 独立技术证据

### 文件、源文与分段

`tests/qa_moon_audio_delivery.py` 使用已安装 Python 3.10 运行，exit 0；不加载模型、不重新生成或推广音频。

- 独立核对 40 个正式 MP3 的精确文件集合、逐条 hash，与 staging 和 delivery 清单一致。
- 80 个 staging WAV/MP3 独立解码：24kHz mono、全有限值、RMS > 0.001、时长匹配；正式 MP3 与对应已解码 staging 字节完全一致。
- 40 段冻结原文和文本 hash 对齐；实际 segments 的 spokenText 拼接与原文去除引号后的内容逐字一致，保留换行。仅 scene-ball-zh 的“背着灯”替换为 `[b][èi]着灯`。每个分段 WAV hash 与记录匹配。
- keep-zh 正式 MP3 与用户 v3 小样字节相同；生成器/辅助代码和两种语言参考录音 hash 与冻结配置匹配。未重新下载或复核全部大模型权重。
- story、manifest、runtime 三个文件与此前冻结 hash 均相同。

### 40 在线 + 40 完整下载后断网

`node tests/qa_moon_audio_offline.cjs` exit 0。真实本地 HTTP、Chrome、Service Worker、阅读器按钮、原生 HTMLAudio；wrapper 只观察真实实例，不用伪造 Audio 或设备语音替代。

- 在线独立浏览器上下文禁用 SW，40 个实际场景/词汇按钮逐个播放到原生 `ended`。4 倍速、未 seek，duration/末尾播放位置均断言成功。
- 另一全新上下文安装模拟旧 13 项图文 partial 清单并缓存该包，再切换到实际当前清单；升级后只保留原有 13 项，UI 不误认 13/53 为完成，下载按钮允许补齐 40 MP3。
- 完整下载后逐条读取 Cache Storage，40 个音频缓存 SHA256 均与正式文件一致。注入错误 `?v=0` 缓存后，当前 `?v=1` 仍准确命中。
- 关闭浏览器网络，同时服务器拒绝音频，再重新导航阅读器，40 个实际按钮分别播放到 `ended`，未跳播。服务器收到的断网阶段音频请求为 0，设备朗读回退为 0，媒体错误/页面 JS 错误为 0。
- 两种模式均检查停止、切语言、翻相册会暂停真实旧音频。技术加速播放不代替用户正常速度试听；用户批准另有独立记录。

证据：`.qa-labs/moon-audio-offline/playback-report.json`，含 80 次逐条 URL、时长、终点、错误/回退、缓存 hash 及 partial 升级前后数量；截图 `old-partial.png`、`complete-download.png`。

### 删除、重下载与旧书

`node tests/qa_moon_offline.cjs` exit 0：真实 SW 旧书目升级保留飞机离线包；月相下载后断网重载书架、封面、正文及七图、语言/相册/月相交互通过；旧 asset JSON 不覆盖新 shell；旧飞机原生 MP3 仍可断网播放。

月相包删除后缓存计数为 0，飞机包缓存完整保留；联网重新下载后 53/53 齐全、40 音频缓存 hash 全部恢复；再次断网，中英 gift 两条原生音频播放到 ended。

证据：`.qa-labs/moon-offline/report.json`（资源 HTTP 状态与重下载音频 hash）。近视/蛀牙旧书 16 段 × 在线/断网共 32 次原生播放回归通过，证据已复制到 `.qa-labs/moon-audio-offline/health-regression.json`；测试自动刷新的旧历史证据文件已只还原本轮改动，未混入交付。

### 其余回归

- PWA 静态检查 6 项、0 警告/失败；离线资源对齐 16 本，月相 missing 0/40。
- Python 单元测试 8 项；PWA Node 回归 2 项。
- 月相 model 73 轮廓/40映射、geometry 84,666 独立采样；content 28 段 DOM 原文/40按钮路由；interactions 10 组；browser 五宽 320/390/820/1024/1280 双语与交互；全部通过。content/interactions 的音频 mock 仅证明其专项合同，真正声音证据来自上述原生测试。
- 旧 14 本共享阅读器 books/runtime、健康书布局与近视/蛀牙模型通过；脚本语法与 git diff --check 通过。
- 新全量离线声音测试已加入 PWA workflow；本轮仅本地执行，未声称远端 CI 或线上部署通过。

## 剩余边界

本地候选已可审阅；未验证真实手机/平板硬件、生产站点/CDN 或部署环境。参考录音归属/使用条件沿用音频任务的记录，本轮没有新增法律权利清理结论；中文 bundled reference 尤其不能把本地复用视作所有用途授权。用户试听通过不改变这些边界。

后续发布必须另获授权并按发布范围复核实际线上入口、缓存和声音；当前未提交、推送、合并或发布任何月相内容。

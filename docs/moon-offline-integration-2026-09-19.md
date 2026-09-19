# 月相绘本本地书架与离线图文集成

> 后续状态：40 条 v3 batch-r2 正式配音已交付并获用户“试听通过”确认，在线 40/40 和下载后断网 40/40 全段技术播放已通过。最新候选指纹 `562723b37a6b`；请以 `moon-final-audio-offline-2026-09-19.md` 为当前结论。下文保留此前图文阶段证据，“待交付”不是当前状态。

结论：本地非音频接入及浏览器断网回归通过。正式音频 **40/40 待交付**；未提交、推送、合并或发布。

## 范围与版本

- 工作区 `.worktrees/moon-diary`，分支 `codex/moon-diary`，HEAD 仍为 `5cfb30f91a986d5c537680b9f072740c87221dc8`。
- PWA 内容指纹 `a82e25e3c2e4`；共享 AUDIO_VER=5，月相仍为 1。旧健康书自定义音频版本发现逻辑保留。
- 书架新增实际入口、双语标题、480px 原图派生封面，标注配音制作中。首页数量更新为 16。
- 月相入口补齐 PWA 标签及本书离线面板；正文、场景划分、声音清单不变。
- 冻结 SHA256：story `a4936f906d0d1216050daf3285d27359a7561f852c94065532971cdd587efcee`；audio-manifest `6a03d4283f12e6fdba0c49819d25b810ee9849416b84153847670172806dd017`；moon-experience `8005edef0a1b2bbc7abccb7328d51f1c03642bcfa2f3aa634c7bc56c769377c2`。

## 资源与状态合同

`tools/story_resources.py` 从实际 scenes/vocab 中英文内容检查 manifest 覆盖，再按实际阅读器版本发现音频。不是固定页数或固定音频条数模板。

当前月相包有 13 项、约 3.1 MiB：入口 + 两个 JS + CSS + story.json + audio-manifest.json + 七张实际插图。封面派生图另入 shell；两个 JSON 同时进入版本化 shell，避免长期 asset 缓存中的旧 JSON 覆盖新内容。

生成器仅加入磁盘已有、非空的正式音频；缺失列表保留真实 URL `?v=1`，`audioExpected=40`、`complete=false`。文件存在检查不是解码/听感验收；正式采用后的声音仍须独立验证。没有创建占位音频，也没有复制候选音频进入正式目录。

SW 下载图文后返回 `partial`，不是 `done`。界面显示“图文互动已存 · 配音待交付 40/40”，不增加完整已存本数，不画完成进度条；可删除图文包，“全部下载”不会重复下载已经保存的图文。正式音频未来齐全并重生成清单后，将自动纳入实际文件及版本键。

新增 `gen_pwa_covers.py --book moon` 用于仅生成本书封面。首次全量运行带来的云朵封面重编码已只还原该非目标改动，最终无旧书封面改动。

## 实际验证

- `python qa_pwa.py`：6 项，0 警告/失败，指纹匹配。
- `python tools/qa_offline_manifest.py`：15 本旧书对齐；月相 13 项对齐，明确输出 PENDING 40/40。
- `python tools/gen_pwa_covers.py --check`：16 张；`--book moon --check`：1 张。
- `python -m unittest discover -s tests -p 'test_*.py'`：8 项通过，包括临时隔离目录内缺失/空文件/部分/全部资源发现及 manifest 缺项拒绝。临时字节夹具不是音频验收。
- `node --test tests/pwa_upgrade.test.mjs tests/pwa_offline_contract.test.mjs`：2 项通过。
- `node qa_books.js`、`node qa_runtime.js`：旧书静态/运行时合同通过；月相独立 story-json 合同不套旧 PAGES。
- 月相 model：73 轮廓、40 冻结映射；geometry：84,666 独立明暗采样。
- 月相 browser：320/390/820/1024/1280 五宽、双语、相册、月相控制、预测、日记、插图，无 JS 错误。
- 月相 interactions：10 项，包括焦点、草稿、按钮/键盘、缩放声明、减少动画、存储拒绝、音频生命周期。音频使用 mock，仅验证生命周期。
- 内容任务提供的 `qa_moon_content.cjs`：28 段双语正文逐字匹配、40 个 UI 音频 URL 对应实际 manifest；音频 mock，不证明播放。
- `node tests/qa_moon_offline.cjs`：真实本地 HTTP + Chrome + Service Worker + 浏览器断网。先安装不含月相的模拟旧目录并下载飞机，再升级到实际新清单；旧飞机缓存保留。月相通过书架面板下载图文后，断网重载书架封面并进入月相，13 项资源均返回 200/非空，双语、相册和月相控制正常。注入旧 asset JSON 不影响新版 shell 正文。断网原生播放一条旧飞机 MP3，currentTime > 0.15；书内面板可删除月相图文包，无 JS 错误。模拟旧目录不是线上升级证据。
- `node --check` shared/pwa.js、sw.js，以及 `git diff --check` 通过。Git 仅提示工作区 LF 将转 CRLF；内容指纹沿用规范化 LF 算法。

浏览器证据：`.qa-labs/moon-offline/report.json`、`download-state.png`、`offline-reader.png`。报告包含逐资源状态、字节数和完整缺失音频列表。封面与截图已目视复核。

已把月相独立合同和图文断网回归接入 PWA workflow；本轮只运行本地命令，未触发/宣称远端 CI 成功。

## 待交付与不包含的结论

- Fun-CosyVoice 参考录音使用条件、准确 WAV/文本配对和自然度合格小样由音频任务继续处理。用户已否决当前 Kokoro 批次自然度，不采用、不批量；历史技术报告已追加该决定。
- 40 条正式音频尚未交付，不能证明本书离线朗读；设备朗读不是离线声音替代验收。
- 后续需完整音频逐条技术检查/试听，并从真实入口覆盖在线和下载后断网播放、版本更新旧缓存；必要时更新书架配音待交付标记。
- 未验证真实手机/平板硬件、线上/CDN/部署；未提交、推送、合并或发布。
- 按绘本技能区分静态、浏览器与线上结论；按自我改进技能把已查明的异步测试等待陷阱记录到本地忽略目录 `.learnings/`，未修改全局记忆或开启 hooks。

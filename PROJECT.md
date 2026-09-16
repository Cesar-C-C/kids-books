# 儿童绘本开发

这是面向约 4–8 岁儿童的双语互动科普项目，包含可点读绘本和可旋转、拆解、观察的 3D 科普实验室。正式站点是纯静态资源，可通过 GitHub Pages 发布。

## 从这里开始

- 书架入口：`index.html`
- 绘本：`books/<主题>/index.html`
- 3D 实验室目录：`labs/index.html`
- 当前状态：[docs/STATUS.md](docs/STATUS.md)
- 会话分工：[docs/CONVERSATIONS.md](docs/CONVERSATIONS.md)
- GitHub：<https://github.com/Cesar-C-C/kids-books>
- 线上站点：<https://cesar-c-c.github.io/kids-books/>

线上地址只代表上一次已经发布的版本。本地改动通过测试不等于已经上线。

## 目录地图

| 路径 | 职责 |
|---|---|
| `books/` | 12 本正式双语绘本、页面内容、插画、热点和正式音频 |
| `labs/` | 3D 实验室页面、模型、部件知识和共享运行时 |
| `shared/` | 绘本阅读器、通用样式和交互 |
| `art/` | 插画生成记录、审核数据和正式资源清单 |
| `tools/` | 可复用的生成、校验、离线和发布辅助工具 |
| `docs/` | 当前设计、专项审计、状态和协作约定 |
| `preview_overlays/` | 热点和插画对照预览；是否保留由对应工具与文档决定 |

项目根目录本身就是唯一 Git 仓库。不要再在项目内复制完整仓库；需要隔离开发时使用 Git worktree，并在完成后移除。

## 资源规则

- 正式页面只引用 `books/`、`labs/`、`shared/`、`icons/` 中的发布资源。
- 图片或音频“已经生成”不等于“已经接入”。必须检查 `BOOK`、`PAGES`、HTML、运行时请求、PWA 清单和最终页面。
- `books/*/_manifest.json` 由 `gen_book_manifest.js` 生成，不是内容源。
- 学校巴士 WAV 是可再生成母带，正式交付是 MP3；规则见 `.gitignore` 和其音频 README。
- 同 URL 替换图片时需要更新缓存版本，并验证 Service Worker/CDN 实际加载的新资源。

## 常用检查

静态和数据检查：

```powershell
node qa_books.js
node qa_runtime.js
node qa_labs.cjs
node qa_models.cjs
node qa_exhibits_model.cjs
python qa_library_r2_assets.py
python qa_schoolbus_cdn_assets.py
python qa_pwa.py
python tools/qa_offline_manifest.py
```

代表性浏览器检查：

```powershell
node qa_cloud.cjs
node qa_cloud_swipe.cjs
node qa_schoolbus_inspection.cjs
node qa_v3_labs_browser.cjs
node qa_book_hsr_browser.cjs
```

浏览器测试依赖本机已有的 Playwright/Chrome 环境。静态检查、浏览器检查和线上检查必须分开记录；某一层通过不能替代另一层。

## Git 与发布边界

开始修改前先确认：

```powershell
git rev-parse --show-toplevel
git status --short --branch
git branch --show-current
git remote -v
```

提交前检查目标文件、未提交内容、相关 QA 和 `git diff --check`。提交不自动授权推送；推送不自动授权合并或发布。发布后还要验证远端引用、Pages 构建和最终 URL。

## 协作约定

- 一个 Codex 任务只讨论一类问题；分类和命名见 [docs/CONVERSATIONS.md](docs/CONVERSATIONS.md)。
- 修改绘本时沿用现有阅读器和资源契约，不为单页改动重做全站。
- 触控交互必须兼容纵向滚动、按钮/热点、对话框、多指缩放和取消手势。
- 3D、音频、插画等生成结果必须接入实际入口并经过相应运行时检查后，才能标记为完成。

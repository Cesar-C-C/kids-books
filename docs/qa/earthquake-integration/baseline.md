# 地震主题隔离基线与任务契约

记录日期：2026-10-01。此文件记录实施起点，不代表地震主题已验收或获发布许可。

- Git 根：`C:\Users\Cesar\.codex\worktrees\publish-station-tour\儿童绘本开发`
- 分支：`codex/earthquake-topic`
- 远端基线：`origin/main`，提交 `5428f938f579d46fbc8a2d9af853c91ee37a5675`。此前空间站版本已经由 PR #32 合并；不从主目录的旧分支或其脏文件建立本主题。
- 主目录：`C:\Users\Cesar\Documents\ChatGPT\儿童绘本开发` 的 `codex/cloud-journey`、HEAD `1a2268f6e6c332eb69dabe0fd13f1f3494f7abed` 和现存未提交改动均保持原状。
- 主题占用核查：基线 Git 中没有已跟踪的 `books/earthquake/**` 或 `labs/earthquake/**`。实施任务开始后这些目录可由各自 owner 创建，不因此视为基线内容。
- 已批准绘本 spec SHA-256：`370c4c22902b8a71fb4218b26b675de645cb529e6717578f083e86339e1d4784`。
- 已批准 3D spec SHA-256：`92f267ac7c9f753d380af05c783f5f644636958f5c1cb771421e7d1746785cc7`。
- 两份 spec 和四份实施计划从主目录逐文件复制，复制前后 SHA-256 相同；源文件未删除或覆盖。

文件边界：绘本任务独占 `books/earthquake/**`（排除 `audio/**` 和正式音频清单）及 `tests/qa_earthquake_book_content.cjs`、`_models.cjs`、`_routes.cjs`；3D 任务独占 `labs/earthquake/**`（同样排除音频）及 `tests/qa_earthquake_lab_*.cjs`；音频任务独占两端音频文件／正式清单、`tools/earthquake_audio_*`、相关音频测试和独立工作台；本集成任务独占根书架、实验室目录、共享 PWA／资源发现、联合浏览器测试与本报告。任何共享文件改动只由集成任务处理。

固定深链：绘本 `#fault-lab` → 实验室 `#elastic-rebound`，`#wave-lab` → `#waves`；`lang` 仅 `zh|en`，`from` 仅 `earthquake-fault|earthquake-waves`，不用任意 `returnUrl`。概念 ID 统一为 `fault`、`elastic-strain`、`slip`、`focus`、`epicenter`、`wavefront`、`particle-motion`、`p-wave`、`s-wave`。默认模型是向内挤压的逆断层。

本地预览预期路由：`/books/earthquake/index.html` 与 `/labs/earthquake/index.html`；页面未完成前不登记为 ready。共享离线接口 `window.KBOfflineLab.check('earthquake')` 必须以实际缓存和本版清单判定，而不是仅看在线状态。

发布边界：当前授权只覆盖此前旧任务的发布；地震任务仅做本地实现和验收，不提交、不推送、不建 PR、不合并、不部署。桌面 Chrome 模拟、安装到用户设备的 PWA、真人儿童测试及线上验证分别记录，不能互相替代。

执行裁定：复用刚完成旧任务发布、已无未提交跟踪改动的受管理 worktree，切新分支从最新 `origin/main` 开始，而不再新建第二个 worktree。若此判断有误，代价是需要迁移当前主题文件到另一隔离 checkout；主目录与旧发布分支均未被重置或删除。

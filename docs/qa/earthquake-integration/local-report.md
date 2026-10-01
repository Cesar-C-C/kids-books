# 地震绘本与 3D 实验室联合验收（进行中）

日期：2026-10-02。基线见 [baseline.md](baseline.md)。本报告为当前本地开发快照，不是用户设备或线上发布证明。

## 已执行的静态与模型检查

- `python -m unittest discover -s tests -p 'test_*.py'`：19 项通过；额外钉住 `art-manifest.json` 与运行时使用的已审核插画必须一致并进入离线书包。
- `python tools/earthquake_audio_batch.py --stage verify` 和 `node tests/qa_earthquake_audio_delivery.cjs`：书本 56 条、实验室 50 条共 106 条正式 MP3 的源文本覆盖、manifest 状态与逐文件 SHA-256 全部通过。正式音频双语各 53 条；试听批准的 4 条 WAV 被复用，其余批次通过自动技术验收，尚未逐条人工试听。
- `python qa_pwa.py` 在最终本地候选指纹 `38ad63f33db6` 下 6 项通过、0 警告／失败；`python tools/qa_offline_manifest.py`：19 本书资源与运行时引用一致，地震绘本 74 项含 56 条音频，missing 0/56；实验室 50 条 MP3 仍为按需缓存，不误装进首次安装 shell。`node qa_books.js`：书架 19 本登记正确，旧 14 本原有阅读器契约 0 错误。
- `node tests/qa_earthquake_integration.cjs`：旧 worker 不响应、无 controller、未知实验室、缓存为空／部分／完整及不支持 MessageChannel 均安全处理。
- `node --test tests/pwa_upgrade.test.mjs tests/pwa_offline_contract.test.mjs`：5 项通过；旧书 PWA 消息／升级约定未被本轮共享接口破坏。
- `node tests/qa_everyday_delivery.cjs`：声音和肥皂原有交付契约通过。
- 绘本内容／模型／路由／播放器单测、实验室模型／几何／路由／播放器单测、`qa_labs.cjs`、`qa_models.cjs` 均通过。GitHub CI 工作流已加入地震主题静态、真实浏览器与面板升级预防检查；CI 尚未在远端执行。

## 已执行的桌面 Chrome 候选检查

- `node tests/qa_earthquake_book_browser.cjs`：四张已审核故事插画显示；断层单步进入 settled 并保留永久滑移；重置和 pointercancel 停止持续输入；结果朗读不抹掉模型结论、布展完成后朗读仍保留完成态；英文场景和词汇真实 MP3 可播放／停止／到 ended。两章节中英从书页实际进入实验室并按原章节返回；恶意 `returnUrl` 与非法 `lang/from/hash` 安全回落；320、390、820、1024px 与短横屏无横向溢出，主按钮和朗读入口命中区至少 44px，减弱动效下仍可单步观察。书架下载 74/74 完整资源、`complete=true`、missing 0/56；断网重开插画及英文场景／中文词汇，真实播放到 ended。实验室完整 shell 可离线进入；刻意移除一项核心文件后仍留在绘本并提示联网。此为独立本地 Chrome 上下文，不等于用户设备上的安装版升级证明。
- `node tests/qa_earthquake_lab_browser.cjs`：四张实验卡、波卡中途暂停冻结／继续原状态／reset 清理、单步、双语与视图不变量通过；点读小卡 25 项×中英 2 语共 50 个显式入口逐一触发原生 Audio 且有播放进度，并核对当前语言原文、MP3 路径及文件 hash。预置旧无版本／旧 hash 的坏缓存后，新 `?v=<fileSha256>` URL 仍能播放正确音频；预热后断网重开两语播放、未预热时清晰降级，切语言／失焦／换卡／离页中止旧音频通过。断网测试同时断开服务端响应，避免只设置浏览器 offline 而由 Service Worker 后台联网掩盖缺陷。
- `node tests/qa_pwa_panel_upgrade.cjs`：当前客户端打开离线面板不会额外调用 SW 更新；从旧 manifest 升至候选时仅一次当前 worker 请求且能接管。它是未来客户端预防回归，不是历史已安装客户端的修复证据。
- 受共享 PWA 代码影响的旧书回归：`qa_sound_soap_browser.cjs` 两语五宽度、插画与交互参数通过；`qa_interaction_redesign.cjs` 16 项触控／取消／离线检查通过；`qa_everyday_full.cjs` 对声音与肥皂 66 条录音在线和 66 条离线逐条播到 ended，当次版本 `b539de4551f2`。最终 `38ad63f33db6` 仅变动地震资源／目录文案，不改共享播放器；这些是本地浏览器证据，非用户设备验收。
- 目视检查 `opening.webp`、`observation.webp`、`arrival.webp`、`exhibit.webp` 与透明角色图：岩岩的围裙、鳞片和博物馆风格大体连续；断层／波的科学几何仍以可检验 SVG/模型为准，背景插画没有承担力学示意。

## 待完成，不能据此宣称通过

- 独立只读代码审查曾指出三项 Important：实验室 16 个非结果有声 item 不可点读、无版本音频 URL 会复用旧缓存、波卡缺暂停／继续。3D owner 已补点读小卡、`?v=<fileSha256>` 与波卡控制；上方最终候选真实浏览器测试逐项验证，内容源 SHA 未变。独立审查没有在修复后再次运行，最终复测由集成测试承担。
- 完整配音已生成并接入，不再把旧的图文候选或 `pending` 状态作为现况。用户已明确选择等完整配音版；本地技术完整性达标不等于所有片段逐条人工听审，也不等于已经发布。
- 两端深链、320/390/820/1024 宽及短横屏、减弱动效、书本失焦／指针取消、实验室无 WebGL 语义 SVG 降级、音频在线预热后离线与未预热降级已在桌面 Chrome 验证。真实中档 Android 设备性能及用户设备上的已安装升级仍未验证。
- 历史版本 `5abde007feec` → 当前候选 `38ad63f33db6` 的旧安装升级回归仍揭示一项**部署切换时序竞态**。旧版页面打开离线面板会调用 `checkForUpdate(false)` → `registration.update()`；若服务器恰在这次旧版更新尚在途时切到新版，随后普通刷新可触发两次当前 `/sw.js` 请求，新 worker 停在 `waiting=installed`。真实历史/当前 worker 与首页的对照证明：只开面板不下载也会复现；不开面板直接下载或等旧版更新完成后才切换服务器则正常。Chrome `154.0.8037.57` 的正式 `node tests/qa_earthquake_upgrade.cjs` 对当前候选仍为 `EARTHQUAKE_UPGRADE_BLOCKED`、非零退出；该测试先下载飞机与声音两本，关闭旧应用页再重开可升级，165 个旧下载文件 SHA-256 不变，但这不能冒充持续打开时普通刷新通过。Edge `154.0.4258.37` 的一次自然时序运行通过，未强制重叠，不构成排除竞态的证据。当前客户端移除了打开面板时重复更新检查，预防未来版本复现；无法改变已安装的旧脚本。用户对这一旧安装边界是否可接受，仍待明确答复；不能把红灯改写成通过。
- 尚未进行真人儿童理解性观察、中档 Android 真机性能测量、用户设备上已安装 PWA 升级或地震主题线上发布验证。桌面 Chrome 模拟不会被写成这些证据。

## 发布边界

此前空间站及旧绘本的发布已在独立 PR #32 完成并另行核验：2026-10-02 GitHub `main` 与 Pages 最后成功构建均指向 `5428f938f579d46fbc8a2d9af853c91ee37a5675`。地震主题仍仅在本地隔离工作树、未提交／推送／合并／部署；完整配音的本地技术门槛已通过，但旧安装时序风险仍待用户选择，不能自行把红灯解释为可接受的线上结果。

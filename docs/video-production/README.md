# 科普视频制作资料

- [从《索道小探险》提炼的制作方法](ropeway-method.md)：内容/问题驱动的 Blender 动作与镜头、实测配音时间轴、相机投影标记、编码和原生双语播放。
- [分层验收清单](checklist.md)：科学、几何、运动、语音、画面、浏览器、离线、独立 QA 和发布的不同证据。
- [源会话最新 32 项复盘迁移索引](retrospective.md)：逐项处理/预防与六阶段流程，原始快照 hash 和跨版本证据路径边界。
- [可编辑计划模板](../../video-production/templates/science-film.json)与[只读预检入口](../../tools/science_video.py)。null 音频字段不是可发布的配音。
- [完整 v5 原始源码包](../../video-production/ropeway-v5/source.zip)（82 文件）与[字节接收/冻结记录](../../video-production/ropeway-v5/generation-lock.json)。解压保留 work/ 结构，可编辑模型和剧本；本次没有重新渲染。
- [实际影片页面](../../animations/ropeway-adventure/index.html)。旧 Remotion 短篇经用户授权退役；原源码及原字节恢复副本仅作技术历史，不进入当前运行或发布清单。按内容选择方法，不把一个成功案例固化成所有影片的模板。

音频负责人已交付并原样接收 [旁白方法](audio/audio-method.md) 与 [来源回执](audio/receipt.json)；可编辑的 [旁白记录模板](../../video-production/templates/narration-record.template.json) 和 [JSON Schema](../../video-production/templates/narration-record.schema.json) 已接入。模板身份/音频/hash/许可字段仍待填，不是已冻结或已获听审的产出。Schema合法不能代替实际文本/hash/时窗/授权/人工验收。

本机可用 `./tools/check_narration_template.ps1` 运行现有 PowerShell `Test-Json`，含 zero-shot 缺转录、cross-lingual 伪转录、未记录 seed 的负例，不需要安装全局 Python 库。

学习日志在项目 `.learnings/`，不会修改全局 Codex 记忆或技能。

离线推荐现为[项目适配离线版 v3](../../animations/ropeway-adventure/downloads/ropeway-v5-project-offline-v3.html)，[原始 v5 HTML](../../animations/ropeway-adventure/downloads/ropeway-v5.html) 原字节归档仍可取。v3 修复真实策略拒绝全屏后的 focused Escape；v2 原件和 NO-GO 证据不覆盖。媒体未重制，作者复验与接收主线独立 QA 分列，见方法第 9–10 节及 v3 交接包。

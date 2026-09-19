# 月相内容阶段独立 QA

候选：codex/moon-diary，HEAD/base `5cfb30f91a986d5c537680b9f072740c87221dc8`；文件未提交。仅本地内容与交互验收，未推送/合并/发布。

## 本轮修复

- 翻画册重建 DOM 后恢复前后按钮焦点；未保存的日记字段跨翻页、切语言保留。
- 灯球实验补两个步进按钮、初始 aria-valuetext，保留灯球角度。
- 日记载入过滤非法枚举、日期/时间格式及超长字段；有效的没找到/未观察仍独立保存。
- 朗读统一释放失败/结束的 Audio 源和事件，停止时清理超时；10 秒未开始播放时最多一次设备语音降级，过期回调不能复播。
- 云经过场景延续比较画面的上弦月；示意朝向明确为北半球、北极朝上，不改变冻结正文与声音合同。

## 证据

- `node tests/qa_moon_model.cjs`：主要位置、73 个面积样本、40 条冻结映射通过。
- `node tests/qa_moon_geometry.cjs`：独立三维可见球面法线与光向点积，对照渲染轮廓，84,666 个亮暗采样通过，覆盖渐盈/渐亏及循环。
- `node tests/qa_moon_interactions.cjs`：10 组通过，覆盖真实键盘/触摸点击、焦点、灯球替代按钮、未保存草稿、存储拒绝、损坏记录、删除确认、减少动画、zoom配置和音频生命周期。
- `node tests/qa_moon_browser.cjs`：320/390/820/1024/1280 宽度、双语、翻画册、预测、日记保存重载、图片和页面无 JS 异常通过。屏幕为桌面 Chrome 模拟，不是真机。
- 查看全部 7 幅 WebP 原图及 `.qa-labs/moon/album-mobile.png`、`lab.png`；比较页月相位于画纸内，实验灯在球的右侧，动态图与人物图分区，文字可读。未声称完成全站 WCAG 审计。
- 阅读核查 [NASA Moon Phases](https://science.nasa.gov/moon/moon-phases/) 与 [NASA Space Place](https://spaceplace.nasa.gov/moon-phases/en/)：模型的受光、渐盈/渐亏和叙事观察时段与标明的北半球示意一致；未把普通月相当作月食。

音频生命周期测试用受控 Audio/speech mock 制造失败/超时，不是正式音频播放或人工试听证据。当前正式 audio 为空是预期，不计为内容交互缺陷。

## 冻结哈希

- story.json: `a4936f906d0d1216050daf3285d27359a7561f852c94065532971cdd587efcee`（未改）
- audio-manifest.json: `6a03d4283f12e6fdba0c49819d25b810ee9849416b84153847670172806dd017`（未改）
- moon-experience.js: `8005edef0a1b2bbc7abccb7328d51f1c03642bcfa2f3aa634c7bc56c769377c2`

## 后续交付条件

正式音频和真人试听待音频会话；完整书架/PWA 集成、资源发现、下载后断网重载、旧缓存升级仍待完整候选，不能据本报告称整书通过。实际手机/平板的多指缩放、滚动手势与辅助技术尚未真机验收。月相发布未授权。

运行命令会更新本地截图。候选母版与 workbench 音频/依赖缓存不纳入发布。父项目准备清单已复制到本工作树 docs/qa，方便未来同一交付提交，原文件保留。

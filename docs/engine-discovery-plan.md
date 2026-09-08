# 飞机发动机深度探索 · 第一期

依据已确认方案：保留整机的十类部件与原有交互，新增可从整机进入的发动机探索页。面向4–8岁，全部朗读文字可见，中英双语，静态GitHub Pages，无账号。

## 实施与验收
- [x] 独立可选的8个部件：进气口、风扇、外涵道、压气机、燃烧室、涡轮、轴、喷口。
- [x] 开合剖面、两路空气、机械连接、暂停/慢放/单步及复位；可拖动旋转与缩放。
- [x] 4个观察后作答的任务；答错有解释，完成后可重做，全部内容自由访问。
- [x] 共享本地探索记录：发现、操作、解释分别保存；异常存储可继续使用。
- [x] 桌面与手机浏览器验证、原有实验室回归、科学内容与整体验收。

## 验证证据
`node qa_discovery_progress.cjs`：去重、刷新恢复、损坏数据、存储禁用、清空。
`node qa_engine_model.cjs`：真实Three.js下8类部件、333个可选网格、气流方向与分离、核心受热、转轴连接与可逆开合。
`node qa_engine_browser.cjs`（需Playwright及Chrome）：从整机进入、点击风扇网格、旋转缩放、暂停单步、四任务及答错重试、隐藏气流不能计入观察、取消清空保留记录、刷新恢复、英文调用、手机布局、双指缩放、无WebGL/存储受限回退、返回机翼。
`node qa_labs.cjs`、`node qa_models.cjs`、`node qa_labs_browser.cjs`、`node qa_more_labs_browser.cjs`：原有四实验室与导航回归通过。
截图存于忽略目录 `.qa-labs/engine-desktop.png` 和 `engine-mobile.png`。语音验证为浏览器接口调用，实际声音取决于设备英语语音。未把桌面软件渲染测试当作真实移动硬件帧率验证；模型为教育定性演示。

发布路径：`labs/airplane/engine/`。部署后可设置 `LAB_LIVE_BASE=https://cesar-c-c.github.io/kids-books/` 重跑发动机浏览器测试。

## 科学边界
通用高涵道比涡扇发动机教学示意，不对应具体机型；内部级数、比例、转速、流量与热效应均为定性示意。机械连接简化显示，实际发动机可有多根同心轴。气流从前到后，燃料仅在核心燃烧区加入，核心与外涵流路分开。外部无夸张火焰。风扇和核心均可贡献推力。

参考：NASA https://www.grc.nasa.gov/www/k-12/airplane/Animation/turbtyp/etfr.html

## 接口与分工
模型模块提供EngineModel.create(THREE)，返回group、pickables、parts、anchors与update({time,open,flow,shaft,selected})；页面负责相机、选择、播放、任务及记录。flow为both/bypass/core/off，时间由页面暂停与单步控制。模型作者仅改model.js及模型测试，页面与集成由主代理负责。测试不读取秘密或依赖第三方网络。

Ruling: 新增engine子页承载深度体验，保留整机用于定位和返回；避免两个渲染器在同页争用资源。阶段2/3内容不在本期范围内。

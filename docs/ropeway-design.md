# 索道实验室：机制与证据

本地候选，未提交、未上线。基线：6c59115d1bbd53ba45252c845f6b8b0dbd8b1925。没有新增索道绘本，也不改其他主题。正文已终审冻结，独立音频任务的 32 条真实 MP3 已本地接入，并通过作者在线/断网点读验收；独立 QA、最新主线集成与发布分别记录，不混为一个“通过”。

## 范围

教学主模型是单线可脱挂循环吊厢：同一根环形钢索在区间承载并牵引吊厢。几何尺寸、运行时间、颜色和动作幅度是示意值，不是工程计算、设备认证或真实操作指引。站内输送轨道、轮胎、抱索器和检测点采用机制示意，不复制完整商业设备。

## 可观察的因果链

| 操作 | 看得到的证据 | 解释 | 限制 |
|---|---|---|---|
| 运行钢索 | 驱动轮、钢索标记、线路吊厢同向运动 | 站内驱动牵引环形钢索 | 不计算摩擦、负载与能耗 |
| 跟随一辆吊厢 | 轨道先接住运行轮；抱索器打开；吊厢偏离索路并减速；站内低速；加速对齐；闭合与检查；再离站 | 脱挂使区间与乘降速度不同 | 开合幅度、输送曲线夸大，检测几何非工程图 |
| 观察输送轮胎 | 减速区转速逐级下降，乘降区低速，加速区逐级上升 | 轮胎各位置速度与吊厢的示意速度曲线对应 | 使用恒定加速度示意，不复刻真实传动、轮胎压紧力或控制程序 |
| 查看夹紧检查异常 | 检测点变红，主驱动和站内输送一起减速停下，两处制动器显示闭合 | 保护性停机，不让未通过检查的吊厢出站 | 未模拟真实制动距离与安全控制电路；不能绕过故障继续运行 |
| 主驱动电源不可用示例 | 正常驱动停止；仅在其他检查正常的示例中，辅助装置带动驱动轮低速回站 | 部分配置有辅助驱动，适用性需专业判断 | 不代表所有故障均可恢复；救援、维护与预案不可省略 |
| 改变示意伸长量 | 张紧驱动框架沿导轨移动，驱动轮随框架移动 | 配置示例用于补偿钢索长度变化 | 非温度、张力、应力与液压求解，不提供实际调整步骤 |

## 一手来源与采用范围（核查于 2026-10-03）

1. [LEITNER detachable gondola lifts](https://www.leitner.com/en/products/ropeway-systems/detail/detachable-gondola-lifts/)：单线承载牵引、站内脱挂低速；LPA 产品离站夹紧检查。采用机制，不采用页面最大速度与容量作为通用值。
2. [Doppelmayr detachable gondola brochure](https://www.doppelmayr.com/wp-content/uploads/2023/04/Detachable-Gondola-Lifts-EN.pdf)：第 3、6 页描述站内慢行和开合监测异常停机。文件末页有 032013 版次代码；2023 URL 不是设计标准版本证据。
3. [Doppelmayr DT training curriculum](https://service.doppelmayr.com/training/course-list/detail/mechanical-course-ropeways-with-dt-grips-76/)：DT 配置的轮组、站内开合线、轮胎输送、夹紧力检查、间距与防碰撞教学目录；不是操作手册。
4. [LEITNER LPA grip brochure](https://www.leitner.com/fileadmin//user_upload/pages/LPA_grip.pdf)：弹簧施加夹紧力、默认闭合、移动钳口。只作为 LPA 构型示例，不把具体弹簧机构推广到全部设备。
5. [LEITNER overhead drive](https://www.leitner.com/fileadmin//userdaten/00-home/Ordner-Facelift/PDF_s_Logo_neu/Antrieb_sheets/The_LEITNER_Drive_System_OverheadDrive.pdf)：电机、减速机构、作用于输入端飞轮的工作制动器、作用于驱动轮的安全制动器、柴油液压辅助驱动、可移动框架。只作为一种有齿轮驱动配置，不宣称所有索道相同。
6. [LEITNER elements](https://www.leitner.com/en/company/useful-information/elements-of-ropeways/)：支架轮组导引钢索、站内驱动与控制、固定与可脱挂抱索器的区别。
7. [LEITNER 3S](https://www.leitner.com/en/products/ropeway-systems/detail/tricable-gondola-lifts/)：两根承载索与一根牵引索；[aerial tramway](https://www.leitner.com/en/products/ropeway-systems/detail/aerial-tramways/)：往返车厢及多种承载/牵引配置。类型比较不能只数画面中两条去回程索线。
8. [昂坪 360 运营方 2016 换索项目说明](https://www.np360.com.hk/media/ox4k25nt/20161109rope-replacement-project-press-release-stage-2-3-eng-final.pdf)：双线构型承载索和牵引索分工，以及专业维护换索的实际案例。历史双线案例，不是本单线模型的维护周期。
9. [市场监管总局：客运索道安全监督管理规定](https://www.samr.gov.cn/zw/zfxxgk/fdzdgknr/fgs/art/2025/art_6f21963fcb7e46c3a2002b5016e5c9e9.html)：2025 年修订；第 23、27、29、30 条涉及运行前检查、维护、救援准备和异常停用检查。采用管理原则，不将模型称为符合全部法规的设备。
10. [国家标准官方题录：GB 12352-2018](https://openstd.samr.gov.cn/bzgk/std/newGbInfo?hcno=D4BB0B81D40B2FFD69A796B7D6DDE952)：当前题录显示现行；已核对名称及实施日期。全文预览未取得，因此没有作条款级符合性审核。
11. [LEITNER aerial tramways](https://www.leitner.com/en/products/ropeway-systems/detail/aerial-tramways/)：往复式路线与不同承载/牵引构型。运行方式与钢索分工是两个分类角度，不能混成互斥的四种索道。
12. [LEITNER station brochure](https://www.leitner.com/fileadmin//userdaten/00-home/Ordner-Facelift/PDF_s_Logo_neu/Compact_station/The_LEITNER_Station_.pdf)：PDF 第 7 页（印刷 12/13）轮胎输送、加减速；第 8 页（印刷 14/15）站内运行轮、轨道与开合/夹紧检查。采用机制，旧版认证宣传不作当前法规符合性证据。
13. [LEITNER bicable brochure](https://www.leitner.com/fileadmin//userdaten/01-produkte/Seilbahnsysteme/Drei-_und_Zweiseilumlaufbahnen/Bicable_gondola_lifts.pdf)：PDF 第 3、5 页的承载索、牵引索、运行轮和抱索器。只用于类型对照，本模型仍是单线可脱挂循环吊厢。

来源 8 是历史运营案例，不是当前单线模型配音正文的必要依据。制造商 PDF 已实际读取，并查看驱动、抱索器和站内检测图片；分析副本不进入发布白名单。

## 实现与验收

机制状态与 Three.js 几何分离，纯模型测试验证路线闭合、脱挂时轨道承载、夹紧前速度匹配、检查后出站、保护停机不可用辅助驱动绕过。8 辆吊厢按运行时间等间隔布置，而非按几何距离均分，以保持站内慢速时的合理间距。鼠标两轴旋转，触控单指横向旋转，纵向原生页面滚动，多指立即退出旋转直至全部抬起。保留键盘视角与缩放按钮、减少动态效果、无 WebGL 的同机制 SVG 降级，以及可滚动的说明区域。

## 冻结与交付边界

16 个稳定 ID、32 条中英正文经内容任务终审并通过逐项落稿复核，复核 turn 为 01a0ff2d-3370-7242-97ad-84529b6cda16。

- content.js SHA-256：04a80621f72d0ad316af6c2fd96d6990099b96750f4e5d927f4e477b66c53231。
- docs/ropeway-narration-lock.json SHA-256：2362d349b3fda427294053bc6ad32d04a409064002165e47d364698b83a000f7。
- 只有正文参与朗读，不把标题、操作按钮或来源列表混入这 32 条任务。每条音频必须绑定锁中精确文本、文本哈希与真实 MP3 字节哈希。

tools/ropeway_handoff.cjs 生成白名单与字节/规范化 LF 哈希，记录当前 PWA、配音状态和报告是否匹配当前运行文件。生成报告不是静态“最终通过”标记；后续改动或音频接入必须重建 PWA、复测并刷新交付清单。

本树位于地震滑动修复之前的基线。集成时按白名单差异合并 catalog、QA 和 workflow，保留地震修复及其新测试；在最新集成基线上重新生成 pwa-assets.js 与 sw.js，不能整文件覆盖。

浏览器证据是桌面、390 手机、820 平板与强制 SVG 降级下的真实 Chrome/CDP 原生输入模拟；断网证据是新鲜隔离 Service Worker 控制后重开，均不等于物理设备或用户原已安装 PWA 验收。合成/解码、逐条在线/离线点读、人工自然度试听分别记录；未取得的证据不推断为通过。

## 本地音频接入与最终作者回归

配音实际使用 Fun-CosyVoice 3 的 inference_zero_shot、CUDA FP32，中英文分别绑定同语言参考 WAV 与准确转录；历史声线配置标记的 instruct2 方向字符串没有用于本次生成。接入时只采用 32 个指定 MP3 与清单，不复制母带或音频任务的整个工作区。

交付清单原始 CRLF SHA 为 dfb27c83264259b29b117408bff63edc831a674f9864c8f585657a64d19b8177；接入后仅规范化 LF，SHA 为 51e93ba600c764cb54dfb0db83a8780254c0a62926a0ea1467971ce7133ffbae，两者规范化内容完全相同。32 个 MP3 字节未作任何修改。音频任务统一以 0.88 转码增益留余量，原 WAV 母带不变。

当前作者验收记录绑定运行文件集合 f42b6db649a819cd27883c98610450d6a0591302aac92ad7995b19ea84b67dae、PWA 26916fbb893d；此前 e620 / bb63 的报告是历史候选，不是当前封版证据：

- 32 条在线播放/停止与 32 条断网点读/停止均从实际页面触发，并完整解码；每条实际服务/缓存 MP3 的 SHA 与清单相同。
- 64 次完整解码均为 24 kHz 单声道、有限且非静音样本，最大峰值 0.911386，未超过满幅。
- 新鲜 SW 接管后，先核对 32 个带版本号的精确音频缓存键，再断网首次点播全部 32 条，最后恢复在线测 32 条；没有任何在线播放预热。断网目录、预览像素和模型通过，无缺失资产或页面错误。
- 四配置的实际书架/目录入口、模型机制与可见张紧/制动/辅助驱动、原生竖滑/对角线/多指/取消恢复、SVG 轮圈/索线起手横滑和键盘控件通过。WebGL 约 106–110 draws、33447–33495 triangles，不是性能或真机认证。
- 全部 8 个目录入口、旧 7 个 studio 契约、PWA 6 项静态检查、0 页面接线遗漏与 19 本绘本离线引用对齐通过。

docs/ropeway-audio-receipt.json 保存脱敏生成/校验锁哈希、参考配对哈希与接入证据。音频任务记录 brakes-zh、types-en 为已接受并原样复用的小样；其余 30 条尚未逐条人工听审。decelerate-zh、auxiliary-en 的短片段参考提示警告保留，不改正文，也不将技术通过解释为自然度或发音已听审。

## 独立 QA 发现后的修正

辅助驱动暂停原来进入 paused，但辅助按钮只接受 power-stop，造成只能重置才能继续。现在辅助运行的任何暂停入口都回到保持主电源不可用故障的 power-stop，制动闭合；主运行仍禁止，只有显式点击辅助按钮才能低速继续。切换模式也先暂停且停止配音，不能清除故障或绕过夹紧检查。

SHA 绑定的旧 model.js 单行逆向回放在手机横屏、平板横屏、自动无 WebGL 三配置及双语共 6 案中复现旧死路；不是整个历史运行文件集合的回放。修正后同 6 案覆盖重复暂停/恢复、实际配音暂停、模式切换和健康/夹紧故障门禁。无头浏览器的新标签页切换没有触发真实后台事件，因此 blur/hidden 仅用明确标记的合成生命周期回调验证，不能称作操作系统或真机后台切换通过。

后续冷离线探针确认另一个确定性缺陷：原清单缓存 raw MP3，而播放器请求带 ?v=哈希 的精确 URL，未经在线预热时离线返回 HTTP 504 / 媒体错误 4。tools/gen_pwa_assets.py 现从 ready 清单验证 16 对双语音频的身份、真实字节、大小和版本 URL，替换 raw 索道音频键。Service Worker 的精确 URL 匹配规则未放宽。测试改为先冷离线后在线，保留此前失败工件及原 30 秒播放等待界限，不把等待失败归咎于生命周期或编码。

handoff 中的 integration 字段区分 add-exact、merge-scoped-diff 与 regenerate-on-target；5 个共享文件（包括 PWA 生成器）按差异合并，2 个 PWA 生成文件在目标基线上重建。该约束优先于复制整张文件清单。

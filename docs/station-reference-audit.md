# 太空站多视角参考与实体模型

## 参考顺序

主外观固定使用 `books/station/assets/02_overview_c_r2.webp`：T 形、单根长前舱、两根横舱、两组紧凑蓝金太阳翼、右舱机械臂。生活与实验设备来自 `03_living_c_r2.webp` 和 `04_lab_c_r2.webp`。

先使用内置 image_gen 生成三张参考板，再调整模型：

1. `labs/station/references/exterior.png`：四格外观与俯视参考。生成器的背面格仍偏向正面，不能当作背面工程图。
2. `labs/station/references/interior.png`：舱内布局、睡袋餐桌、跑步机、植物/晶体箱及样品瓶。
3. `labs/station/references/mechanics.png`：背面、底面以及对接口和机械臂细节。生成图存在太阳翼安装方向偏差，安装位置仍遵从绘本主图。

所有生成图已保留在项目中，页面提供对照入口。没有把插画推断出来的尺寸描述为真实航天器尺寸，也没有声称这些生成图达到投影一致的工程三视图。当前实现是按插画比例和设备特征人工细化的教学模型，不能宣称逐像素 1:1。

## 生成提示词概要

工具：内置 image_gen。参考图角色均为外观/设备身份参考，不改写原绘本文件。

- Exterior：same SINGLE T-shaped design in four separate panels; one long forward barrel, two shorter cross cabins, rounded node; exactly two twin-panel navy/gold wings in canonical locations; thin silver/gold arm; warm metal, porthole glass; no extra ISS truss, no people, no labels.
- Interior：four equipment panels; curved ivory cabin, upright blue quilted sleeping bag and three restraints, pedestal galley and retained food pouches, treadmill rollers/handrails/harness, clear plant chamber and violet LEDs, crystal chamber with seals/latches, capped restrained sample vials; spatial separation; no people.
- Mechanics：true rear with docking nose occluded, underside, concentric docking rings/seals/latches, articulated arm bearings/cable loom/two fingers; preserve canonical object identity. Rejected generated topology variations are documented above.

## 模型实现

`v3/reference-details.js` 是新设备布局和细化层；`v3/inspection.js` 管理按安装位置计算的镜头及主动剖切。旧的舱内坐标平移和旧设备几何已移除。

- 生活区：3 个机柜抽屉、睡袋缝线/拉链/3 根绑带/扣环、餐桌底座/螺栓/3 份固定食品、跑步机双滚筒/双扶手/约束带。
- 两个横舱：植物箱（4 组叶簇、12 盏灯）、晶体箱（7 个晶体）、3 只带盖样品瓶与仪表。
- 服务设施：红蓝管线、固定夹、分块地板。
- 舱外：开在舱壁几何上的舷窗孔，前端过渡壳体，端盖铆点，节点舱门手轮，机械臂关节轴承盖/螺栓/线束。
- 玻璃：独立玻璃面、双面物理材质、反射环境、关闭深度写入。不会因放大而使周围部件透明。
- 主动查看内部时移动太阳翼并剖开面向镜头的舱壁。选择照明时使用向上保留的剖面，从下方看灯。
- 40 条部件细节，均绑定非空实体网格，带可见英文说明；新增晶体箱、样品瓶、服务管线。

## 验证

- `node qa_station_reference_model.cjs`：每项内容的实体映射；全部家具顶点的圆柱舱包络检查；独立设备包围盒不相交；物理玻璃属性。
- `node qa_book_space_models.cjs`：绘本 T 形和太阳翼数量回归，动作复位；现已加载新细化层。
- `node qa_station_inspection.cjs`：每个部件完整/打开视角及全部细节截图，摄像机画幅与射线可见性检查；图片需人工复核。
- 浏览器截图保存于 `.qa-labs/station-audit/`，报告为 `visibility.json`。

几何包络与镜头检查有明确范围，不能证明任意用户旋转视角都完全无遮挡，也不能代替工程级碰撞检测。

## 科普校对来源

这些资料用来核对教学原理，不用来证明绘本中的站体布局：

- [NASA Cupola](https://www.nasa.gov/international-space-station/cupola/)：真实七窗观察舱；模型中仍属于默认隐藏的教学扩展。
- [NASA Orion windows](https://www.nasa.gov/missions/artemis/orion/orion-windows-provide-new-outlook-for-spacecrafts-future/)：窗体材料、承压与防护取决于飞行器设计，不能统一说只有两片玻璃。
- [NASA Glenn Flight Harness](https://www.nasa.gov/glenn/glenn-expertise-space-exploration/human-health-performance/advanced-exercise-concepts/glenn-flight-harness/)：跑步机约束背带的教学依据。
- [NASA station structure](https://www.nasa.gov/missions/station/backbone-for-science-twenty-years-on-international-space-station-structures-managed-by-nasa-marshall-still-soar/)：桁架、电力和散热器的关系。

## 最终本地验收记录

最终模型：10 类部件，40 条细节，609 个网格、177283 个三角形、30 个玻璃面。静态包络与设备分离、动作复位、浏览器 40/40 细节画幅与射线可见性、桌面/手机布局、打开合上、模型身份保持、缩放不改透明度及离线清单均通过。已逐页查看完整截图集，并针对节点照明、太阳翼近景、桁架、机械臂、观察舱做修正与复测。最终报告为 `.qa-labs/station-audit/visibility-final.json`。

`qa_station_smoke.cjs` 覆盖 1360×900 桌面与 390×844 手机布局。截图 `station-desktop-final.png`、`station-mobile-final.png`、`station-mobile-crystals.png` 位于 `.qa-labs/`。本次仅保存本地修改，未执行 GitHub 发布。

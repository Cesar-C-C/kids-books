# 云朵去哪里旅行：家长阅读说明

本书为原创中英文科普故事，共 16 页。主线围绕滴滴离开池塘后的好奇、迷路、担心和重逢展开。正文适合共读；每页“为什么”补充因果解释，供第二遍阅读。角色的语言、情绪与回到原池塘的巧合是文学想象，不作为真实水滴的行为解释。

## 科学核查

核查日期：2026-09-14。故事文字为原创改写，未复制网站叙述。

- [USGS：Water cycle](https://www.usgs.gov/water-science-school/water-cycle)：水的储存位置、液固气变化、多条循环路径、太阳能与重力；对应第 2、10、11、13、14 页。
- [USGS：Condensation and the Water Cycle](https://www.usgs.gov/water-science-school/science/condensation-and-water-cycle)：不可见水蒸气、凝结、云滴及冷杯外壁凝结；对应第 3、4、15 页。正文不照搬该网页对高空气温和整朵云浮力的简化说明。
- [USGS：Evapotranspiration and the Water Cycle](https://www.usgs.gov/water-science-school/science/evapotranspiration-and-water-cycle)：根吸水与叶片蒸腾；对应第 12 页。

需要特别区分：蒸发不等于沸腾；云不是棉花或一个装水的袋子；水蒸气本身看不见；灰云不一定降雨；水滴不靠意愿选择路线。微观插图中的水珠、尘埃、土壤孔隙、气孔均有放大，不能用图中比例推断真实尺寸。滴滴的尖顶造型是角色设计，实际小雨滴通常接近球形。第 9 页放大展示云滴合并；第 12 页用叶片剖面和局部放大展示内部通道、气孔，并非叶面有裸露的河流。

## 亲子共读

先读故事，再按兴趣打开知识卡。孩子不必一次记住全部术语。让孩子用自己的话解释“为什么”，并在答错后重新观察、尝试。

冷杯实验使用不易碎的容器和托盘，由大人放入冰块。将两只杯外壁擦干，对照冰水与常温水。观察结果受温度和空气湿度影响，不保证每次都出现明显水珠；如实记录没有看到变化的情况。实验用水不饮用。

## 图片与声音

15 张独立 AI 插画以封面为角色和画风参考，使用内置 ImageGen 生成，保存于本目录 assets。旅行地图在复述页复用，以便孩子对照回忆。提示词见 ART-PROMPTS.md。热区在可交互 SVG 浮层中，不写入图片。

故事、知识卡和词汇的双语音频均从 book.js 导出，使用项目现有 Edge TTS 制作工具生成。网络语音文件不可用时回退设备语音。自动朗读由用户开启，翻页会停止上一段声音，默认不自动翻页。

## 本地维护

`node tools/build_cloud_manifest.cjs` 生成音频清单；`python gen_audio.py books/cloud/_manifest.json` 制作声音。
`node qa_cloud.cjs` 检查内容、资源、互动和版面。通过书架进入 `books/cloud/index.html` 阅读。

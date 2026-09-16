# 《眼睛为什么看不清了？》视觉连续性表

**适用范围：** 14 页插画、封面、互动素材和后续音频封面图。除非本文件在后续经科学审核修订，所有画面须保持以下角色和场景连续性。

## 资产生产与可翻译标签

- 所有新位图插画必须导出为 **1216×832** 像素的 WebP 文件；采用版本化文件名，例如 `page-01_v1.webp`。后续修订递增版本号（如 `page-01_v2.webp`），不得用同名文件覆盖已审核版本。
- 需要随中英文版本翻译、在互动中变化或需无障碍读取的图示标签，必须以 **HTML/SVG** 文本层实现，不得 baked（烘焙）进位图插画。标签层须能独立替换文字，不改变人物或科学图示本体。
- 可以保留在位图中的文字仅限不可翻译的装饰性笔触；所有科学术语、焦点说明、图例、按钮文案和“原理示意 / Diagram not to scale”提示都属于可编辑标签层。

## 主角：朵朵 / Duoduo

- **身份与年龄：** 6 岁中国女孩；活泼、好奇、愿意在看不清时向大人求助。
- **不可变识别元素：** 明亮黄色风衣、青绿色（teal）双肩包、齐下巴的短黑色波波头、红色风筝线轴。
- **使用规则：** 风衣、书包和线轴在风筝场景中完整可辨；诊室里书包可以放在椅旁、线轴可放入包侧袋，但不得替换颜色或发型。她的表情从好奇、困惑到放心；眯眼只能是短暂观察动作，绝不画成滑稽或失败。

## 陪伴角色

### 爸爸

- 中国父亲，约 30 多岁，温和、专注倾听；短黑发，无夸张面部特征。
- 固定服装为深靛蓝针织开衫、浅灰 T 恤、卡其长裤和白色运动鞋；不穿白大褂，不替代专业人员做检查。
- 他的动作是蹲下倾听、牵手、陪同来到诊室；表情支持而不焦虑，不责怪朵朵“看太多屏幕”。

### 验光师 / optometrist

- 中国女性验光师，约 30 多岁，短深棕发，亲切、专业、平静。
- 固定服装为干净的白色短款医疗外套、浅蓝上衣、深青绿长裤，佩戴小名牌；只在眼科检查室出现。
- 她使用标准验光设备、指示棒和适龄图形视力表；不展示注射、手术器械或可怕医疗情节。她解释检查步骤，爸爸与朵朵始终在安全、被尊重的互动中。

## 场景与色彩

### 风筝场 / kite field

- 明亮、开阔、无危险的社区草地；远处有风筝节号码牌和柔和的城市/树线轮廓，近处突出朵朵手中的红色线轴。
- 固定调色：天空青蓝 `#7CCDF4`、草地嫩绿 `#8DCB72`、阳光奶油黄 `#F7D56B`、云朵暖白 `#FFF9EE`；朵朵黄色风衣 `#F4C542`、青绿色书包 `#1F9E9A`、红色线轴 `#D94B4B` 是最醒目的角色锚点。
- 远处号码可用轻柔失焦表现“看不清”，但不得用惊悚眩晕、黑洞或完全遮黑的效果；近处线轴保持清晰，便于对比。

### 眼科检查室 / eye-exam room

- 干净、安静、儿童友好；背景为浅雾蓝 `#DCEFF6`、暖白墙面 `#FFF9EE`、青绿色点缀 `#1F9E9A`，与风筝场共享温暖明亮的光线。
- 具有一张儿童椅、验光设备、适龄图形视力表、朵朵的书包和一幅小风筝墙画，形成从户外故事到检查场景的连续线索。
- 不出现恐怖医院走廊、针头、手术台、血液、诊断数字或暗示立刻治疗的画面。

## 科学图示规则

- 眼球、角膜、晶状体、光线、焦点和视网膜一律采用清楚标注的**剖面示意（cutaway diagram）**；每张图标出“原理示意 / Diagram not to scale”。
- 图示服务“焦点在视网膜上 / 前方”的比较；颜色、比例、线条和光线箭头必须清晰，但不能被误读为真实人体切面或检查结果。
- 禁止使用逼真的手术、眼球解剖、创伤或其他 photorealistic surgery imagery。镜片、眼球长度滑块和焦点的改变均为无创、儿童友好的互动图形。
- 画面保持柔和数字水粉/绘本质感，线条圆润，避免嘲笑、恐吓或将戴眼镜塑造成外貌缺陷。


## 2026-09-16 入库记录与提示词来源

本批使用 **built-in image_gen 模式**（由前一执行者的交接记录确认），未使用 CLI/API fallback。接续执行只做候选选择、人工视觉检查和非创意格式转换，没有重新生成插画。原始工具调用逐字提示词随执行主机退出而丢失；下列条目是 **canonical regeneration prompts（依据已批准成图与合同重建的规范再生成提示词）**，不是原始提示词的逐字恢复，也不承诺复现同一随机结果或原始工具参数。

- 生成日期统一记录为 **2026-09-16（Asia/Shanghai）**，依据保留源文件的本地修改日期及任务交接；精确服务端生成时间不可恢复。
- 原始候选目录：`C:\Users\Cesar\.codex\generated_images\01a0a610-9c29-7b31-bce1-f6a17e71e52e`。目录中的 PNG 仅作来源证据；阅读器使用下面列出的项目内 WebP。
- 封面参考锚点：`books/myopia/assets/00_cover_v1.webp`，源文件 `exec-62020074-5a88-4d02-8170-0e1aa1c60f1c.png`。后续提示词明确把它作为角色、配色与绘本风格参考，不作为编辑目标。原始引用参数未能独立恢复；这里记录的是再生成时应采用的参考角色。
- 所有 18 个候选均经 original-detail 查看；14 个所选源图逐页确认，最终 WebP 已通过标注 contact sheet 检查。
- 输出均为 1216×832 WebP。封面保留接手时已选定的转换文件；其余 13 图采用 Pillow `ImageOps.fit(..., (1216,832), LANCZOS, centering=(0.5,0.5))` 居中裁切并等比缩放，WebP quality=92、method=6。未绘制、替换或修补位图内容。

### 每条再生成提示词共同前缀

以下共同前缀和每页独立提示词合起来构成完整的规范提示词；共同前缀不可省略。

```text
Asset type: landscape illustration for a bilingual science picture book for ages 4–8; final project delivery 1216×832.
Style/medium: warm digital gouache and soft cut-paper picture-book texture, rounded forms, clear gentle lighting, consistent with the approved cover.
Character invariants when present: Duoduo is a six-year-old Chinese girl with chin-length black bob, yellow windbreaker, teal backpack and red kite spool. Her father has short black hair, indigo cardigan, light gray T-shirt, khaki trousers and white shoes. The optometrist appears only in the clinic, with short dark-brown hair, white coat, pale-blue top and dark-teal trousers. Duoduo receives teal glasses on page 07 and wears them thereafter.
Constraints: no title, caption, translatable label, readable badge, logo or watermark in the bitmap; render scientific terms, focus explanations, numbers and diagram-not-to-scale notices separately in HTML/SVG. No surgery, fear, blame, diagnostic measurements, cure claim or prevention guarantee. Preserve natural hands, intact props and the approved character identities. Scientific pages show a simple illustrative cutaway with light traveling left to right and no unnecessary anatomy.
```

### 00 · 00_cover_v1.webp

- 最终资产：`books/myopia/assets/00_cover_v1.webp`
- 生成日期：2026-09-16（Asia/Shanghai；文件日期/交接依据）。
- 所选源文件：`exec-62020074-5a88-4d02-8170-0e1aa1c60f1c.png`。
- 封面参考角色：本页建立封面角色与风格锚点；再生成时不输入参考图。
- 提示词性质：规范再生成提示词，非原始调用逐字记录。

```text
Use case: illustration-story
Input images: none; create the cover reference anchor.
Primary request: Create the cover anchor: Duoduo and her father fly a red kite on an open, sunny community field. Place the characters to the right with a wide sky and grass area for separate HTML title text. Duoduo holds her red spool naturally, her yellow windbreaker and teal backpack fully recognizable; father wears his indigo cardigan, light gray T-shirt, khaki trousers and white shoes. Show a soft city and tree line far away. No glasses yet, no medical equipment.
```

验收记录：Original and retained WebP inspected. Hands grip a recognizable intact spool; near figures and distant kite read clearly; upper-left sky provides title space. No baked title or clinical objects.

### 01 · 01_kite-clue_v1.webp

- 最终资产：`books/myopia/assets/01_kite-clue_v1.webp`
- 生成日期：2026-09-16（Asia/Shanghai；文件日期/交接依据）。
- 所选源文件：`exec-fd827bdc-2808-43b1-9245-3c7c30c3e332.png`。
- 封面参考角色：`books/myopia/assets/00_cover_v1.webp` 为角色、配色与画风参考，非编辑目标。
- 提示词性质：规范再生成提示词，非原始调用逐字记录。

```text
Use case: illustration-story
Input images: Image 1 is the approved cover, used as character/style reference, not an edit target.
Primary request: Show Duoduo close in the foreground looking curiously at a distant kite, with the red spool and her hands sharply visible. Father stands supportively in the background. Keep the far kite and its blank pale circular number badge gently blurred; reserve the actual number for an editable HTML/SVG layer. Preserve the warm field and character clothing. Her puzzled expression is mild, never frightening or mocking.
```

验收记录：Clear foreground spool contrasts with gently blurred kite and background. The pale kite badge contains no legible number: the final reader must add its editable number to match the narration.

### 02 · 02_speak-up_v1.webp

- 最终资产：`books/myopia/assets/02_speak-up_v1.webp`
- 生成日期：2026-09-16（Asia/Shanghai；文件日期/交接依据）。
- 所选源文件：`exec-ebce7192-4ce1-444d-af03-3e5b45e8e112.png`。
- 封面参考角色：`books/myopia/assets/00_cover_v1.webp` 为角色、配色与画风参考，非编辑目标。
- 提示词性质：规范再生成提示词，非原始调用逐字记录。

```text
Use case: illustration-story
Input images: Image 1 is the approved cover, used as character/style reference, not an edit target.
Primary request: In the same field, Duoduo holds her red spool in one hand and points toward the distant kite while speaking to her father. He crouches at her eye level and listens warmly. Keep the girl without glasses, with chin-length black bob, yellow windbreaker and teal backpack. Preserve the same kite, landscape and clothing; leave open sky around the figures.
```

验收记录：Supportive eye-level conversation and natural pointing gesture are clear. Father remains a parent in ordinary clothes. No blame, alarm or embarrassment.

### 03 · 03_eye-exam_v1.webp

- 最终资产：`books/myopia/assets/03_eye-exam_v1.webp`
- 生成日期：2026-09-16（Asia/Shanghai；文件日期/交接依据）。
- 所选源文件：`exec-d7b11e68-ab1d-464a-90d6-7c1d821982ce.png`。
- 封面参考角色：`books/myopia/assets/00_cover_v1.webp` 为角色、配色与画风参考，非编辑目标。
- 提示词性质：规范再生成提示词，非原始调用逐字记录。

```text
Use case: illustration-story
Input images: Image 1 is the approved cover, used as character/style reference, not an edit target.
Primary request: Show a calm, painless eye exam in the child-friendly pale blue and warm-white room. Duoduo sits at an optical measuring instrument with father seated nearby. The female Chinese optometrist has short dark-brown hair, a white short medical coat, pale-blue shirt, dark-teal trousers and a small blank badge. She explains the step with a relaxed open hand. Include a simple shape chart, a kite wall picture, and the teal bag with red spool by the chair.
```

验收记录：Safe, calm exam scene; chin rest and measuring equipment are non-invasive. Clinician has the locked short hairstyle; father, bag, spool and kite picture support continuity. Shape chart has symbols, not diagnostic results.

### 04 · 04_light-path_v1.webp

- 最终资产：`books/myopia/assets/04_light-path_v1.webp`
- 生成日期：2026-09-16（Asia/Shanghai；文件日期/交接依据）。
- 所选源文件：`exec-2e037bce-745f-487e-84e0-8f96fe40c52e.png`。
- 封面参考角色：`books/myopia/assets/00_cover_v1.webp` 为角色、配色与画风参考，非编辑目标；本页仅继承画风和配色，不强行加入人物。
- 提示词性质：规范再生成提示词，非原始调用逐字记录。

```text
Use case: scientific-educational
Input images: Image 1 is the approved cover, used as character/style reference, not an edit target.
Primary request: Create an extremely simplified child-friendly eye cutaway on warm paper with a soft blue wash. Orient the transparent curved cornea and pale-blue lens on the left and a coral retinal arc at the back on the right. Three golden parallel rays travel left to right through the front optical structures, then begin converging and stop before forming a focus. Show only these essential structures. Leave generous clear margins for separate editable labels and the diagram-not-to-scale notice.
```

验收记录：Selected simplified replacement for candidate 04. Consistent left-to-right light, distinct cornea/lens and coral retina. Truncated rays intentionally teach entry only; no focus is claimed on this page. Labels and scale disclaimer remain a required HTML/SVG layer.

### 05 · 05_retina-focus_v1.webp

- 最终资产：`books/myopia/assets/05_retina-focus_v1.webp`
- 生成日期：2026-09-16（Asia/Shanghai；文件日期/交接依据）。
- 所选源文件：`exec-8e537275-93d4-4945-8de3-c0906a716442.png`。
- 封面参考角色：`books/myopia/assets/00_cover_v1.webp` 为角色、配色与画风参考，非编辑目标；本页仅继承画风和配色，不强行加入人物。
- 提示词性质：规范再生成提示词，非原始调用逐字记录。

```text
Use case: scientific-educational
Input images: Image 1 is the approved cover, used as character/style reference, not an edit target.
Primary request: Use the same simplified cutaway vocabulary and left-to-right orientation as page 04. Show a normal-focus illustrative eye with three parallel golden incoming rays that converge to one small bright focus on the coral retinal arc at the rear right. Preserve transparent blue front cornea and lens, pale hollow interior, cream outer wall, soft paper texture and empty label margins. Avoid blood vessels, nerves or extra anatomical detail.
```

验收记录：Selected simplified replacement for candidate 07. The single bright focus touches the rear coral retina and does not lie in front of it. Matches page 04 colors and orientation; editable labels still required.

### 06 · 06_myopic-focus_v1.webp

- 最终资产：`books/myopia/assets/06_myopic-focus_v1.webp`
- 生成日期：2026-09-16（Asia/Shanghai；文件日期/交接依据）。
- 所选源文件：`exec-9a9cd7eb-8912-499c-bd1f-83fa2d1989a1.png`。
- 封面参考角色：`books/myopia/assets/00_cover_v1.webp` 为角色、配色与画风参考，非编辑目标；本页仅继承画风和配色，不强行加入人物。
- 提示词性质：规范再生成提示词，非原始调用逐字记录。

```text
Use case: scientific-educational
Input images: Image 1 is the approved cover, used as character/style reference, not an edit target.
Primary request: Show the matching simplified eye model elongated horizontally, front cornea and lens on the left and coral retina at the rear right. Three golden parallel rays enter left to right, converge at a single small bright point visibly before the retina, and spread apart again before striking the retinal arc. Make the gap between focus and retina unmistakable. Use the same cream, pale-blue and coral palette and clear label margins as pages 04 and 05; do not include a person or clinical measurement.
```

验收记录：Selected simplified replacement for candidate 09. The focus is clearly anterior to the retina, with divergence beyond it; elongated outline supports the narrative. No mirrored eye or clinical numeric result. Diagram is illustrative, not anatomical scale.

### 07 · 07_glasses-help_v1.webp

- 最终资产：`books/myopia/assets/07_glasses-help_v1.webp`
- 生成日期：2026-09-16（Asia/Shanghai；文件日期/交接依据）。
- 所选源文件：`exec-ed53f04a-538d-4d25-9d8b-eeb2c1241368.png`。
- 封面参考角色：`books/myopia/assets/00_cover_v1.webp` 为角色、配色与画风参考，非编辑目标。
- 提示词性质：规范再生成提示词，非原始调用逐字记录。

```text
Use case: illustration-story
Input images: Image 1 is the approved cover, used as character/style reference, not an edit target.
Primary request: Back in the same bright eye-exam room, the same short-haired optometrist gently presents teal round glasses to seated Duoduo. Father sits nearby and smiles supportively. Duoduo reaches toward the glasses with relaxed hands. Include her teal bag, red spool, shape chart and kite picture. Preserve the clinician's white coat, pale-blue shirt and dark-teal trousers. Convey professional help without a cure claim, miracle glow or corrective-light diagram.
```

验收记录：Glasses are offered by the professional after the exam. Hands, frame, child and father read naturally. Same short-haired clinician, room motifs and wardrobe; the optical explanation remains in editable text/activity.

### 08 · 08_many-influences_v1.webp

- 最终资产：`books/myopia/assets/08_many-influences_v1.webp`
- 生成日期：2026-09-16（Asia/Shanghai；文件日期/交接依据）。
- 所选源文件：`exec-2285f658-717a-4f82-b57c-caa5c8b7bd30.png`。
- 封面参考角色：`books/myopia/assets/00_cover_v1.webp` 为角色、配色与画风参考，非编辑目标。
- 提示词性质：规范再生成提示词，非原始调用逐字记录。

```text
Use case: illustration-story
Input images: Image 1 is the approved cover, used as character/style reference, not an edit target.
Primary request: Show Duoduo wearing teal glasses at a sunny table with her father, both smiling without blame. A family photograph including older relatives sits beside an open picture book, while a large window shows the green field and neighborhood outside. Include the teal backpack and red spool nearby. Suggest family and environment together without deterministic arrows, genes, percentages or a single causal culprit.
```

验收记录：Family photograph, shared reading and outdoor view suggest multiple influences without declaring a cause. Same girl, father and props; no screen blame or guarantee. Teal glasses continue after page 07.

### 09 · 09_outdoor-play_v1.webp

- 最终资产：`books/myopia/assets/09_outdoor-play_v1.webp`
- 生成日期：2026-09-16（Asia/Shanghai；文件日期/交接依据）。
- 所选源文件：`exec-2ded6a89-e6d3-402f-b2f9-99c597cff1c9.png`。
- 封面参考角色：`books/myopia/assets/00_cover_v1.webp` 为角色、配色与画风参考，非编辑目标。
- 提示词性质：规范再生成提示词，非原始调用逐字记录。

```text
Use case: illustration-story
Input images: Image 1 is the approved cover, used as character/style reference, not an edit target.
Primary request: Show Duoduo walking and flying her red kite alongside her father in the sunny open field. She wears teal glasses, yellow windbreaker and teal backpack and holds the red spool. Keep light movement, grass, distant families, trees and city skyline. A warm, ordinary healthy activity, with no shield, medical badge, protective aura or prevention guarantee.
```

验收记录：Active outdoor walking and kite play, supportive adult and stable character colors. Glasses remain present; picture does not imply outdoor time cures or guarantees prevention.

### 10 · 10_look-far-break_v1.webp

- 最终资产：`books/myopia/assets/10_look-far-break_v1.webp`
- 生成日期：2026-09-16（Asia/Shanghai；文件日期/交接依据）。
- 所选源文件：`exec-725c25fa-681e-412b-bc45-c47ac1b43648.png`。
- 封面参考角色：`books/myopia/assets/00_cover_v1.webp` 为角色、配色与画风参考，非编辑目标。
- 提示词性质：规范再生成提示词，非原始调用逐字记录。

```text
Use case: illustration-story
Input images: Image 1 is the approved cover, used as character/style reference, not an edit target.
Primary request: At a bright home desk, show Duoduo in teal glasses pausing over an open illustrated book and drawing pencils to look through the window at faraway trees, buildings and birds. Her relaxed head rests lightly on her hands. Keep her yellow jacket, chin-length black bob, teal backpack and red spool nearby. Make the near book and far view both recognizable; include no timer, required duration or exercise-cure claim.
```

验收记录：Eyes and face look toward the distant window view, with near work visibly paused. Stable bob, jacket, glasses and bag/spool. No unsupported duration or treatment cue.

### 11 · 11_focus-model_v1.webp

- 最终资产：`books/myopia/assets/11_focus-model_v1.webp`
- 生成日期：2026-09-16（Asia/Shanghai；文件日期/交接依据）。
- 所选源文件：`exec-9e88e80a-e37d-4913-915b-299b3c416fdb.png`。
- 封面参考角色：`books/myopia/assets/00_cover_v1.webp` 为角色、配色与画风参考，非编辑目标。
- 提示词性质：规范再生成提示词，非原始调用逐字记录。

```text
Use case: illustration-story
Input images: Image 1 is the approved cover, used as character/style reference, not an edit target.
Primary request: Show Duoduo in teal glasses and her father introducing a large empty cream presentation board in a friendly home learning space. Duoduo stands left with yellow jacket, teal backpack and red spool; father stands right in the locked clothes, both gesturing toward the blank board. Include a small kite wall picture and soft daylight. Keep the board completely empty for separately rendered interactive SVG, controls and bilingual explanation. No baked diagram, buttons or text.
```

验收记录：Blank-board presentation composition accepted as activity backdrop; character identities and natural gestures remain clear. This bitmap alone is not a finished activity: Task 4 must mount the real controls, diagram and explanatory labels.

### 12 · 12_tell-an-adult_v1.webp

- 最终资产：`books/myopia/assets/12_tell-an-adult_v1.webp`
- 生成日期：2026-09-16（Asia/Shanghai；文件日期/交接依据）。
- 所选源文件：`exec-3a9ea2df-c3a0-4ef5-af02-2dafbb82e802.png`。
- 封面参考角色：`books/myopia/assets/00_cover_v1.webp` 为角色、配色与画风参考，非编辑目标。
- 提示词性质：规范再生成提示词，非原始调用逐字记录。

```text
Use case: illustration-story
Input images: Image 1 is the approved cover, used as character/style reference, not an edit target.
Primary request: Show Duoduo in teal glasses comfortably describing her experience to father and the optometrist in the same bright clinic. Father crouches beside her chair; clinician listens with open hands. Lock clinician to short dark-brown bob, white coat with small blank badge, pale-blue shirt and dark-teal trousers. Keep Duoduo's yellow jacket, teal backpack and red spool; include the shape chart, kite picture and non-invasive equipment. Do not show pain, needles or diagnostic numbers.
```

验收记录：Candidate 18 replaces candidate 13's ponytail with the required short bob. Open conversation reinforces telling an adult and seeking professional help. Wardrobe and clinic motifs match; no fear or blame.

### 13 · 13_glossary_v1.webp

- 最终资产：`books/myopia/assets/13_glossary_v1.webp`
- 生成日期：2026-09-16（Asia/Shanghai；文件日期/交接依据）。
- 所选源文件：`exec-86d9647c-9be8-4b17-bfa3-0d23d4d9716e.png`。
- 封面参考角色：`books/myopia/assets/00_cover_v1.webp` 为角色、配色与画风参考，非编辑目标。
- 提示词性质：规范再生成提示词，非原始调用逐字记录。

```text
Use case: illustration-story
Input images: Image 1 is the approved cover, used as character/style reference, not an edit target.
Primary request: Return to the kite field for a positive ending. Duoduo now wears teal glasses and happily raises her red spool while father stands supportively nearby. Preserve the cover's yellow jacket, teal backpack, chin-length black bob, father's indigo cardigan and khaki trousers, red kite, warm field and open blue sky. Leave open sky and grass for separately rendered glossary content. Do not bake any glossary terms or title into the image.
```

验收记录：Ending echoes the cover with a distinct lifted-spool pose and teal glasses. Hands/spool are intact, mood is confident and welcoming. Six glossary entries stay editable in book data.

## 未采用候选与集成边界

- `exec-098d84cc-be23-4b58-b3bd-db7fdf869b76.png`（候选 04）：较厚实的眼内组织且提前显示完整焦点；页 04 改选简化入光图（候选 10）。
- `exec-e1da15d3-2be0-41fd-8326-511b3f9fb6c8.png`（候选 07）：含血管、神经等多余解剖细节；页 05 改选简化聚焦图（候选 14）。
- `exec-60b9b2cf-2716-4345-bb77-e03837152aa8.png`（候选 09）：户外人物加眼剖面，较难与相邻正常眼图直接比较；页 06 改选匹配的加长简图（候选 16）。
- `exec-62df8e45-33d6-426f-840e-9447c1f51fa1.png`（候选 13）：验光师为马尾，与锁定短发不符；页 12 改选短发修正版（候选 18）。

上述“替换”描述本轮基于成图的选择决定，不推测丢失的原始调用顺序或编辑指令。原始候选均保留，没有删除。

图像层已验收；完整阅读器仍须在后续任务落实：页 01 风筝号码的可编辑文字；页 04–06 的角膜、晶状体、视网膜、焦点标签及“原理示意 / Diagram not to scale”；页 11 的真实聚焦活动和非诊断说明；页 13 的可编辑术语表。位图没有这些文字是按可翻译层合同执行，不代表这些界面要求已经交付。浏览器、音频、书架与线上验收不属于本次图像层验收。

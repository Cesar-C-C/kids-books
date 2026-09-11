# 《幼儿园校车》整书配音 · IndexTTS-2.5 (cesar)

> The Kindergarten School Bus — full bilingual narration voiceover.

用本机 **IndexTTS-2.5** 的 `cesar` 音色克隆，把绘本《幼儿园校车》全部 **11 页**
的中英正文合成为语音，提供 **逐句** 与 **整页** 两种粒度，共 **74 条** 音频。

## 1. 目录结构

```
books/schoolbus/
├── book.js                      # 绘本正文数据（配音文本的唯一来源）
├── overlays.js                  # 气泡热点（另有 edge-tts 生成的点读音频，不在本次范围）
└── audio/
    ├── line_sb_*_{en,zh}.mp3    # 【既有】热点气泡点读音频（edge-tts，未改动）
    └── narration/               # 【本次新增】整书配音
        ├── manifest.json        # 配音清单：页码/句序/文本/语言/文件名
        ├── generation.log       # 逐条合成日志（含每条耗时）
        ├── README.md            # 本文件
        └── pNN_<slug>_*.mp3   # 音频本体，命名规则见 §3
```

生成脚本位于仓库根：`gen_schoolbus_voiceover.py`（`--build` / `--run` / `--mp3` / `--doc`）。

## 2. 生成方式

| 项 | 值 |
|---|---|
| 引擎 | IndexTTS-2.5（本机部署，`C:\Users\Cesar\WorkBuddy\index-tts`）|
| 入口 | `tts_cli.py --manifest ...`（批量，模型只加载一次）|
| 音色 | `cesar` 预设（voice clone，参考音频 40.26s / 44.1kHz / 16bit / mono）|
| 采样率 | 22050 Hz / 单声道 / 16 bit（IndexTTS 原生输出）|
| 交付格式 | MP3 128 kbps（源已是 22.05 kHz 单声道语音，128k 即透明；WAV 母带本地保留、不入库）|
| 扩散步数 | 12（4GB 显存下的默认值，上游默认 25）|
| CFG rate | 0.7 |
| 切块阈值 | 40 字符（`--chunk-chars`，4GB 卡不可调大）|
| 情感模式 | 0 = 跟随音色参考音频 |

### 英文口音策略

**所有英文条目都显式指定 `lang=EN`**，中文条目指定 `lang=ZH`，绝不使用默认的 `auto`。
`auto` 只按"文本里有没有汉字"判断，一旦某个英文句子里混入一个中文字符就会整句切到中文
音素器，发音立刻变味。英文的 G2P 走美式英语音素集。

### 复现命令

```bash
cd <kids-books 仓库根>
python gen_schoolbus_voiceover.py --build   # 重新解析 book.js 生成 manifest.json
python gen_schoolbus_voiceover.py --run     # 批量合成（可断点续跑，已存在的文件跳过）
python gen_schoolbus_voiceover.py --doc     # 重新生成本文件
```

`--run` 每轮只挑"缺失或过小"的条目提交给 IndexTTS，失败/中断后重跑即可，不会重复合成。

## 3. 命名规则

```
pNN_<slug>_full_<lang>.mp3     ← 整页通读（第 NN 页，lang = en | zh）
pNN_<slug>_sN_<lang>.mp3       ← 第 NN 页的第 N 句（N 从 1 开始）
```

- `NN`：页码 `00`–`10`，与 `book.js` 中 `window.PAGES` 的下标一致（00 = 封面）。
- `slug`：与 `overlays.js` 的热点组名对应（`sb_parts` → `parts`）；封面无热点组，固定为 `cover`。
- 文件名按 `pNN` 排序即为阅读顺序。

## 4. 完整清单（74 条 / 成功 74 / 缺失 0）

| 文件 | 页 | 粒度 | 语言 | 时长 | 大小 | 文本 |
|---|---|---|---|---|---|---|
| `p00_cover_full_en.mp3` | 封面 (cover) | 整页 | 英 EN | 3.39s | 54 KB | The Kindergarten School Bus |
| `p00_cover_s1_en.mp3` | 封面 (cover) | 第 1 句 | 英 EN | 3.11s | 50 KB | The Kindergarten School Bus |
| `p00_cover_full_zh.mp3` | 封面 (cover) | 整页 | 中 ZH | 2.71s | 44 KB | 幼儿园校车 |
| `p00_cover_s1_zh.mp3` | 封面 (cover) | 第 1 句 | 中 ZH | 2.43s | 39 KB | 幼儿园校车 |
| `p01_parts_full_en.mp3` | 整车部件 (parts) | 整页 | 英 EN | 14.40s | 227 KB | This is our kindergarten school bus! It is a happy yellow bus that picks children up and brings them safely to school. Big windows let us watch the world go by. |
| `p01_parts_s1_en.mp3` | 整车部件 (parts) | 第 1 句 | 英 EN | 3.87s | 62 KB | This is our kindergarten school bus! |
| `p01_parts_s2_en.mp3` | 整车部件 (parts) | 第 2 句 | 英 EN | 6.50s | 103 KB | It is a happy yellow bus that picks children up and brings them safely to school. |
| `p01_parts_s3_en.mp3` | 整车部件 (parts) | 第 3 句 | 英 EN | 4.50s | 72 KB | Big windows let us watch the world go by. |
| `p01_parts_full_zh.mp3` | 整车部件 (parts) | 整页 | 中 ZH | 12.22s | 192 KB | 这是我们的幼儿园校车！它是一辆快乐的黄色巴士，接上小朋友，把他们安全送到幼儿园。大大的车窗让我们看外面的世界。 |
| `p01_parts_s1_zh.mp3` | 整车部件 (parts) | 第 1 句 | 中 ZH | 3.83s | 61 KB | 这是我们的幼儿园校车！ |
| `p01_parts_s2_zh.mp3` | 整车部件 (parts) | 第 2 句 | 中 ZH | 6.34s | 100 KB | 它是一辆快乐的黄色巴士，接上小朋友，把他们安全送到幼儿园。 |
| `p01_parts_s3_zh.mp3` | 整车部件 (parts) | 第 3 句 | 中 ZH | 4.11s | 66 KB | 大大的车窗让我们看外面的世界。 |
| `p02_driver_full_en.mp3` | 驾驶室 (driver) | 整页 | 英 EN | 11.57s | 182 KB | The driver sits up front and holds the big steering wheel. The driver watches the road carefully and keeps every child safe on the trip. |
| `p02_driver_s1_en.mp3` | 驾驶室 (driver) | 第 1 句 | 英 EN | 5.19s | 82 KB | The driver sits up front and holds the big steering wheel. |
| `p02_driver_s2_en.mp3` | 驾驶室 (driver) | 第 2 句 | 英 EN | 5.70s | 91 KB | The driver watches the road carefully and keeps every child safe on the trip. |
| `p02_driver_full_zh.mp3` | 驾驶室 (driver) | 整页 | 中 ZH | 9.18s | 145 KB | 司机坐在最前面，握着大方向盘。司机认真看着路，一路上保护每个小朋友的安全。 |
| `p02_driver_s1_zh.mp3` | 驾驶室 (driver) | 第 1 句 | 中 ZH | 4.75s | 76 KB | 司机坐在最前面，握着大方向盘。 |
| `p02_driver_s2_zh.mp3` | 驾驶室 (driver) | 第 2 句 | 中 ZH | 5.50s | 87 KB | 司机认真看着路，一路上保护每个小朋友的安全。 |
| `p03_inside_full_en.mp3` | 车厢内部 (inside) | 整页 | 英 EN | 14.08s | 221 KB | Inside, there are rows of cozy seats and a wide aisle down the middle. Friends sit together, talk, and sing on the way to school! |
| `p03_inside_s1_en.mp3` | 车厢内部 (inside) | 第 1 句 | 英 EN | 8.06s | 127 KB | Inside, there are rows of cozy seats and a wide aisle down the middle. |
| `p03_inside_s2_en.mp3` | 车厢内部 (inside) | 第 2 句 | 英 EN | 6.02s | 96 KB | Friends sit together, talk, and sing on the way to school! |
| `p03_inside_full_zh.mp3` | 车厢内部 (inside) | 整页 | 中 ZH | 12.58s | 198 KB | 车里有一排排舒服的座位，中间是一条宽宽的走道。小伙伴们坐在一起，聊天、唱歌，开开心心去幼儿园！ |
| `p03_inside_s1_zh.mp3` | 车厢内部 (inside) | 第 1 句 | 中 ZH | 6.27s | 99 KB | 车里有一排排舒服的座位，中间是一条宽宽的走道。 |
| `p03_inside_s2_zh.mp3` | 车厢内部 (inside) | 第 2 句 | 中 ZH | 6.50s | 103 KB | 小伙伴们坐在一起，聊天、唱歌，开开心心去幼儿园！ |
| `p04_wheels_full_en.mp3` | 车轮 (wheels) | 整页 | 英 EN | 14.92s | 234 KB | Look at the wheels! Thick black tires grip the road, and shiny hubcaps spin round and round. The wheels roll the bus all the way to school. |
| `p04_wheels_s1_en.mp3` | 车轮 (wheels) | 第 1 句 | 英 EN | 2.67s | 43 KB | Look at the wheels! |
| `p04_wheels_s2_en.mp3` | 车轮 (wheels) | 第 2 句 | 英 EN | 7.18s | 114 KB | Thick black tires grip the road, and shiny hubcaps spin round and round. |
| `p04_wheels_s3_en.mp3` | 车轮 (wheels) | 第 3 句 | 英 EN | 4.03s | 65 KB | The wheels roll the bus all the way to school. |
| `p04_wheels_full_zh.mp3` | 车轮 (wheels) | 整页 | 中 ZH | 8.99s | 142 KB | 看车轮！厚厚的黑色轮胎抓住路面，亮亮的轮毂转呀转。车轮带着巴士一路开到幼儿园。 |
| `p04_wheels_s1_zh.mp3` | 车轮 (wheels) | 第 1 句 | 中 ZH | 2.00s | 33 KB | 看车轮！ |
| `p04_wheels_s2_zh.mp3` | 车轮 (wheels) | 第 2 句 | 中 ZH | 5.70s | 91 KB | 厚厚的黑色轮胎抓住路面，亮亮的轮毂转呀转。 |
| `p04_wheels_s3_zh.mp3` | 车轮 (wheels) | 第 3 句 | 中 ZH | 4.23s | 67 KB | 车轮带着巴士一路开到幼儿园。 |
| `p05_stopsign_full_en.mp3` | 停车牌 (stopsign) | 整页 | 英 EN | 15.11s | 238 KB | When the bus stops, the red stop sign swings out and the yellow lights flash. Cars must wait. Then children can cross the road safely. |
| `p05_stopsign_s1_en.mp3` | 停车牌 (stopsign) | 第 1 句 | 英 EN | 8.18s | 129 KB | When the bus stops, the red stop sign swings out and the yellow lights flash. |
| `p05_stopsign_s2_en.mp3` | 停车牌 (stopsign) | 第 2 句 | 英 EN | 2.59s | 42 KB | Cars must wait. |
| `p05_stopsign_s3_en.mp3` | 停车牌 (stopsign) | 第 3 句 | 英 EN | 4.14s | 66 KB | Then children can cross the road safely. |
| `p05_stopsign_full_zh.mp3` | 停车牌 (stopsign) | 整页 | 中 ZH | 12.38s | 195 KB | 巴士一停下，红色停车牌就伸出来，黄灯一闪一闪。小汽车必须等着。这样小朋友才能安全过马路。 |
| `p05_stopsign_s1_zh.mp3` | 停车牌 (stopsign) | 第 1 句 | 中 ZH | 5.58s | 89 KB | 巴士一停下，红色停车牌就伸出来，黄灯一闪一闪。 |
| `p05_stopsign_s2_zh.mp3` | 停车牌 (stopsign) | 第 2 句 | 中 ZH | 2.79s | 45 KB | 小汽车必须等着。 |
| `p05_stopsign_s3_zh.mp3` | 停车牌 (stopsign) | 第 3 句 | 中 ZH | 4.06s | 65 KB | 这样小朋友才能安全过马路。 |
| `p06_doors_full_en.mp3` | 车门 (doors) | 整页 | 英 EN | 13.58s | 214 KB | At the kindergarten, the door opens with a friendly beep. One by one, children hop down the steps and wave goodbye to the driver. |
| `p06_doors_s1_en.mp3` | 车门 (doors) | 第 1 句 | 英 EN | 6.14s | 98 KB | At the kindergarten, the door opens with a friendly beep. |
| `p06_doors_s2_en.mp3` | 车门 (doors) | 第 2 句 | 英 EN | 7.34s | 116 KB | One by one, children hop down the steps and wave goodbye to the driver. |
| `p06_doors_full_zh.mp3` | 车门 (doors) | 整页 | 中 ZH | 8.50s | 134 KB | 到了幼儿园，车门"哔"的一声打开。小朋友一个接一个跳下台阶，跟司机挥手说再见。 |
| `p06_doors_s1_zh.mp3` | 车门 (doors) | 第 1 句 | 中 ZH | 4.55s | 73 KB | 到了幼儿园，车门"哔"的一声打开。 |
| `p06_doors_s2_zh.mp3` | 车门 (doors) | 第 2 句 | 中 ZH | 6.11s | 97 KB | 小朋友一个接一个跳下台阶，跟司机挥手说再见。 |
| `p07_aide_full_en.mp3` | 随车老师 (aide) | 整页 | 英 EN | 14.56s | 229 KB | A kind bus aide rides along to help. The aide finds each child a seat, fastens a belt, and makes sure everyone is happy and safe. |
| `p07_aide_s1_en.mp3` | 随车老师 (aide) | 第 1 句 | 英 EN | 3.55s | 57 KB | A kind bus aide rides along to help. |
| `p07_aide_s2_en.mp3` | 随车老师 (aide) | 第 2 句 | 英 EN | 10.36s | 163 KB | The aide finds each child a seat, fastens a belt, and makes sure everyone is happy and safe. |
| `p07_aide_full_zh.mp3` | 随车老师 (aide) | 整页 | 中 ZH | 11.66s | 184 KB | 一位亲切的随车老师也坐车上帮忙。她帮每个小朋友找到座位、系好安全带，让大家又开心又安全。 |
| `p07_aide_s1_zh.mp3` | 随车老师 (aide) | 第 1 句 | 中 ZH | 4.83s | 77 KB | 一位亲切的随车老师也坐车上帮忙。 |
| `p07_aide_s2_zh.mp3` | 随车老师 (aide) | 第 2 句 | 中 ZH | 6.34s | 100 KB | 她帮每个小朋友找到座位、系好安全带，让大家又开心又安全。 |
| `p08_road_full_en.mp3` | 在路上 (road) | 整页 | 英 EN | 13.85s | 218 KB | On the road, the bus follows the rules. It waits at red lights, slows at the crosswalk, and shares the street with cars and people. |
| `p08_road_s1_en.mp3` | 在路上 (road) | 第 1 句 | 英 EN | 3.75s | 60 KB | On the road, the bus follows the rules. |
| `p08_road_s2_en.mp3` | 在路上 (road) | 第 2 句 | 英 EN | 10.25s | 162 KB | It waits at red lights, slows at the crosswalk, and shares the street with cars and people. |
| `p08_road_full_zh.mp3` | 在路上 (road) | 整页 | 中 ZH | 8.19s | 129 KB | 在路上，巴士遵守规则。红灯前停下，斑马线前放慢，和小汽车、行人一起走。 |
| `p08_road_s1_zh.mp3` | 在路上 (road) | 第 1 句 | 中 ZH | 3.87s | 62 KB | 在路上，巴士遵守规则。 |
| `p08_road_s2_zh.mp3` | 在路上 (road) | 第 2 句 | 中 ZH | 6.58s | 104 KB | 红灯前停下，斑马线前放慢，和小汽车、行人一起走。 |
| `p09_arrive_full_en.mp3` | 到达 (arrive) | 整页 | 英 EN | 14.00s | 220 KB | Here we are! The bus arrives at the kindergarten gate. Children run to the slide and swings, ready for a fun day of play and learning. |
| `p09_arrive_s1_en.mp3` | 到达 (arrive) | 第 1 句 | 英 EN | 1.92s | 31 KB | Here we are! |
| `p09_arrive_s2_en.mp3` | 到达 (arrive) | 第 2 句 | 英 EN | 3.83s | 61 KB | The bus arrives at the kindergarten gate. |
| `p09_arrive_s3_en.mp3` | 到达 (arrive) | 第 3 句 | 英 EN | 8.06s | 127 KB | Children run to the slide and swings, ready for a fun day of play and learning. |
| `p09_arrive_full_zh.mp3` | 到达 (arrive) | 整页 | 中 ZH | 11.14s | 176 KB | 到啦！巴士停在幼儿园门口。小朋友跑向滑梯和秋千，准备开始快乐的一天——玩耍和学本领。 |
| `p09_arrive_s1_zh.mp3` | 到达 (arrive) | 第 1 句 | 中 ZH | 1.56s | 26 KB | 到啦！ |
| `p09_arrive_s2_zh.mp3` | 到达 (arrive) | 第 2 句 | 中 ZH | 3.31s | 53 KB | 巴士停在幼儿园门口。 |
| `p09_arrive_s3_zh.mp3` | 到达 (arrive) | 第 3 句 | 中 ZH | 6.75s | 107 KB | 小朋友跑向滑梯和秋千，准备开始快乐的一天——玩耍和学本领。 |
| `p10_vocab_full_en.mp3` | 词汇回顾 (vocab) | 整页 | 英 EN | 9.53s | 150 KB | Great job, little rider! You learned the parts of the school bus. Can you name them all? |
| `p10_vocab_s1_en.mp3` | 词汇回顾 (vocab) | 第 1 句 | 英 EN | 3.11s | 50 KB | Great job, little rider! |
| `p10_vocab_s2_en.mp3` | 词汇回顾 (vocab) | 第 2 句 | 英 EN | 3.39s | 54 KB | You learned the parts of the school bus. |
| `p10_vocab_s3_en.mp3` | 词汇回顾 (vocab) | 第 3 句 | 英 EN | 2.43s | 39 KB | Can you name them all? |
| `p10_vocab_full_zh.mp3` | 词汇回顾 (vocab) | 整页 | 中 ZH | 6.83s | 108 KB | 做得好，小车友！你认识了校车的各个部件。你能叫出它们的名字吗？ |
| `p10_vocab_s1_zh.mp3` | 词汇回顾 (vocab) | 第 1 句 | 中 ZH | 2.67s | 43 KB | 做得好，小车友！ |
| `p10_vocab_s2_zh.mp3` | 词汇回顾 (vocab) | 第 2 句 | 中 ZH | 4.11s | 66 KB | 你认识了校车的各个部件。 |
| `p10_vocab_s3_zh.mp3` | 词汇回顾 (vocab) | 第 3 句 | 中 ZH | 3.55s | 57 KB | 你能叫出它们的名字吗？ |

合计时长约 **8.3 分钟**，总体积 **7.7 MB**。

## 5. 已知限制

- **音色与口音同源**：cesar 是音色克隆，英文的"音色质感"来自 40 秒参考音频；
  引擎侧只保证美式英语音素（`lang=EN`），不改变参考音频本身的说话习惯。
  若要求纯正美式播音腔，需换用美式英语参考音频（那就不再是 cesar 音色）。
- **本次不含热点气泡音频**：`audio/line_sb_*` 仍是 edge-tts 版本，未替换。
- **4GB 显存**：合成速度约 1–3 分钟/段，全量耗时数小时；期间请勿启动 WebUI（抢显存会慢 2–5 倍）。
- 无情感标注：全部按"跟随音色参考"合成，未做高兴/温柔等情感区分。

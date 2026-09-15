# 本地分角色配音：来源与复现

配音引擎：Fun-CosyVoice3-0.5B（FunAudioLLM/Fun-CosyVoice3-0.5B-2512），本地 CUDA FP32。
中英文正文、知识卡和词汇直接从 `book.js` 导出；188 个分段合成为 80 条页面音频。
角色对白依据引号划分，原文内容不另写一份；旁白负责对白之间的叙述。

## 参考声音署名

参考录音来自 [SDialog / voices-libritts](https://huggingface.co/datasets/sdialog/voices-libritts)，
该整理库标注 Apache-2.0；原始 [LibriTTS](https://www.openslr.org/60/) 语料为
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)。
LibriTTS: Heiga Zen et al., “LibriTTS: A Corpus Derived from LibriSpeech for Text-to-Speech”,
Interspeech 2019, DOI: 10.21437/Interspeech.2019-2441。

| 虚构角色 | 参考录音者 / 语料 speaker ID | 裁剪范围（秒） | 表演方向 |
| --- | --- | --- | --- |
| 旁白 | Kara Shallenberg / 19 | 2.04–7.34 | 温柔亲切、自然讲述 |
| 滴滴 | Alys AtteWater / 16 | 0–6.78 | 明亮、活泼、好奇 |
| 青蛙阿跳 | Gord Mackenzie / 17 | 1.01–9.44 | 爽朗、友好 |
| 尘埃 | Kristin Hughes / 28 | 2.87–8.89 | 轻巧、俏皮 |
| 云中邻居 | Michelle Crandall / 22 | 0–12 | 轻快、鼓励 |
| 小柳树 | Kristin LeMoine / 14 | 0–9.02 | 慈爱、从容 |
| 蚯蚓 | Denny Sayers / 26 | 1.83–13.83 | 沉稳、憨厚 |

录音经过裁剪，仅用作音色条件；绘本中的台词均为 AI 重新合成，
不是参考录音者的原始演出，也不表示他们参与、认可或代言本书。
同一角色在中英文中使用同一参考录音；没有把调节音高当作不同说话人。
原始参考录音与无损分段保留在本地制作目录，不纳入绘本离线包。

## 本地制作流程

1. 使用 `node tools/cosyvoice_cloud_cast.cjs <制作目录>/manifest.json` 导出文本与角色指令。
2. 制作目录中的 `reference-sources.json` 记录每个角色的参考 WAV 路径、原始下载 URL 和署名。
3. 用已部署环境的 Python 运行 `tools/generate_cloud_cosyvoice.py --runtime <已部署模型目录> --work <制作目录>`。
4. `progress.json` 按文本、指令与参考音频的指纹记录断点；`clips/` 存无损片段。
5. 合成结束后 `final/` 应有 80 个可解码 MP3，`validation.json` 记录时长和大小。
6. 核验与试听后再替换绘本 `audio/`，递增 `cloud.js` 中的 `AUDIO_VER`，并重新生成 `pwa-assets.js`。

各分段保留自然停顿；合并时增加短间隔并限制峰值。播放控制继续使用既有阅读器，翻页、切换语言与停止时取消旧播放。

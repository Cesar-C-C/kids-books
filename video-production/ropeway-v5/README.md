# 索道小探险 · 3D配音修订版 v5

5–8岁；横屏1920×1080 / 24fps；9分57.5秒；104组中英双语字幕；普通话与英语可切换。

## 此次修订

- 约2:37：中文配音中的“行走轮”连续读出，保留原字幕。
- 约8:32：中文配音中的“不故意”连续读出，保留原字幕。
- 约8:38：“担心什么？”改为“如果担心，”，中文配音与字幕同步修改。

实际句子起点仍为154.5374、510.05897、514.70917秒。用户标记的是听到相关词组的附近时间。
旁白时间线保持不变。英文配音母版和模型库逐字节保留；画面沿用v4，只重新合成包含更正字幕的20.833秒区间。其余13840帧的图像编码内容经过对比保留。
中文母版先解码，在三个原句时间窗内替换，再整体编码为AAC；重新编码前，窗外PCM逐样本一致，编码后不宣称样本逐字节一致。

中文采用已有Fun-CosyVoice3-0.5B、CUDA FP32及原片官方示例参考声音。参考WAV的哈希及准确文本见zh-reference-provenance.json。
初次生成的“不故意”仍在“不”后出现停顿，没有采用该候选。为保持连读，采用含“我们”语境前缀的候选，从波形及词时间边界裁掉该前缀；最终输出只有指定句子，ASR检查不含“我们”。前缀只用于合成，未加入字幕或成片配音。
音量与原句匹配并限制短暂峰值；第二句采用约1.037倍保调变速，其余两句不变速。三个成片句子均落在原时间窗内，不移动后续镜头。

## 文件与重新生成

annotations.py、compose_film.py：v4的内容标记和字幕样式；新译文来自full-timing.json。
speech-revisions.json：三处修订的指定文字、旧文、字幕、时间窗与关键词。
audio-zh-raw / audio-zh-prepared：合成候选及最终句子WAV。
narration-zh.m4a / narration-en.m4a：成片两种配音母版，无需再次合成即可重建视频。
patch_audio.py、patch_picture.py、deliver_revisions.py：本机对v4的音频、局部画面及完整交付的修改流程，需要同机v4文件。
synthesize_revisions.py、refine_compound.py：复现本次中文合成的参数，依赖已有共享运行时。
check_revised_speech.py：本地Whisper small的词时间核查；识别结果存在部分同音字替代，不作为人工听感验收。
verify_speech_delivery.py、final-qa.json：成片解码、旧版哈希、字幕唯一改动、时间线和真实浏览器检查记录。

完整重建不需要v4文件或重新合成配音：保持压缩包目录结构，在解压根目录运行

```powershell
python work/ropeway-3d-v5/render_project.py --blender "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" --ffmpeg "C:/path/to/ffmpeg.exe"
```

需要Blender5.2、Python3.11+、NumPy、Pillow、支持libass/minterpolate/libx264的FFmpeg，以及Microsoft YaHei与Segoe UI字体。重新合成语音使用现有的Python3.10与Fun-CosyVoice运行时，不属于重建视频的必要步骤。
继承v3/v4的镜头来源：关键运行镜头原生24fps，部分讲解镜头720p/8fps经运动补偿输出24fps；本次没有重新建模或提升这些原始镜头分辨率。

## 模型说明与验收范围

模型为通用原理示意，结构、比例、剖视和动作速度经过教学简化。中间站展示两段独立绳环、同一吊厢经轨道输送到下一段的案例；具体设备以运营方说明为准。类型对比和局部往返观察镜头仅作教学示例。
本次核查包括词内时间连续性、ASR关键词与前缀删除、音量与时间窗、成片字幕、整片解码和17项浏览器播放检查。没有新增人工听音或实体设备验收。
旧的2D、3D v1、v2、v3和v4产物均保留；它们不在此包中被覆盖。

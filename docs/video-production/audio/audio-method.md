# 科普视频旁白方法移交：ropeway-3d-v5

## 范围与证据边界

本模块复盘的是 sourceRoot 中的 work/ropeway-3d-v5 成片旁白修订，不是 animation-content-v5，也不是上一项 RopewayStation 短动画批次。该版 README 记录成片长 597.5 秒、1920×1080/24fps、104 组中英双语字幕；中文和英文旁白分别存为 narration-zh.m4a 与 narration-en.m4a。输出视频、双语 SRT 和两条旁白母版的绑定哈希见同目录 receipt.json。

本次只读了指定脚本、报告、QA、SRT、成片清单和配音方法来源；没有生成或修改音频，没有播放/解码整片，没有运行 ASR，也没有新增人工听审。源中已有的 ASR 是机器证据，不等于旁白自然度或术语通过。

## 实际合成路线：必须按语言区分

| 来源 | 实际调用与检查 | 参考音频 | 可确认与不可确认 |
|---|---|---|---|
| 较早的 ropeway-explorer 英文旁白 | Fun-CosyVoice3-0.5B；inference_cross_lingual；输入含结构前缀 “You are a helpful assistant.<\|endofprompt\|>” 后接英语句子；模型以 fp16=False 加载。历史日志记录 PyTorch CUDA 可用、设备 Quadro T1000 Max-Q。 | 本机共享运行时的 CosyVoice/asset/cross_lingual_prompt.wav；记录 SHA-256 353a7715c2e4811f4045658b29d1ce67ecad5120e09de10ce890f1763aab486c。此路线不传参考文本；不要编造 prompt transcript。 | 合成批处理脚本没有设置手工种子，旧批次 seed 应记为未记录，而不是补一个值。该目录 README 将此记作官方跨语言样例路线，自动 ASR 不代表人耳通过。 |
| ropeway-3d-v5 三处中文修订 | Fun-CosyVoice3-0.5B；inference_zero_shot；CUDA FP32，脚本 fp16=False；结构前缀接准确的中文参考文本。初始三条种子依次为 20261004、20261005、20261006；“不故意”的带上下文候选使用种子 20261015。 | zero_shot_prompt.wav；SHA-256 c7b31d6dbe7cc6a716dded00550db5b50940bf209e424e4ad207b12e657c8ff6；精确 transcript：希望你以后能够做的比我还好呦。 | v5 报告确认模型名、API、精度、采样率、声道及每条 seed；没有记录 CosyVoice 源码提交号或当时 PyTorch build，因此不要用现在安装的版本倒推历史版本。 |

旧英文批次 QA 统计 99 个片段：raw 总时长 523.2 秒，裁静音后 516.61825 秒，按 1.043673232 左右的统一保调 tempo 得到 493.251875 秒。README 和 audio-qa.json 将变速列为控制总片长的后处理经验，不是新项目的默认参数。v5 三句里只有 s31b1 的 atempo 为 1.037121；其他两句为 1.0。

v5 使用的窄范围 wrapper fallback 是：现有 Fun-CosyVoice wrapper 的 uv trampoline 孤立/失效后，由 tts_bootstrap.py 直接挂接共享目录 C:\ProgramData\FunCosyVoice3 中的既有 CPython/site-packages、CosyVoice 源路径及 DLL 搜索目录，并把缓存限定在项目工作区；未安装或升级 runtime。日志同时显示 PyTorch CUDA 可用和 T1000 设备，但 ONNX Runtime 报告 CUDAExecutionProvider 不可用，另有 SDPA/Flash Attention 警告；因此精确说法是主 TTS 模型被记录为 CUDA FP32，不能外推为所有前后处理子模块都在 GPU 上运行。

## 来源与权限表述

v5 本地 provenance 文件把中文参考 WAV 归到 CosyVoice 仓库 asset/zero_shot_prompt.wav，记录了 SHA、精确 transcript、example.py 和 LICENSE 链接。较早英文批次日志将 cross_lingual_prompt.wav 记为官方仓库示例资产并记录本地文件 SHA；它没有参考 transcript。

官方 example.py 展示零样本参考 WAV+文本的调用，也展示不带参考 transcript 的 cross-lingual 调用（https://github.com/FunAudioLLM/CosyVoice/blob/main/example.py；当前链接重定向到 QwenAudio/CosyVoice，2026-10-04 查看）。仓库当前 LICENSE 文件标为 Apache License 2.0（https://github.com/FunAudioLLM/CosyVoice/blob/main/LICENSE）。这仅能说明当前仓库许可证文本和示例用法；不证明样例录音中说话人的同意、声音/录音本身的授权范围、模型权重的独立条件，或本项目输出的商业分发权已清理。以上事项保持“未核实”，不构成法律结论。

中文参考的 SHA 与 transcript 必须作为一对冻结；英文 cross-lingual 参考应明确 transcript=null。不可为了字段完整而捏造英文参考文本，也不可把仓库软件 license 当作录音许可。

## 字幕、旁白和翻译映射

字幕文本和每一种语言实际朗读的文本是独立字段；不能假设中英字幕、配音脚本逐字相同。s12b0 就是明确例子：英文句子是 “As the cabin enters, its carrier wheels run onto a station rail.”；中文旁白是“进站时，吊厢组件的行走轮驶上轨道。”；中文字幕则是“吊厢进入车站时，吊厢组件上的行走轮驶上站内轨道。”。这是同一稳定 beat ID 下的内容映射，不是 hash 相等。

v5 三个改动 ID 的 SRT 字幕显示窗与实际替换音频窗分开如下（SRT 时间按毫秒显示，音频窗来自 patch QA）：

| ID | SRT 字幕窗（秒） | 音频替换窗（秒） | 最终句长 / 保调 tempo |
|---|---:|---:|---:|
| s12b0 | 154.537–159.182 | 154.537–159.142 | 3.38725 秒 / 1.0 |
| s31b1 | 510.059–514.709 | 510.059–514.669 | 4.57754 秒 / 1.037121 |
| s31b2 | 514.709–521.600 | 514.709–521.560 | 4.46617 秒 / 1.0 |

s31b2 的中文原句/旧字幕起首为“担心什么？”，v5 将朗读与中文字幕改为“如果担心，”；对应英文字幕仍为 “Worried? Tell your grown-up. Follow the posted instructions to contact staff.”。改稿时要在稳定 ID 下分别冻结朗读、字幕及翻译映射与各自 hash。

## v5 局部修订证据与边界

patch_audio.py 从 v4 中文母版解码为 24 kHz 单声道 float PCM，只在上述三个旧槽位清零并放入新句；旁白时间线没有移动。生成候选先按阈值裁句首尾静音，再估计与邻接旧旁白的 RMS 增益，并通过 limiter 控制瞬时峰值；QA 中三句 limiter 后 peak 均约为 0.84。记录的 target/output voice RMS 与响度差为：

| ID | 邻接目标 RMS | 准备后 RMS | loudness delta | peak |
|---|---:|---:|---:|---:|
| s12b0 | 0.140935 | 0.121768 | −1.270 dB | 0.840 |
| s31b1 | 0.152225 | 0.135267 | −1.026 dB | 0.840 |
| s31b2 | 0.183970 | 0.162603 | −1.072 dB | 0.840 |

“不故意”首次按目标句直合成后仍在“不”后停顿，因此该候选没有采用。修订者另合成一个句首含“我们”的上下文候选（raw SHA-256 bfb27795254e1b56110e97921ed792918442b66e5863795b8a512f4b645bf39e），之后使用上下文候选 SHA-256 5ec730a8cf470f40cbb85671c6a0f7e0ecde1fb6038637b85501c1014b31530d。patch 脚本按词边界证据裁去 0.51 秒上下文，再把最终句放回原窗；成品句 SHA-256 为 4bf9d5a2459b7f148ccecb392e1e219ab7015258d80db398728cf63f980e8346。已记录的 ASR 文本中没有“我们”。这是这一次经边界核查的候选处理，不是可无条件复用的“句首加词”规则；每次局部 cue 都要单独听辨、量界并保留旧候选。

patch QA 声明：AAC 编码前，三个槽位以外的 PCM 与基线逐样本一致；随后整条中文旁白重新编码为 AAC 一次，因此不能声称有损编码后的槽外解码样本仍逐样本一致。移交记录应保存基线/候选/交付 SHA、改动窗、AAC codec 与整轨重编码边界。

## 机器检查与人工检查必须分开

speech-asr-final.json 是既有机器 ASR/词时间记录：s12b0 相似度 0.733，出现“近战/组建/试”等同音替代；s31b1 相似度 0.895，出现“吊箱/箱门”；s31b2 为 1.0。ASR 可提示漏词/上下文是否出现，但相似度不是发音自然度、术语准确度或人工验收。v5 README 明确说没有新增人工听音或实体设备验收；本次复盘也没有听整片。

未来每条旁白分别记录机器解码/hash/时长/峰值、ASR 结果与人工听审状态。人工听审应声明实际试听 ID/范围及结论，至少分别标自然度、术语发音和字幕同步；未试听必须保持 pending/not_performed。

## 未来复用流程

1. 冻结来源 variant、稳定 composition/beat ID、原文与译文映射、朗读文本、字幕文本和源文件 SHA；为每种字符串独立计算 UTF-8 SHA-256。适龄口语可以与字幕不同，但差异必须有显式映射。
2. 先确认参考音频来源、文件 SHA、适用推理模式和授权边界。zero-shot 必须配准确 transcript；cross-lingual transcript-free 模式则明确留空，不猜词。仓库/模型许可证与样例说话人/录音/商用权分开记录。
3. 按语言做新稿短样，术语及自然度由人试听批准后再批量生成；记录实际 API、checkpoint/runtime 版本、GPU/精度、seed、提示前缀和所有显式/默认参数。未记录的值写 unknown/unrecorded。
4. 保存原始 WAV 与 hash，记采样率、声道、样本数/时长、RMS、peak。裁静音、RMS 匹配、peak limiter 与保调 tempo 都记处理前后值，不把这次 0.88、1.037 或任何比例设为通用常量。
5. 将 audio target window 与真实 subtitle display window 分别绑定；检查整句实际时长落在目标时间窗内。只有测过真实词级 alignment 才能填词时码；否则使用句级字幕。
6. 局部改音先冻结母版并保留所有旧/新候选；记录被替换窗口以及窗口外 PCM 的编码前一致性。整轨 AAC/MP3 重新编码会改变有损编码解码值，必须在 QA 中明示，不宣称编码后 bit-identical。
7. 自动 ASR 与人工听审分栏。批次只有机器校验不得标为人耳通过；只有用户或指定听审明确验收的片段才标 human accepted。发布/复制到正式视频目录另有授权门槛。

同目录 narration-record.schema.json 与 narration-record.template.json 是刻意受限的单轨记录契约；hash 与路径只能绑定冻结输入，不能替代人耳验收或许可核查。

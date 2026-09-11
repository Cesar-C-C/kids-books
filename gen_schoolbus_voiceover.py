#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""gen_schoolbus_voiceover.py -- whole-book narration voiceover for 《幼儿园校车》.

Two phases:

  --build   Parse books/schoolbus/book.js PAGES, split every page's EN/ZH text
            into sentences, and emit a manifest at
              books/schoolbus/audio/narration/manifest.json
  --run     Batch-synthesise every manifest item with IndexTTS-2.5 (cesar
            preset) via the cross-project CLI, resumably.
  --mp3     Transcode the produced WAVs to MP3 (needs a working ffmpeg).

Naming contract (stable -- readers/docs depend on it):

  pNN_<slug>_full_<lang>.wav   whole-page narration   (NN = page index 00..10)
  pNN_<slug>_sN_<lang>.wav     sentence N of that page (N = 1-based)
  <lang> is en | zh.

The slug mirrors the hotspot prefix in overlays.js (sb_parts -> parts); the
cover page has no overlay group so it is always `cover`.

Language handling / accent policy
---------------------------------
English items are ALWAYS sent with an explicit lang=EN so the American-English
G2P is used; Chinese items with lang=ZH.  Only `lang: "auto"` would let a stray
CJK glyph flip the phonemiser, which is why this is pinned per item.
"""
import argparse
import json
import os
import re
import subprocess
import sys
import time
import wave

REPO = os.path.dirname(os.path.abspath(__file__))
BOOK = os.path.join(REPO, "books", "schoolbus")
BOOKJS = os.path.join(BOOK, "book.js")
OUTDIR = os.path.join(BOOK, "audio", "narration")
MANIFEST = os.path.join(OUTDIR, "manifest.json")
LOG = os.path.join(OUTDIR, "generation.log")

TTS_PY = r"C:\Users\Cesar\WorkBuddy\index-tts\.venv\Scripts\python.exe"
TTS_CLI = r"C:\Users\Cesar\WorkBuddy\index-tts\tts_cli.py"
VOICE = "cesar"

# --- text extraction ---------------------------------------------------------

def _sfield(chunk, key):
    """First single-quoted value of `key:` in chunk (values may hold \" )."""
    m = re.search(r"\b" + key + r"\s*:\s*'((?:[^'\\]|\\.)*)'", chunk)
    if not m:
        return None
    return m.group(1).replace("\\'", "'").replace('\\"', '"')


def split_sentences_en(text):
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]


def split_sentences_zh(text):
    return [s.strip() for s in re.split(r"(?<=[。！？；])", text) if s.strip()]


def parse_pages():
    src = open(BOOKJS, encoding="utf-8").read()
    body = src[src.index("window.PAGES"):]
    chunks = re.split(r"(?=img:\s*')", body)[1:]   # drop preamble
    pages = []
    for idx, c in enumerate(chunks):
        img = _sfield(c, "img")
        en = _sfield(c, "en")
        zh = _sfield(c, "zh")
        if not img or not en or not zh:
            continue
        ov = _sfield(c, "ov")
        slug = ov.replace("sb_", "") if ov else "cover"
        pages.append({"idx": idx, "slug": slug, "img": img, "en": en, "zh": zh,
                      "cover": bool(_sfield(c, "cover"))})
    return pages


def build_manifest():
    pages = parse_pages()
    items = []
    for p in pages:
        tag = "p%02d_%s" % (p["idx"], p["slug"])
        for lang, full, splitter in (("en", p["en"], split_sentences_en),
                                     ("zh", p["zh"], split_sentences_zh)):
            sents = splitter(full)
            items.append({
                "out": os.path.join(OUTDIR, "%s_full_%s.wav" % (tag, lang)),
                "text": full, "lang": "EN" if lang == "en" else "ZH",
                "page": p["idx"], "slug": p["slug"], "kind": "full",
                "langTag": lang, "sentence": None,
            })
            for i, s in enumerate(sents, 1):
                items.append({
                    "out": os.path.join(OUTDIR, "%s_s%d_%s.wav" % (tag, i, lang)),
                    "text": s, "lang": "EN" if lang == "en" else "ZH",
                    "page": p["idx"], "slug": p["slug"], "kind": "sentence",
                    "langTag": lang, "sentence": i,
                })
    os.makedirs(OUTDIR, exist_ok=True)
    with open(MANIFEST, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)
    n_en = sum(1 for i in items if i["langTag"] == "en")
    n_zh = sum(1 for i in items if i["langTag"] == "zh")
    print("manifest -> %s" % MANIFEST)
    print("pages=%d  items=%d  (en=%d zh=%d)  sentences_en=%d sentences_zh=%d"
          % (len(pages), len(items), n_en, n_zh,
             sum(1 for i in items if i["kind"] == "sentence" and i["langTag"] == "en"),
             sum(1 for i in items if i["kind"] == "sentence" and i["langTag"] == "zh")))
    return items


# --- synthesis ---------------------------------------------------------------

def _ok(path):
    return os.path.exists(path) and os.path.getsize(path) > 2000


def run_voiceover():
    items = json.load(open(MANIFEST, encoding="utf-8"))
    total = len(items)
    # strip bookkeeping keys; tts_cli only needs text/out/lang
    tasks = [{"text": i["text"], "out": i["out"], "lang": i["lang"]} for i in items]

    t_start = time.time()
    with open(LOG, "a", encoding="utf-8") as logf:
        logf.write("\n===== run %s | %d items =====\n"
                   % (time.strftime("%Y-%m-%d %H:%M:%S"), total))
    rounds = 0
    while rounds < 4:
        pending = [t for t in tasks if not _ok(t["out"])]
        if not pending:
            break
        rounds += 1
        print(">> round %d: %d/%d pending" % (rounds, len(pending), total), flush=True)
        tmp = os.path.join(OUTDIR, "_pending.json")
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(pending, f, ensure_ascii=False, indent=2)
        cmd = [TTS_PY, TTS_CLI, "--manifest", tmp, "--voice", VOICE,
               "--diffusion-steps", "12", "--cfg-rate", "0.7", "--chunk-chars", "40"]
        print(">> %s" % " ".join(cmd), flush=True)
        with open(LOG, "a", encoding="utf-8") as logf:
            proc = subprocess.run(cmd, stdout=logf, stderr=subprocess.STDOUT)
        print(">> round %d exit=%d" % (rounds, proc.returncode), flush=True)
        if proc.returncode != 0:
            # keep going: the next round retries whatever is still missing
            print(">> non-zero exit, will retry missing items", flush=True)

    done = [t for t in tasks if _ok(t["out"])]
    missing = [t for t in tasks if not _ok(t["out"])]
    print("\n===== RESULT =====")
    print("generated %d/%d files in %.0f min"
          % (len(done), total, (time.time() - t_start) / 60.0))
    if missing:
        print("MISSING %d:" % len(missing))
        for t in missing:
            print("   " + os.path.basename(t["out"]))
        return 1
    return 0


# --- optional mp3 ------------------------------------------------------------

def _find_ffmpeg():
    """Locate an ffmpeg binary.

    This box has no ffmpeg on PATH, and the venv that runs IndexTTS has no pip,
    so imageio-ffmpeg was installed into the *managed* interpreter
    (C:\\Users\\Cesar\\.workbuddy\\binaries\\python\\...).  Depending on which
    python happens to execute this script, the module may or may not be
    importable -- so fall back to globbing that tree and finally to PATH.
    """
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        pass
    import glob
    import shutil
    pats = [
        os.path.join(os.path.expanduser("~"), ".workbuddy", "binaries",
                     "python", "versions", "*", "Lib", "site-packages",
                     "imageio_ffmpeg", "binaries", "ffmpeg*.exe"),
        os.path.join(os.path.expanduser("~"), ".workbuddy", "binaries",
                     "python", "envs", "*", "Lib", "site-packages",
                     "imageio_ffmpeg", "binaries", "ffmpeg*.exe"),
    ]
    for pat in pats:
        hits = sorted(glob.glob(pat))
        if hits:
            return hits[-1]
    return shutil.which("ffmpeg")


def to_mp3(bitrate="128k"):
    """Transcode the produced WAVs to MP3.

    The source is 22050 Hz / mono / 16-bit speech, so 128 kbps is already
    transparent here -- 192 k would just bloat the repo for no audible gain.
    """
    exe = _find_ffmpeg()
    if not exe:
        print("no ffmpeg available; keeping WAV only")
        return 1
    print("using ffmpeg: %s" % exe)
    n = 0
    for name in sorted(os.listdir(OUTDIR)):
        if not name.endswith(".wav"):
            continue
        src = os.path.join(OUTDIR, name)
        dst = src[:-4] + ".mp3"
        subprocess.run([exe, "-y", "-loglevel", "error", "-i", src,
                        "-codec:a", "libmp3lame", "-b:a", bitrate, dst], check=True)
        n += 1
    print("transcoded %d files to mp3 @%s" % (n, bitrate))
    return 0


# --- documentation -----------------------------------------------------------

PAGE_TITLES = {
    0: "封面 (cover)", 1: "整车部件 (parts)", 2: "驾驶室 (driver)",
    3: "车厢内部 (inside)", 4: "车轮 (wheels)", 5: "停车牌 (stopsign)",
    6: "车门 (doors)", 7: "随车老师 (aide)", 8: "在路上 (road)",
    9: "到达 (arrive)", 10: "词汇回顾 (vocab)",
}


def _wav_info(path):
    try:
        import wave
        with wave.open(path) as w:
            return w.getnframes() / float(w.getframerate()), w.getframerate(), w.getnchannels()
    except Exception:
        return None, None, None


def write_readme():
    items = json.load(open(MANIFEST, encoding="utf-8"))
    ext = ".mp3" if any(f.endswith(".mp3") for f in os.listdir(OUTDIR)) else ".wav"
    rows, tot_dur, tot_size, n_ok, n_miss = [], 0.0, 0, 0, 0
    for it in items:
        p = it["out"][:-4] + ext
        name = os.path.basename(p)
        # duration always comes from the WAV master (the deliverable may be mp3)
        dur, rate, ch = _wav_info(it["out"])
        if not os.path.exists(p):
            n_miss += 1
            rows.append((it, name, dur, None))
            continue
        size = os.path.getsize(p)
        tot_size += size
        if dur:
            tot_dur += dur
        n_ok += 1
        rows.append((it, name, dur, size))

    L = []
    A = L.append
    A("# 《幼儿园校车》整书配音 · IndexTTS-2.5 (cesar)")
    A("")
    A("> The Kindergarten School Bus — full bilingual narration voiceover.")
    A("")
    A("用本机 **IndexTTS-2.5** 的 `cesar` 音色克隆，把绘本《幼儿园校车》全部 **11 页**")
    A("的中英正文合成为语音，提供 **逐句** 与 **整页** 两种粒度，共 **%d 条** 音频。" % len(items))
    A("")
    A("## 1. 目录结构")
    A("")
    A("```")
    A("books/schoolbus/")
    A("├── book.js                      # 绘本正文数据（配音文本的唯一来源）")
    A("├── overlays.js                  # 气泡热点（另有 edge-tts 生成的点读音频，不在本次范围）")
    A("└── audio/")
    A("    ├── line_sb_*_{en,zh}.mp3    # 【既有】热点气泡点读音频（edge-tts，未改动）")
    A("    └── narration/               # 【本次新增】整书配音")
    A("        ├── manifest.json        # 配音清单：页码/句序/文本/语言/文件名")
    A("        ├── generation.log       # 逐条合成日志（含每条耗时）")
    A("        ├── README.md            # 本文件")
    A("        └── pNN_<slug>_*%s   # 音频本体，命名规则见 §3" % ext)
    A("```")
    A("")
    A("生成脚本位于仓库根：`gen_schoolbus_voiceover.py`（`--build` / `--run` / `--mp3` / `--doc`）。")
    A("")
    A("## 2. 生成方式")
    A("")
    A("| 项 | 值 |")
    A("|---|---|")
    A("| 引擎 | IndexTTS-2.5（本机部署，`C:\\Users\\Cesar\\WorkBuddy\\index-tts`）|")
    A("| 入口 | `tts_cli.py --manifest ...`（批量，模型只加载一次）|")
    A("| 音色 | `cesar` 预设（voice clone，参考音频 40.26s / 44.1kHz / 16bit / mono）|")
    A("| 采样率 | 22050 Hz / 单声道 / 16 bit（IndexTTS 原生输出）|")
    A("| 交付格式 | MP3 128 kbps（源已是 22.05 kHz 单声道语音，128k 即透明；WAV 母带本地保留、不入库）|")
    A("| 扩散步数 | 12（4GB 显存下的默认值，上游默认 25）|")
    A("| CFG rate | 0.7 |")
    A("| 切块阈值 | 40 字符（`--chunk-chars`，4GB 卡不可调大）|")
    A("| 情感模式 | 0 = 跟随音色参考音频 |")
    A("")
    A("### 英文口音策略")
    A("")
    A("**所有英文条目都显式指定 `lang=EN`**，中文条目指定 `lang=ZH`，绝不使用默认的 `auto`。")
    A("`auto` 只按\"文本里有没有汉字\"判断，一旦某个英文句子里混入一个中文字符就会整句切到中文")
    A("音素器，发音立刻变味。英文的 G2P 走美式英语音素集。")
    A("")
    A("### 复现命令")
    A("")
    A("```bash")
    A("cd <kids-books 仓库根>")
    A("python gen_schoolbus_voiceover.py --build   # 重新解析 book.js 生成 manifest.json")
    A("python gen_schoolbus_voiceover.py --run     # 批量合成（可断点续跑，已存在的文件跳过）")
    A("python gen_schoolbus_voiceover.py --doc     # 重新生成本文件")
    A("```")
    A("")
    A("`--run` 每轮只挑\"缺失或过小\"的条目提交给 IndexTTS，失败/中断后重跑即可，不会重复合成。")
    A("")
    A("## 3. 命名规则")
    A("")
    A("```")
    A("pNN_<slug>_full_<lang>%s     ← 整页通读（第 NN 页，lang = en | zh）" % ext)
    A("pNN_<slug>_sN_<lang>%s       ← 第 NN 页的第 N 句（N 从 1 开始）" % ext)
    A("```")
    A("")
    A("- `NN`：页码 `00`–`10`，与 `book.js` 中 `window.PAGES` 的下标一致（00 = 封面）。")
    A("- `slug`：与 `overlays.js` 的热点组名对应（`sb_parts` → `parts`）；封面无热点组，固定为 `cover`。")
    A("- 文件名按 `pNN` 排序即为阅读顺序。")
    A("")
    A("## 4. 完整清单（%d 条 / 成功 %d / 缺失 %d）" % (len(items), n_ok, n_miss))
    A("")
    A("| 文件 | 页 | 粒度 | 语言 | 时长 | 大小 | 文本 |")
    A("|---|---|---|---|---|---|---|")
    for it, name, dur, size in rows:
        pg = PAGE_TITLES.get(it["page"], str(it["page"]))
        kind = "整页" if it["kind"] == "full" else "第 %d 句" % it["sentence"]
        lg = "英 EN" if it["langTag"] == "en" else "中 ZH"
        d = "%.2fs" % dur if dur else "—"
        s = "%.0f KB" % (size / 1024.0) if size else "—"
        txt = it["text"].replace("|", "\\|")
        A("| `%s` | %s | %s | %s | %s | %s | %s |" % (name, pg, kind, lg, d, s, txt))
    A("")
    A("合计时长约 **%.1f 分钟**，总体积 **%.1f MB**。" % (tot_dur / 60.0, tot_size / 1048576.0))
    A("")
    A("## 5. 已知限制")
    A("")
    A("- **音色与口音同源**：cesar 是音色克隆，英文的\"音色质感\"来自 40 秒参考音频；")
    A("  引擎侧只保证美式英语音素（`lang=EN`），不改变参考音频本身的说话习惯。")
    A("  若要求纯正美式播音腔，需换用美式英语参考音频（那就不再是 cesar 音色）。")
    A("- **本次不含热点气泡音频**：`audio/line_sb_*` 仍是 edge-tts 版本，未替换。")
    A("- **4GB 显存**：合成速度约 1–3 分钟/段，全量耗时数小时；期间请勿启动 WebUI（抢显存会慢 2–5 倍）。")
    A("- 无情感标注：全部按\"跟随音色参考\"合成，未做高兴/温柔等情感区分。")
    A("")
    with open(os.path.join(OUTDIR, "README.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(L))
    print("README -> %s  (ok=%d missing=%d, audio=%.1f min)" %
          (os.path.join(OUTDIR, "README.md"), n_ok, n_miss, tot_dur / 60.0))
    return 0


def status_line():
    """Compact progress probe for periodic reporting. Prints one block.

    Two gotchas this deliberately handles:
      * the run header is ``[i/N]`` where N is the size of the CURRENT round's
        pending list (74 on the first pass, 34 on a resume) -- hardcoding 74
        silently drops every item from a resumed run;
      * a freeze/sleep/kill inflates one item's TIME to hours and would poison
        any average, so TIME > 1500s is dropped as an outlier before fitting.

    ETA comes from a least-squares fit of TIME vs segment count; the trailing
    window rate is reported only when it has enough samples to mean anything.
    """
    items = json.load(open(MANIFEST, encoding="utf-8"))
    total = len(items)
    rem = [i for i in items if not _ok(i["out"])]
    done = total - len(rem)

    def _segs(x):
        return max(1, (len(x) + 39) // 40)

    log_age = (time.time() - os.path.getmtime(LOG)) if os.path.exists(LOG) else -1
    now = time.time()

    print("TIME=%s" % time.strftime("%H:%M:%S"))
    print("DONE=%d/%d" % (done, total))
    print("REMAINING=%d (full=%d sentence=%d)" % (
        len(rem), sum(1 for i in rem if i["kind"] == "full"),
        sum(1 for i in rem if i["kind"] == "sentence")))

    # --- ETA: fit TIME ~ a + b*segments over every clean completed item -------
    txt = open(LOG, encoding="utf-8", errors="ignore").read() if os.path.exists(LOG) else ""
    rows = re.findall(r">> \[\d+/\d+\] lang=(\w+) chars=(\d+) -> (\S+?)\n(.*?)TIME=([0-9.]+)",
                      txt, re.S)
    data = []
    dropped = 0
    for lg, ch, _p, _mid, tm in rows:
        tm = float(tm)
        if tm > 1500:
            dropped += 1
            continue
        data.append((_segs("x" * int(ch)), tm))
    if len(data) >= 4:
        n = len(data)
        sx = sum(d[0] for d in data); sy = sum(d[1] for d in data)
        sxx = sum(d[0] ** 2 for d in data); sxy = sum(d[0] * d[1] for d in data)
        den = n * sxx - sx * sx
        if den:
            b = (n * sxy - sx * sy) / den
            a = (sy - b * sx) / n
            eta = sum(max(60.0, a + b * _segs(i["text"])) for i in rem)
            print("FIT=TIME=%.0f+%.0f*seg (n=%d, dropped %d outlier)" % (a, b, n, dropped))
            print("ETA_MIN=%.0f" % (eta / 60.0))
            print("ETA_AT=%s" % time.strftime("%H:%M", time.localtime(now + eta)))
    else:
        print("FIT=(too few clean samples)")

    # --- last completion + trailing rate (files' mtime == completion time) ---
    stamped = sorted((os.path.getmtime(i["out"]), i) for i in items if _ok(i["out"]))
    if stamped:
        with wave.open(stamped[-1][1]["out"]) as w:
            d = w.getnframes() / w.getframerate()
        print("LAST=%s (%s) %.1fs audio, at %s" % (
            os.path.basename(stamped[-1][1]["out"]), stamped[-1][1]["lang"], d,
            time.strftime("%H:%M:%S", time.localtime(stamped[-1][0]))))
        cut = now - 30 * 60
        n30 = sum(1 for t, _ in stamped if t >= cut)
        if n30 >= 6:
            rate = n30 / 30.0 * 60.0
            print("RATE=%.1f items/h (30 min, n=%d) -> pace ETA %s" % (
                rate, n30, time.strftime("%H:%M", time.localtime(now + len(rem) / rate * 3600))))
        else:
            print("RATE=(30min window n=%d, too few to trust)" % n30)

    print("LOG_AGE_SEC=%d" % log_age)
    print("COMPLETE=%s" % ("YES" if not rem else "NO"))
    return 0


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--build", action="store_true")
    ap.add_argument("--run", action="store_true")
    ap.add_argument("--mp3", action="store_true")
    ap.add_argument("--doc", action="store_true")
    ap.add_argument("--status", action="store_true")
    a = ap.parse_args()
    rc = 0
    if a.build:
        build_manifest()
    if a.run:
        rc = run_voiceover()
    if a.mp3:
        rc = to_mp3() or rc
    if a.doc:
        rc = write_readme() or rc
    if a.status:
        rc = status_line() or rc
    if not (a.build or a.run or a.mp3 or a.doc or a.status):
        ap.error("pick one of --build / --run / --mp3 / --doc / --status")
    sys.exit(rc)

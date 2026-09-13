"""生成 pwa-assets.js —— Service Worker 预缓存清单（唯一真源）。

为什么用生成而不是手写：绘本资产会不断增加（换图 _r2/_v2、补音频），
手写清单必然漏。这个脚本把「该离线保存什么」变成可从仓库重新推出的结论。

产出 pwa-assets.js，结构：
    self.KB_ASSETS = {
      version: "<内容指纹>",     // 变化时 Service Worker 自动更新
      shell:   [ ... ],          // 站点外壳：13 个页面 + shared + icons + labs
      books:   { id: { files:[...], bytes: N } },
      total:   N
    }

收录规则：
  · shell  = 页面、脚本样式 + labs + 12 张书架封面小图（480px 派生图），
    首次安装就缓存，保证断网也能打开首页并看到完整书架
  · 每本书 = index.html + book.js + overlays.js + assets/ 下的图片 + audio/ 下的 mp3
    —— 只收运行时会用到的图片与 mp3；跳过 .py/.wav/.json/.log 等源文件
      （schoolbus/audio/narration 里有几十 MB 的 TTS 源 WAV，绝不能进离线包）

用法： python tools/gen_pwa_assets.py
"""
import hashlib
import json
import os
import re

import gen_pwa_covers

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(REPO, "pwa-assets.js")
READER = os.path.join(REPO, "shared", "reader.js")

IMAGE_EXT = {".webp", ".png", ".jpg", ".jpeg", ".svg", ".gif", ".avif"}
AUDIO_EXT = {".mp3", ".m4a", ".ogg"}

SHARED_FILES = [
    "shared/style.css",
    "shared/library-sections.css",
    "shared/cdn.js",
    "shared/reader.js",
    "shared/overlays.js",
    "shared/pwa.css",
    "shared/pwa.js",
]
ROOT_FILES = [
    "index.html",
    "offline.html",
    "manifest.webmanifest",
]
ICON_DIR = "icons"
# 实验室（含 three.min.js 约 670KB）整个收进外壳：总共才 1.4MB，
# 而且孩子点进 3D 实验室之前不该先等下载。用目录遍历而不是手写清单，
# 以后加新实验室不会漏。
LAB_EXCLUDE = (".md", ".py", ".json")


def rel_files(*dirs):
    """按目录列举仓库内文件（相对路径，正斜杠）。"""
    found = []
    for d in dirs:
        base = os.path.join(REPO, d)
        for root, dirnames, filenames in os.walk(base):
            dirnames[:] = [x for x in dirnames if x != "__pycache__"]
            for fn in filenames:
                p = os.path.join(root, fn)
                found.append(os.path.relpath(p, REPO).replace("\\", "/"))
    return sorted(found)


def size_of(rel):
    """rel 可能带 ?v=N 查询串（音频），取文件大小时要去掉。"""
    return os.path.getsize(os.path.join(REPO, rel.split("?")[0]))


def norm(p):
    return "/".join(p.split("\\"))


def sha256_of(rel):
    h = hashlib.sha256()
    with open(os.path.join(REPO, rel.split("?")[0]), "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def read_audio_ver():
    """音频 URL 的真实形态是 `<path>.mp3?v=<AUDIO_VER>`（见 shared/reader.js）。
    离线包必须按一模一样的 URL 存，否则页面播放时带 ?v= 会 cache miss。
    这里直接读 reader.js 的常量；读不到就报错退出，绝不静默生成错误清单。"""
    src = open(READER, encoding="utf-8").read()
    m = re.search(r"const\s+AUDIO_VER\s*=\s*(\d+)", src)
    if not m:
        raise SystemExit("ERROR 在 shared/reader.js 里找不到 AUDIO_VER，离线包清单无法生成")
    return m.group(1)


ASSET_REF = re.compile(r"['\"](assets/[^'\"]+)['\"]")


def referenced_assets(name):
    """只收录 book.js / overlays.js 里真正引用的图片。

    为什么不能整个 assets/ 目录都收：R2 换图时旧版 _c.webp 仍留在仓库里，
    296 张图中只有 148 张被引用，全收会让离线包白白多出近 8MB。
    这些引用全部是静态字面量（没有动态拼接），可以安全地静态提取。
    个别路径带 ?v=xxx（rocket 的地球图），存在性检查要去掉查询串，
    但清单里保留原样，因为页面请求的就是带查询串的地址。
    """
    refs, missing = [], []
    for fn in ("book.js", "overlays.js"):
        p = os.path.join(REPO, "books", name, fn)
        if not os.path.exists(p):
            continue
        for m in ASSET_REF.finditer(open(p, encoding="utf-8").read()):
            raw = m.group(1)
            disk = os.path.join(REPO, "books", name, raw.split("?")[0])
            rel = "books/%s/%s" % (name, raw)
            if os.path.exists(disk):
                if rel not in refs:
                    refs.append(rel)
            elif rel not in missing:
                missing.append(rel)
    return sorted(refs), missing


def book_audio(name, audio_ver):
    """音频文件名由 reader.js 动态拼装（page_XX / word_ / line_），无法静态枚举，
    所以取音频目录顶层的全部 mp3。

    故意不递归子目录：schoolbus/audio/narration/ 里是最初的长音频素材
    （74 个 wav + 74 个 mp3，约 30MB），运行时从不读取（audioDir 指向 audio/），
    放进离线包纯属浪费家长流量。"""
    d = os.path.join(REPO, "books", name, "audio")
    out = []
    if not os.path.isdir(d):
        return out
    for fn in sorted(os.listdir(d)):
        p = os.path.join(d, fn)
        if os.path.isfile(p) and os.path.splitext(fn)[1].lower() in AUDIO_EXT:
            out.append("books/%s/audio/%s?v=%s" % (name, fn, audio_ver))
    return out


def main():
    audio_ver = read_audio_ver()
    lab_files = [f for f in rel_files("labs") if not f.lower().endswith(LAB_EXCLUDE) and "/_replica/" not in f]

    # 书架封面用的小派生图（480px，见 tools/gen_pwa_covers.py）必须进外壳预缓存：
    # 线上封面走 jsDelivr 是跨域请求，Service Worker 按设计放行不缓存；只靠
    # 「已下载那本书」的离线包命中同源回退，断网时书架会剩下 11 张空白卡片。
    # 这 12 张合计约 260KB，换来离线书架完整 + 首屏少传 2.6MB 原图。
    cover_cards, missing_cards = [], []
    for bid, _cover, card in gen_pwa_covers.discover():
        rel = "books/%s/%s" % (bid, card)
        if os.path.exists(os.path.join(REPO, rel)):
            cover_cards.append(rel)
        else:
            missing_cards.append(rel)

    # Cache actual lab dependency URLs, including cache-busting query strings.
    for page in list(lab_files):
        if page.endswith('.html'):
            with open(os.path.join(REPO, page), encoding='utf-8') as source:
                for src in re.findall(r'<(?:img|script|link)\b[^>]+(?:src|href)="([^"]+)"', source.read()):
                    if not src.startswith(('http:', 'https:', 'data:')):
                        dep = norm(os.path.normpath(os.path.join(os.path.dirname(page), src)))
                        if not dep.startswith('../') and os.path.isfile(os.path.join(REPO, dep.split("?")[0])):
                            lab_files.append(dep)

    shell, missing = [], []
    for p in ROOT_FILES + SHARED_FILES + rel_files(ICON_DIR) + lab_files + cover_cards:
        p = norm(p)
        if os.path.exists(os.path.join(REPO, p.split("?")[0])):
            shell.append(p)
        else:
            missing.append(p)

    books = {}
    missing_assets = []
    for name in sorted(os.listdir(os.path.join(REPO, "books"))):
        bdir = os.path.join(REPO, "books", name)
        if not os.path.isdir(bdir):
            continue
        imgs, miss = referenced_assets(name)
        if miss:
            missing_assets.append((name, miss))
        files = imgs + book_audio(name, audio_ver)
        for fn in ("index.html", "book.js", "overlays.js"):
            p = os.path.join(bdir, fn)
            if os.path.exists(p):
                shell.append("books/%s/%s" % (name, fn))
                files.append("books/%s/%s" % (name, fn))
        books[name] = {
            "files": sorted(files),
            "bytes": sum(size_of(f) for f in files),
        }

    shell = sorted(set(shell))
    total = sum(size_of(f) for f in shell) + sum(b["bytes"] for b in books.values())

    # 版本指纹取「内容」而不是「大小」：同长度替换（改个错字、换个数值）也要能触发更新
    h = hashlib.sha256()
    for f in shell:
        h.update(("%s:%s;" % (f, sha256_of(f))).encode())
    for bid in sorted(books):
        for f in books[bid]["files"]:
            h.update(("%s:%s;" % (f, sha256_of(f.split("?")[0]))).encode())
    version = h.hexdigest()[:12]

    payload = {
        "version": version,
        "audioVer": audio_ver,
        "shell": shell,
        "books": books,
        "total": total,
    }

    body = (
        "/* 自动生成，请勿手改 —— 重新生成：python tools/gen_pwa_assets.py */\n"
        "self.KB_ASSETS = " + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n"
    )
    with open(OUT, "w", encoding="utf-8", newline="\n") as f:
        f.write(body)

    print("version = %s  (audioVer=%s)" % (version, audio_ver))
    print("shell   = %d files, %.0f KB" % (len(shell), sum(size_of(f) for f in shell) / 1024))
    for bid, b in books.items():
        print("  %-11s %3d files  %6.1f MB" % (bid, len(b["files"]), b["bytes"] / 1048576))
    print("total   = %.1f MB" % (total / 1048576))
    if missing:
        print("WARN 清单里缺失（已跳过）: %s" % ", ".join(missing))
    if missing_cards:
        print("WARN 缺封面派生图（跑 python tools/gen_pwa_covers.py）: %s"
              % ", ".join(missing_cards))
    for name, miss in missing_assets:
        print("WARN %s 引用了不存在的图片: %s" % (name, ", ".join(miss)))


if __name__ == "__main__":
    main()

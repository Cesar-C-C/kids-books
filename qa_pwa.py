"""PWA / 离线包 / 多节点 CDN 的静态校验。

这些检查故意不依赖浏览器，可以在 CI 里跑（现有 .github/workflows/labs.yml
只跑纯 Node 校验，绘本类与 PWA 类校验一直是盲区）。

检查项：
  1. manifest.webmanifest 合法、图标文件存在且尺寸与声明一致
  2. pwa-assets.js 里每一个文件都真实存在；音频 URL 带正确的 ?v=<AUDIO_VER>
  3. Service Worker 的关键约定没被改坏（离线包缓存不随版本清空、只回填 200）
  4. 所有页面都接上了 manifest / cdn.js / pwa.js
  5. reader.js 里没有遗留的旧 CDN 常量
  6. 首页封面走 _card480 小派生图，且都在外壳预缓存里

用法：python qa_pwa.py      退出码 0 = 全部通过
"""
import json
import os
import re
import struct
import sys

REPO = os.path.dirname(os.path.abspath(__file__))
fails, warns, checks = [], [], 0


def bad(msg):
    fails.append(msg)


def warn(msg):
    warns.append(msg)


def ok():
    global checks
    checks += 1


def png_size(path):
    """不依赖 Pillow，直接读 PNG 的 IHDR。"""
    with open(path, "rb") as f:
        head = f.read(26)
    if head[:8] != b"\x89PNG\r\n\x1a\n" or head[12:16] != b"IHDR":
        return None
    return struct.unpack(">II", head[16:24])


def rel_path(p):
    return os.path.join(REPO, p.replace("/", os.sep).split("?")[0])


# ---------- 1. manifest ----------
def check_manifest():
    path = os.path.join(REPO, "manifest.webmanifest")
    if not os.path.exists(path):
        return bad("manifest.webmanifest 不存在")
    try:
        m = json.load(open(path, encoding="utf-8"))
    except Exception as e:
        return bad("manifest.webmanifest 不是合法 JSON：%s" % e)
    for k in ("name", "short_name", "start_url", "scope", "display", "icons"):
        if k not in m:
            bad("manifest 缺少字段 %s" % k)
    if m.get("display") not in ("standalone", "fullscreen", "minimal-ui"):
        bad("manifest display=%r 不是可安装的取值" % m.get("display"))
    if not m.get("start_url", "").startswith("./"):
        warn("manifest start_url 建议用相对路径（./index.html），子路径部署更稳")
    has_any = has_maskable = False
    for ic in m.get("icons", []):
        src = ic.get("src", "")
        if not os.path.exists(rel_path(src)):
            bad("manifest 图标缺失：%s" % src)
            continue
        size = png_size(rel_path(src))
        want = ic.get("sizes", "")
        if size:
            got = "%dx%d" % size
            if want and got != want:
                bad("图标 %s 实际 %s，manifest 声明 %s" % (src, got, want))
        purpose = ic.get("purpose", "any")
        has_any = has_any or "any" in purpose
        has_maskable = has_maskable or "maskable" in purpose
    if not has_any:
        bad("manifest 里没有 purpose=any 的图标")
    if not has_maskable:
        warn("缺少 maskable 图标，安卓主屏图标会被裁得很难看")
    ok()


# ---------- 2. 离线包清单 ----------
def check_assets():
    path = os.path.join(REPO, "pwa-assets.js")
    if not os.path.exists(path):
        return bad("pwa-assets.js 不存在（先跑 python tools/gen_pwa_assets.py）")
    src = open(path, encoding="utf-8").read()
    try:
        data = json.loads(src[src.index("{"): src.rindex(";")])
    except Exception as e:
        return bad("pwa-assets.js 内容无法解析：%s" % e)

    reader = open(os.path.join(REPO, "shared", "reader.js"), encoding="utf-8").read()
    m = re.search(r"const\s+AUDIO_VER\s*=\s*(\d+)", reader)
    if not m:
        return bad("reader.js 里找不到 AUDIO_VER")
    audio_ver = m.group(1)
    if data.get("audioVer") != audio_ver:
        bad("pwa-assets.js 的 audioVer=%s 与 reader.js 的 AUDIO_VER=%s 不一致（清单过期，重新生成）"
            % (data.get("audioVer"), audio_ver))

    missing = [p for p in data.get("shell", []) if not os.path.exists(rel_path(p))]
    if missing:
        bad("外壳清单里有 %d 个文件不存在：%s" % (len(missing), ", ".join(missing[:5])))
    if "offline.html" not in data.get("shell", []):
        bad("offline.html 不在外壳清单里，断网会白屏")

    total = 0
    for bid, book in data.get("books", {}).items():
        for f in book["files"]:
            if not os.path.exists(rel_path(f)):
                bad("%s 的离线清单引用了不存在的文件：%s" % (bid, f))
            if f.endswith(".mp3") and "?v=" + audio_ver not in f:
                bad("%s 的音频没带 ?v=%s：%s（离线播放会 cache miss）" % (bid, audio_ver, f))
        total += book["bytes"]
        if book["bytes"] <= 0:
            bad("%s 的离线包体积为 0，明显不对" % bid)

    if abs(total + sum(os.path.getsize(rel_path(p)) for p in data["shell"]) - data.get("total", 0)) > 1024:
        warn("total 字段与实际体积对不上（可能是清单过期）")
    for bid, book in data.get("books", {}).items():
        ratio = book["bytes"] / max(1, len(book["files"]))
        if ratio > 900 * 1024:
            warn("%s 平均单文件 %.1f MB，离线包可能夹带了不该收的大文件" % (bid, ratio / 1048576))
    ok()


# ---------- 3. Service Worker 约定 ----------
def check_sw():
    path = os.path.join(REPO, "sw.js")
    if not os.path.exists(path):
        return bad("sw.js 不存在")
    src = open(path, encoding="utf-8").read()
    if "importScripts('./pwa-assets.js')" not in src:
        bad("sw.js 没有 importScripts('./pwa-assets.js')")
    if "'kb-asset-v1'" not in src and '"kb-asset-v1"' not in src:
        bad("离线包缓存不是固定名（kb-asset-v1）—— 一旦跟版本走，家长下载的绘本会被改版清空")
    if "status === 200" not in src:
        bad("sw.js 没有对 200 做判断：206 分片响应不能存进 Cache Storage")
    if "clients.claim()" not in src:
        warn("sw.js 没有 clients.claim()，首次访问的页面要刷新一次才受控")
    if "opaque" not in src:
        warn("sw.js 没有排除不透明响应，跨域资源会虚高配额统计")
    ok()


# ---------- 4. 页面接线 ----------
def check_pages():
    sys.path.insert(0, os.path.join(REPO, "tools"))
    import wire_pwa_pages as wire  # noqa: E402
    unwired = []
    for p in wire.pages():
        rel, _new, changed, notes = wire.wire(p)
        if changed:
            unwired.append("%s (%s)" % (rel, ", ".join(notes)))
    if unwired:
        bad("这些页面还没接上 PWA（跑 python tools/wire_pwa_pages.py）：%s" % "; ".join(unwired))
    else:
        ok()


# ---------- 5. 旧 CDN 常量 ----------
def check_no_legacy():
    src = open(os.path.join(REPO, "shared", "reader.js"), encoding="utf-8").read()
    for token in ("CDN_BASE", "fallbackUrl"):
        if re.search(r"\b%s\b" % token, src):
            bad("reader.js 里还有旧的 %s 残留" % token)
    cdn = open(os.path.join(REPO, "shared", "cdn.js"), encoding="utf-8").read()
    if "cdn.jsdelivr.net" not in cdn:
        warn("cdn.js 的节点列表里没有 cdn.jsdelivr.net 兜底")
    if "gcore.jsdelivr.net" not in cdn:
        bad("cdn.js 首选节点不是实测可用的 gcore")
    ok()


# ---------- 6. 书架封面派生图 ----------
def check_covers():
    """首页封面必须指向 _card480 派生图，且必须在外壳预缓存里。

    这条为什么值得单独校验：线上封面走 jsDelivr 是跨域请求，Service Worker
    按设计放行不缓存。一旦首页退回引用 1216×832 原图，断网打开书架就会
    「只有已下载那本有封面，其余 11 张空白」，同时首屏白白多传约 2.5MB。
    两种退化都是静默的 —— 在线时看不出任何异常，所以必须在这里卡住。
    """
    for bid, cover, card in _covers():
        card_abs = rel_path("books/%s/%s" % (bid, card))
        cover_abs = rel_path("books/%s/%s" % (bid, cover))
        if not os.path.exists(card_abs):
            bad("封面派生图不存在：books/%s/%s（跑 python tools/gen_pwa_covers.py）"
                % (bid, card))
            continue
        if os.path.exists(cover_abs):
            c, o = os.path.getsize(card_abs), os.path.getsize(cover_abs)
            if c >= o * 0.6:
                bad("封面派生图 %s 没起到瘦身作用（%.0fKB vs 原图 %.0fKB）"
                    % (card, c / 1024, o / 1024))

    home = open(os.path.join(REPO, "index.html"), encoding="utf-8").read()
    refs = re.findall(r'data-kbc="(books/[^"]+)"', home)
    if len(refs) != 12:
        bad("首页 data-kbc 封面数量为 %d，期望 12" % len(refs))
    stale = [r for r in refs if not r.endswith("_card480.webp")]
    if stale:
        bad("首页封面没走小派生图（断网会空白 + 多传原图）：%s" % ", ".join(stale[:3]))
    for r in refs:
        if not os.path.exists(rel_path(r)):
            bad("首页封面指向不存在的文件：%s" % r)

    shell = set()
    ap = os.path.join(REPO, "pwa-assets.js")
    if os.path.exists(ap):
        s = open(ap, encoding="utf-8").read()
        try:
            shell = set(json.loads(s[s.index("{"): s.rindex(";")]).get("shell", []))
        except Exception:
            shell = set()
    if shell:
        not_cached = [r for r in refs if r not in shell]
        if not_cached:
            bad("这些首页封面没进外壳预缓存，断网会空白：%s"
                % ", ".join(not_cached[:3]))
    ok()


def _covers():
    """复用 gen_pwa_covers 的发现逻辑，避免两处口径不一致。"""
    sys.path.insert(0, os.path.join(REPO, "tools"))
    import gen_pwa_covers as covers  # noqa: E402
    return covers.discover()


def main():
    check_manifest()
    check_assets()
    check_sw()
    check_pages()
    check_no_legacy()
    check_covers()

    for w in warns:
        print("WARN  " + w)
    for f in fails:
        print("FAIL  " + f)
    print("\n通过 %d 项检查，%d 个警告，%d 个失败" % (checks, len(warns), len(fails)))
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
